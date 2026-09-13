/**
 * @fileoverview Notificações Flutuantes (Toasts) com animação fluida via Motion
 */
import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHotel } from "../../context/HotelContext.jsx";

export function ToastContainer() {
  const { toasts, removeToast } = useHotel();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#14248A] shrink-0" />,
  };

  const bgStyles = {
    success: "bg-emerald-50/95 border-emerald-200 text-emerald-950",
    error: "bg-rose-50/95 border-rose-200 text-rose-950",
    warning: "bg-amber-50/95 border-amber-200 text-amber-950",
    info: "bg-[#F9F5FF]/95 border-[#D4C2FC] text-[#28262C]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs ${
        bgStyles[toast.type] || bgStyles.info
      }`}
    >
      <div className="flex items-start gap-3">
        {icons[toast.type] || icons.info}
        <div className="text-xs sm:text-sm font-medium leading-tight">
          {toast.message}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onDismiss}
        className="p-1 rounded-md text-[#28262C]/40 hover:text-[#28262C] hover:bg-black/5 cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
