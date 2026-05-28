import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type World = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function WorldsPage() {
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Create world modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('worlds')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
    } else {
      setWorlds(data ?? []);
      // Auto-select the first world if none selected
      if (data && data.length > 0 && !selectedWorld) {
        setSelectedWorld(data[0]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  async function handleCreateWorld() {
    if (!newName.trim()) {
      setNameError('World name is required.');
      return;
    }
    if (newName.trim().length > 60) {
      setNameError('Name must be 60 characters or fewer.');
      return;
    }

    setCreating(true);
    setCreateError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreateError('You must be signed in to create a world.');
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('worlds')
      .insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
        owner_id: session.user.id,
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      setCreateError(error.message);
    } else {
      setWorlds((prev) => [data, ...prev]);
      setSelectedWorld(data);
      setModalVisible(false);
      setNewName('');
      setNewDescription('');
      setNameError('');
      setCreateError('');
    }
  }

  function openModal() {
    setNewName('');
    setNewDescription('');
    setNameError('');
    setCreateError('');
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WorldKrafter</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Select a world</Text>

        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
        ) : fetchError ? (
          <Text style={styles.errorText}>{fetchError}</Text>
        ) : worlds.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No worlds yet</Text>
            <Text style={styles.emptySubtitle}>Create your first world to get started.</Text>
          </View>
        ) : (
          <View style={styles.dropdownWrapper}>
            {/* Dropdown trigger */}
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValue}>
                {selectedWorld ? selectedWorld.name : 'Choose a world…'}
              </Text>
              <Text style={styles.dropdownChevron}>{dropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Dropdown list */}
            {dropdownOpen && (
              <View style={styles.dropdownList}>
                <FlatList
                  data={worlds}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={worlds.length > 5}
                  style={{ maxHeight: 240 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        selectedWorld?.id === item.id && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedWorld(item);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedWorld?.id === item.id && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {/* Enter world button — only shown when a world is selected */}
        {selectedWorld && !dropdownOpen && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push(`/world/${selectedWorld.id}`)}
          >
            <Text style={styles.primaryButtonText}>Enter {selectedWorld.name}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.createButton} onPress={openModal}>
          <Text style={styles.createButtonText}>+ Create a world</Text>
        </TouchableOpacity>
      </View>

      {/* Create world modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create a world</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>World name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="e.g. The Shattered Realm"
                placeholderTextColor="#4a4a6a"
                value={newName}
                onChangeText={(v) => {
                  setNewName(v);
                  if (nameError) setNameError('');
                }}
                autoFocus
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="A brief description of your world…"
                placeholderTextColor="#4a4a6a"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {createError ? (
              <Text style={styles.errorText}>{createError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.modalConfirm, creating && styles.disabled]}
                onPress={handleCreateWorld}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  signOutText: {
    color: '#8b8fa8',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b8fa8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8b8fa8',
    textAlign: 'center',
  },
  dropdownWrapper: {
    zIndex: 10,
  },
  dropdownTrigger: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#ffffff',
  },
  dropdownChevron: {
    fontSize: 11,
    color: '#8b8fa8',
  },
  dropdownList: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  dropdownItemActive: {
    backgroundColor: '#23233a',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#c0c4d8',
  },
  dropdownItemTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  createButton: {
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#8b8fa8',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
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
    maxWidth: 440,
    gap: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c0c4d8',
  },
  optional: {
    fontWeight: '400',
    color: '#8b8fa8',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8b8fa8',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
