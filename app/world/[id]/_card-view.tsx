import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Pressable, TextInput,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import { CARD_TIMESTAMP_SLOTS } from '../../../lib/cardTimestamps';
import { confirmAction } from '../../../lib/timeline/confirm';
import type { CardTimestampRow, Timeline, TimelinePeriod, TrackingType } from '../../../lib/timeline/types';
import SectionEditor, { type CardSection } from './_section-editor';

export type { CardSection };

export type FullCard = {
  id: string
  world_id: string;
  title: string; 
  type: CardType;
  content: string | null;
  sections: CardSection[];
  updated_at: string;
};

type TimestampDraft = {
  label: string;
  hint: string;
  year: string;
  month: string;
  day: string;
  required: boolean;
  periodId: string | null;
  rowId: string | null;
};

type Props = {
  card: FullCard;
  visible: boolean;
  onClose: () => void;
  onUpdated: (card: FullCard) => void;
  onDeleted: (id: string) => void;
};

function getPeriodForYear(
  periods: TimelinePeriod[],
  year: number,
): { period: TimelinePeriod; relativeYear: number } | null {
  let offset = 0;
  for (const period of periods) {
    if (year <= offset + period.years) {
      return { period, relativeYear: year - offset };
    }
    offset += period.years;
  }

  const last = periods[periods.length - 1];
  if (!last) return null;

  const totalOffset = periods.reduce((sum, period) => sum + period.years, 0) - last.years;
  return { period: last, relativeYear: year - totalOffset };
}

function periodOffset(periods: TimelinePeriod[], periodId: string | null): number {
  if (!periodId) {
  throw new Error('Missing period');
}

  let offset = 0;
  for (const period of periods) {
    if (period.id === periodId) break;
    offset += period.years;
  }

  return offset;
}

function buildTimestampDrafts(
  cardType: CardType,
  timeline: Timeline | null,
  periods: TimelinePeriod[],
  rows: CardTimestampRow[],
): TimestampDraft[] {
  const slots = CARD_TIMESTAMP_SLOTS[cardType];

  return slots.map((slot) => {
    const suffix = slot.timelineLabel.replace('{name}', '').trim();
    const row = rows.find((item) => {
      const label = item.label?.trim() ?? '';
      return (
        label === slot.label ||
        (suffix.length > 0 && label.endsWith(suffix))
      );
    }) ?? null;

    let year = '';
    let periodId: string | null = null;

    if (row) {
      if (timeline && (timeline.tracking_type === 'era' || timeline.tracking_type === 'age') && periods.length > 0) {
        const match = getPeriodForYear(periods, row.year);
        if (match) {
          year = String(match.relativeYear);
          periodId = match.period.id;
        } else {
          year = String(row.year);
        }
      } else {
        year = String(row.year);
      }
    }

    return {
      label: slot.label,
      hint: slot.hint,
      year,
      month: row?.month != null ? String(row.month) : '',
      day: row?.day != null ? String(row.day) : '',
      required: slot.required ?? false,
      periodId,
      rowId: normalizeRowId(row?.id ?? null),
    };
  });
}

function parseNullableInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeRowId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') return null;
  return trimmed;
}

