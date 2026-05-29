import { useEffect, useState, useCallback } from 'react';
import {
  Text, View, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../../lib/cardTypes';
import WorldHeader from '../_header';
import CreateCardModal from '../_create-card-modal';
import CardView, { type FullCard } from '../_card-view';
import styles from './styles';

type FilterType = CardType | 'All';

export default function WorldLore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cards, setCards] = useState<FullCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [fetchError, setFetchError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FullCard | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cards')
      .select('id, world_id, title, type, content, sections, updated_at')
      .eq('world_id', id)
      .order('updated_at', { ascending: false });

    if (error) setFetchError(error.message);
    else setCards((data ?? []).map((c: any) => ({ ...c, sections: c.sections ?? [] })));
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  function handleCardCreated(card: any, _timestamps: any[]) {
    const newCard = {
      ...card,
      world_id: card.world_id ?? id,
      sections: card.sections ?? [],
    };
    setCards((prev) => [newCard, ...prev]);
    setModalVisible(false);
    setSelectedCard(newCard);
  }

  function handleCardUpdated(updated: FullCard) {
    setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelectedCard(updated);
  }

  function handleCardDeleted(deletedId: string) {
    setCards((prev) => prev.filter((c) => c.id !== deletedId));
    setSelectedCard(null);
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
              style={[styles.filterChip, active && { backgroundColor: color + '22', borderColor: color + '66' }]}
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
        <View style={styles.centered}><ActivityIndicator color="#6366f1" /></View>
      ) : fetchError ? (
        <View style={styles.centered}><Text style={styles.errorText}>{fetchError}</Text></View>
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
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={() => setSelectedCard(card)}
                activeOpacity={0.75}
              >
                <View style={[styles.cardTypeBar, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <View style={[styles.typeTag, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.typeTagText, { color }]}>{card.type}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
                  {card.sections.length > 0 ? (
                    <Text style={styles.cardMeta}>{card.sections.length} section{card.sections.length !== 1 ? 's' : ''}</Text>
                  ) : card.content ? (
                    <Text style={styles.cardContent} numberOfLines={2}>{card.content}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
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

      {selectedCard && (
        <CardView
          card={selectedCard}
          visible={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      )}
    </View>
  );
}
