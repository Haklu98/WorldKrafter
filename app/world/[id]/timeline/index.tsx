import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import WorldHeader from '../_header';
import FormatCard from './_FormatCard';
import TimelineCard from './_TimelineCard';
import TimeFormatModal from './_TimeFormatModal';
import TimelineModal from './_TimelineModal';
import VisualTimeline from './_VisualTimeline';
import CreateCardModal from '../_create-card-modal';
import { S } from '../../../../lib/timeline/styles';
import type {
  Timeline, TimeFormat, TimelinePeriod,
  CardTimestamp, TimelineOrientation,
} from '../../../../lib/timeline/types';

export default function WorldTimeline() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [periods, setPeriods] = useState<TimelinePeriod[]>([]);
  const [formats, setFormats] = useState<TimeFormat[]>([]);
  const [events, setEvents] = useState<CardTimestamp[]>([]);
  const [loading, setLoading] = useState(true);

  const [orientation, setOrientation] = useState<TimelineOrientation>('vertical');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const fetchData = useCallback(async () => {
    const [tlRes, fmtRes] = await Promise.all([
      supabase
        .from('timelines')
        .select('id, name, time_format_id, tracking_type, pivot_card_id, before_label, after_label')
        .eq('world_id', id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('time_formats')
        .select('id, name, is_gregorian, hours_per_day, days_per_week, weeks_per_year, months_per_year, lunar_cycle_days, day_names, month_names')
        .eq('world_id', id)
        .order('created_at', { ascending: true }),
    ]);

    const tl = tlRes.data ?? null;
    setTimeline(tl);
    setFormats(fmtRes.data ?? []);

    if (tl) {
      if (tl.tracking_type === 'era' || tl.tracking_type === 'age') {
        const { data: pData } = await supabase
          .from('timeline_periods')
          .select('id, position, name, years, months, days')
          .eq('timeline_id', tl.id)
          .order('position', { ascending: true });
        setPeriods(pData ?? []);
      } else {
        setPeriods([]);
      }

      const { data: evData } = await supabase
        .from('card_timestamps')
        .select(`
          id, card_id, timeline_id, label, year, month, day, sort_key,
          cards ( title, type )
        `)
        .eq('timeline_id', tl.id)
        .order('sort_key', { ascending: true });

      setEvents(
        (evData ?? []).map((e: any) => ({
          id: e.id,
          card_id: e.card_id,
          timeline_id: e.timeline_id,
          label: e.label,
          year: e.year,
          month: e.month,
          day: e.day,
          sort_key: e.sort_key,
          card_title: e.cards?.title ?? '',
          card_type: e.cards?.type ?? '',
        }))
      );
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleCardCreated(_card: any, newTs: CardTimestamp[]) {
    if (newTs.length > 0) {
      setEvents((prev) => [...prev, ...newTs].sort((a, b) => a.sort_key - b.sort_key));
    }
    setShowAddEvent(false);
  }

  async function handleDeleteEvent(eventId: string) {
    await supabase.from('card_timestamps').delete().eq('id', eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handleDeleteTimeline() {
    if (!timeline) return;
    await supabase.from('timelines').delete().eq('id', timeline.id);
    setTimeline(null);
    setPeriods([]);
    setEvents([]);
  }

  async function handleDeleteFormat(formatId: string) {
    await supabase.from('time_formats').delete().eq('id', formatId);
    setFormats((prev) => prev.filter((f) => f.id !== formatId));
  }

  const activeFormat = formats.find((f) => f.id === timeline?.time_format_id) ?? null;

  if (loading) {
    return (
      <View style={S.container}>
        <WorldHeader section="Timeline" />
        <View style={S.centered}><ActivityIndicator color="#6366f1" /></View>
      </View>
    );
  }

  return (
    <View style={S.container}>
      <StatusBar style="light" />
      <WorldHeader section="Timeline" />

      <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* ── Empty state ── */}
        {!timeline && (
          <View style={S.emptySection}>
            <Text style={S.emptyTitle}>No timeline yet</Text>
            <Text style={S.emptySubtext}>
              Start by creating a time format, then build your timeline on top of it.
            </Text>
            <View style={S.emptyActions}>
              <TouchableOpacity style={S.primaryBtn} onPress={() => setShowTimelineModal(true)}>
                <Text style={S.primaryBtnText}>Create a timeline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.secondaryBtn} onPress={() => setShowFormatModal(true)}>
                <Text style={S.secondaryBtnText}>Create a time format</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Visual timeline ── */}
        {timeline && (
          <View style={S.section}>
            {/* Header row */}
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>{timeline.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[S.addBtn, orientation === 'vertical' && { borderColor: '#6366f1' }]}
                  onPress={() => setOrientation('vertical')}
                >
                  <Text style={[S.addBtnText, orientation === 'vertical' && { color: '#6366f1' }]}>
                    ↕ Vertical
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.addBtn, orientation === 'horizontal' && { borderColor: '#6366f1' }]}
                  onPress={() => setOrientation('horizontal')}
                >
                  <Text style={[S.addBtnText, orientation === 'horizontal' && { color: '#6366f1' }]}>
                    ↔ Horizontal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.addBtn, { backgroundColor: '#6366f1', borderColor: '#6366f1' }]}
                  onPress={() => setShowAddEvent(true)}
                >
                  <Text style={[S.addBtnText, { color: '#fff' }]}>+ Event</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Visual */}
            <View style={{ backgroundColor: '#12121f', borderRadius: 14, borderWidth: 1, borderColor: '#2d2d44', overflow: 'hidden' }}>
              <VisualTimeline
                timeline={timeline}
                periods={periods}
                events={events}
                orientation={orientation}
                onAddEvent={() => setShowAddEvent(true)}
                onDeleteEvent={handleDeleteEvent}
              />
            </View>

            {/* Summary card */}
            <TimelineCard
              timeline={timeline}
              format={activeFormat}
              periods={periods}
              onDelete={handleDeleteTimeline}
            />
          </View>
        )}

        {/* ── Time formats ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Time formats</Text>
            <TouchableOpacity style={S.addBtn} onPress={() => setShowFormatModal(true)}>
              <Text style={S.addBtnText}>+ Add format</Text>
            </TouchableOpacity>
          </View>
          {formats.length === 0 ? (
            <View style={S.emptyCard}>
              <Text style={S.emptyCardText}>No time formats yet</Text>
            </View>
          ) : (
            formats.map((fmt) => (
              <FormatCard
                key={fmt.id}
                fmt={fmt}
                onDelete={() => handleDeleteFormat(fmt.id)}
              />
            ))
          )}
        </View>

        {/* ── Create timeline button (when no timeline exists) ── */}
        {!timeline && formats.length > 0 && (
          <TouchableOpacity style={S.primaryBtn} onPress={() => setShowTimelineModal(true)}>
            <Text style={S.primaryBtnText}>Create a timeline</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <TimeFormatModal
        visible={showFormatModal}
        worldId={id}
        onClose={() => setShowFormatModal(false)}
        onCreated={(fmt) => {
          setFormats((prev) => [...prev, fmt]);
          setShowFormatModal(false);
        }}
      />

      <TimelineModal
        visible={showTimelineModal}
        worldId={id}
        formats={formats}
        onClose={() => setShowTimelineModal(false)}
        onCreated={(tl) => {
          setTimeline(tl);
          setShowTimelineModal(false);
          fetchData();
        }}
      />

      {timeline && (
        <CreateCardModal
          visible={showAddEvent}
          worldId={id}
          timeline={timeline}
          periods={periods}
          onClose={() => setShowAddEvent(false)}
          onCreated={handleCardCreated}
        />
      )}
    </View>
  );
}
