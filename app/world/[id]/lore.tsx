import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import WorldHeader from './_header';

type Card = {
  id: string;
  title: string;
  type: CardType;
  content: string | null;
  updated_at: string;
};

type FilterType = CardType | 'All';

export default function WorldLore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [fetchError, setFetchError] = useState('');

  // Create modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CardType>('Character');
  const [newContent, setNewContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cards')
      .select('id, title, type, content, updated_at')
      .eq('world_id', id)
      .order('updated_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
    } else {
      setCards(data ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  function openModal() {
    setNewTitle('');
    setNewType('Character');
    setNewContent('');
    setTitleError('');
    setCreateError('');
    setTypePickerOpen(false);
    setModalVisible(true);
  }

  async function handleCreate() {
    if (!newTitle.trim()) {
      setTitleError('Title is required.');
      return;
    }
    if (newTitle.trim().length > 100) {
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
        world_id: id,
        owner_id: session.user.id,
        type: newType,
        title: newTitle.trim(),
        content: newContent.trim() || null,
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      setCreateError(error.message);
    } else {
      setCards((prev) => [data, ...prev]);
      setModalVisible(false);
    }
  }

  const filtered = filter === 'All' ? cards : cards.filter((c) => c.type === filter);

  // Count per type for filter badges
  const typeCounts = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WorldHeader section="Lore" />

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'All' && styles.filterChipActive]}
          onPress={() => setFilter('All')}
        >
          <Text style={[styles.filterChipText, filter === 'All' && styles.filterChipTextActive]}>
            All {cards.length > 0 ? `(${cards.length})` : ''}
          </Text>
        </TouchableOpacity>
        {CARD_TYPES.filter((t) => (typeCounts[t] ?? 0) > 0).map((type) => {
          const active = filter === type;
          const color = CARD_TYPE_COLOR[type];
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                active && { backgroundColor: color + '22', borderColor: color + '66' },
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterChipText, active && { color }]}>
                {type} ({typeCounts[type]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Card list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : fetchError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>
            {filter === 'All' ? 'No cards yet' : `No ${filter} cards`}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'All' ? 'Create your first card below.' : 'Try a different filter.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.cardGrid} showsVerticalScrollIndicator={false}>
          {filtered.map((card) => {
            const color = CARD_TYPE_COLOR[card.type] ?? '#6366f1';
            return (
              <View key={card.id} style={styles.card}>
                <View style={[styles.cardTypeBar, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <View style={[styles.typeTag, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.typeTagText, { color }]}>{card.type}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
                  {card.content ? (
                    <Text style={styles.cardContent} numberOfLines={3}>{card.content}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create button */}
      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={openModal}>
          <Text style={styles.fabText}>+ New card</Text>
        </TouchableOpacity>
      </View>

      {/* Create modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>New card</Text>

            {/* Type picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Type</Text>
              <TouchableOpacity
                style={styles.typeTrigger}
                onPress={() => setTypePickerOpen((v) => !v)}
              >
                <View style={[styles.typeTagInline, { backgroundColor: CARD_TYPE_COLOR[newType] + '22' }]}>
                  <Text style={[styles.typeTagText, { color: CARD_TYPE_COLOR[newType] }]}>
                    {newType}
                  </Text>
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
                      const active = item === newType;
                      const color = CARD_TYPE_COLOR[item];
                      return (
                        <TouchableOpacity
                          style={[styles.typeListItem, active && styles.typeListItemActive]}
                          onPress={() => {
                            setNewType(item);
                            setTypePickerOpen(false);
                          }}
                        >
                          <View style={[styles.typeTagInline, { backgroundColor: color + '22' }]}>
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
                value={newTitle}
                onChangeText={(v) => {
                  setNewTitle(v);
                  if (titleError) setTitleError('');
                }}
                autoFocus={!typePickerOpen}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
            </View>

            {/* Content */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add some notes about this card…"
                placeholderTextColor="#4a4a6a"
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={4}
              />
            </View>

            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creating && styles.disabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  emptySubtext: { fontSize: 13, color: '#8b8fa8', textAlign: 'center' },
  errorText: { fontSize: 12, color: '#ef4444' },

  // Filter bar
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    backgroundColor: '#1a1a2e',
  },
  filterChipActive: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f166',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b8fa8',
  },
  filterChipTextActive: {
    color: '#6366f1',
  },

  // Card grid
  cardGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardTypeBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  typeTag: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardContent: {
    fontSize: 13,
    color: '#8b8fa8',
    lineHeight: 18,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  fabButton: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#16162a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c0c4d8',
  },
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
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: '#ef4444' },

  // Type picker
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
  typeTagInline: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
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
  typeListItemActive: {
    backgroundColor: '#23233a',
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8b8fa8',
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: { opacity: 0.6 },
});
