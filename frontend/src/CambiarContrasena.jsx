import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CambiarContrasena() {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    contraseña_actual: "",
    contraseña_nueva: "",
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
      }));
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
        <h2>Cambiar contraseña</h2>
        <p className="config-description">
        Usa los mismos datos del usuario que inició sesión.
        </p>

        <div className="session-details" aria-label="Datos de sesión">
        <input
          name="role"
          value={form.role}
          readOnly
          aria-label="Rol"
        />
        <input
          name="user_id"
          value={form.user_id}
          readOnly
          aria-label="Identificador de usuario"
        />
        </div>

        <form onSubmit={onSubmit} className="config-form">
          <label>Contraseña actual<input type="password" name="contraseña_actual" value={form.contraseña_actual} onChange={onChange} placeholder="Ingresa tu contraseña actual" required /></label>

          <label>Nueva contraseña<input type="password" name="contraseña_nueva" value={form.contraseña_nueva} onChange={onChange} placeholder="Ingresa una nueva contraseña" required /></label>

          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Actualizar contraseña"}</button>
        </form>

        {error ? <p className="form-message form-error">{error}</p> : null}
        {success ? <p className="form-message form-success">{success}</p> : null}

        <Link className="back-link" to="/">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}
