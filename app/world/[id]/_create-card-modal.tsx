import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator,
  Modal, Pressable, TextInput, FlatList, ScrollView,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import { CARD_TIMESTAMP_SLOTS } from '../../../lib/cardTimestamps';
import type { Timeline, TimelinePeriod, CardTimestamp } from '../../../lib/timeline/types';
import { useWorld } from './_layout';
import CardEditorDesktop from './_card-editor-desktop';
import SectionEditor, { type CardSection } from './_section-editor';

export type CreatedCard = {
  id: string;
  title: string;
  type: CardType;
  content: string | null;
  updated_at: string;
};

type TimestampDraft = {
  label: string;
  hint: string;
  timelineLabel: string;
  year: string;
  month: string;
  day: string;
  required: boolean;
  periodId: string | null;
};

type Props = {
  visible: boolean;
  worldId: string;
  onClose: () => void;
  onCreated: (card: CreatedCard, timestamps: CardTimestamp[], sections: CardSection[]) => void;
  timeline?: Timeline;
  periods?: TimelinePeriod[];
};

function buildDrafts(type: CardType): TimestampDraft[] {
  return CARD_TIMESTAMP_SLOTS[type].map((slot) => ({
    label: slot.label,
    hint: slot.hint,
    timelineLabel: slot.timelineLabel,
    year: '',
    month: '',
    day: '',
    required: slot.required ?? false,
    periodId: null,
  }));
}

function periodOffset(periods: TimelinePeriod[], periodId: string | null): number {
  if (!periodId) return 0;
  let offset = 0;
  for (const p of periods) {
    if (p.id === periodId) break;
    offset += p.years;
  }
  return offset;
}

function periodLabel(trackingType: string, p: TimelinePeriod): string {
  const name = trackingType === 'age' && p.name ? p.name : `Era ${p.position}`;
  return `${name} · ${p.years}y`;
}

