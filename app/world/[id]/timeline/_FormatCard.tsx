import { View, Text, StyleSheet } from 'react-native';
import type { TimeFormat } from './_types';
import { S } from './_styles';

export default function FormatCard({ fmt }: { fmt: TimeFormat }) {
  const stats = [
    { label: 'Hours/day',  value: String(fmt.hours_per_day) },
    { label: 'Days/week',  value: String(fmt.days_per_week) },
    { label: 'Weeks/year', value: String(fmt.weeks_per_year) },
    { label: 'Months',     value: String(fmt.months_per_year) },
    ...(fmt.lunar_cycle_days != null
      ? [{ label: 'Lunar cycle', value: `${fmt.lunar_cycle_days}d` }]
      : []),
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{fmt.name}</Text>
        {fmt.is_gregorian && (
          <View style={S.badge}><Text style={S.badgeText}>Gregorian</Text></View>
        )}
      </View>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      {fmt.day_names && (
        <Text style={styles.nameList}>
          <Text style={styles.nameListLabel}>Days: </Text>
          {fmt.day_names.join(' · ')}
        </Text>
      )}
      {fmt.month_names && (
        <Text style={styles.nameList}>
          <Text style={styles.nameListLabel}>Months: </Text>
          {fmt.month_names.join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2d2d44', gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  statLabel: { fontSize: 10, color: '#8b8fa8', fontWeight: '500', marginTop: 2 },
  nameList: { fontSize: 12, color: '#8b8fa8', lineHeight: 18 },
  nameListLabel: { fontWeight: '600', color: '#c0c4d8' },
});
