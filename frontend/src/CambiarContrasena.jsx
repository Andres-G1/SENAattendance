import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";
import senaLogo from "./assets/Senalogo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CambiarContrasena() {
  const role = localStorage.getItem("role") || "Aprendiz";
  const storedRole = role.toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";
  const displayName = localStorage.getItem("user_name") || "Sebastian";
  const dashboardPath = role === "Aprendiz" ? "/aprendiz" : role === "Instructor" ? "/instructor" : "/administrador";
  const [menuOpen, setMenuOpen] = useState(true);

  const menuItems = [
    { label: "Mi Perfil", icon: "👤", to: "/config/perfil" },
    { label: "Configuración", icon: "⚙️", to: "/config/modulo_config" },
    { label: "Cerrar sesión", icon: "⎋", to: "/", danger: true },
  ];

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    contraseña_actual: "",
    contraseña_nueva: "",
    confirmar_contraseña: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.contraseña_nueva !== form.confirmar_contraseña) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role: form.role,
        user_id: Number(form.user_id),
        contraseña_actual: form.contraseña_actual,
        contraseña_nueva: form.contraseña_nueva,
      };

      const res = await fetch(`${API_URL}/users/cambiar-contrasena`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "No fue posible cambiar la contraseña");
      }

      setSuccess(data.detail || "Contraseña actualizada correctamente");
      setForm((prev) => ({
        ...prev,
        contraseña_actual: "",
        contraseña_nueva: "",
        confirmar_contraseña: "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="config-page">
      <aside className="side-rail" aria-label="Navegación lateral">
        <div className="rail-top">
          <span className="rail-badge">S</span>
        </div>
        <nav className="rail-nav" aria-label="Menú principal">
          <button type="button" className="rail-item active" aria-label="Inicio">⌂</button>
          <button type="button" className="rail-item" aria-label="Archivo">▣</button>
          <button type="button" className="rail-item" aria-label="Estadísticas">◔</button>
          <button type="button" className="rail-item" aria-label="Perfil">◍</button>
          <button type="button" className="rail-item" aria-label="Ajustes">⚙</button>
        </nav>
      </aside>

      <div className="config-workspace">
        <header className="topbar">
          <div className="brand-group">
            <div className="brand-mark">
              <img src={senaLogo} alt="Logo SENA" />
            </div>
            <span className="brand-text">SENA Attendance</span>
            <Link className="home-link" to={dashboardPath}>Inicio</Link>
          </div>

          <div className="user-panel">
            <div className="user-menu-wrap">
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <span className="user-name">{displayName}</span>
                <span className="role-tag">{role}</span>
                <span className="user-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="user-menu-dropdown">
                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`menu-item ${item.danger ? "danger" : ""}`}
                      onClick={() => {
                        setMenuOpen(false);
                        if (item.label === "Cerrar sesión") {
                          localStorage.clear();
                        }
                      }}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="avatar-round">{displayName[0]}</div>
          </div>
        </header>

        <div className="config-shell">
          <section className="config-card">
            <div className="card-header-custom">
              <div className="header-copy">
                <h2 className="page-title">Configuración de cuenta</h2>
                <p className="page-subtitle">Actualiza tus datos de acceso con seguridad y claridad.</p>
              </div>
              <span className="status-badge">{role}</span>
            </div>

            <form onSubmit={onSubmit} className="config-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="actual">Contraseña actual</label>
                  <input id="actual" name="contraseña_actual" type="password" value={form.contraseña_actual} onChange={onChange} placeholder="Ingresa tu contraseña actual" required />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="nueva">Nueva contraseña</label>
                  <input id="nueva" name="contraseña_nueva" type="password" value={form.contraseña_nueva} onChange={onChange} placeholder="Ingresa una nueva contraseña" required />
                </div>

                <div className="form-group full-width divider">
                  <label htmlFor="confirmar">Confirma tu contraseña actual</label>
                  <input id="confirmar" name="confirmar_contraseña" type="password" value={form.confirmar_contraseña} onChange={onChange} placeholder="Necesaria para guardar cualquier cambio" required />
                </div>
              </div>

              <div className="form-actions">
                <Link className="btn btn-outline-secondary" to={dashboardPath}>Cancelar</Link>
                <button className="btn btn-success" type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>

            {error ? <p className="config-message error">{error}</p> : null}
            {success ? <p className="config-message success">{success}</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
