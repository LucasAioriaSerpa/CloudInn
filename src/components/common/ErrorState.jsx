/**
 * @fileoverview Componente ErrorState para estados de erro com opção de nova tentativa
 */
import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'Ocorreu um erro ao carregar os dados',
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-200 rounded-2xl bg-rose-50/50">
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-rose-900">{title}</h4>
      {message && <p className="text-xs sm:text-sm text-rose-700 max-w-md mt-1 mb-4">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </div>
  );
}
