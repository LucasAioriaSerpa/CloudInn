/**
 * @fileoverview Componente Raiz da Aplicação CloudInn
 */
import React, { useState, useEffect } from "react";
import { HotelProvider } from "./context/HotelContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { ReservationsPage } from "./features/reservations/ReservationsPage.jsx";
import { RoomsPage } from "./features/rooms/RoomsPage.jsx";
import { GuestsPage } from "./features/guests/GuestsPage.jsx";
import { ROUTES } from "./config/constants.js";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "reservas" || hash === "/reservas") return ROUTES.RESERVATIONS;
    if (hash === "quartos" || hash === "/quartos") return ROUTES.ROOMS;
    if (hash === "hospedes" || hash === "/hospedes") return ROUTES.GUESTS;
    return ROUTES.DASHBOARD;
  });

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

  const renderCurrentPage = () => {
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
    <HotelProvider>
      <AppLayout activeRoute={currentRoute} onNavigate={handleNavigate}>
        {renderCurrentPage()}
      </AppLayout>
    </HotelProvider>
  );
}
