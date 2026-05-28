import { createContext, useContext, useEffect, useState } from 'react';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

// Share the world name across all tabs without each tab fetching it separately
type WorldContextType = { worldName: string };
const WorldContext = createContext<WorldContextType>({ worldName: '' });
export const useWorld = () => useContext(WorldContext);

type TabIconProps = {
  label: string;
  icon: string;
  focused: boolean;
};

function TabIcon({ label, icon, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function WorldLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worldName, setWorldName] = useState('');

  useEffect(() => {
    supabase
      .from('worlds')
      .select('name')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setWorldName(data.name);
      });
  }, [id]);

  return (
    <WorldContext.Provider value={{ worldName }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Home" icon="⌂" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Timeline" icon="◷" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="maps"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Maps" icon="◈" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="lore"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Lore" icon="✦" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Settings" icon="⚙" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </WorldContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#12121f',
    borderTopWidth: 1,
    borderTopColor: '#1e1e30',
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 8,
  },
  tabIcon: {
    fontSize: 20,
    color: '#4a4a6a',
  },
  tabIconFocused: {
    color: '#6366f1',
  },
  tabLabel: {
    fontSize: 10,
    color: '#4a4a6a',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#6366f1',
    fontWeight: '700',
  },
});
