/**
 * @fileoverview Componente LoadingState para indicadores visuais de carregamento
 */
import React from "react";

export function LoadingState({ message = "Carregando dados..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-\[260px\]">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#D4C2FC] border-t-[#14248A] animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-[#28262C]/70">{message}</p>
    </div>
  );
}
