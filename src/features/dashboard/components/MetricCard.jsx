/**
 * @fileoverview Card de métrica operacional com ícone e indicador de variação
 */
import React from 'react';
import { Card } from '../../../components/common/Card.jsx';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  onClick,
}) {
  const colorStyles = {
    primary: {
      iconBg: 'bg-[#14248A]/10 text-[#14248A]',
      border: 'border-[#D4C2FC]/80',
    },
    purple: {
      iconBg: 'bg-[#998FC7]/20 text-[#28262C]',
      border: 'border-[#998FC7]/40',
    },
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      border: 'border-emerald-200',
    },
    amber: {
      iconBg: 'bg-amber-100 text-amber-700',
      border: 'border-amber-200',
    },
    rose: {
      iconBg: 'bg-rose-100 text-rose-700',
      border: 'border-rose-200',
    },
  };

  const style = colorStyles[color] || colorStyles.primary;

  return (
    <Card
      onClick={onClick}
      className={`p-5 flex flex-col justify-between transition-all hover:shadow-md ${style.border} ${
        onClick ? 'cursor-pointer hover:border-[#14248A]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#28262C]/65">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#28262C] font-heading mt-1">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-[#F9F5FF] flex items-center justify-between text-xs">
          {subtitle && <span className="text-[#28262C]/70">{subtitle}</span>}
          {trend && (
            <span className="font-semibold text-[#14248A] bg-[#D4C2FC]/50 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
