import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ActualizarPerfil() {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    nombre: "",
    apellido: "",
    correo: "",
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
      const payload = {};
      if (form.nombre.trim()) payload.nombre = form.nombre.trim();
      if (form.apellido.trim()) payload.apellido = form.apellido.trim();
      if (form.correo.trim()) payload.correo = form.correo.trim();

      if (Object.keys(payload).length === 0) {
        throw new Error("Debes enviar al menos un campo para actualizar");
      }

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

      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="config-page">
      <section className="config-card">
        <p className="config-eyebrow">Configuración de cuenta</p>
        <h2>Actualizar perfil</h2>
        <p className="config-description">Actualiza la información del usuario que inició sesión.</p>

        <div className="session-details" aria-label="Datos de sesión">
          <span>Cuenta autenticada</span>
          <span>Datos protegidos</span>
        </div>

        <form onSubmit={onSubmit} className="config-form">
          <label>Nombre<input name="nombre" value={form.nombre} onChange={onChange} placeholder="Tu nombre" /></label>

          <label>Apellido<input name="apellido" value={form.apellido} onChange={onChange} placeholder="Tu apellido" /></label>

          <label>Correo electrónico<input name="correo" value={form.correo} onChange={onChange} placeholder="correo@ejemplo.com" type="email" /></label>

          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</button>
        </form>

        {error ? <p className="form-message form-error">{error}</p> : null}
        {success ? <p className="form-message form-success">{success}</p> : null}

        <Link className="back-link" to="/">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}