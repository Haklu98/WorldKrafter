import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, Pressable, FlatList,
} from 'react-native';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import type { Timeline, TimelinePeriod } from '../../../lib/timeline/types';
import SectionEditor, { type CardSection } from './_section-editor';

type TimestampDraft = {
  label: string; hint: string; year: string; month: string; day: string; required: boolean;
  periodId: string | null;
};

type Props = {
  visible: boolean;
  title: string;
  type: CardType;
  content: string;
  titleError: string;
  createError: string;
  creating: boolean;
  timeline: Timeline | null;
  periods: TimelinePeriod[];
  timestamps: TimestampDraft[];
  tsErrors: Record<number, string>;
  onChangeTitle: (v: string) => void;
  onChangeType: (v: CardType) => void;
  onChangeContent: (v: string) => void;
  onUpdateTs: (i: number, field: 'year' | 'month' | 'day', value: string) => void;
  onUpdateTsPeriod: (i: number, periodId: string | null) => void;
  sections: CardSection[];
  onChangeSections: (sections: CardSection[]) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CardEditorDesktop({
  visible, title, type, titleError, createError, creating,
  timeline, periods, timestamps, tsErrors, sections,
  onChangeTitle, onChangeType, onUpdateTs, onUpdateTsPeriod, onChangeSections, onClose, onSubmit,
}: Props) {
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const typeColor = CARD_TYPE_COLOR[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>

          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.panelTitle}>New card</Text>
            <View style={styles.topBarRight}>
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name / Title</Text>
              <TextInput
                style={[styles.titleInput, titleError ? styles.titleInputError : null]}
                placeholder="e.g. Aldric the Bold"
                placeholderTextColor="#4a4a6a"
                value={title}
                onChangeText={onChangeTitle}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
            </View>

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
                    style={{ maxHeight: 240 }}
                    scrollEnabled
                    renderItem={({ item }) => {
                      const active = item === type;
                      const c = CARD_TYPE_COLOR[item];
                      return (
                        <TouchableOpacity
                          style={[styles.typeListItem, active && styles.typeListItemActive]}
                          onPress={() => { onChangeType(item); setTypePickerOpen(false); }}
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

            {/* Sections */}
            <View style={styles.divider} />
            <SectionEditor sections={sections} onChange={onChangeSections} />

            {/* Timestamps */}
            {timeline && (
              <View style={styles.tsSection}>
                <View style={styles.divider} />
                <Text style={styles.tsHeader}>Dates on timeline</Text>
                <View style={styles.tsGrid}>
                  {timestamps.map((ts, i) => (
                    <View key={ts.label} style={styles.tsBlock}>
                      <Text style={styles.tsLabel}>
                        {ts.label}
                        {ts.required ? <Text style={styles.tsRequired}> *</Text> : null}
                      </Text>
                      <Text style={styles.tsHint}>{ts.hint}</Text>

                      {/* Period picker for era/age timelines */}
                      {periods.length > 0 && (
                        <View style={{ gap: 4 }}>
                          <Text style={styles.tsFieldLabel}>
                            {timeline!.tracking_type === 'age' ? 'Age' : 'Era'}
                          </Text>
                          <View style={styles.periodRow}>
                            {periods.map((p) => {
                              const active = ts.periodId === p.id;
                              const label = timeline!.tracking_type === 'age' && p.name ? p.name : `Era ${p.position}`;
                              const chipLabel = `${label} · ${p.years}y`;
                              return (
                                <TouchableOpacity
                                  key={p.id}
                                  style={[styles.periodChip, active && styles.periodChipActive]}
                                  onPress={() => onUpdateTsPeriod(i, active ? null : p.id)}
                                >
                                  <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                                    {chipLabel}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      <View style={styles.twoCol}>
                        <View style={[styles.tsField, { flex: 2 }]}>
                          <Text style={styles.tsFieldLabel}>
                            {periods.length > 0 ? 'Year within period' : 'Year'}
                          </Text>
                          <TextInput
                            style={[styles.tsInput, tsErrors[i] ? styles.tsInputError : null]}
                            value={ts.year}
                            onChangeText={(v) => onUpdateTs(i, 'year', v)}
                            keyboardType="numeric"
                            placeholder="e.g. 450"
                            placeholderTextColor="#4a4a6a"
                          />
                          {tsErrors[i] ? <Text style={styles.errorText}>{tsErrors[i]}</Text> : null}
                        </View>
                        <View style={[styles.tsField, { flex: 1 }]}>
                          <Text style={styles.tsFieldLabel}>Month</Text>
                          <TextInput
                            style={styles.tsInput}
                            value={ts.month}
                            onChangeText={(v) => onUpdateTs(i, 'month', v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                          />
                        </View>
                        <View style={[styles.tsField, { flex: 1 }]}>
                          <Text style={styles.tsFieldLabel}>Day</Text>
                          <TextInput
                            style={styles.tsInput}
                            value={ts.day}
                            onChangeText={(v) => onUpdateTs(i, 'day', v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#4a4a6a"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, creating && styles.disabled]}
              onPress={onSubmit}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Create card</Text>}
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  panel: {
    backgroundColor: '#13131f', borderRadius: 20, borderWidth: 1, borderColor: '#2d2d44',
    width: '100%', maxWidth: 560, maxHeight: '90%', overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e1e30',
  },
  panelTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    borderColor: '#2d2d44', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#8b8fa8', fontSize: 14 },
  errorText: { fontSize: 12, color: '#ef4444' },

  body: { padding: 24, gap: 16, paddingBottom: 8 },

  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#c0c4d8' },
  titleInput: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: '#ffffff', fontWeight: '600',
  },
  titleInputError: { borderColor: '#ef4444' },

  typeTrigger: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  typeTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: 12, fontWeight: '700' },
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
  tsSection: { gap: 12 },
  tsHeader: { fontSize: 12, fontWeight: '700', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: 0.6 },
  tsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tsBlock: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44', gap: 8, minWidth: 220, flex: 1,
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
  tsField: { gap: 4 },
  tsFieldLabel: { fontSize: 12, fontWeight: '600', color: '#c0c4d8' },
  tsInput: {
    backgroundColor: '#13131f', borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#ffffff',
  },
  tsInputError: { borderColor: '#ef4444' },

  footer: {
    flexDirection: 'row', gap: 12, padding: 24,
    borderTopWidth: 1, borderTopColor: '#1e1e30',
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: '#2d2d44',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#8b8fa8', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1, backgroundColor: '#6366f1',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
