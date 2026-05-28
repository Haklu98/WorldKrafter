import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { confirmAction } from '../../../lib/timeline/confirm';

export type CardSection = { heading: string; body: string };

type Props = {
  sections: CardSection[];
  onChange: (sections: CardSection[]) => void;
  // When provided, each section save triggers this (used in edit mode)
  onSave?: (sections: CardSection[]) => void;
};

export default function SectionEditor({ sections, onChange, onSave }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function addSection() {
    const next = [...sections, { heading: '', body: '' }];
    onChange(next);
    setEditingIndex(next.length - 1);
  }

  function updateSection(i: number, field: 'heading' | 'body', value: string) {
    const next = sections.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    onChange(next);
  }

  function deleteSection(i: number) {
    confirmAction('Delete section', 'Remove this section?', () => {
      const next = sections.filter((_, idx) => idx !== i);
      onChange(next);
      if (editingIndex === i) setEditingIndex(null);
      onSave?.(next);
    });
  }

  function saveSection() {
    setEditingIndex(null);
    onSave?.(sections);
  }

  return (
    <View style={styles.container}>
      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          {editingIndex === i ? (
            <View style={styles.sectionEdit}>
              <TextInput
                style={styles.headingInput}
                value={section.heading}
                onChangeText={(v) => updateSection(i, 'heading', v)}
                placeholder="Section heading…"
                placeholderTextColor="#4a4a6a"
              />
              <TextInput
                style={styles.bodyInput}
                value={section.body}
                onChangeText={(v) => updateSection(i, 'body', v)}
                placeholder="Write something…"
                placeholderTextColor="#4a4a6a"
                multiline
                textAlignVertical="top"
              />
              <View style={styles.sectionActions}>
                <TouchableOpacity onPress={() => deleteSection(i)}>
                  <Text style={styles.deleteBtnText}>Delete section</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveSection}>
                  <Text style={styles.saveBtnText}>{onSave ? 'Save' : 'Done'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.sectionRead} onPress={() => setEditingIndex(i)} activeOpacity={0.7}>
              {section.heading ? (
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              ) : null}
              {section.body ? (
                <Text style={styles.sectionBody}>{section.body}</Text>
              ) : (
                <Text style={styles.sectionEmpty}>Empty — tap to edit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addSection}>
        <Text style={styles.addBtnText}>+ Add section</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  section: { borderRadius: 12, borderWidth: 1, borderColor: '#2d2d44', overflow: 'hidden' },
  sectionRead: { padding: 14, gap: 6 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  sectionBody: { fontSize: 14, color: '#c0c4d8', lineHeight: 21 },
  sectionEmpty: { fontSize: 13, color: '#4a4a6a', fontStyle: 'italic' },
  sectionEdit: { padding: 14, gap: 10, backgroundColor: '#1a1a2e' },
  headingInput: {
    fontSize: 16, fontWeight: '700', color: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#2d2d44', paddingBottom: 8,
  },
  bodyInput: {
    fontSize: 14, color: '#c0c4d8', lineHeight: 21, minHeight: 90,
    borderWidth: 1, borderColor: '#2d2d44', borderRadius: 8, padding: 10,
  },
  sectionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtnText: { fontSize: 12, color: '#ef4444' },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  addBtn: {
    borderWidth: 1, borderColor: '#2d2d44', borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  addBtnText: { fontSize: 13, color: '#4a4a6a', fontWeight: '600' },
});
