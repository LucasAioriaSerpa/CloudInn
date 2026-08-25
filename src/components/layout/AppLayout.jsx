/**
 * @fileoverview Layout mestre da aplicação CloudInn
 */
import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { ToastContainer } from '../common/Toast.jsx';
import { PartnerSimulatorModal } from '../../features/partner-simulator/PartnerSimulatorModal.jsx';
import { ApiExplorerModal } from '../../features/api-docs/ApiExplorerModal.jsx';

export function AppLayout({ activeRoute, onNavigate, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [apiExplorerOpen, setApiExplorerOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F9F5FF] overflow-hidden text-[#28262C]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          onOpenPartnerSimulator={() => setPartnerModalOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#28262C]/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#28262C] z-10">
            <Sidebar
              activeRoute={activeRoute}
              onNavigate={onNavigate}
              onOpenPartnerSimulator={() => {
                setPartnerModalOpen(true);
                setMobileMenuOpen(false);
              }}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          activeRoute={activeRoute}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenPartnerSimulator={() => setPartnerModalOpen(true)}
          onOpenApiExplorer={() => setApiExplorerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />

      {/* External Partner Webhook Simulator Modal (RF01) */}
      <PartnerSimulatorModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
      />

      {/* Interactive Swagger Explorer Modal */}
      <ApiExplorerModal
        isOpen={apiExplorerOpen}
        onClose={() => setApiExplorerOpen(false)}
      />
    </div>
  );
}
