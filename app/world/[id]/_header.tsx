import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorld } from './_layout';

type Props = {
  section: string;
};

export default function WorldHeader({ section }: Props) {
  const router = useRouter();
  const { worldName, isDesktop } = useWorld();

  // On desktop the sidebar handles navigation — just show the section title
  if (isDesktop) {
    return (
      <View style={styles.desktopHeader}>
        <Text style={styles.desktopSection}>{section}</Text>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.replace('/worlds')} style={styles.backButton}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.worldName} numberOfLines={1}>{worldName}</Text>
        <Text style={styles.section}>{section}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mobile header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#8b8fa8',
    fontSize: 16,
  },
  titles: {
    flex: 1,
  },
  worldName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  section: {
    fontSize: 12,
    color: '#8b8fa8',
    fontWeight: '500',
    marginTop: 1,
  },

  // Desktop header — just the section name, no back button
  desktopHeader: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
  },
  desktopSection: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
});
