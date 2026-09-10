import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";
import senaLogo from "./assets/Senalogo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ActualizarPerfil() {
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
    nombre: "Sebastian Ramirez",
    correo: "aprendiz.prueba@sena.edu.co",
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
    setLoading(true);

    try {
      if (form.contraseña_nueva && form.contraseña_nueva !== form.confirmar_contraseña) {
        throw new Error("La nueva contraseña y la confirmación no coinciden.");
      }

      const payload = {};
      if (form.nombre.trim()) payload.nombre = form.nombre.trim();
      if (form.correo.trim()) payload.correo = form.correo.trim();

      if (Object.keys(payload).length === 0 && !form.contraseña_nueva.trim()) {
        throw new Error("Debes enviar al menos un campo para actualizar");
      }

      if (Object.keys(payload).length > 0) {
        const profilePath = `${API_URL}/users/${form.role}/${Number(form.user_id)}/perfil`;
        const profileRes = await fetch(profilePath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const profileData = await profileRes.json().catch(() => ({}));
        if (!profileRes.ok) {
          const detail = Array.isArray(profileData.detail) ? "Error de validación" : profileData.detail;
          throw new Error(detail || "No fue posible actualizar perfil");
        }
      }

      if (form.contraseña_nueva.trim()) {
        if (!form.confirmar_contraseña.trim()) {
          throw new Error("Escribe tu contraseña actual para cambiarla.");
        }

        const passwordRes = await fetch(`${API_URL}/users/cambiar-contrasena`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: form.role,
            user_id: Number(form.user_id),
            contraseña_actual: form.confirmar_contraseña,
            contraseña_nueva: form.contraseña_nueva,
          }),
        });

        const passwordData = await passwordRes.json().catch(() => ({}));
        if (!passwordRes.ok) {
          throw new Error(passwordData.detail || "No fue posible cambiar la contraseña");
        }
      }

      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="config-page">
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
                <div className="form-group">
                  <label htmlFor="nombre">Nombre completo</label>
                  <input id="nombre" name="nombre" value={form.nombre} onChange={onChange} placeholder="Nombre completo" />
                </div>

                <div className="form-group">
                  <label htmlFor="rol">Rol</label>
                  <input id="rol" value={role} readOnly />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="correo">Correo electrónico</label>
                  <input id="correo" name="correo" type="email" value={form.correo} onChange={onChange} placeholder="aprendiz.prueba@sena.edu.co" />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="contraseña_nueva">Nueva contraseña</label>
                  <input
                    id="contraseña_nueva"
                    name="contraseña_nueva"
                    type="password"
                    value={form.contraseña_nueva}
                    onChange={onChange}
                    placeholder="Deja vacío si no quieres cambiarla"
                  />
                </div>

                <div className="form-group full-width divider">
                  <label htmlFor="confirmar_contraseña">Confirma tu contraseña actual</label>
                  <input
                    id="confirmar_contraseña"
                    name="confirmar_contraseña"
                    type="password"
                    value={form.confirmar_contraseña}
                    onChange={onChange}
                    placeholder="Necesaria para guardar cualquier cambio"
                  />
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

