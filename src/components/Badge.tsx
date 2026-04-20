'use client';

import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<NonNullable<BadgeProps['variant']>, { bg: string; text: string; ring: string; dot: string }> = {
  success: { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-500'   },
  danger:  { bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-200',     dot: 'bg-red-500'     },
  info:    { bg: 'bg-blue-50',     text: 'text-blue-700',    ring: 'ring-blue-200',    dot: 'bg-blue-500'    },
  neutral: { bg: 'bg-gray-50',     text: 'text-gray-700',    ring: 'ring-gray-200',    dot: 'bg-gray-400'    },
  default: { bg: 'bg-gray-100',    text: 'text-gray-800',    ring: 'ring-gray-200',    dot: 'bg-gray-400'    },
};

export default function Badge({ variant = 'default', size = 'sm', dot = false, children }: BadgeProps) {
  const v = VARIANTS[variant];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        v.bg, v.text, v.ring,
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', v.dot)} />}
      {children}
    </span>
  );
}
