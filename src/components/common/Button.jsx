/**
 * @fileoverview Componente Button customizável com variantes da paleta CloudInn
 */
import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'p-2 text-sm',
  };

  const variantStyles = {
    primary:
      'bg-[#14248A] text-white hover:bg-[#0f1b69] focus:ring-[#14248A] shadow-sm',
    secondary:
      'bg-[#D4C2FC] text-[#28262C] hover:bg-[#c2abf8] focus:ring-[#998FC7] shadow-sm font-semibold',
    outline:
      'bg-white text-[#28262C] border border-[#998FC7]/40 hover:bg-[#F9F5FF] hover:border-[#998FC7] focus:ring-[#998FC7]',
    ghost:
      'bg-transparent text-[#28262C] hover:bg-[#D4C2FC]/30 focus:ring-[#998FC7]',
    dark:
      'bg-[#28262C] text-white hover:bg-[#1e1c21] focus:ring-[#28262C] shadow-sm',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    warning:
      'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
