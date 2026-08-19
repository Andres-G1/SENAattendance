import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children, rolPermitido }) {
  const token = localStorage.getItem("access_token");
  const rol = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (rolPermitido && rol !== rolPermitido) {
    return <Navigate to="/" replace />;
  }

  return children;
}