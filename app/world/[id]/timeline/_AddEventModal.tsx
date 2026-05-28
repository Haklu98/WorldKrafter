import { useState } from 'react';
import {
  Modal, Pressable, ScrollView, View, Text,
  TextInput, TouchableOpacity, ActivityIndicator, FlatList,
} from 'react-native';
import { supabase } from '../../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../../lib/cardTypes';
import { CARD_TIMESTAMP_SLOTS } from '../../../../lib/cardTimestamps';
import { F, S } from './_styles';
import type { CardTimestamp, Timeline } from './_types';

type TimestampDraft = {
  label: string;
  hint: string;
  year: string;
  month: string;
  day: string;
  required: boolean;
};

type Props = {
  visible: boolean;
  worldId: string;
  timeline: Timeline;
  onClose: () => void;
  onCreated: (timestamps: CardTimestamp[]) => void;
};

function buildDrafts(type: CardType): TimestampDraft[] {
  return CARD_TIMESTAMP_SLOTS[type].map((slot) => ({
    label: slot.label,
    hint: slot.hint,
    year: '',
    month: '',
    day: '',
    required: slot.required ?? false,
  }));
}

export default function AddEventModal({ visible, worldId, timeline, onClose, onCreated }: Props) {
  const [cardType, setCardType] = useState<CardType>('Event');
  const [cardTitle, setCardTitle] = useState('');
  const [cardContent, setCardContent] = useState('');
  const [timestamps, setTimestamps] = useState<TimestampDraft[]>(buildDrafts('Event'));
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [tsErrors, setTsErrors] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleTypeChange(t: CardType) {
    setCardType(t);
    setTimestamps(buildDrafts(t));
    setTypePickerOpen(false);
    setTsErrors({});
  }

  function updateTs(i: number, field: 'year' | 'month' | 'day', value: string) {
    setTimestamps((prev) => prev.map((ts, idx) =>
      idx === i ? { ...ts, [field]: value } : ts
    ));
    if (tsErrors[i]) setTsErrors((prev) => { const n = { ...prev }; delete n[i]; return n; });
  }

  function reset() {
    setCardType('Event'); setCardTitle(''); setCardContent('');
    setTimestamps(buildDrafts('Event')); setTypePickerOpen(false);
    setTitleError(''); setTsErrors({}); setSaveError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    let valid = true;
    if (!cardTitle.trim()) { setTitleError('Title is required.'); valid = false; }

    const newTsErrors: Record<number, string> = {};
    timestamps.forEach((ts, i) => {
      if (ts.required && !ts.year.trim()) {
        newTsErrors[i] = 'Year is required.';
        valid = false;
      }
    });
    setTsErrors(newTsErrors);
    if (!valid) return;

    setSaving(true); setSaveError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaveError('Not signed in.'); setSaving(false); return; }

    // Create the card
    const { data: cardData, error: cardErr } = await supabase
      .from('cards')
      .insert({
        world_id: worldId,
        owner_id: session.user.id,
        type: cardType,
        title: cardTitle.trim(),
        content: cardContent.trim() || null,
      })
      .select('id')
      .single();

    if (cardErr) { setSaveError(cardErr.message); setSaving(false); return; }

    // Insert timestamps that have a year filled in
    const tsRows = timestamps
      .filter((ts) => ts.year.trim())
      .map((ts) => ({
        card_id: cardData.id,
        timeline_id: timeline.id,
        owner_id: session.user.id,
        label: ts.label,
        year: parseInt(ts.year),
        month: ts.month.trim() ? parseInt(ts.month) : null,
        day: ts.day.trim() ? parseInt(ts.day) : null,
      }));

    if (tsRows.length > 0) {
      const { data: tsData, error: tsErr } = await supabase
        .from('card_timestamps')
        .insert(tsRows)
        .select('id, card_id, timeline_id, label, year, month, day, sort_key');

      if (tsErr) { setSaveError(tsErr.message); setSaving(false); return; }

      const enriched: CardTimestamp[] = (tsData ?? []).map((t: any) => ({
        ...t,
        card_title: cardTitle.trim(),
        card_type: cardType,
      }));
      onCreated(enriched);
    } else {
      onCreated([]);
    }

    setSaving(false);
    reset();
  }

  const typeColor = CARD_TYPE_COLOR[cardType];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={S.overlay} onPress={handleClose}>
        <Pressable style={S.modalCard} onPress={() => {}}>
          <Text style={S.modalTitle}>Add to timeline</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            <View style={S.modalBody}>

              {/* Type picker */}
              <View style={F.field}>
                <Text style={F.label}>Card type</Text>
                <TouchableOpacity
                  style={[styles.typeTrigger, { borderColor: typeColor + '55' }]}
                  onPress={() => setTypePickerOpen((v) => !v)}
                >
                  <View style={[styles.typeTag, { backgroundColor: typeColor + '22' }]}>
                    <Text style={[styles.typeTagText, { color: typeColor }]}>{cardType}</Text>
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
                        const active = item === cardType;
                        const c = CARD_TYPE_COLOR[item];
                        return (
                          <TouchableOpacity
                            style={[styles.typeListItem, active && styles.typeListItemActive]}
                            onPress={() => handleTypeChange(item)}
                          >
                            <View style={[styles.typeTag, { backgroundColor: c + '22' }]}>
                              <Text style={[styles.typeTagText, { color: c }]}>{item}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Title */}
              <View style={F.field}>
                <Text style={F.label}>Name / Title</Text>
                <TextInput
                  style={[F.input, titleError ? F.inputError : null]}
                  value={cardTitle}
                  onChangeText={(v) => { setCardTitle(v); if (titleError) setTitleError(''); }}
                  placeholder="e.g. Aldric the Bold"
                  placeholderTextColor="#4a4a6a"
                />
                {titleError ? <Text style={S.errorText}>{titleError}</Text> : null}
              </View>

              {/* Notes */}
              <View style={F.field}>
                <Text style={F.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                  style={[F.input, F.textArea]}
                  value={cardContent}
                  onChangeText={setCardContent}
                  multiline
                  numberOfLines={3}
                  placeholder="Brief notes about this entry…"
                  placeholderTextColor="#4a4a6a"
                />
              </View>

              {/* Timestamps */}
              <View style={S.divider} />
              <Text style={styles.tsHeader}>Dates on timeline</Text>

              {timestamps.map((ts, i) => (
                <View key={ts.label} style={styles.tsBlock}>
                  <Text style={styles.tsLabel}>
                    {ts.label}
                    {ts.required ? <Text style={styles.tsRequired}> *</Text> : null}
                  </Text>
                  <Text style={styles.tsHint}>{ts.hint}</Text>
                  <View style={S.twoCol}>
                    <View style={[F.field, { flex: 2 }]}>
                      <Text style={F.label}>Year</Text>
                      <TextInput
                        style={[F.input, tsErrors[i] ? F.inputError : null]}
                        value={ts.year}
                        onChangeText={(v) => updateTs(i, 'year', v)}
                        keyboardType="numeric"
                        placeholder="e.g. 450"
                        placeholderTextColor="#4a4a6a"
                      />
                      {tsErrors[i] ? <Text style={S.errorText}>{tsErrors[i]}</Text> : null}
                    </View>
                    <View style={[F.field, { flex: 1 }]}>
                      <Text style={F.label}>Month</Text>
                      <TextInput
                        style={F.input}
                        value={ts.month}
                        onChangeText={(v) => updateTs(i, 'month', v)}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#4a4a6a"
                      />
                    </View>
                    <View style={[F.field, { flex: 1 }]}>
                      <Text style={F.label}>Day</Text>
                      <TextInput
                        style={F.input}
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

              {saveError ? <Text style={S.errorText}>{saveError}</Text> : null}
            </View>
          </ScrollView>

          <View style={S.modalActions}>
            <TouchableOpacity style={S.cancelBtn} onPress={handleClose}>
              <Text style={S.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.primaryBtn, saving && S.disabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.primaryBtnText}>Add to timeline</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  typeTrigger: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  typeTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
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
  optional: { fontWeight: '400', color: '#8b8fa8' },
  tsHeader: { fontSize: 13, fontWeight: '700', color: '#c0c4d8', marginBottom: 4 },
  tsBlock: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44', gap: 8,
  },
  tsLabel: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  tsRequired: { color: '#6366f1' },
  tsHint: { fontSize: 11, color: '#8b8fa8', marginTop: -4 },
});

// Need StyleSheet import
import { StyleSheet } from 'react-native';
