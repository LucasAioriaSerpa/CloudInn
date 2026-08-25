/**
 * @fileoverview Componente EmptyState para estados sem registros
 */
import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./Button.jsx";

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nenhum registro encontrado",
  description = "Não há itens correspondentes aos critérios de busca ou filtros aplicados.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#D4C2FC]/80 rounded-2xl bg-white/50">
      <div className="w-14 h-14 rounded-2xl bg-[#F9F5FF] flex items-center justify-center text-[#998FC7] mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-[#28262C] font-heading">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#28262C]/65 max-w-sm mt-1 mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
