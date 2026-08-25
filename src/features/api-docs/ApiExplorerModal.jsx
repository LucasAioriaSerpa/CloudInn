/**
 * @fileoverview Modal Interativo de Inspeção de Contratos Swagger & RF01-RF11
 */
import React from 'react';
import { Code2, Check, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';

const SWAGGER_ENDPOINTS = [
  {
    method: 'POST',
    path: '/reservation',
    rf: 'RF01, RF03, RF04, RF05',
    desc: 'Recebe notificação de reserva, cadastra hóspede e associa quarto.',
    status: 'Implementado',
  },
  {
    method: 'GET',
    path: '/reservation',
    rf: 'Listagem & Filtros',
    desc: 'Lista as reservas com parâmetro opcional ?status=pending|active|completed|cancelled.',
    status: 'Implementado',
  },
  {
    method: 'GET',
    path: '/reservation/{id}',
    rf: 'Consulta',
    desc: 'Busca os detalhes completos de uma reserva pelo ID.',
    status: 'Implementado',
  },
  {
    method: 'POST',
    path: '/reservation/{id}/checkin',
    rf: 'RF07',
    desc: 'Registra check-in do hóspede e altera quarto para occupied.',
    status: 'Implementado',
  },
  {
    method: 'POST',
    path: '/reservation/{id}/checkout',
    rf: 'RF08, RF09',
    desc: 'Registra check-out do hóspede e altera quarto para dirty.',
    status: 'Implementado',
  },
  {
    method: 'GET',
    path: '/room',
    rf: 'Visão Geral & Governança',
    desc: 'Lista todos os quartos com filtro ?status=available|reserved|occupied|dirty|cleaning.',
    status: 'Implementado',
  },
  {
    method: 'GET',
    path: '/room/{id}',
    rf: 'Consulta Quarto',
    desc: 'Busca informações e status de um quarto específico.',
    status: 'Implementado',
  },
  {
    method: 'POST',
    path: '/room/{id}?status={status}',
    rf: 'RF06, RF10, RF11',
    desc: 'Atualiza o status operacional do quarto (iniciar limpeza, disponibilizar).',
    status: 'Implementado',
  },
  {
    method: 'POST',
    path: '/guest',
    rf: 'RF02',
    desc: 'Cadastra os dados de um novo hóspede (nome, documento, e-mail, telefone).',
    status: 'Implementado',
  },
  {
    method: 'GET',
    path: '/guest/{id}',
    rf: 'Consulta Hóspede',
    desc: 'Busca dados cadastrais do hóspede pelo ID.',
    status: 'Implementado',
  },
  {
    method: 'PUT',
    path: '/guest/{id}',
    rf: 'Edição Hóspede',
    desc: 'Atualiza dados de contato ou identificação do hóspede.',
    status: 'Implementado',
  },
];

export function ApiExplorerModal({ isOpen, onClose }) {
  const methodColors = {
    GET: 'bg-blue-100 text-blue-800 border-blue-200',
    POST: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PUT: 'bg-amber-100 text-amber-800 border-amber-200',
    DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contratos Swagger & Mapeamento de Requisitos"
      subtitle="Conformidade arquitetural com swagger.yaml e arc42"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-[#F9F5FF] rounded-xl border border-[#D4C2FC]/70 text-xs text-[#28262C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Todos os 11 endpoints e RFs do Swagger estão conectados e funcionais no frontend.</span>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#14248A]">OpenAPI 3.0.4</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#D4C2FC]/60 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9F5FF] border-b border-[#D4C2FC]/50 text-[#28262C]/70 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Requisito arc42</th>
                <th className="py-2.5 px-3">Descrição da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F5FF]">
              {SWAGGER_ENDPOINTS.map((ep, idx) => (
                <tr key={idx} className="hover:bg-[#F9F5FF]/70">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                        methodColors[ep.method]
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#14248A]">
                    {ep.path}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#28262C]">
                    {ep.rf}
                  </td>
                  <td className="py-2.5 px-3 text-[#28262C]/70">
                    {ep.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
