// Shared form field components used across timeline modals

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { F, S } from './_styles';

export function NumField({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <View style={F.field}>
      <Text style={F.label}>{label}</Text>
      {hint ? <Text style={F.hint}>{hint}</Text> : null}
      <TextInput
        style={F.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor="#4a4a6a"
        placeholder="0"
      />
    </View>
  );
}

export function NamesField({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <View style={F.field}>
      <Text style={F.label}>{label}</Text>
      {hint ? <Text style={F.hint}>{hint}</Text> : null}
      <TextInput
        style={[F.input, F.textArea]}
        value={value}
        onChangeText={onChange}
        multiline
        placeholderTextColor="#4a4a6a"
        placeholder="Comma-separated, e.g. Monday, Tuesday, Wednesday"
      />
    </View>
  );
}

export function RadioOption({ label, sublabel, selected, onPress }: {
  label: string; sublabel: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[S.radioOption, selected && S.radioOptionActive]}
      onPress={onPress}
    >
      <View style={S.radioDot}>
        {selected && <View style={S.radioDotInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.radioLabel}>{label}</Text>
        <Text style={S.radioSublabel}>{sublabel}</Text>
      </View>
    </TouchableOpacity>
  );
}
