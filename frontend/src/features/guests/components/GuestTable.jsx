/**
 * @fileoverview Tabela de listagem de hóspedes com busca e ações
 */
import React from "react";
import { Eye, Edit3, Trash2 } from "lucide-react";
import { Button } from "../../../components/common/Button.jsx";

export function GuestTable({
  guests = [],
  onViewDetails,
  onEditGuest,
  onDeleteGuest,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#D4C2FC]/60 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-[#D4C2FC]/50 bg-[#F9F5FF] text-[#28262C]/70 font-semibold uppercase text-[11px] tracking-wider">
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Nome do Hóspede</th>
            <th className="py-3 px-4">Documento</th>
            <th className="py-3 px-4">E-mail</th>
            <th className="py-3 px-4">Telefone</th>
            <th className="py-3 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F9F5FF]">
          {guests.map((guest) => (
            <tr
              key={guest.id}
              className="hover:bg-[#F9F5FF]/80 transition-colors"
            >
              <td className="py-3.5 px-4 font-mono font-bold text-[#14248A]">
                #{guest.id}
              </td>
              <td className="py-3.5 px-4 font-bold text-[#28262C]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#D4C2FC] text-[#28262C] flex items-center justify-center font-bold text-xs shrink-0">
                    {guest.name?.charAt(0).toUpperCase() || "H"}
                  </div>
                  <span>{guest.name}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 font-medium text-[#28262C]">
                {guest.document || "-"}
              </td>
              <td className="py-3.5 px-4 text-[#28262C]/70">
                {guest.email || "-"}
              </td>
              <td className="py-3.5 px-4 text-[#28262C]/70">
                {guest.phone || "-"}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    title="Editar dados"
                    onClick={() => onEditGuest(guest)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Visualizar Perfil"
                    onClick={() => onViewDetails(guest)}
                    className="text-[#28262C]/60 hover:text-[#14248A]"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {onDeleteGuest && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir Hóspede (DELETE)"
                      onClick={() => onDeleteGuest(guest)}
                      className="text-[#28262C]/40 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
