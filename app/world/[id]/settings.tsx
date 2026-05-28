import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import WorldHeader from './_header';

export default function WorldSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteWorld() {
    setDeleting(true);
    setDeleteError('');
    const { error } = await supabase.from('worlds').delete().eq('id', id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
    } else {
      router.replace('/worlds');
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WorldHeader section="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger zone</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerLabel}>Delete this world</Text>
            <Text style={styles.dangerDesc}>
              Permanently deletes this world and all its data. This cannot be undone.
            </Text>
            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}
            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.disabled]}
              onPress={handleDeleteWorld}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fca5a5" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete world</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 24, gap: 24 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b8fa8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dangerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3d1f1f',
    gap: 10,
  },
  dangerLabel: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  dangerDesc: { fontSize: 13, color: '#8b8fa8', lineHeight: 18 },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteButtonText: { color: '#fca5a5', fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 12, color: '#ef4444' },
  disabled: { opacity: 0.6 },
});
