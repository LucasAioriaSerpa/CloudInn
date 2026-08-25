/**
 * @fileoverview Tabela completa de reservas com filtros, busca e ações operacionais
 */
import React from 'react';
import { LogIn, LogOut, Eye, User, Calendar, BedDouble } from 'lucide-react';
import { ReservationBadge } from '../../../components/common/Badge.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { ROOM_TYPE_LABELS } from '../../../config/constants.js';

export function ReservationTable({
  reservations = [],
  onCheckIn,
  onCheckOut,
  onViewDetails,
}) {
  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#D4C2FC]/60 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-[#D4C2FC]/50 bg-[#F9F5FF] text-[#28262C]/70 font-semibold uppercase text-[11px] tracking-wider">
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Hóspede</th>
            <th className="py-3 px-4">Quarto</th>
            <th className="py-3 px-4">Check-in</th>
            <th className="py-3 px-4">Check-out</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F9F5FF]">
          {reservations.map((res) => {
            const isPending = res.status === 'pending';
            const isActive = res.status === 'active';

            return (
              <tr
                key={res.id}
                className="hover:bg-[#F9F5FF]/80 transition-colors group"
              >
                {/* ID */}
                <td className="py-3.5 px-4 font-mono font-bold text-[#14248A]">
                  #{res.id}
                </td>

                {/* Guest info */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#D4C2FC] text-[#28262C] flex items-center justify-center font-bold text-xs shrink-0">
                      {res.guest?.name ? res.guest.name.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#28262C] truncate">
                        {res.guest?.name || 'Hóspede não informado'}
                      </p>
                      <p className="text-[11px] text-[#28262C]/60 truncate">
                        Doc: {res.guest?.document || 'Sem documento'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Room info */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#14248A] bg-[#14248A]/10 px-2 py-0.5 rounded-md text-xs">
                      {res.room?.number || '-'}
                    </span>
                    <span className="text-xs text-[#28262C]/60">
                      ({ROOM_TYPE_LABELS[res.room?.roomType] || res.room?.roomType || '-'})
                    </span>
                  </div>
                </td>

                {/* Check-in Date */}
                <td className="py-3.5 px-4 font-medium text-[#28262C]">
                  {formatDate(res.checkInDate)}
                </td>

                {/* Check-out Date */}
                <td className="py-3.5 px-4 font-medium text-[#28262C]">
                  {formatDate(res.checkOutDate)}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <ReservationBadge status={res.status} />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {isPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={LogIn}
                        title="Registrar Check-in (RF07)"
                        onClick={() => onCheckIn(res)}
                      >
                        Check-in
                      </Button>
                    )}

                    {isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={LogOut}
                        title="Registrar Check-out (RF08, RF09)"
                        className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => onCheckOut(res)}
                      >
                        Check-out
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver Detalhes"
                      onClick={() => onViewDetails(res)}
                      className="text-[#28262C]/60 hover:text-[#14248A]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
