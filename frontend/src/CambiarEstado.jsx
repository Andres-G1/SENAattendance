import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CambiarEstado() {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        activo: Boolean(form.activo),
      };

      const res = await fetch(`${API_URL}/users/cambiar-estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = Array.isArray(data.detail) ? "Error de validación" : data.detail;
        throw new Error(detail || "No fue posible cambiar el estado");
      }

      setSuccess(data.detail || "Estado actualizado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Cambiar estado de cuenta</h2>

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

        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            name="activo"
            type="checkbox"
            checked={form.activo}
            onChange={onChange}
          />
          Activo
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Cambiar estado"}
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
