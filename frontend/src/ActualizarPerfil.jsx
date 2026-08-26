import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div style={{ maxWidth: 460, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Actualizar perfil</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <input
          name="role"
          value={form.role}
          onChange={onChange}
          placeholder="role (instructor/aprendiz/coordinador)"
          required
        />

        <input
          name="user_id"
          value={form.user_id}
          onChange={onChange}
          placeholder="user_id"
          required
        />

        <input
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          placeholder="nombre"
        />

        <input
          name="apellido"
          value={form.apellido}
          onChange={onChange}
          placeholder="apellido"
        />

        <input
          name="correo"
          value={form.correo}
          onChange={onChange}
          placeholder="correo"
          type="email"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar perfil"}
        </button>
      </form>

      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
      {success ? <p style={{ color: "#126c2f" }}>{success}</p> : null}

      <p>
        <Link to="/">Volver a login</Link>
      </p>
    </div>
  );
}
