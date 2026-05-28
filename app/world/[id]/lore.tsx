import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WorldHeader from './_header';

export default function WorldLore() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WorldHeader section="Lore" />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Lore coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: '#4a4a6a', fontSize: 15 },
});
