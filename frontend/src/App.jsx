import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import Login from "./Login.jsx";
import CambiarContrasena from "./CambiarContrasena.jsx";
import ActualizarPerfil from "./ActualizarPerfil.jsx";
import MiPerfil from "./MiPerfil.jsx";
import CambiarEstado from "./CambiarEstado.jsx";

function Dashboard({ title }) {
  const role = localStorage.getItem("role") || "";
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: "Mi perfil", icon: "👤", to: "/config/perfil" },
    { label: "Configuración", icon: "⚙️", to: "/config/modulo_config" },
    { label: "Cerrar sesión", icon: "⎋", to: "/", danger: true },
  ];

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", background: "#f3f5f6", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0e9f5b", padding: "1rem 1.25rem", borderRadius: "12px 12px 0 0", color: "#fff", boxShadow: "0 8px 18px rgba(13, 51, 35, 0.12)" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{title}</h1>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              border: "none",
              background: "#fff",
              color: "#1f2d2a",
              borderRadius: "999px",
              padding: "0.7rem 0.9rem",
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <span>{role || "Usuario"}</span>
            <span>▾</span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.55rem)",
                width: "220px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
              }}
            >
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => {
                    setMenuOpen(false);
                    if (item.label === "Cerrar sesión") {
                      localStorage.clear();
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.7rem",
                    padding: "0.9rem 1rem",
                    textDecoration: "none",
                    color: item.danger ? "#e53935" : "#1f2937",
                    fontWeight: 500,
                    borderBottom: "1px solid #f1f5f9",
                    background: "#fff",
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", minHeight: "220px", borderRadius: "0 0 12px 12px", padding: "2rem", boxShadow: "0 8px 18px rgba(13, 51, 35, 0.08)" }}>
        <p style={{ margin: 0, color: "#374151" }}>Rol autenticado: {role}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/config" element={<Navigate to="/config/modulo_config" replace />} />
        <Route path="/config/modulo_config" element={<ActualizarPerfil />} />
        <Route path="/config/contrasena" element={<CambiarContrasena />} />
        <Route path="/config/perfil" element={<MiPerfil />} />
        <Route path="/config/estado" element={<CambiarEstado />} />
        <Route path="/aprendiz" element={<Dashboard title="Panel Aprendiz" />} />
        <Route path="/instructor" element={<Dashboard title="Panel Instructor" />} />
        <Route path="/administrador" element={<Dashboard title="Panel Coordinador" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
