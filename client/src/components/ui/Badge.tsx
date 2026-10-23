import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'facebook' | 'instagram' | 'success' | 'warning' | 'danger' | 'outline' | 'demo';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    facebook: 'bg-facebook-light text-facebook font-semibold border border-blue-200',
    instagram: 'bg-instagram-light text-instagram-pink font-semibold border border-pink-200',
    success: 'bg-success-light text-success-text border border-emerald-200',
    warning: 'bg-warning-light text-warning-text border border-amber-200',
    danger: 'bg-danger-light text-danger-text border border-red-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    demo: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold uppercase tracking-wider text-[10px]',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};
