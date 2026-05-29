import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WorldHeader from '../_header';
import styles from './styles';

export default function WorldMaps() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WorldHeader section="Maps" />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Maps coming soon</Text>
      </View>
    </View>
  );
}
