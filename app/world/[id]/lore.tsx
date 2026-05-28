import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import WorldHeader from './_header';
import CreateCardModal, { type CreatedCard } from './_create-card-modal';

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
  const [modalVisible, setModalVisible] = useState(false);

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

  function handleCardCreated(card: CreatedCard) {
    setCards((prev) => [card, ...prev]);
    setModalVisible(false);
  }

  const filtered = filter === 'All' ? cards : cards.filter((c) => c.type === filter);

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

      {/* FAB */}
      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+ New card</Text>
        </TouchableOpacity>
      </View>

      <CreateCardModal
        visible={modalVisible}
        worldId={id}
        onClose={() => setModalVisible(false)}
        onCreated={handleCardCreated}
      />
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
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#8b8fa8' },
  filterChipTextActive: { color: '#6366f1' },
  cardGrid: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardTypeBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  typeTag: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  cardContent: { fontSize: 13, color: '#8b8fa8', lineHeight: 18 },
  fab: { position: 'absolute', bottom: 80, right: 20 },
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
  fabText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
