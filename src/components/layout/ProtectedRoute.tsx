import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Acceso directo 100% privado y local para el Sales Cockpit de Mercado Pago — Cero contraseñas
  return <>{children}</>;
};
