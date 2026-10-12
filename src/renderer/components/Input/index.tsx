import React, { useState } from 'react';
import { colors, radius, typography, spacing } from '../../tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label
          style={{
            fontSize: typography.scale.sm,
            fontWeight: typography.weight.medium,
            color: colors.text.secondary,
            fontFamily: typography.fontBody,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          backgroundColor: colors.bg.elevated,
          border: `1px solid ${focused ? colors.accent.DEFAULT : error ? colors.status.error : colors.border.default}`,
          borderRadius: radius.md,
          padding: `${spacing[2]} ${spacing[4]}`,
          fontSize: typography.scale.base,
          color: colors.text.primary,
          fontFamily: typography.fontBody,
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && (
        <span style={{ fontSize: typography.scale.xs, color: colors.status.error }}>
          {error}
        </span>
      )}
    </div>
  );
}
