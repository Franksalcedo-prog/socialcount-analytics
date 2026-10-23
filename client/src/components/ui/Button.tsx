import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'facebook' | 'instagram';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm hover:shadow',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200',
      outline:
        'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-400',
      ghost:
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400',
      danger:
        'bg-danger text-white hover:bg-red-600 focus:ring-red-500 shadow-sm',
      facebook:
        'bg-facebook text-white hover:bg-facebook-hover focus:ring-blue-500 shadow-sm font-semibold',
      instagram:
        'bg-ig-gradient text-white hover:opacity-95 focus:ring-pink-500 shadow-sm font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
