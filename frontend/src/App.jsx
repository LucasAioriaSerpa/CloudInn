/**
 * @fileoverview Componente Raiz da Aplicação CloudInn com Autenticação e Controle por Cargos
 */
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { HotelProvider } from "./context/HotelContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { ReservationsPage } from "./features/reservations/ReservationsPage.jsx";
import { RoomsPage } from "./features/rooms/RoomsPage.jsx";
import { HousekeepingPage } from "./features/housekeeping/HousekeepingPage.jsx";
import { GuestsPage } from "./features/guests/GuestsPage.jsx";
import { ROUTES } from "./config/constants.js";
import { USER_ROLES } from "./config/auth.js";
import { motion, AnimatePresence } from "motion/react";

function AppContent() {
  const { user, isAuthenticated, permissions } = useAuth();

  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "reservas" || hash === "/reservas") return ROUTES.RESERVATIONS;
    if (hash === "quartos" || hash === "/quartos") return ROUTES.ROOMS;
    if (hash === "hospedes" || hash === "/hospedes") return ROUTES.GUESTS;
    return ROUTES.DASHBOARD;
  });

  // Ajusta a rota quando o perfil do funcionário mudar
  useEffect(() => {
    if (user) {
      if (user.role === USER_ROLES.HOUSEKEEPER) {
        setCurrentRoute(ROUTES.ROOMS);
      } else if (
        user.role === USER_ROLES.RECEPTIONIST &&
        currentRoute === ROUTES.DASHBOARD
      ) {
        setCurrentRoute(ROUTES.RESERVATIONS);
      }
    }
  }, [user]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "reservas" || hash === "/reservas") {
        setCurrentRoute(ROUTES.RESERVATIONS);
      } else if (hash === "quartos" || hash === "/quartos") {
        setCurrentRoute(ROUTES.ROOMS);
      } else if (hash === "hospedes" || hash === "/hospedes") {
        setCurrentRoute(ROUTES.GUESTS);
      } else {
        setCurrentRoute(ROUTES.DASHBOARD);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleNavigate = (route) => {
    setCurrentRoute(route);
    const hashValue = route === ROUTES.DASHBOARD ? "" : route.replace("/", "");
    if (hashValue) {
      window.location.hash = hashValue;
    } else {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  // Se não estiver autenticado, exibe a tela de login corporativo
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(loggedInUser) => {
          if (loggedInUser.role === USER_ROLES.HOUSEKEEPER) {
            handleNavigate(ROUTES.ROOMS);
          } else if (loggedInUser.role === USER_ROLES.RECEPTIONIST) {
            handleNavigate(ROUTES.RESERVATIONS);
          } else {
            handleNavigate(ROUTES.DASHBOARD);
          }
        }}
      />
    );
  }

  // Renderiza a página correspondente com base no cargo
  const renderCurrentPage = () => {
    // 1. Governanta: Foco exclusivo em Quartos Sujos e Limpos
    if (user?.role === USER_ROLES.HOUSEKEEPER) {
      return <HousekeepingPage />;
    }

    // 2. Recepcionista: Foco em Reservas (Check-in e Check-out), Quartos e Hóspedes
    if (user?.role === USER_ROLES.RECEPTIONIST) {
      switch (currentRoute) {
        case ROUTES.ROOMS:
          return <RoomsPage />;
        case ROUTES.GUESTS:
          return <GuestsPage />;
        case ROUTES.RESERVATIONS:
        default:
          return <ReservationsPage />;
      }
    }

    // 3. Gerente / Sub-Gerente: Acesso total a todo o sistema
    switch (currentRoute) {
      case ROUTES.RESERVATIONS:
        return <ReservationsPage />;
      case ROUTES.ROOMS:
        return <RoomsPage />;
      case ROUTES.GUESTS:
        return <GuestsPage />;
      case ROUTES.DASHBOARD:
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout activeRoute={currentRoute} onNavigate={handleNavigate}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentRoute}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full"
        >
          {renderCurrentPage()}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HotelProvider>
        <AppContent />
      </HotelProvider>
    </AuthProvider>
  );
}

