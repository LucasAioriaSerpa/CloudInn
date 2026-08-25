/**
 * @fileoverview Inputs de formulário com foco, labels acessíveis e mensagens de validação
 */
import React from 'react';

export function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#28262C] flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#28262C]/40 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full text-sm rounded-lg border bg-white px-3 py-2 text-[#28262C] placeholder-[#28262C]/40 transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F9F5FF] disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-[#998FC7]/40 focus:border-[#14248A] focus:ring-[#D4C2FC]'
          }`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-500 mt-0.5">{error}</span>}
      {!error && helperText && <span className="text-xs text-[#28262C]/60 mt-0.5">{helperText}</span>}
    </div>
  );
}

export function Textarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  rows = 3,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#28262C] flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full text-sm rounded-lg border bg-white px-3 py-2 text-[#28262C] placeholder-[#28262C]/40 transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F9F5FF] disabled:cursor-not-allowed ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-[#998FC7]/40 focus:border-[#14248A] focus:ring-[#D4C2FC]'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-rose-500 mt-0.5">{error}</span>}
    </div>
  );
}
