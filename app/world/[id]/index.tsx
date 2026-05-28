import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import WorldHeader from './_header';

type World = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function WorldHome() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('worlds')
      .select('id, name, description, created_at')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setWorld(data);
        setLoading(false);
      });
  }, [id]);

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

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>World</Text>
          <Text style={styles.cardTitle}>{world?.name}</Text>
          {world?.description ? (
            <Text style={styles.cardDescription}>{world.description}</Text>
          ) : null}
        </View>

        <View style={styles.grid}>
          {[
            { label: 'Timeline', icon: '◷', desc: 'Track events across time' },
            { label: 'Maps', icon: '◈', desc: 'Explore your world' },
            { label: 'Lore', icon: '✦', desc: 'Characters, factions & more' },
          ].map((item) => (
            <View key={item.label} style={styles.gridItem}>
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
              <Text style={styles.gridDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    gap: 6,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8b8fa8',
    lineHeight: 20,
    marginTop: 4,
  },
  grid: {
    gap: 12,
  },
  gridItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gridIcon: {
    fontSize: 22,
    color: '#6366f1',
    width: 28,
    textAlign: 'center',
  },
  gridLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  gridDesc: {
    fontSize: 12,
    color: '#8b8fa8',
  },
});
