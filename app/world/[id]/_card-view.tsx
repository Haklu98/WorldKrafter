import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import { confirmAction } from '../../../lib/timeline/confirm';
import SectionEditor, { type CardSection } from './_section-editor';

export type { CardSection };

export type FullCard = {
  id: string;
  title: string;
  type: CardType;
  content: string | null;
  sections: CardSection[];
  updated_at: string;
};

type Props = {
  card: FullCard;
  visible: boolean;
  onClose: () => void;
  onUpdated: (card: FullCard) => void;
  onDeleted: (id: string) => void;
};

export default function CardView({ card, visible, onClose, onUpdated, onDeleted }: Props) {
  const [sections, setSections] = useState<CardSection[]>(card.sections ?? []);
  const [saving, setSaving] = useState(false);
  const color = CARD_TYPE_COLOR[card.type] ?? '#6366f1';

  async function handleSave(updated: CardSection[]) {
    setSaving(true);
    const { error } = await supabase
      .from('cards').update({ sections: updated }).eq('id', card.id);
    setSaving(false);
    if (!error) onUpdated({ ...card, sections: updated });
  }

  function handleDelete() {
    confirmAction('Delete card', `Delete "${card.title}"? This cannot be undone.`, async () => {
      await supabase.from('card_timestamps').delete().eq('card_id', card.id);
      await supabase.from('cards').delete().eq('id', card.id);
      onDeleted(card.id);
      onClose();
    });
  }

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
              {saving && <ActivityIndicator size="small" color="#6366f1" />}
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
            {card.content ? <Text style={styles.legacyContent}>{card.content}</Text> : null}

            <SectionEditor
              sections={sections}
              onChange={setSections}
              onSave={handleSave}
            />
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
  legacyContent: { fontSize: 14, color: '#8b8fa8', lineHeight: 22 },
});
