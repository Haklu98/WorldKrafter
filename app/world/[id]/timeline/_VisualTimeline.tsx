import { useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { CARD_TYPE_COLOR } from '../../../../lib/cardTypes';
import type { CardTimestamp, Timeline, TimelinePeriod, TimelineOrientation } from './_types';

type Props = {
  timeline: Timeline;
  periods: TimelinePeriod[];
  events: CardTimestamp[];
  orientation: TimelineOrientation;
  onAddEvent: () => void;
};

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDate(year: number, month: number | null, day: number | null): string {
  const parts: string[] = [];
  if (day) parts.push(String(day));
  if (month) parts.push(String(month));
  parts.push(String(Math.abs(year)));
  return parts.join('/') + (year < 0 ? ' B' : '');
}

// ─── Vertical timeline ────────────────────────────────────────────────────────

function VerticalTimeline({ timeline, periods, events, onAddEvent }: Omit<Props, 'orientation'>) {
  return (
    <View style={V.container}>
      {/* Axis line */}
      <View style={V.axis} />

      {events.length === 0 ? (
        <View style={V.emptyWrap}>
          <View style={V.dot} />
          <View style={V.emptyCard}>
            <Text style={V.emptyText}>No events yet</Text>
            <TouchableOpacity style={V.addBtn} onPress={onAddEvent}>
              <Text style={V.addBtnText}>+ Add event</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {events.map((ev, i) => {
            const color = (CARD_TYPE_COLOR as Record<string, string>)[ev.card_type] ?? '#6366f1';
            const isLeft = i % 2 === 0;
            return (
              <View key={ev.id} style={V.row}>
                {/* Left side */}
                <View style={[V.side, { alignItems: 'flex-end' }]}>
                  {isLeft ? (
                    <View style={[V.eventCard, { borderColor: color + '55' }]}>
                      <View style={[V.typeBar, { backgroundColor: color }]} />
                      <View style={V.cardBody}>
                        <Text style={[V.eventLabel, { color }]}>{ev.label}</Text>
                        <Text style={V.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                        <Text style={V.eventDate}>{formatDate(ev.year, ev.month, ev.day)}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Centre dot */}
                <View style={V.dotWrap}>
                  <View style={[V.dot, { borderColor: color }]} />
                </View>

                {/* Right side */}
                <View style={[V.side, { alignItems: 'flex-start' }]}>
                  {!isLeft ? (
                    <View style={[V.eventCard, { borderColor: color + '55' }]}>
                      <View style={[V.typeBar, { backgroundColor: color }]} />
                      <View style={V.cardBody}>
                        <Text style={[V.eventLabel, { color }]}>{ev.label}</Text>
                        <Text style={V.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                        <Text style={V.eventDate}>{formatDate(ev.year, ev.month, ev.day)}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* Add button at the end */}
          <View style={V.row}>
            <View style={V.side} />
            <View style={V.dotWrap}>
              <TouchableOpacity style={V.addDot} onPress={onAddEvent}>
                <Text style={V.addDotText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={V.side} />
          </View>
        </>
      )}
    </View>
  );
}

const V = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 16, position: 'relative' },
  axis: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#2d2d44',
    marginLeft: -1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 60,
  },
  side: { flex: 1, paddingHorizontal: 12 },
  dotWrap: { width: 24, alignItems: 'center', zIndex: 1 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0f0f1a',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  addDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDotText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    maxWidth: 200,
  },
  typeBar: { width: 3 },
  cardBody: { padding: 10, gap: 2, flex: 1 },
  eventLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  eventDate: { fontSize: 11, color: '#8b8fa8', marginTop: 2 },
  emptyWrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 32 },
  emptyCard: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
    gap: 10,
    alignItems: 'flex-start',
  },
  emptyText: { fontSize: 14, color: '#4a4a6a' },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ─── Horizontal timeline ──────────────────────────────────────────────────────

function HorizontalTimeline({ timeline, periods, events, onAddEvent }: Omit<Props, 'orientation'>) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={H.container}
    >
      {/* Axis */}
      <View style={H.axisWrap}>
        <View style={H.axis} />

        {events.length === 0 ? (
          <View style={H.emptyWrap}>
            <View style={H.dot} />
            <View style={H.emptyCard}>
              <Text style={H.emptyText}>No events yet</Text>
              <TouchableOpacity style={H.addBtn} onPress={onAddEvent}>
                <Text style={H.addBtnText}>+ Add event</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {events.map((ev, i) => {
              const color = (CARD_TYPE_COLOR as Record<string, string>)[ev.card_type] ?? '#6366f1';
              const isTop = i % 2 === 0;
              return (
                <View key={ev.id} style={H.col}>
                  {/* Top card */}
                  <View style={[H.cardSlot, { justifyContent: 'flex-end' }]}>
                    {isTop ? (
                      <View style={[H.eventCard, { borderColor: color + '55' }]}>
                        <View style={[H.typeBar, { backgroundColor: color }]} />
                        <View style={H.cardBody}>
                          <Text style={[H.eventLabel, { color }]}>{ev.label}</Text>
                          <Text style={H.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                          <Text style={H.eventDate}>{formatDate(ev.year, ev.month, ev.day)}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Dot on axis */}
                  <View style={H.dotRow}>
                    <View style={[H.dot, { borderColor: color }]} />
                  </View>

                  {/* Bottom card */}
                  <View style={[H.cardSlot, { justifyContent: 'flex-start' }]}>
                    {!isTop ? (
                      <View style={[H.eventCard, { borderColor: color + '55' }]}>
                        <View style={[H.typeBar, { backgroundColor: color }]} />
                        <View style={H.cardBody}>
                          <Text style={[H.eventLabel, { color }]}>{ev.label}</Text>
                          <Text style={H.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                          <Text style={H.eventDate}>{formatDate(ev.year, ev.month, ev.day)}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Add button */}
            <View style={H.col}>
              <View style={[H.cardSlot, { justifyContent: 'flex-end' }]} />
              <View style={H.dotRow}>
                <TouchableOpacity style={H.addDot} onPress={onAddEvent}>
                  <Text style={H.addDotText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={H.cardSlot} />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const H = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 8, minWidth: '100%' },
  axisWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative', minHeight: 260 },
  axis: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    backgroundColor: '#2d2d44',
    marginTop: -1,
  },
  col: {
    width: 160,
    alignItems: 'center',
    marginRight: 8,
  },
  cardSlot: { height: 110, width: '100%', paddingHorizontal: 4 },
  dotRow: { height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0f0f1a',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  addDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDotText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  typeBar: { height: 3 },
  cardBody: { padding: 8, gap: 2 },
  eventLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  eventDate: { fontSize: 10, color: '#8b8fa8', marginTop: 2 },
  emptyWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
    gap: 10,
    minWidth: 200,
  },
  emptyText: { fontSize: 14, color: '#4a4a6a' },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ─── Exported wrapper ─────────────────────────────────────────────────────────

export default function VisualTimeline(props: Props) {
  if (props.orientation === 'horizontal') {
    return <HorizontalTimeline {...props} />;
  }
  return <VerticalTimeline {...props} />;
}
