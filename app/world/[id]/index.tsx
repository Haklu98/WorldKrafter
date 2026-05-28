import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';
import WorldHeader from './_header';
import CreateCardModal, { type CreatedCard } from './_create-card-modal';

type World = {
  id: string;
  name: string;
  description: string | null;
};

type RecentCard = {
  id: string;
  title: string;
  type: CardType;
  updated_at: string;
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WorldHome() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  const [recentCards, setRecentCards] = useState<RecentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    const [worldRes, cardsRes] = await Promise.all([
      supabase
        .from('worlds')
        .select('id, name, description')
        .eq('id', id)
        .single(),
      supabase
        .from('cards')
        .select('id, title, type, updated_at')
        .eq('world_id', id)
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    setWorld(worldRes.data);
    setRecentCards(cardsRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleCardCreated(card: CreatedCard) {
    // Prepend to recent list and trim to 10
    setRecentCards((prev) => [card, ...prev].slice(0, 10));
    setModalVisible(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WorldHeader section="Home" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* World info card */}
        <View style={styles.worldCard}>
          <Text style={styles.worldCardLabel}>World</Text>
          <Text style={styles.worldCardTitle}>{world?.name}</Text>
          {world?.description ? (
            <Text style={styles.worldCardDesc}>{world.description}</Text>
          ) : null}
        </View>

        {/* Recent edits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent edits</Text>
            <TouchableOpacity
              style={styles.createCardButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.createCardButtonText}>+ Create a card</Text>
            </TouchableOpacity>
          </View>

          {recentCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent edits</Text>
              <Text style={styles.emptySubtext}>
                Create your first card to get started.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {recentCards.map((card) => {
                const color = CARD_TYPE_COLOR[card.type] ?? '#6366f1';
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.recentCard}
                    onPress={() => router.push(`/world/${id}/lore` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeTag, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.typeTagText, { color }]}>{card.type}</Text>
                    </View>
                    <Text style={styles.recentCardTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text style={styles.recentCardTime}>{timeAgo(card.updated_at)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    gap: 28,
    paddingBottom: 40,
  },
  worldCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    gap: 6,
  },
  worldCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  worldCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  worldCardDesc: {
    fontSize: 14,
    color: '#8b8fa8',
    lineHeight: 20,
    marginTop: 4,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b8fa8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  createCardButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  createCardButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d2d44',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  emptySubtext: { fontSize: 13, color: '#8b8fa8', textAlign: 'center' },
  cardList: { gap: 8 },
  recentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  recentCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  recentCardTime: { fontSize: 12, color: '#4a4a6a' },
});
