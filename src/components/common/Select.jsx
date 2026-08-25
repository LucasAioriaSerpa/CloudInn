/**
 * @fileoverview Componente Select com suporte a opções, ícones e estados
 */
import React from "react";

export function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Selecione uma opção",
  required = false,
  disabled = false,
  error,
  helperText,
  className = "",
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-[#28262C] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full text-sm rounded-lg border bg-white px-3 py-2 pr-8 text-[#28262C] transition-colors appearance-none focus:outline-none focus:ring-2 disabled:bg-[#F9F5FF] disabled:cursor-not-allowed ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-[#998FC7]/40 focus:border-[#14248A] focus:ring-[#D4C2FC]"
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#28262C]/50">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-rose-500 mt-0.5">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-[#28262C]/60 mt-0.5">{helperText}</span>
      )}
    </div>
  );
}
