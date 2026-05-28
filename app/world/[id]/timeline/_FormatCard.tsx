import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { TimeFormat } from './_types';
import { S } from './_styles';

type Props = {
  fmt: TimeFormat;
  onDelete: () => void;
};

export default function FormatCard({ fmt, onDelete }: Props) {
  const stats = [
    { label: 'Hours/day',  value: String(fmt.hours_per_day) },
    { label: 'Days/week',  value: String(fmt.days_per_week) },
    { label: 'Weeks/year', value: String(fmt.weeks_per_year) },
    { label: 'Months',     value: String(fmt.months_per_year) },
    ...(fmt.lunar_cycle_days != null
      ? [{ label: 'Lunar cycle', value: `${fmt.lunar_cycle_days}d` }]
      : []),
  ];

  function confirmDelete() {
    Alert.alert(
      'Delete time format',
      `Delete "${fmt.name}"? Timelines using this format will lose their format reference.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{fmt.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {fmt.is_gregorian && (
            <View style={S.badge}><Text style={S.badgeText}>Gregorian</Text></View>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
  name: { fontSize: 16, fontWeight: '700', color: '#ffffff', flex: 1 },
  deleteBtn: {
    borderWidth: 1, borderColor: '#ef444444', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  deleteBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  statLabel: { fontSize: 10, color: '#8b8fa8', fontWeight: '500', marginTop: 2 },
  nameList: { fontSize: 12, color: '#8b8fa8', lineHeight: 18 },
  nameListLabel: { fontWeight: '600', color: '#c0c4d8' },
});
