import { useEffect, useState } from 'react';
import {
  Modal, Pressable, ScrollView, View, Text,
  TextInput, TouchableOpacity, ActivityIndicator, Switch,
} from 'react-native';
import { supabase } from '../../../../lib/supabase';
import { GREGORIAN_PRESET } from './_constants';
import { NumField, NamesField } from './_fields';
import { F, S } from './_styles';
import type { TimeFormat } from './_types';

type Props = {
  visible: boolean;
  worldId: string;
  onClose: () => void;
  onCreated: (fmt: TimeFormat) => void;
};

export default function TimeFormatModal({ visible, worldId, onClose, onCreated }: Props) {
  const [useGregorian, setUseGregorian] = useState(true);
  const [name, setName] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('24');
  const [daysPerWeek, setDaysPerWeek] = useState('7');
  const [weeksPerYear, setWeeksPerYear] = useState('52');
  const [monthsPerYear, setMonthsPerYear] = useState('12');
  const [lunarCycle, setLunarCycle] = useState('');
  const [dayNames, setDayNames] = useState('');
  const [monthNames, setMonthNames] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setUseGregorian(true); setName(''); setHoursPerDay('24'); setDaysPerWeek('7');
    setWeeksPerYear('52'); setMonthsPerYear('12'); setLunarCycle('');
    setDayNames(''); setMonthNames(''); setError('');
  }

  function applyGregorian() {
    setName(GREGORIAN_PRESET.name);
    setHoursPerDay(String(GREGORIAN_PRESET.hours_per_day));
    setDaysPerWeek(String(GREGORIAN_PRESET.days_per_week));
    setWeeksPerYear(String(GREGORIAN_PRESET.weeks_per_year));
    setMonthsPerYear(String(GREGORIAN_PRESET.months_per_year));
    setLunarCycle(String(GREGORIAN_PRESET.lunar_cycle_days));
    setDayNames(GREGORIAN_PRESET.day_names.join(', '));
    setMonthNames(GREGORIAN_PRESET.month_names.join(', '));
  }

  useEffect(() => { if (useGregorian) applyGregorian(); }, [useGregorian]);

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setSaving(false); return; }

    const { data, error: err } = await supabase.from('time_formats').insert({
      world_id: worldId,
      owner_id: session.user.id,
      name: name.trim(),
      is_gregorian: useGregorian,
      hours_per_day: parseInt(hoursPerDay) || 24,
      days_per_week: parseInt(daysPerWeek) || 7,
      weeks_per_year: parseInt(weeksPerYear) || 52,
      months_per_year: parseInt(monthsPerYear) || 12,
      lunar_cycle_days: lunarCycle ? parseFloat(lunarCycle) : null,
      day_names: dayNames.trim()
        ? dayNames.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      month_names: monthNames.trim()
        ? monthNames.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
    }).select().single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated(data as TimeFormat);
    reset();
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={S.overlay} onPress={handleClose}>
        <Pressable style={S.modalCard} onPress={() => {}}>
          <Text style={S.modalTitle}>Create a time format</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            <View style={S.modalBody}>
              <View style={S.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.toggleLabel}>Use Gregorian calendar</Text>
                  <Text style={S.toggleHint}>Pre-fills all fields with Earth's calendar</Text>
                </View>
                <Switch
                  value={useGregorian}
                  onValueChange={setUseGregorian}
                  trackColor={{ false: '#2d2d44', true: '#6366f1' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={S.divider} />

              <View style={F.field}>
                <Text style={F.label}>Format name</Text>
                <TextInput
                  style={F.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Imperial Calendar"
                  placeholderTextColor="#4a4a6a"
                />
              </View>

              <NumField label="Hours per day" value={hoursPerDay} onChange={setHoursPerDay} hint="How many hours in a day" />
              <NumField label="Days per week" value={daysPerWeek} onChange={setDaysPerWeek} />
              <NumField label="Weeks per year" value={weeksPerYear} onChange={setWeeksPerYear} />
              <NumField label="Months per year" value={monthsPerYear} onChange={setMonthsPerYear} />
              <NumField label="Lunar cycle (days)" value={lunarCycle} onChange={setLunarCycle} hint="Optional — e.g. 29.53" />
              <NamesField
                label="Day names"
                value={dayNames}
                onChange={setDayNames}
                hint={`One per day of the week (${daysPerWeek || '?'} expected)`}
              />
              <NamesField
                label="Month names"
                value={monthNames}
                onChange={setMonthNames}
                hint={`One per month (${monthsPerYear || '?'} expected)`}
              />

              {error ? <Text style={S.errorText}>{error}</Text> : null}
            </View>
          </ScrollView>

          <View style={S.modalActions}>
            <TouchableOpacity style={S.cancelBtn} onPress={handleClose}>
              <Text style={S.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.primaryBtn, saving && S.disabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.primaryBtnText}>Create format</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
