import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import WorldHeader from '../_header';
import styles from './styles';

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

