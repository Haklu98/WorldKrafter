import { useEffect, useState } from 'react';
import {
  Modal, Pressable, ScrollView, View, Text,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../../lib/supabase';
import { NumField, RadioOption } from '../../../../lib/timeline/fields';
import { F, S } from '../../../../lib/timeline/styles';
import type { TimeFormat, Timeline, TrackingType, PeriodDraft } from '../../../../lib/timeline/types';

type Props = {
  visible: boolean;
  worldId: string;
  formats: TimeFormat[];
  onClose: () => void;
  onCreated: (tl: Timeline) => void;
};

type WizardStep = 1 | 2 | 3;

const DEFAULT_PERIODS: PeriodDraft[] = [
  { name: '', years: '100', months: '0', days: '0' },
  { name: '', years: '100', months: '0', days: '0' },
  { name: '', years: '100', months: '0', days: '0' },
];

export default function TimelineModal({ visible, worldId, formats, onClose, onCreated }: Props) {
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [name, setName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(formats[0]?.id ?? null);
  const [nameError, setNameError] = useState('');

  // Step 2
  const [trackingType, setTrackingType] = useState<TrackingType>('before_after');

  // Step 3 — before/after
  const [pivotName, setPivotName] = useState('');
  const [beforeLabel, setBeforeLabel] = useState('Before');
  const [afterLabel, setAfterLabel] = useState('After');

  // Step 3 — era / age
  const [periodCount, setPeriodCount] = useState('3');
  const [periods, setPeriods] = useState<PeriodDraft[]>(DEFAULT_PERIODS);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) setSelectedFormat(formats[0].id);
  }, [formats]);

  // Keep period array in sync with count input
  useEffect(() => {
    const n = Math.max(1, Math.min(50, parseInt(periodCount) || 1));
    setPeriods((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) {
        const extra = Array(n - prev.length)
          .fill(null)
          .map(() => ({ name: '', years: '100', months: '0', days: '0' }));
        return [...prev, ...extra];
      }
      return prev.slice(0, n);
    });
  }, [periodCount]);

  function reset() {
    setStep(1); setName(''); setNameError('');
    setSelectedFormat(formats[0]?.id ?? null);
    setTrackingType('before_after');
    setPivotName(''); setBeforeLabel('Before'); setAfterLabel('After');
    setPeriodCount('3'); setPeriods(DEFAULT_PERIODS);
    setError('');
  }

  function handleClose() { reset(); onClose(); }

  function goNext() {
    if (step === 1) {
      if (!name.trim()) { setNameError('Name is required.'); return; }
      setNameError(''); setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function updatePeriod(i: number, field: keyof PeriodDraft, value: string) {
    setPeriods((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    setSaving(true); setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setSaving(false); return; }

    // Before/after: create pivot event card first
    let pivotCardId: string | null = null;
    if (trackingType === 'before_after') {
      const { data: cardData, error: cardErr } = await supabase
        .from('cards')
        .insert({
          world_id: worldId,
          owner_id: session.user.id,
          type: 'Event',
          title: pivotName.trim() || 'Pivotal Event',
          content: null,
        })
        .select('id')
        .single();
      if (cardErr) { setError(cardErr.message); setSaving(false); return; }
      pivotCardId = cardData.id;
    }

    // Create timeline
    const { data: tlData, error: tlErr } = await supabase
      .from('timelines')
      .insert({
        world_id: worldId,
        owner_id: session.user.id,
        name: name.trim(),
        time_format_id: selectedFormat,
        tracking_type: trackingType,
        pivot_card_id: pivotCardId,
        before_label: beforeLabel.trim() || 'Before',
        after_label: afterLabel.trim() || 'After',
      })
      .select()
      .single();

    if (tlErr) { setError(tlErr.message); setSaving(false); return; }

    // Era/age: insert periods
    if (trackingType === 'era' || trackingType === 'age') {
      const rows = periods.map((p, i) => ({
        timeline_id: tlData.id,
        owner_id: session.user.id,
        position: i + 1,
        name: trackingType === 'age' && p.name.trim() ? p.name.trim() : null,
        years: parseInt(p.years) || 0,
        months: parseInt(p.months) || 0,
        days: parseInt(p.days) || 0,
      }));
      const { error: periodErr } = await supabase.from('timeline_periods').insert(rows);
      if (periodErr) { setError(periodErr.message); setSaving(false); return; }
    }

    setSaving(false);
    onCreated(tlData as Timeline);
    reset();
  }

  const activeFormat = formats.find((f) => f.id === selectedFormat);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={S.overlay} onPress={handleClose}>
        <Pressable style={S.modalCard} onPress={() => {}}>

          {/* Step dots */}
          <View style={S.stepRow}>
            {([1, 2, 3] as WizardStep[]).map((n) => (
              <View key={n} style={[S.stepDot, step >= n && S.stepDotActive]} />
            ))}
          </View>

          {/* ── Step 1: Name + format ── */}
          {step === 1 && (
            <>
              <Text style={S.modalTitle}>Create a timeline</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                <View style={S.modalBody}>
                  <View style={F.field}>
                    <Text style={F.label}>Timeline name</Text>
                    <TextInput
                      style={[F.input, nameError ? F.inputError : null]}
                      value={name}
                      onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }}
                      placeholder="e.g. Age of Empires"
                      placeholderTextColor="#4a4a6a"
                    />
                    {nameError ? <Text style={S.errorText}>{nameError}</Text> : null}
                  </View>

                  {formats.length > 0 && (
                    <View style={F.field}>
                      <Text style={F.label}>Time format</Text>
                      {formats.map((fmt) => (
                        <TouchableOpacity
                          key={fmt.id}
                          style={[S.radioOption, selectedFormat === fmt.id && S.radioOptionActive]}
                          onPress={() => setSelectedFormat(fmt.id)}
                        >
                          <View style={S.radioDot}>
                            {selectedFormat === fmt.id && <View style={S.radioDotInner} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={S.radioLabel}>{fmt.name}</Text>
                            <Text style={S.radioSublabel}>
                              {fmt.hours_per_day}h · {fmt.days_per_week}d/wk · {fmt.months_per_year} months
                            </Text>
                          </View>
                          {fmt.is_gregorian && (
                            <View style={S.badge}><Text style={S.badgeText}>Gregorian</Text></View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.cancelBtn} onPress={handleClose}>
                  <Text style={S.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.primaryBtn} onPress={goNext}>
                  <Text style={S.primaryBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 2: Tracking type ── */}
          {step === 2 && (
            <>
              <Text style={S.modalTitle}>How is time tracked?</Text>
              <View style={S.modalBody}>
                <RadioOption
                  label="Before & After"
                  sublabel="Events are dated relative to a pivotal moment (e.g. BC / AD). The pivot is created as an Event card."
                  selected={trackingType === 'before_after'}
                  onPress={() => setTrackingType('before_after')}
                />
                <RadioOption
                  label="Era based"
                  sublabel="Time is divided into numbered eras (Era 1, Era 2…). Each era has a defined length."
                  selected={trackingType === 'era'}
                  onPress={() => setTrackingType('era')}
                />
                <RadioOption
                  label="Age based"
                  sublabel="Same as eras, but each age has a custom name (e.g. Age of Fire, Age of Silence)."
                  selected={trackingType === 'age'}
                  onPress={() => setTrackingType('age')}
                />
              </View>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.cancelBtn} onPress={goBack}>
                  <Text style={S.cancelBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.primaryBtn} onPress={goNext}>
                  <Text style={S.primaryBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3: Type config ── */}
          {step === 3 && (
            <>
              <Text style={S.modalTitle}>
                {trackingType === 'before_after' ? 'Define the pivot event'
                  : trackingType === 'era' ? 'Define eras' : 'Define ages'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                <View style={S.modalBody}>

                  {trackingType === 'before_after' && (
                    <>
                      <View style={S.infoBox}>
                        <Text style={S.infoText}>
                          A card of type <Text style={S.infoHighlight}>Event</Text> will be
                          automatically created for the pivot moment and linked to this timeline.
                        </Text>
                      </View>
                      <View style={F.field}>
                        <Text style={F.label}>Pivot event name</Text>
                        <TextInput
                          style={F.input}
                          value={pivotName}
                          onChangeText={setPivotName}
                          placeholder="e.g. The Great Sundering"
                          placeholderTextColor="#4a4a6a"
                        />
                      </View>
                      <View style={S.twoCol}>
                        <View style={[F.field, { flex: 1 }]}>
                          <Text style={F.label}>Before label</Text>
                          <TextInput style={F.input} value={beforeLabel}
                            onChangeText={setBeforeLabel} placeholder="Before"
                            placeholderTextColor="#4a4a6a" />
                        </View>
                        <View style={[F.field, { flex: 1 }]}>
                          <Text style={F.label}>After label</Text>
                          <TextInput style={F.input} value={afterLabel}
                            onChangeText={setAfterLabel} placeholder="After"
                            placeholderTextColor="#4a4a6a" />
                        </View>
                      </View>
                      <View style={S.previewRow}>
                        <Text style={S.previewLabel}>Preview: </Text>
                        <Text style={S.previewValue}>
                          450 {beforeLabel || 'Before'} / 12 {afterLabel || 'After'} {pivotName || 'Pivotal Event'}
                        </Text>
                      </View>
                    </>
                  )}

                  {(trackingType === 'era' || trackingType === 'age') && (
                    <>
                      <NumField
                        label={`Number of ${trackingType === 'era' ? 'eras' : 'ages'}`}
                        value={periodCount}
                        onChange={setPeriodCount}
                        hint="1–50"
                      />
                      <View style={S.divider} />
                      {periods.map((p, i) => (
                        <View key={i} style={S.periodBlock}>
                          <Text style={S.periodTitle}>
                            {trackingType === 'era' ? `Era ${i + 1}` : `Age ${i + 1}`}
                          </Text>
                          {trackingType === 'age' && (
                            <View style={F.field}>
                              <Text style={F.label}>Name</Text>
                              <TextInput
                                style={F.input}
                                value={p.name}
                                onChangeText={(v) => updatePeriod(i, 'name', v)}
                                placeholder={`e.g. Age of ${['Fire', 'Ice', 'Shadow', 'Light'][i % 4]}`}
                                placeholderTextColor="#4a4a6a"
                              />
                            </View>
                          )}
                          <View style={S.twoCol}>
                            <View style={[F.field, { flex: 1 }]}>
                              <Text style={F.label}>Years</Text>
                              <TextInput style={F.input} value={p.years}
                                onChangeText={(v) => updatePeriod(i, 'years', v)}
                                keyboardType="numeric" placeholderTextColor="#4a4a6a" placeholder="0" />
                            </View>
                            <View style={[F.field, { flex: 1 }]}>
                              <Text style={F.label}>
                                Months{activeFormat ? ` (/${activeFormat.months_per_year})` : ''}
                              </Text>
                              <TextInput style={F.input} value={p.months}
                                onChangeText={(v) => updatePeriod(i, 'months', v)}
                                keyboardType="numeric" placeholderTextColor="#4a4a6a" placeholder="0" />
                            </View>
                            <View style={[F.field, { flex: 1 }]}>
                              <Text style={F.label}>Days</Text>
                              <TextInput style={F.input} value={p.days}
                                onChangeText={(v) => updatePeriod(i, 'days', v)}
                                keyboardType="numeric" placeholderTextColor="#4a4a6a" placeholder="0" />
                            </View>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {error ? <Text style={S.errorText}>{error}</Text> : null}
                </View>
              </ScrollView>

              <View style={S.modalActions}>
                <TouchableOpacity style={S.cancelBtn} onPress={goBack}>
                  <Text style={S.cancelBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.primaryBtn, saving && S.disabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={S.primaryBtnText}>Create timeline</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}
