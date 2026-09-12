import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CuentaNavbar from "./components/CuentaNavbar";
import "./styles/Configuracion.css";

const dashboardByRole = {
  aprendiz: "/aprendiz",
  instructor: "/instructor",
  coordinador: "/administrador",
  administrador: "/administrador",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function MiPerfil() {
  const role = localStorage.getItem("role") || "Usuario";
  const userId = localStorage.getItem("user_id") || "-";
  const firstName = localStorage.getItem("firstName") || "Usuario";
  const dashboard = dashboardByRole[role.toLowerCase()] || "/";
  const initials = firstName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const [profile, setProfile] = useState({
    nombreCompleto: firstName,
    correo: "Información de contacto",
    documento: "CC",
    numero: "-",
    ficha: "Sin ficha",
  });

  useEffect(() => {
    if (!userId || userId === "-") return;
    const rolePath = role.toLowerCase() === "coordinador" ? "administrador" : role.toLowerCase();
    fetch(`${API_URL}/usuarios/${rolePath}/${userId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        const nom = data.Nom_Apr || data.Nom_Ins || data.Nom_Adm || firstName;
        const ape = data.Ape_Apr || data.Ape_Ins || data.Ape_Adm || "";
        setProfile({
          nombreCompleto: ape ? `${nom} ${ape}` : nom,
          correo: data.Cor_Apr || data.Cor_Ins || data.Cor_Adm || "Información de contacto",
          documento: data.Tip_ide_Apr || data.Tip_ide_Ins || data.Tip_ide_Adm || "CC",
          numero: data.Num_ide_Apr || data.Num_ide_Ins || data.Num_ide_Adm || "-",
          ficha: data.Num_Fic || "Sin ficha",
        });
      })
      .catch(() => {});
  }, [role, userId, firstName]);

  return (
    <div className="account-page">
      <CuentaNavbar role={role} name={firstName} />
      <main className="config-page">
      <section className="config-card profile-card">
        <header className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2>Mi perfil</h2>
            <p className="config-description">Aquí puedes revisar tus datos principales y tu información de acceso.</p>
          </div>
        </header>

        <div className="profile-details" aria-label="Datos del perfil">
          <div><span>Nombre completo</span><strong>{profile.nombreCompleto}</strong></div>
          <div><span>Tipo de documento</span><strong>{profile.documento}</strong></div>
          <div><span>Correo electrónico</span><strong>{profile.correo}</strong></div>
          <div><span>Número de identificación</span><strong>{profile.numero}</strong></div>
          {role.toLowerCase() === "aprendiz" && (
            <div><span>Ficha o token</span><strong>{profile.ficha}</strong></div>
          )}
        </div>

        <div className="profile-actions profile-actions-end">
          <Link className="config-action" to="/config/modulo_config">
            Actualizar datos
          </Link>
        </div>
        <Link className="profile-back-link" to={dashboard}>Volver al inicio</Link>
      </section>
      </main>
    </div>
  );
}