export default function CardView({ card, visible, onClose, onUpdated, onDeleted }: Props) {
  const [sections, setSections] = useState<CardSection[]>(card.sections ?? []);
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content ?? '');
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [periods, setPeriods] = useState<TimelinePeriod[]>([]);
  const [timestamps, setTimestamps] = useState<TimestampDraft[]>([]);
  const [originalTimestamps, setOriginalTimestamps] = useState<TimestampDraft[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [savingTimestamps, setSavingTimestamps] = useState(false);
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const color = CARD_TYPE_COLOR[card.type] ?? '#6366f1';

  useEffect(() => {
    setSections(card.sections ?? []);
    setTitle(card.title);
    setContent(card.content ?? '');
    setTitleError('');
    setIsEditing(false);
  }, [card.id, card.sections, card.title, card.content, visible]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    async function loadEditorData() {
      setLoadingMeta(true);
      setError('');

      const { data: timelineData, error: timelineError } = await supabase
        .from('timelines')
        .select('id, name, time_format_id, tracking_type, pivot_card_id, before_label, after_label')
        .eq('world_id', card.world_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (timelineError) {
        setError(timelineError.message);
        setTimeline(null);
        setPeriods([]);
        setTimestamps([]);
        setLoadingMeta(false);
        return;
      }

      const nextTimeline = timelineData ?? null;
      setTimeline(nextTimeline);

      let nextPeriods: TimelinePeriod[] = [];
      if (nextTimeline && (nextTimeline.tracking_type === 'era' || nextTimeline.tracking_type === 'age')) {
        const { data: periodData, error: periodError } = await supabase
          .from('timeline_periods')
          .select('id, position, name, years, months, days')
          .eq('timeline_id', nextTimeline.id)
          .order('position', { ascending: true });

        if (cancelled) return;

        if (periodError) {
          setError(periodError.message);
          setPeriods([]);
          setTimestamps([]);
          setLoadingMeta(false);
          return;
        }

        nextPeriods = periodData ?? [];
      }

      setPeriods(nextPeriods);

      if (nextTimeline) {
        const { data: timestampData, error: timestampError } = await supabase
          .from('card_timestamps')
          .select('id, card_id, timeline_id, label, year, month, day, sort_key')
          .eq('card_id', card.id)
          .eq('timeline_id', nextTimeline.id)
          .order('sort_key', { ascending: true });

        if (cancelled) return;

        if (timestampError) {
          setError(timestampError.message);
          setTimestamps([]);
          setOriginalTimestamps([]);
          setLoadingMeta(false);
          return;
        }

        const drafts = buildTimestampDrafts(card.type, nextTimeline, nextPeriods, timestampData ?? []);
        setTimestamps(drafts);
        setOriginalTimestamps(drafts);
      } else {
        setTimestamps([]);
        setOriginalTimestamps([]);
      }

      setLoadingMeta(false);
    }

    loadEditorData();

    return () => {
      cancelled = true;
    };
  }, [visible, card.id, card.type, card.world_id]);

  async function handleSaveMetadata() {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    setSavingMeta(true);
    setError('');
    setTitleError('');

    const now = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from('cards')
      .update({ title: title.trim(), content: content.trim() || null, updated_at: now })
      .eq('id', card.id)
      .select('id, world_id, title, type, content, sections, updated_at')
      .single();

    setSavingMeta(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onUpdated(data as FullCard);
  }

  async function handleSaveSections(updated: CardSection[]) {
    setSavingSections(true);
    setError('');

    const now = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from('cards')
      .update({ sections: updated, updated_at: now })
      .eq('id', card.id)
      .select('id, world_id, title, type, content, sections, updated_at')
      .single();

    setSavingSections(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSections(updated);
    onUpdated(data as FullCard);
  }

  async function handleSaveTimestamps() {
    if (!timeline) {
      setError('This card is not on a timeline yet.');
      return;
    }

    setSavingTimestamps(true);
    setError('');

    const rows: Array<{
      id?: string;
      card_id: string;
      timeline_id: string;
      owner_id: string;
      label: string;
      year: number;
      month: number | null;
      day: number | null;
    }> = [];
    const rowsToDelete: string[] = [];

    for (const draft of timestamps) {
      const yearValue = draft.year.trim();
      if (!yearValue) {
        const normalizedId = normalizeRowId(draft.rowId);
        if (normalizedId) rowsToDelete.push(normalizedId);
        continue;
      }

      const year = Number.parseInt(yearValue, 10);
      if (Number.isNaN(year)) {
        setError(`"${draft.label}" needs a valid year.`);
        setSavingTimestamps(false);
        return;
      }

      const month = parseNullableInt(draft.month);
      if (month === null && draft.month.trim()) {
        setError(`"${draft.label}" needs a valid month.`);
        setSavingTimestamps(false);
        return;
      }

      const day = parseNullableInt(draft.day);
      if (day === null && draft.day.trim()) {
        setError(`"${draft.label}" needs a valid day.`);
        setSavingTimestamps(false);
        return;
      }

      const finalYear =
        timeline.tracking_type === 'era' || timeline.tracking_type === 'age'
          ? year + periodOffset(periods, draft.periodId)
          : year;

      const safeRowId = normalizeRowId(draft.rowId) ?? undefined;

      rows.push({
        ...(safeRowId ? { id: safeRowId } : {}),
        card_id: card.id,
        timeline_id: timeline.id,
        owner_id: '',
        label: draft.label,
        year: finalYear,
        month,
        day,
      });
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      setError('Not signed in.');
      setSavingTimestamps(false);
      return;
    }

    rows.forEach((row) => {
      row.owner_id = session.user.id;
    });

    if (rowsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('card_timestamps')
        .delete()
        .in('id', rowsToDelete);

      if (deleteError) {
        setError(deleteError.message);
        setSavingTimestamps(false);
        return;
      }
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from('card_timestamps')
        .upsert(rows, { onConflict: 'id' });

      if (upsertError) {
        setError(upsertError.message);
        setSavingTimestamps(false);
        return;
      }
    }

    const now = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from('cards')
      .update({ updated_at: now })
      .eq('id', card.id)
      .select('id, world_id, title, type, content, sections, updated_at')
      .single();

    setSavingTimestamps(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onUpdated(data as FullCard);
  }

  function cancelEdit() {
    setIsEditing(false);
    setTitle(card.title);
    setContent(card.content ?? '');
    setSections(card.sections ?? []);
    setTimestamps(originalTimestamps);
    setTitleError('');
    setError('');
  }

  function handleDelete() {
    confirmAction('Delete card', `Delete "${card.title}"? This cannot be undone.`, async () => {
      await supabase.from('card_timestamps').delete().eq('card_id', card.id);
      await supabase.from('cards').delete().eq('id', card.id);
      onDeleted(card.id);
      onClose();
    });
  }

  const canEditTimestamps = !!timeline && timestamps.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>

          <View style={[styles.header, { borderBottomColor: color + '44' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.typeTag, { backgroundColor: color + '22' }]}>
                <Text style={[styles.typeTagText, { color }]}>{card.type}</Text>
              </View>
              <Text style={styles.title}>{card.title}</Text>
            </View>
            <View style={styles.headerActions}>
              {(savingSections || savingTimestamps || savingMeta) && <ActivityIndicator size="small" color="#6366f1" />}
              {!isEditing ? (
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEdit}>
                  <Text style={styles.cancelEditBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.metaSection}>
              <View style={styles.metaHeaderRow}>
                <Text style={styles.sectionTitle}>Card details</Text>
                {isEditing ? <Text style={styles.sectionHint}>Editing enabled</Text> : null}
              </View>
              {!isEditing ? (
                <View style={styles.metaReadOnly}>
                  <Text style={styles.cardTitleDisplay}>{card.title}</Text>
                  {card.content ? (
                    <Text style={styles.cardContentDisplay}>{card.content}</Text>
                  ) : (
                    <Text style={styles.cardContentEmpty}>No card content.</Text>
                  )}
                </View>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, titleError ? styles.inputError : null]}
                    placeholder="Card title"
                    placeholderTextColor="#4a4a6a"
                    value={title}
                    onChangeText={(value) => {
                      setTitle(value);
                      if (titleError) setTitleError('');
                    }}
                  />
                  <TextInput
                    style={[styles.textArea, styles.input]}
                    placeholder="Card content (optional)"
                    placeholderTextColor="#4a4a6a"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.metaSaveBtn, savingMeta && styles.disabled]}
                    onPress={handleSaveMetadata}
                    disabled={savingMeta}
                  >
                    {savingMeta ? <ActivityIndicator color="#fff" /> : <Text style={styles.metaSaveBtnText}>Save card</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Sections</Text>
              {savingSections ? <Text style={styles.sectionHint}>Saving…</Text> : null}
            </View>

            {isEditing ? (
              <SectionEditor
                sections={sections}
                onChange={setSections}
                onSave={handleSaveSections}
              />
            ) : (
              <View style={styles.readOnlySectionContainer}>
                {(card.sections ?? []).length > 0 ? (
                  (card.sections ?? []).map((section, index) => (
                    <View key={`${section.heading ?? 'section'}-${index}`} style={styles.readOnlySectionBlock}>
                      {section.heading ? <Text style={styles.readOnlySectionHeading}>{section.heading}</Text> : null}
                      {section.body ? <Text style={styles.readOnlySectionBody}>{section.body}</Text> : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionEmpty}>No sections added yet. Tap Edit to add sections.</Text>
                )}
              </View>
            )}

          

            {timeline ? (
              <View style={styles.timestampSection}>
                {timestamps.length > 0 ? (
                  timestamps.map((ts, index) => (
                    <View key={ts.label} style={styles.timestampBlock}>
                      <Text style={styles.timestampLabel}>
                        {ts.label}
                        {ts.required ? <Text style={styles.timestampRequired}> *</Text> : null}
                      </Text>
                      <Text style={styles.timestampHint}>{ts.hint}</Text>

                      {(timeline.tracking_type === 'era' || timeline.tracking_type === 'age') && periods.length > 0 && (
                        <View style={{ gap: 6 }}>
                          <Text style={styles.timestampFieldLabel}>
                            {timeline.tracking_type === 'age' ? 'Age' : 'Era'}
                          </Text>
                          {isEditing ? (
                            <View style={styles.periodRow}>
                              {periods.map((period) => {
                                const active = ts.periodId === period.id;
                                const label = timeline.tracking_type === 'age' && period.name
                                  ? period.name
                                  : `Era ${period.position}`;
                                return (
                                  <TouchableOpacity
                                    key={period.id}
                                    style={[styles.periodChip, active && styles.periodChipActive]}
                                    onPress={() => {
                                      setTimestamps((prev) => prev.map((item, i) => (
                                        i === index ? { ...item, periodId: active ? null : period.id } : item
                                      )));
                                    }}
                                  >
                                    <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                                      {label} · {period.years}y
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : (
                            <Text style={styles.timestampReadValue}>
                              {(() => {
                                const selected = periods.find((period) => period.id === ts.periodId);
                                if (!selected) return 'No period selected';
                                return timeline.tracking_type === 'age' && selected.name
                                  ? selected.name
                                  : `Era ${selected.position}`;
                              })()}
                            </Text>
                          )}
                        </View>
                      )}

                      {isEditing ? (
                        
                        <View style={styles.timestampGrid}>
                          <View style={[styles.timestampField, { flex: 2 }]}> 
                            <Text style={styles.timestampFieldLabel}>
                              {periods.length > 0 ? 'Year within period' : 'Year'}
                            </Text>
                            <TextInput
                              style={styles.timestampInput}
                              keyboardType="numeric"
                              placeholder="e.g. 450"
                              placeholderTextColor="#4a4a6a"
                              value={ts.year}
                              onChangeText={(value) => {
                                setTimestamps((prev) => prev.map((item, i) => (
                                  i === index ? { ...item, year: value } : item
                                )));
                              }}
                            />
                          </View>

                        <View style={[styles.timestampField, { flex: 1 }]}>
                          <Text style={styles.timestampFieldLabel}>Month</Text>
                          <TextInput
                            style={styles.timestampInput}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                            value={ts.month}
                            onChangeText={(value) => {
                              setTimestamps((prev) => prev.map((item, i) => (
                                i === index ? { ...item, month: value } : item
                              )));
                            }}
                          />
                        </View>
                        <View style={[styles.timestampField, { flex: 1 }]}>
                          <Text style={styles.timestampFieldLabel}>Day</Text>
                          <TextInput
                            style={styles.timestampInput}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                            value={ts.day}
                            onChangeText={(value) => {
                              setTimestamps((prev) => prev.map((item, i) => (
                                i === index ? { ...item, day: value } : item
                              )));
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timestampReadRow}>
                        <Text style={styles.timestampReadValue}>
                          {ts.year ? `Year ${ts.year}` : ''}
                          {ts.month ? ` · ${ts.month}m` : ''}
                          {ts.day ? ` · ${ts.day}d` : ''}
                        </Text>
                      </View>
                    )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTimestampCard}>
                    <Text style={styles.emptyTimestampTitle}>No timestamp slots for this card type</Text>
                    <Text style={styles.emptyTimestampText}>
                      {card.type === 'Event'
                        ? 'Events normally have a single timestamp. Check the timeline setup.'
                        : 'Add a timeline to this world to start editing dates.'}
                    </Text>
                  </View>
                )}

                {isEditing && canEditTimestamps ? (
                  <TouchableOpacity
                    style={[styles.timestampSaveBtn, savingTimestamps && styles.disabled]}
                    onPress={handleSaveTimestamps}
                    disabled={savingTimestamps}
                  >
                    {savingTimestamps
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.timestampSaveBtnText}>Save timestamps</Text>}
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyTimestampCard}>
                <Text style={styles.emptyTimestampTitle}>No timeline yet</Text>
                <Text style={styles.emptyTimestampText}>
                  Create a timeline for this world before editing card timestamps.
                </Text>
              </View>
            )}
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  panel: {
    backgroundColor: '#13131f', borderRadius: 20, borderWidth: 1, borderColor: '#2d2d44',
    width: '100%', maxWidth: 720, maxHeight: '90%', overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerLeft: { flex: 1, gap: 6 },
  typeTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: {
    borderWidth: 1, borderColor: '#ef444433', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  deleteBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#2d2d44',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#8b8fa8', fontSize: 14 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  errorText: { fontSize: 12, color: '#ef4444' },
  legacyContent: { fontSize: 14, color: '#8b8fa8', lineHeight: 22 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  sectionHint: { fontSize: 12, color: '#8b8fa8' },
  timestampHeaderRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
  },
  timestampHint: { fontSize: 12, color: '#8b8fa8', marginTop: 2 },
  timestampSection: { gap: 12 },
  timestampBlock: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44', gap: 10,
  },
  timestampLabel: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  timestampRequired: { color: '#6366f1' },
  timestampFieldLabel: { fontSize: 12, fontWeight: '600', color: '#c0c4d8' },
  timestampGrid: { flexDirection: 'row', gap: 10 },
  timestampField: { gap: 4 },
  timestampInput: {
    backgroundColor: '#13131f', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#ffffff',
  },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  periodChip: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#2d2d44', backgroundColor: '#13131f',
  },
  periodChipActive: { borderColor: '#6366f1', backgroundColor: '#6366f122' },
  periodChipText: { fontSize: 11, fontWeight: '600', color: '#8b8fa8' },
  periodChipTextActive: { color: '#6366f1' },
  emptyTimestampCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2d44', gap: 6,
  },
  emptyTimestampTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  emptyTimestampText: { fontSize: 12, color: '#8b8fa8', lineHeight: 18 },
  metaSection: { gap: 12, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2d2d44' },
  metaHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaReadOnly: { gap: 8 },
  cardTitleDisplay: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  cardContentDisplay: { fontSize: 14, color: '#c0c4d8', lineHeight: 20 },
  cardContentEmpty: { fontSize: 13, color: '#8b8fa8' },
  editBtn: {
    borderWidth: 1, borderColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  editBtnText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  cancelEditBtn: {
    borderWidth: 1, borderColor: '#8b8fa8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  cancelEditBtnText: { color: '#8b8fa8', fontSize: 12, fontWeight: '700' },
  readOnlySectionContainer: { gap: 12, paddingVertical: 8 },
  readOnlySectionBlock: { gap: 6, borderBottomWidth: 1, borderBottomColor: '#2d2d44', paddingBottom: 10 },
  readOnlySectionHeading: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  readOnlySectionBody: { fontSize: 13, color: '#c0c4d8', lineHeight: 20 },
  sectionEmpty: { fontSize: 13, color: '#8b8fa8' },
  timestampReadRow: { paddingVertical: 8 },
  timestampReadValue: { fontSize: 13, color: '#c0c4d8' },
  input: {
    backgroundColor: '#13131f', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#ffffff',
  },
  textArea: { minHeight: 90 },
  inputError: { borderColor: '#ef4444' },
  metaSaveBtn: {
    alignSelf: 'flex-start', backgroundColor: '#6366f1',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  metaSaveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  timestampSaveBtn: {
    alignSelf: 'flex-start', backgroundColor: '#6366f1',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  timestampSaveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
