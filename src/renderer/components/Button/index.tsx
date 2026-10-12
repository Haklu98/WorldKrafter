import React from 'react';
import { colors, radius, typography, spacing } from '../../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.accent.DEFAULT,
    color: colors.text.inverse,
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.text.secondary,
    border: 'none',
  },
  danger: {
    backgroundColor: 'transparent',
    color: colors.status.error,
    border: `1px solid ${colors.status.error}`,
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: `${spacing[1]} ${spacing[3]}`, fontSize: typography.scale.sm },
  md: { padding: `${spacing[2]} ${spacing[5]}`, fontSize: typography.scale.base },
  lg: { padding: `${spacing[3]} ${spacing[8]}`, fontSize: typography.scale.lg },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderRadius: radius.md,
        fontFamily: typography.fontBody,
        fontWeight: typography.weight.semibold,
        cursor: 'pointer',
        transition: 'opacity 0.15s, transform 0.1s',
        width: fullWidth ? '100%' : undefined,
        letterSpacing: '0.01em',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      {...props}
    >
      {children}
    </button>
  );
}
