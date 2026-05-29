import { useEffect, useState } from 'react';
import {
  Modal, Pressable, ScrollView, View, Text,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../../lib/supabase';
import { NumField, RadioOption } from '../../../../lib/timeline/fields';
import { F, S } from '../../../../lib/timeline/styles';
import type { TimeFormat, Timeline, TimelinePeriod, TrackingType, PeriodDraft } from '../../../../lib/timeline/types';

type Props = {
  visible: boolean;
  worldId: string;
  formats: TimeFormat[];
  onClose: () => void;
  onCreated: (tl: Timeline) => void;
  // Edit mode
  editTimeline?: Timeline;
  editPeriods?: TimelinePeriod[];
  onUpdated?: (tl: Timeline, periods: TimelinePeriod[]) => void;
};

type WizardStep = 1 | 2 | 3;

const DEFAULT_PERIODS: PeriodDraft[] = [
  { name: '', years: '100', months: '0', days: '0' },
  { name: '', years: '100', months: '0', days: '0' },
  { name: '', years: '100', months: '0', days: '0' },
];

function periodsTodrafts(periods: TimelinePeriod[]): PeriodDraft[] {
  return periods.map((p) => ({
    name: p.name ?? '',
    years: String(p.years),
    months: String(p.months),
    days: String(p.days),
  }));
}

export default function TimelineModal({
  visible, worldId, formats, onClose, onCreated,
  editTimeline, editPeriods, onUpdated,
}: Props) {
  const isEdit = !!editTimeline;
  const [step, setStep] = useState<WizardStep>(1);

  const [name, setName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(formats[0]?.id ?? null);
  const [nameError, setNameError] = useState('');

  const [trackingType, setTrackingType] = useState<TrackingType>('before_after');

  const [pivotName, setPivotName] = useState('');
  const [beforeLabel, setBeforeLabel] = useState('Before');
  const [afterLabel, setAfterLabel] = useState('After');

  const [periodCount, setPeriodCount] = useState('3');
  const [periods, setPeriods] = useState<PeriodDraft[]>(DEFAULT_PERIODS);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill when opening in edit mode
  useEffect(() => {
    if (!visible) return;
    if (isEdit && editTimeline) {
      setName(editTimeline.name);
      setSelectedFormat(editTimeline.time_format_id);
      setTrackingType(editTimeline.tracking_type);
      setBeforeLabel(editTimeline.before_label);
      setAfterLabel(editTimeline.after_label);
      if (editPeriods && editPeriods.length > 0) {
        const drafts = periodsTodrafts(editPeriods);
        setPeriods(drafts);
        setPeriodCount(String(drafts.length));
      }
      // Edit skips step 2 (tracking type is locked), go straight to step 1
      setStep(1);
    } else {
      setSelectedFormat(formats[0]?.id ?? null);
    }
  }, [visible]);

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) setSelectedFormat(formats[0].id);
  }, [formats]);

  useEffect(() => {
    const n = Math.max(1, Math.min(50, parseInt(periodCount) || 1));
    setPeriods((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) {
        const extra = Array(n - prev.length).fill(null)
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
      setNameError('');
      // In edit mode skip tracking type step
      setStep(isEdit ? 3 : 2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(isEdit ? 1 : 2);
  }

  function updatePeriod(i: number, field: keyof PeriodDraft, value: string) {
    setPeriods((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    setSaving(true); setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setSaving(false); return; }

    if (isEdit && editTimeline) {
      // ── Edit mode ──
      const { data: tlData, error: tlErr } = await supabase
        .from('timelines')
        .update({
          name: name.trim(),
          time_format_id: selectedFormat,
          before_label: beforeLabel.trim() || 'Before',
          after_label: afterLabel.trim() || 'After',
        })
        .eq('id', editTimeline.id)
        .select()
        .single();

      if (tlErr) { setError(tlErr.message); setSaving(false); return; }

      let newPeriods: TimelinePeriod[] = [];
      if (trackingType === 'era' || trackingType === 'age') {
        // Delete existing periods and re-insert
        await supabase.from('timeline_periods').delete().eq('timeline_id', editTimeline.id);
        const rows = periods.map((p, i) => ({
          timeline_id: editTimeline.id,
          owner_id: session.user.id,
          position: i + 1,
          name: trackingType === 'age' && p.name.trim() ? p.name.trim() : null,
          years: parseInt(p.years) || 0,
          months: parseInt(p.months) || 0,
          days: parseInt(p.days) || 0,
        }));
        const { data: pData, error: periodErr } = await supabase
          .from('timeline_periods').insert(rows)
          .select('id, position, name, years, months, days');
        if (periodErr) { setError(periodErr.message); setSaving(false); return; }
        newPeriods = pData ?? [];
      }

      setSaving(false);
      onUpdated?.(tlData as Timeline, newPeriods);
      reset();
    } else {
      // ── Create mode ──
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
  }

  const activeFormat = formats.find((f) => f.id === selectedFormat);
  const totalSteps = isEdit ? 2 : 3;
  const currentStepDisplay = isEdit ? (step === 1 ? 1 : 2) : step;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={S.overlay} onPress={handleClose}>
        <Pressable style={S.modalCard} onPress={() => {}}>

          {/* Step dots */}
          <View style={S.stepRow}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View key={i} style={[S.stepDot, currentStepDisplay > i && S.stepDotActive]} />
            ))}
          </View>

          {/* ── Step 1: Name + format ── */}
          {step === 1 && (
            <>
              <Text style={S.modalTitle}>{isEdit ? 'Edit timeline' : 'Create a timeline'}</Text>
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

                  {isEdit && trackingType === 'before_after' && (
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
                  )}
                </View>
              </ScrollView>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.cancelBtn} onPress={handleClose}>
                  <Text style={S.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                {isEdit && (trackingType === 'era' || trackingType === 'age') ? (
                  <TouchableOpacity style={S.primaryBtn} onPress={goNext}>
                    <Text style={S.primaryBtnText}>Next →</Text>
                  </TouchableOpacity>
                ) : isEdit ? (
                  <TouchableOpacity
                    style={[S.primaryBtn, saving && S.disabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={S.primaryBtnText}>Save</Text>}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={S.primaryBtn} onPress={goNext}>
                    <Text style={S.primaryBtnText}>Next →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── Step 2: Tracking type (create only) ── */}
          {step === 2 && !isEdit && (
            <>
              <Text style={S.modalTitle}>How is time tracked?</Text>
              <View style={S.modalBody}>
                <RadioOption
                  label="Before & After"
                  sublabel="Events are dated relative to a pivotal moment (e.g. BC / AD)."
                  selected={trackingType === 'before_after'}
                  onPress={() => setTrackingType('before_after')}
                />
                <RadioOption
                  label="Era based"
                  sublabel="Time is divided into numbered eras. Each era has a defined length."
                  selected={trackingType === 'era'}
                  onPress={() => setTrackingType('era')}
                />
                <RadioOption
                  label="Age based"
                  sublabel="Same as eras, but each age has a custom name."
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
                      {!isEdit && (
                        <>
                          <View style={S.infoBox}>
                            <Text style={S.infoText}>
                              A card of type <Text style={S.infoHighlight}>Event</Text> will be
                              automatically created for the pivot moment.
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
                        </>
                      )}
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
                      {isEdit && (
                        <View style={S.infoBox}>
                          <Text style={S.infoText}>
                            Editing periods will re-calculate all event positions. Existing events are preserved.
                          </Text>
                        </View>
                      )}
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
                    : <Text style={S.primaryBtnText}>{isEdit ? 'Save' : 'Create timeline'}</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}
