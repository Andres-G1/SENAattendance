import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CuentaNavbar from "./components/CuentaNavbar";
import "./styles/Configuracion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ActualizarPerfil() {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";
  const storedName = localStorage.getItem("firstName") || "";
  const roleLabel = storedRole === "coordinador" ? "Coordinador" : storedRole.charAt(0).toUpperCase() + storedRole.slice(1);
  const dashboardByRole = { aprendiz: "/aprendiz", instructor: "/instructor", coordinador: "/administrador", administrador: "/administrador" };
  const dashboard = dashboardByRole[storedRole] || "/";

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    nombre: storedName,
    apellido: "",
    correo: "",
    numero_identificacion: "",
    contraseña_actual: "",
    contraseña_nueva: "",
  });

  useEffect(() => {
    const rolePath = storedRole === "coordinador" ? "administrador" : storedRole;
    fetch(`${API_URL}/usuarios/${rolePath}/${storedUserId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        setForm((prev) => ({
          ...prev,
          nombre: data.Nom_Apr || data.Nom_Ins || data.Nom_Adm || prev.nombre,
          apellido: data.Ape_Apr || data.Ape_Ins || data.Ape_Adm || prev.apellido,
          correo: data.Cor_Apr || data.Cor_Ins || data.Cor_Adm || prev.correo,
          numero_identificacion: data.Num_ide_Apr || data.Num_ide_Ins || data.Num_ide_Adm || prev.numero_identificacion,
        }));
      })
      .catch(() => {});
  }, [storedRole, storedUserId]);
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
      const payload = {};
      if (form.nombre.trim()) payload.nombre = form.nombre.trim();
      if (form.apellido.trim()) payload.apellido = form.apellido.trim();
      if (form.correo.trim()) payload.correo = form.correo.trim();

      if (Object.keys(payload).length === 0 && !form.contraseña_nueva.trim()) {
        throw new Error("Debes enviar al menos un campo para actualizar");
      }

      if (Object.keys(payload).length > 0) {
        const path = `${API_URL}/users/${form.role}/${Number(form.user_id)}/perfil`;
        const res = await fetch(path, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(data.detail) ? "Error de validación" : data.detail;
          throw new Error(detail || "No fue posible actualizar perfil");
        }
      }

      if (form.contraseña_nueva.trim()) {
        const passwordResponse = await fetch(`${API_URL}/users/cambiar-contrasena`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: form.role, user_id: Number(form.user_id), contraseña_actual: form.contraseña_actual, contraseña_nueva: form.contraseña_nueva }),
        });
        const passwordData = await passwordResponse.json().catch(() => ({}));
        if (!passwordResponse.ok) throw new Error(passwordData.detail || "No fue posible cambiar la contraseña");
      }

      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <CuentaNavbar role={storedRole} name={storedName} />
      <main className="config-page">
      <section className="config-card config-card-edit">
        <header className="config-header">
          <div>
            <h2>Configuración de cuenta</h2>
            <p className="config-description">Actualiza tus datos de acceso con seguridad y claridad.</p>
          </div>
          <span className="role-badge">{roleLabel}</span>
        </header>

        <form onSubmit={onSubmit} className="config-form">
          <label>Nombre completo<input name="nombre" value={form.nombre} onChange={onChange} placeholder="Tu nombre" /></label>

          <label>Rol<input value={roleLabel} readOnly disabled /></label>

          <label>Número de identificación<input value={form.numero_identificacion} readOnly disabled /></label>

          <label className="config-field-wide">Correo electrónico<input name="correo" value={form.correo} onChange={onChange} placeholder="correo@ejemplo.com" type="email" /></label>

          <label className="config-field-wide">Nueva contraseña<input name="contraseña_nueva" type="password" value={form.contraseña_nueva} onChange={onChange} placeholder="Deja vacío si no quieres cambiarla" /></label>

          <label className="config-field-wide">Confirma tu contraseña actual<input name="contraseña_actual" type="password" value={form.contraseña_actual} onChange={onChange} placeholder="Necesaria para guardar cualquier cambio" /></label>

          <div className="config-actions config-field-wide">
            <Link className="config-cancel" to={dashboard}>Cancelar</Link>
            <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</button>
          </div>
        </form>

        {error ? <p className="form-message form-error">{error}</p> : null}
        {success ? <p className="form-message form-success">{success}</p> : null}

        <Link className="back-link" to="/">Volver al inicio de sesión</Link>
      </section>
      </main>
    </div>
  );
}