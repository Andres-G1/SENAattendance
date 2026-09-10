import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";
import senaLogo from "./assets/Senalogo.png";

export default function MiPerfil() {
  const role = localStorage.getItem("role") || "Aprendiz";
  const userId = localStorage.getItem("user_id") || "1";
  const dashboardPath = role === "Aprendiz" ? "/aprendiz" : role === "Instructor" ? "/instructor" : "/administrador";
  const [menuOpen, setMenuOpen] = useState(false);

  const profileByRole = {
    Aprendiz: {
      name: localStorage.getItem("user_name") || "Sebastian Ramirez",
      document: "CC",
      email: "aprendiz.prueba@sena.edu.co",
      record: "Sin ficha",
    },
    Instructor: {
      name: "Carlos Gomez",
      document: "CC",
      email: "instructor.prueba@sena.edu.co",
      record: "Sin ficha",
    },
    Coordinador: {
      name: "Laura Martinez",
      document: "CC",
      email: "admin.prueba@sena.edu.co",
      record: "Sin ficha",
    },
  };

  const profile = profileByRole[role] || profileByRole.Aprendiz;
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const menuItems = [
    { label: "Mi Perfil", icon: "👤", to: "/config/perfil" },
    { label: "Configuración", icon: "⚙️", to: "/config/modulo_config" },
    { label: "Cerrar sesión", icon: "⎋", to: "/", danger: true },
  ];

  return (
    <main className="config-page profile-page">
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
                <span className="user-name">{profile.name.split(" ")[0]}</span>
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
                        if (item.danger) localStorage.clear();
                      }}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="avatar-round">{initials[0]}</div>
          </div>
        </header>

        <div className="profile-shell">
          <section className="profile-card">
            <div className="profile-heading">
              <div className="profile-avatar">{initials}</div>
              <div>
                <h1>Mi perfil</h1>
                <p>Aquí puedes revisar tus datos principales y tu información de acceso.</p>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-data">
                <span>Nombre completo</span>
                <strong>{profile.name}</strong>
              </div>
              <div className="profile-data">
                <span>Tipo de documento</span>
                <strong>{profile.document}</strong>
              </div>
              <div className="profile-data">
                <span>Correo electrónico</span>
                <strong>{profile.email}</strong>
              </div>
              <div className="profile-data">
                <span>Ficha o token</span>
                <strong>{profile.record}</strong>
              </div>
            </div>

            <div className="profile-actions">
              <Link className="profile-update-button" to={`/config/modulo_config?user=${userId}`}>
                Actualizar datos
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
