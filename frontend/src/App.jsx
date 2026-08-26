import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./Login.jsx";
import PasswordChange from "./PasswordChange.jsx";

function Dashboard({ title }) {
  const role = localStorage.getItem("role") || "";

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{title}</h1>
      <p>Rol autenticado: {role}</p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <a href="/config/password">Cambiar contraseña</a>
        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/config/password" element={<PasswordChange />} />
        <Route path="/aprendiz" element={<Dashboard title="Panel Aprendiz" />} />
        <Route path="/instructor" element={<Dashboard title="Panel Instructor" />} />
        <Route path="/administrador" element={<Dashboard title="Panel Coordinador" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
