import { View, Text, StyleSheet } from 'react-native';
import type { Timeline, TimeFormat, TimelinePeriod } from './_types';
import { TRACKING_TYPE_LABELS } from './_constants';
import { S } from './_styles';

type Props = {
  timeline: Timeline;
  format: TimeFormat | null;
  periods: TimelinePeriod[];
};

export default function TimelineCard({ timeline, format, periods }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{timeline.name}</Text>
        <View style={S.badge}>
          <Text style={S.badgeText}>{TRACKING_TYPE_LABELS[timeline.tracking_type]}</Text>
        </View>
      </View>

      {format && (
        <Text style={styles.meta}>Using {format.name}</Text>
      )}

      {timeline.tracking_type === 'before_after' && (
        <View style={styles.baRow}>
          <Text style={styles.baLabel}>{timeline.before_label}</Text>
          <View style={styles.baDivider} />
          <Text style={styles.baPivot}>Pivot event</Text>
          <View style={styles.baDivider} />
          <Text style={styles.baLabel}>{timeline.after_label}</Text>
        </View>
      )}

      {(timeline.tracking_type === 'era' || timeline.tracking_type === 'age') && periods.length > 0 && (
        <View style={styles.periodsRow}>
          {periods.map((p) => {
            const durationParts = [
              p.years > 0 ? `${p.years}y` : null,
              p.months > 0 ? `${p.months}mo` : null,
              p.days > 0 ? `${p.days}d` : null,
            ].filter(Boolean);

            return (
              <View key={p.id} style={styles.chip}>
                <Text style={styles.chipText}>
                  {timeline.tracking_type === 'age' && p.name
                    ? p.name
                    : `Era ${p.position}`}
                </Text>
                <Text style={styles.chipSub}>
                  {durationParts.join(' ') || '—'}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#2d2d44', gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: '800', color: '#ffffff', flex: 1 },
  meta: { fontSize: 13, color: '#8b8fa8' },

  baRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  baLabel: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  baDivider: { flex: 1, height: 1, backgroundColor: '#2d2d44' },
  baPivot: { fontSize: 12, color: '#8b8fa8', fontStyle: 'italic' },

  periodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: '#23233a', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, borderWidth: 1, borderColor: '#2d2d44',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  chipSub: { fontSize: 10, color: '#8b8fa8', marginTop: 2 },
});