export default function CreateCardModal({ visible, worldId, onClose, onCreated, timeline: timelineProp, periods: periodsProp }: Props) {
  const { isDesktop } = useWorld();

  const [timeline, setTimeline] = useState<Timeline | null>(timelineProp ?? null);
  const [periods, setPeriods] = useState<TimelinePeriod[]>(periodsProp ?? []);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CardType>('Character');
  const [content, setContent] = useState('');
  const [timestamps, setTimestamps] = useState<TimestampDraft[]>(buildDrafts('Character'));
  const [sections, setSections] = useState<CardSection[]>([]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [tsErrors, setTsErrors] = useState<Record<number, string>>({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch the world's timeline (and periods if era/age) if not passed as props
  useEffect(() => {
    if (timelineProp) { setTimeline(timelineProp); return; }
    if (!visible) return;
    supabase
      .from('timelines')
      .select('id, name, time_format_id, tracking_type, pivot_card_id, before_label, after_label')
      .eq('world_id', worldId)
      .limit(1)
      .maybeSingle()
      .then(async ({ data: tl }) => {
        setTimeline(tl ?? null);
        if (tl && (tl.tracking_type === 'era' || tl.tracking_type === 'age')) {
          const { data: pData } = await supabase
            .from('timeline_periods')
            .select('id, position, name, years, months, days')
            .eq('timeline_id', tl.id)
            .order('position', { ascending: true });
          setPeriods(pData ?? []);
        } else {
          setPeriods([]);
        }
      });
  }, [visible, worldId, timelineProp]);

  useEffect(() => {
    if (periodsProp) setPeriods(periodsProp);
  }, [periodsProp]);

  function handleTypeChange(t: CardType) {
    setType(t);
    setTimestamps(buildDrafts(t));
    setTypePickerOpen(false);
    setTsErrors({});
  }

  function updateTs(i: number, field: 'year' | 'month' | 'day', value: string) {
    setTimestamps((prev) => prev.map((ts, idx) => idx === i ? { ...ts, [field]: value } : ts));
    if (tsErrors[i]) setTsErrors((prev) => { const n = { ...prev }; delete n[i]; return n; });
  }

  function updateTsPeriod(i: number, periodId: string | null) {
    setTimestamps((prev) => prev.map((ts, idx) => idx === i ? { ...ts, periodId } : ts));
  }

  function reset() {
    setTitle(''); setType('Character'); setContent('');
    setTimestamps(buildDrafts('Character')); setTypePickerOpen(false);
    setTitleError(''); setTsErrors({}); setCreateError('');
    setSections([]);
    if (!timelineProp) { setTimeline(null); setPeriods([]); }
  }

  function handleClose() { reset(); onClose(); }

  async function handleCreate() {
    let valid = true;
    if (!title.trim()) { setTitleError('Title is required.'); valid = false; }
    if (title.trim().length > 100) { setTitleError('Title must be 100 characters or fewer.'); valid = false; }

    const newTsErrors: Record<number, string> = {};
    if (timeline) {
      timestamps.forEach((ts, i) => {
        if (ts.required && !ts.year.trim()) { newTsErrors[i] = 'Year is required.'; valid = false; }
      });
    }
    setTsErrors(newTsErrors);
    if (!valid) return;

    setCreating(true); setCreateError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCreateError('Not signed in.'); setCreating(false); return; }

    const { data: cardData, error: cardErr } = await supabase
      .from('cards')
      .insert({ world_id: worldId, owner_id: session.user.id, type, title: title.trim(), content: null, sections })
      .select()
      .single();

    if (cardErr) { setCreateError(cardErr.message); setCreating(false); return; }

    let enrichedTs: CardTimestamp[] = [];

    if (timeline) {
      const tsRows = timestamps
        .filter((ts) => ts.year.trim())
        .map((ts) => ({
          card_id: cardData.id,
          timeline_id: timeline.id,
          owner_id: session.user.id,
          label: ts.timelineLabel.replace('{name}', title.trim()),
          year: parseInt(ts.year) + periodOffset(periods, ts.periodId),
          month: ts.month.trim() ? parseInt(ts.month) : null,
          day: ts.day.trim() ? parseInt(ts.day) : null,
        }));

      if (tsRows.length > 0) {
        const { data: tsData, error: tsErr } = await supabase
          .from('card_timestamps')
          .insert(tsRows)
          .select('id, card_id, timeline_id, label, year, month, day, sort_key');

        if (tsErr) { setCreateError(tsErr.message); setCreating(false); return; }

        enrichedTs = (tsData ?? []).map((t: any) => ({
          ...t,
          card_title: title.trim(),
          card_type: type,
        }));
      }
    }

    setCreating(false);
    onCreated(cardData as CreatedCard, enrichedTs, sections);
    reset();
  }

  // ── Desktop: full wiki editor ──────────────────────────────────────────────
  if (isDesktop) {
    return (
      <CardEditorDesktop
        visible={visible}
        title={title}
        type={type}
        content={content}
        titleError={titleError}
        createError={createError}
        creating={creating}
        timeline={timeline}
        periods={periods}
        timestamps={timestamps}
        tsErrors={tsErrors}
        sections={sections}
        onChangeTitle={(v) => { setTitle(v); if (titleError) setTitleError(''); }}
        onChangeType={handleTypeChange}
        onChangeContent={setContent}
        onUpdateTs={updateTs}
        onUpdateTsPeriod={updateTsPeriod}
        onChangeSections={setSections}
        onClose={handleClose}
        onSubmit={handleCreate}
      />
    );
  }

  const typeColor = CARD_TYPE_COLOR[type];

  // ── Mobile: compact modal ──────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.modalTitle}>New card</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            <View style={{ gap: 16 }}>

              {/* Type picker */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Type</Text>
                <TouchableOpacity
                  style={[styles.typeTrigger, { borderColor: typeColor + '55' }]}
                  onPress={() => setTypePickerOpen((v) => !v)}
                >
                  <View style={[styles.typeTag, { backgroundColor: typeColor + '22' }]}>
                    <Text style={[styles.typeTagText, { color: typeColor }]}>{type}</Text>
                  </View>
                  <Text style={styles.chevron}>{typePickerOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {typePickerOpen && (
                  <View style={styles.typeList}>
                    <FlatList
                      data={CARD_TYPES}
                      keyExtractor={(t) => t}
                      style={{ maxHeight: 200 }}
                      scrollEnabled
                      renderItem={({ item }) => {
                        const active = item === type;
                        const color = CARD_TYPE_COLOR[item];
                        return (
                          <TouchableOpacity
                            style={[styles.typeListItem, active && styles.typeListItemActive]}
                            onPress={() => handleTypeChange(item)}
                          >
                            <View style={[styles.typeTag, { backgroundColor: color + '22' }]}>
                              <Text style={[styles.typeTagText, { color }]}>{item}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Title */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={[styles.input, titleError ? styles.inputError : null]}
                  placeholder="e.g. Aldric the Bold"
                  placeholderTextColor="#4a4a6a"
                  value={title}
                  onChangeText={(v) => { setTitle(v); if (titleError) setTitleError(''); }}
                />
                {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
              </View>

              {/* Timestamps — only when a timeline is provided */}
              {timeline && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.tsHeader}>Dates on timeline</Text>
                  {timestamps.map((ts, i) => (
                    <View key={ts.label} style={styles.tsBlock}>
                      <Text style={styles.tsLabel}>
                        {ts.label}
                        {ts.required ? <Text style={styles.tsRequired}> *</Text> : null}
                      </Text>
                      <Text style={styles.tsHint}>{ts.hint}</Text>

                      {/* Period picker for era/age timelines */}
                      {periods.length > 0 && (
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>
                            {timeline.tracking_type === 'age' ? 'Age' : 'Era'}
                          </Text>
                          <View style={styles.periodRow}>
                            {periods.map((p) => {
                              const active = ts.periodId === p.id;
                              return (
                                <TouchableOpacity
                                  key={p.id}
                                  style={[styles.periodChip, active && styles.periodChipActive]}
                                  onPress={() => updateTsPeriod(i, active ? null : p.id)}
                                >
                                  <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                                    {periodLabel(timeline.tracking_type, p)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      <View style={styles.twoCol}>
                        <View style={[styles.field, { flex: 2 }]}>
                          <Text style={styles.fieldLabel}>
                            {periods.length > 0 ? 'Year within period' : 'Year'}
                          </Text>
                          <TextInput
                            style={[styles.input, tsErrors[i] ? styles.inputError : null]}
                            value={ts.year}
                            onChangeText={(v) => updateTs(i, 'year', v)}
                            keyboardType="numeric"
                            placeholder="e.g. 45"
                            placeholderTextColor="#4a4a6a"
                          />
                          {tsErrors[i] ? <Text style={styles.errorText}>{tsErrors[i]}</Text> : null}
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Month</Text>
                          <TextInput
                            style={styles.input}
                            value={ts.month}
                            onChangeText={(v) => updateTs(i, 'month', v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                          />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Day</Text>
                          <TextInput
                            style={styles.input}
                            value={ts.day}
                            onChangeText={(v) => updateTs(i, 'day', v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, creating && styles.disabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.createButtonText}>Create</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#16162a', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 480, gap: 16, borderWidth: 1, borderColor: '#2d2d44',
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#c0c4d8' },
  optional: { fontWeight: '400', color: '#8b8fa8' },
  input: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#ffffff',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 12, color: '#ef4444' },
  typeTrigger: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  typeTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 11, color: '#8b8fa8' },
  typeList: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 12, overflow: 'hidden', marginTop: 4,
  },
  typeListItem: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2d2d44',
  },
  typeListItemActive: { backgroundColor: '#23233a' },
  divider: { height: 1, backgroundColor: '#1e1e30' },
  tsHeader: { fontSize: 13, fontWeight: '700', color: '#c0c4d8' },
  tsBlock: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44', gap: 8,
  },
  tsLabel: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  tsRequired: { color: '#6366f1' },
  tsHint: { fontSize: 11, color: '#8b8fa8', marginTop: -4 },
  twoCol: { flexDirection: 'row', gap: 10 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  periodChip: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#2d2d44', backgroundColor: '#13131f',
  },
  periodChipActive: { borderColor: '#6366f1', backgroundColor: '#6366f122' },
  periodChipText: { fontSize: 11, fontWeight: '600', color: '#8b8fa8' },
  periodChipTextActive: { color: '#6366f1' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1, borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  cancelButtonText: { color: '#8b8fa8', fontSize: 15, fontWeight: '600' },
  createButton: {
    flex: 1, backgroundColor: '#6366f1',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  createButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
