import { createContext, useContext, useEffect, useState } from 'react';
import { Tabs, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

const DESKTOP_BREAKPOINT = 768;

type WorldContextType = { worldName: string; isDesktop: boolean };
const WorldContext = createContext<WorldContextType>({ worldName: '', isDesktop: false });
export const useWorld = () => useContext(WorldContext);

const NAV_ITEMS = [
  { name: 'index',    label: 'Home',     icon: '⌂', href: '' },
  { name: 'timeline', label: 'Timeline', icon: '◷', href: 'timeline' },
  { name: 'maps',     label: 'Maps',     icon: '◈', href: 'maps' },
  { name: 'lore',     label: 'Lore',     icon: '✦', href: 'lore' },
  { name: 'settings', label: 'Settings', icon: '⚙', href: 'settings' },
];

function Sidebar({ id, worldName }: { id: string; worldName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    const full = `/world/${id}${href ? `/${href}` : ''}`;
    return pathname === full;
  }

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity style={styles.sidebarBack} onPress={() => router.replace('/worlds')}>
        <Text style={styles.sidebarBackIcon}>←</Text>
        <Text style={styles.sidebarBackLabel}>All worlds</Text>
      </TouchableOpacity>

      <Text style={styles.sidebarWorldName} numberOfLines={2}>{worldName}</Text>
      <View style={styles.sidebarDivider} />

      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.sidebarItem, active && styles.sidebarItemActive]}
            onPress={() => router.push(`/world/${id}${item.href ? `/${item.href}` : ''}` as any)}
          >
            <Text style={[styles.sidebarIcon, active && styles.sidebarIconActive]}>{item.icon}</Text>
            <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function BottomNav({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    const full = `/world/${id}${href ? `/${href}` : ''}`;
    return pathname === full;
  }

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.bottomNavItem}
            onPress={() => router.push(`/world/${id}${item.href ? `/${item.href}` : ''}` as any)}
          >
            <Text style={[styles.bottomNavIcon, active && styles.bottomNavIconActive]}>{item.icon}</Text>
            <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function WorldLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worldName, setWorldName] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  useEffect(() => {
    supabase.from('worlds').select('name').eq('id', id).single()
      .then(({ data }) => { if (data) setWorldName(data.name); });
  }, [id]);

  const tabs = (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarHidden }}>
      {NAV_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ tabBarButton: () => null }} />
      ))}
    </Tabs>
  );

  return (
    <WorldContext.Provider value={{ worldName, isDesktop }}>
      {isDesktop ? (
        <View style={styles.desktopShell}>
          <Sidebar id={id} worldName={worldName} />
          <View style={styles.desktopContent}>{tabs}</View>
        </View>
      ) : (
        <View style={styles.mobileShell}>
          <View style={{ flex: 1 }}>{tabs}</View>
          <BottomNav id={id} />
        </View>
      )}
    </WorldContext.Provider>
  );
}

const styles = StyleSheet.create({
  desktopShell: { flex: 1, flexDirection: 'row', backgroundColor: '#0f0f1a' },
  desktopContent: { flex: 1 },
  mobileShell: { flex: 1, backgroundColor: '#0f0f1a' },

  // Sidebar (desktop)
  sidebar: {
    width: 220, backgroundColor: '#0b0b16',
    borderRightWidth: 1, borderRightColor: '#1e1e30',
    paddingTop: 40, paddingHorizontal: 16, paddingBottom: 24, gap: 4,
  },
  sidebarBack: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 8, marginBottom: 4,
  },
  sidebarBackIcon: { color: '#8b8fa8', fontSize: 14 },
  sidebarBackLabel: { color: '#8b8fa8', fontSize: 13, fontWeight: '500' },
  sidebarWorldName: {
    fontSize: 16, fontWeight: '800', color: '#ffffff',
    letterSpacing: -0.3, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4,
  },
  sidebarDivider: { height: 1, backgroundColor: '#1e1e30', marginVertical: 8, marginHorizontal: 8 },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10,
  },
  sidebarItemActive: { backgroundColor: '#1e1e35' },
  sidebarIcon: { fontSize: 16, color: '#4a4a6a', width: 22, textAlign: 'center' },
  sidebarIconActive: { color: '#6366f1' },
  sidebarLabel: { fontSize: 14, color: '#8b8fa8', fontWeight: '500' },
  sidebarLabelActive: { color: '#ffffff', fontWeight: '700' },

  // Bottom nav (mobile)
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0b0b16',
    borderTopWidth: 1,
    borderTopColor: '#1e1e30',
    height: 64,
  },
  bottomNavItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  bottomNavIcon: { fontSize: 20, color: '#4a4a6a' },
  bottomNavIconActive: { color: '#6366f1' },
  bottomNavLabel: { fontSize: 10, color: '#4a4a6a', fontWeight: '500' },
  bottomNavLabelActive: { color: '#6366f1', fontWeight: '700' },

  tabBarHidden: { display: 'none', height: 0 },
});
