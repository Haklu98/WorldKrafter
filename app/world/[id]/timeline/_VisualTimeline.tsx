import { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, Platform,
} from 'react-native';
import { CARD_TYPE_COLOR } from '../../../../lib/cardTypes';
import type { CardTimestamp, Timeline, TimelinePeriod } from '../../../../lib/timeline/types';
import { confirmAction } from '../../../../lib/timeline/confirm';

type Props = {
  timeline: Timeline;
  periods: TimelinePeriod[];
  events: CardTimestamp[];
  onAddEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onOpenCard: (cardId: string) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodForYear(periods: TimelinePeriod[], year: number): { period: TimelinePeriod; relativeYear: number } | null {
  let offset = 0;
  for (const p of periods) {
    if (year <= offset + p.years) {
      return { period: p, relativeYear: year - offset };
    }
    offset += p.years;
  }
  // Beyond all defined periods — attribute to last
  const last = periods[periods.length - 1];
  if (!last) return null;
  let totalOffset = periods.reduce((s, p) => s + p.years, 0) - last.years;
  return { period: last, relativeYear: year - totalOffset };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function periodName(trackingType: string, p: TimelinePeriod): string {
  return trackingType === 'age' && p.name ? p.name : `${ordinal(p.position)} Era`;
}

function formatDate(
  year: number, month: number | null, day: number | null,
  periods: TimelinePeriod[], trackingType: string,
): string {
  if ((trackingType === 'era' || trackingType === 'age') && periods.length > 0) {
    const match = getPeriodForYear(periods, year);
    if (match) {
      const parts: string[] = [];
      if (day) parts.push(`Day ${day}`);
      if (month) parts.push(`Month ${month}`);
      parts.push(`Year ${match.relativeYear}`);
      return `${parts.join(', ')} of ${periodName(trackingType, match.period)}`;
    }
  }
  const parts: string[] = [];
  if (day) parts.push(String(day));
  if (month) parts.push(String(month));
  parts.push(String(Math.abs(year)));
  return parts.join('/') + (year < 0 ? ' B' : '');
}

function confirmDelete(label: string, onConfirm: () => void) {
  confirmAction('Delete event', `Remove "${label}" from the timeline?`, onConfirm);
}

function RotatedAxisLabel({ text }: { text: string }) {
  return (
    <View style={RAL.wrap}>
      <Text style={RAL.text} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const RAL = StyleSheet.create({
  wrap: {
    width: 140,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    transform: [{ rotate: '-90deg' }],
  },
});

// Groups events by period; events with no matching period go into a null group
type EventGroup = { period: TimelinePeriod | null; events: CardTimestamp[] };

function groupByPeriod(events: CardTimestamp[], periods: TimelinePeriod[]): EventGroup[] {
  if (!periods.length) return [{ period: null, events }];

  const map = new Map<string | null, CardTimestamp[]>();
  map.set(null, []);
  for (const p of periods) map.set(p.id, []);

  for (const ev of events) {
    const match = getPeriodForYear(periods, ev.year);
    const key = match ? match.period.id : null;
    map.get(key)!.push(ev);
  }

  const groups: EventGroup[] = [];
  for (const p of periods) {
    const evs = map.get(p.id)!;
    if (evs.length > 0) groups.push({ period: p, events: evs });
  }
  const unmatched = map.get(null)!;
  if (unmatched.length > 0) groups.push({ period: null, events: unmatched });
  return groups;
}

// ─── Zoom controls ───────────────────────────────────────────────────────────

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.2;

function ZoomControls({ scale, onZoom }: { scale: number; onZoom: (delta: number) => void }) {
  return (
    <View style={ZC.row}>
      <TouchableOpacity
        style={[ZC.btn, scale <= ZOOM_MIN && ZC.btnDisabled]}
        onPress={() => onZoom(-ZOOM_STEP)}
        disabled={scale <= ZOOM_MIN}
      >
        <Text style={ZC.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={ZC.label}>{Math.round(scale * 100)}%</Text>
      <TouchableOpacity
        style={[ZC.btn, scale >= ZOOM_MAX && ZC.btnDisabled]}
        onPress={() => onZoom(ZOOM_STEP)}
        disabled={scale >= ZOOM_MAX}
      >
        <Text style={ZC.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const ZC = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1e1e30',
  },
  btn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    borderColor: '#2d2d44', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: '#ffffff', fontSize: 16, lineHeight: 20 },
  label: { fontSize: 11, color: '#8b8fa8', fontWeight: '600', minWidth: 36, textAlign: 'center' },
});

// ─── Pivot marker ─────────────────────────────────────────────────────────────

function PivotMarker({ beforeLabel, afterLabel }: { beforeLabel: string; afterLabel: string }) {
  return (
    <View style={PM.row}>
      <RotatedAxisLabel text={beforeLabel} />
      <View style={PM.line} />
      <View style={PM.badge}>
        <Text style={PM.badgeText}>Pivot</Text>
      </View>
      <View style={PM.line} />
      <RotatedAxisLabel text={afterLabel} />
    </View>
  );
}

const PM = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#2d2d44' },
  badge: { backgroundColor: '#6366f122', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#6366f144' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#6366f1' },
});

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ ev, periods, trackingType, onDelete }: {
  ev: CardTimestamp; periods: TimelinePeriod[]; trackingType: string; onDelete: () => void;
}) {
  const color = (CARD_TYPE_COLOR as Record<string, string>)[ev.card_type] ?? '#6366f1';
  return (
    <View style={[EC.card, { borderColor: color + '55' }]}>
      <View style={[EC.typeBar, { backgroundColor: color }]} />
      <View style={EC.body}>
        <Text style={[EC.label, { color }]}>{ev.label}</Text>
        <Text style={EC.title} numberOfLines={2}>{ev.card_title}</Text>
        <Text style={EC.date}>{formatDate(ev.year, ev.month, ev.day, periods, trackingType)}</Text>
      </View>
      <TouchableOpacity style={EC.del} onPress={onDelete} hitSlop={8}>
        <Text style={EC.delText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const EC = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1,
    overflow: 'hidden', flexDirection: 'row', maxWidth: 200,
  },
  typeBar: { width: 3 },
  body: { padding: 10, gap: 2, flex: 1 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  date: { fontSize: 11, color: '#8b8fa8', marginTop: 2 },
  del: { padding: 8, justifyContent: 'center' },
  delText: { fontSize: 11, color: '#4a4a6a' },
});

const COLLAPSE_THRESHOLD = 0.7;

// ─── Collapsed dot with tooltip ───────────────────────────────────────────────

function CollapsedDot({ ev, periods, trackingType, isTop, onDelete, onOpen }: {
  ev: CardTimestamp; periods: TimelinePeriod[]; trackingType: string;
  isTop: boolean; onDelete: () => void; onOpen: () => void;
}) {
  const color = (CARD_TYPE_COLOR as Record<string, string>)[ev.card_type] ?? '#6366f1';
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }
  function scheduleHide() {
    hideTimer.current = setTimeout(() => setVisible(false), 600);
  }

  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: show,
    onMouseLeave: scheduleHide,
  } : {};

  return (
    <View style={CD.wrap}>
      {visible && (
        <View
          style={[CD.tooltip, isTop ? CD.tooltipAbove : CD.tooltipBelow, { borderColor: color + '55' }]}
          {...(Platform.OS === 'web' ? { onMouseEnter: show, onMouseLeave: scheduleHide } : {})}
        >
          <TouchableOpacity style={CD.tooltipInner} onPress={onOpen} activeOpacity={0.8}>
            <View style={[CD.tooltipBar, { backgroundColor: color }]} />
            <View style={CD.tooltipBody}>
              <Text style={[CD.tooltipLabel, { color }]}>{ev.label}</Text>
              <Text style={CD.tooltipTitle} numberOfLines={2}>{ev.card_title}</Text>
              <Text style={CD.tooltipDate}>{formatDate(ev.year, ev.month, ev.day, periods, trackingType)}</Text>
              <Text style={CD.tooltipHint}>Tap to open</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={CD.tooltipDelBtn}>
            <Text style={CD.tooltipDel}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[CD.dot, { borderColor: color, backgroundColor: visible ? color + '33' : '#0f0f1a' }]}
        onPress={() => Platform.OS !== 'web' && setVisible((v) => !v)}
        {...hoverProps}
      />
    </View>
  );
}

const CD = StyleSheet.create({
  wrap: { alignItems: 'center', zIndex: 10 },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#6366f1',
  },
  tooltip: {
    position: 'absolute', left: '50%', width: 180,
    marginLeft: -90, backgroundColor: '#1a1a2e',
    borderRadius: 10, borderWidth: 1,
    overflow: 'hidden', flexDirection: 'row',
    zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  tooltipAbove: { bottom: 18 },
  tooltipBelow: { top: 18 },
  tooltipInner: { flex: 1, flexDirection: 'row', overflow: 'hidden' },
  tooltipBar: { width: 3 },
  tooltipBody: { flex: 1, padding: 8, gap: 2 },
  tooltipLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tooltipTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  tooltipDate: { fontSize: 10, color: '#8b8fa8', marginTop: 1 },
  tooltipHint: { fontSize: 9, color: '#4a4a6a', marginTop: 2, fontStyle: 'italic' },
  tooltipDelBtn: { justifyContent: 'center', paddingHorizontal: 6 },
  tooltipDel: { fontSize: 11, color: '#4a4a6a' },
});

// ─── Horizontal timeline ──────────────────────────────────────────────────────

function HorizontalPeriodHeader({ label }: { label: string }) {
  return (
    <View style={HPH.col}>
      <View style={HPH.cardSlot} />
      <View style={HPH.dotRow}>
        <RotatedAxisLabel text={label} />
      </View>
      <View style={HPH.cardSlot} />
    </View>
  );
}

const HPH = StyleSheet.create({
  col: { alignItems: 'center', marginRight: 4, minWidth: 120, marginBottom: 24 },
  cardSlot: { height: 110, width: '100%' },
  dotRow: { height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
});

function HorizontalTimeline({ timeline, periods, events, onAddEvent, onDeleteEvent, onOpenCard }: Omit<Props, 'orientation'>) {
  const scrollRef = useRef<ScrollView>(null);
  const isEraAge = timeline.tracking_type === 'era' || timeline.tracking_type === 'age';
  const groups = isEraAge ? groupByPeriod(events, periods) : [{ period: null, events }];
  const [scale, setScale] = useState(1);
  function onZoom(delta: number) {
    setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((s + delta) * 10) / 10)));
  }
  const colWidth = Math.round(160 * scale);
  const collapsed = scale < COLLAPSE_THRESHOLD;

  return (
    <View>
      <ZoomControls scale={scale} onZoom={onZoom} />
      {timeline.tracking_type === 'before_after' && (
        <PivotMarker beforeLabel={timeline.before_label} afterLabel={timeline.after_label} />
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={H.container}
      >
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
                  {groups.map((group) => {
                const hue = group.period ? (group.period.position * 47) % 360 : 200;
                const periodColor = `hsl(${hue},60%,60%)`;
                const label = group.period
                  ? periodName(timeline.tracking_type, group.period) + ` · ${group.period.years} years`
                  : 'Other';
                let altIndex = 0;
                return (
                  <View key={group.period?.id ?? 'null'} style={H.group}>
                    {isEraAge && (
                      <HorizontalPeriodHeader label={label} />
                    )}
                    {group.events.map((ev) => {
                      const color = (CARD_TYPE_COLOR as Record<string, string>)[ev.card_type] ?? '#6366f1';
                      const isTop = altIndex % 2 === 0;
                      altIndex++;
                      const deleteHandler = () => confirmDelete(ev.card_title, () => onDeleteEvent(ev.id));
                      return (
                        <View key={ev.id} style={[H.col, { width: colWidth }]}>
                          <View style={[H.cardSlot, { justifyContent: 'flex-end' }]}>
                            {!collapsed && isTop ? (
                              <Pressable
                                style={[H.eventCard, { borderColor: color + '55' }]}
                                onPress={() => onOpenCard(ev.card_id)}
                                android_ripple={{ color: '#ffffff10' }}
                                testID={`timeline-event-${ev.id}`}
                              >
                                <View style={[H.typeBar, { backgroundColor: color }]} />
                                <View style={H.cardBody}>
                                  <Text style={[H.eventLabel, { color }]}>{ev.label}</Text>
                                  <Text style={H.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                                  <Text style={H.eventDate}>{formatDate(ev.year, ev.month, ev.day, periods, timeline.tracking_type)}</Text>
                                </View>
                                <TouchableOpacity style={H.del} onPress={deleteHandler} hitSlop={8}>
                                  <Text style={H.delText}>✕</Text>
                                </TouchableOpacity>
                              </Pressable>
                            ) : null}
                          </View>

                          <View style={H.dotRow}>
                            {collapsed ? (
                              <CollapsedDot
                                ev={ev} periods={periods} trackingType={timeline.tracking_type}
                                isTop={isTop} onDelete={deleteHandler} onOpen={() => onOpenCard(ev.card_id)}
                              />
                            ) : (
                              <View style={[H.dot, { borderColor: color }]} />
                            )}
                          </View>

                          <View style={[H.cardSlot, { justifyContent: 'flex-start' }]}>
                            {!collapsed && !isTop ? (
                              <Pressable
                                style={[H.eventCard, { borderColor: color + '55' }]}
                                onPress={() => onOpenCard(ev.card_id)}
                                android_ripple={{ color: '#ffffff10' }}
                                testID={`timeline-event-${ev.id}`}
                              >
                                <View style={[H.typeBar, { backgroundColor: color }]} />
                                <View style={H.cardBody}>
                                  <Text style={[H.eventLabel, { color }]}>{ev.label}</Text>
                                  <Text style={H.eventTitle} numberOfLines={2}>{ev.card_title}</Text>
                                  <Text style={H.eventDate}>{formatDate(ev.year, ev.month, ev.day, periods, timeline.tracking_type)}</Text>
                                </View>
                                <TouchableOpacity style={H.del} onPress={deleteHandler} hitSlop={8}>
                                  <Text style={H.delText}>✕</Text>
                                </TouchableOpacity>
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}

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
    </View>
  );
}

const H = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 8, minWidth: '100%' },
  axisWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative', minHeight: 340 },
  axis: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 1, backgroundColor: '#2d2d44', marginTop: -1,
  },
  group: { flexDirection: 'row', alignItems: 'center' },
  col: { width: 160, alignItems: 'center', marginRight: 8 },
  cardSlot: { height: 160, width: '100%', paddingHorizontal: 4 },
  dotRow: { height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#0f0f1a', borderWidth: 2, borderColor: '#6366f1',
  },
  addDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  addDotText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  eventCard: {
    backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1,
    overflow: 'hidden', width: '100%',
  },
  typeBar: { height: 3 },
  cardBody: { padding: 8, gap: 2 },
  eventLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  eventDate: { fontSize: 10, color: '#8b8fa8', marginTop: 2 },
  del: { position: 'absolute', top: 4, right: 4 },
  delText: { fontSize: 10, color: '#4a4a6a' },
  emptyWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  emptyCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2d44', gap: 10, minWidth: 200,
  },
  emptyText: { fontSize: 14, color: '#4a4a6a' },
  addBtn: {
    backgroundColor: '#6366f1', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ─── Exported wrapper ─────────────────────────────────────────────────────────

export default function VisualTimeline(props: Props) {
  return <HorizontalTimeline {...props} />;
}
