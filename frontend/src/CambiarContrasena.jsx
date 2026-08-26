import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div style={{ maxWidth: 460, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Cambiar contraseña</h2>
      <p style={{ marginTop: 0 }}>
        Usa los mismos datos del usuario que inició sesión.
      </p>

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
          type="password"
          name="contraseña_actual"
          value={form.contraseña_actual}
          onChange={onChange}
          placeholder="contraseña_actual"
          required
        />

        <input
          type="password"
          name="contraseña_nueva"
          value={form.contraseña_nueva}
          onChange={onChange}
          placeholder="contraseña_nueva"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Cambiar contraseña"}
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
