/**
 * @fileoverview Componente Card com acabamento refinado e bordas suaves
 */
import React from 'react';

export function Card({ children, className = '', id, onClick }) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#D4C2FC]/60 shadow-[0_2px_8px_-2px_rgba(40,38,44,0.05)] transition-all ${
        onClick ? 'cursor-pointer hover:border-[#998FC7] hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`p-5 pb-3 flex items-start justify-between border-b border-[#F9F5FF] ${className}`}>
      <div>
        <h3 className="text-base font-bold text-[#28262C] font-heading">{title}</h3>
        {subtitle && <p className="text-xs text-[#28262C]/65 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
