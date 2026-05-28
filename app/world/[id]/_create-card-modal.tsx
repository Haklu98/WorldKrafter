import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import { useWorld } from './_layout';
import CardEditorDesktop from './_card-editor-desktop';

export type CreatedCard = {
  id: string;
  title: string;
  type: CardType;
  content: string | null;
  updated_at: string;
};

type Props = {
  visible: boolean;
  worldId: string;
  onClose: () => void;
  onCreated: (card: CreatedCard) => void;
};

export default function CreateCardModal({ visible, worldId, onClose, onCreated }: Props) {
  const { isDesktop } = useWorld();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CardType>('Character');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  function reset() {
    setTitle('');
    setType('Character');
    setContent('');
    setTitleError('');
    setCreateError('');
    setTypePickerOpen(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }
    if (title.trim().length > 100) {
      setTitleError('Title must be 100 characters or fewer.');
      return;
    }

    setCreating(true);
    setCreateError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreateError('Not signed in.');
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('cards')
      .insert({
        world_id: worldId,
        owner_id: session.user.id,
        type,
        title: title.trim(),
        content: content.trim() || null,
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      setCreateError(error.message);
    } else {
      onCreated(data as CreatedCard);
      reset();
    }
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
        onChangeTitle={(v) => { setTitle(v); if (titleError) setTitleError(''); }}
        onChangeType={setType}
        onChangeContent={setContent}
        onClose={handleClose}
        onSubmit={handleCreate}
      />
    );
  }

  // ── Mobile: compact modal ──────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.modalTitle}>New card</Text>

          {/* Type picker */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Type</Text>
            <TouchableOpacity
              style={styles.typeTrigger}
              onPress={() => setTypePickerOpen((v) => !v)}
            >
              <View style={[styles.typeTag, { backgroundColor: CARD_TYPE_COLOR[type] + '22' }]}>
                <Text style={[styles.typeTagText, { color: CARD_TYPE_COLOR[type] }]}>{type}</Text>
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
                        onPress={() => { setType(item); setTypePickerOpen(false); }}
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

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Notes <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add some notes about this card…"
              placeholderTextColor="#4a4a6a"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
            />
          </View>

          {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#16162a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#c0c4d8' },
  optional: { fontWeight: '400', color: '#8b8fa8' },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 12, color: '#ef4444' },
  typeTrigger: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 11, color: '#8b8fa8' },
  typeList: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  typeListItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  typeListItemActive: { backgroundColor: '#23233a' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#8b8fa8', fontSize: 15, fontWeight: '600' },
  createButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  createButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
