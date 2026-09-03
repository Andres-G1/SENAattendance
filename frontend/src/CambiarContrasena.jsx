import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CambiarContrasena() {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const storedUserId = localStorage.getItem("user_id") || "";

  const [form, setForm] = useState({
    role: storedRole,
    user_id: storedUserId,
    correo: "",
    contraseña_actual: "",
    contraseña_nueva: "",
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (!storedRole || !storedUserId) return;
    fetch(`${API_URL}/users/${storedRole}/${Number(storedUserId)}/perfil`)
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
        setForm((previous) => ({ ...previous, correo: data.correo || "" }));
      })
      .catch(() => setProfile(null));
  }, [storedRole, storedUserId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!form.correo.trim() && !form.contraseña_nueva.trim()) {
        throw new Error("Debes indicar un correo o una nueva contraseña");
      }

      const passwordPayload = {
        role: form.role,
        user_id: Number(form.user_id),
        contraseña_actual: form.contraseña_actual,
        contraseña_nueva: form.contraseña_nueva,
      };

      if (form.contraseña_nueva.trim()) {
        const passwordResponse = await fetch(`${API_URL}/users/cambiar-contrasena`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passwordPayload),
        });
        const passwordData = await passwordResponse.json().catch(() => ({}));
        if (!passwordResponse.ok) {
          throw new Error(passwordData.detail || "No fue posible cambiar la contraseña");
        }
      }

      if (form.correo.trim()) {
        const profileResponse = await fetch(
          `${API_URL}/users/${form.role}/${Number(form.user_id)}/perfil`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: form.correo.trim() }),
          },
        );
        const profileData = await profileResponse.json().catch(() => ({}));
        if (!profileResponse.ok) {
          throw new Error(profileData.detail || "No fue posible actualizar el correo");
        }
      }

      setSuccess("Datos actualizados correctamente");
      setForm((prev) => ({
        ...prev,
        correo: "",
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
        <h2>Datos de acceso</h2>
        <p className="config-description">
          Actualiza tu correo o contraseña de forma segura.
        </p>

        <div className="session-details" aria-label="Datos de sesión">
          <span>{profile?.tipo_documento || "Tipo de documento"}</span>
          <span>{profile?.numero_documento || "Número de documento"}</span>
        </div>

        <form onSubmit={onSubmit} className="config-form">
          <label>Correo electrónico<input type="email" name="correo" value={form.correo} onChange={onChange} placeholder="Deja vacío si no deseas cambiarlo" /></label>

          <label>Nueva contraseña<input type="password" name="contraseña_nueva" value={form.contraseña_nueva} onChange={onChange} placeholder="Deja vacío si no deseas cambiarla" /></label>

          <label>Contraseña actual<input type="password" name="contraseña_actual" value={form.contraseña_actual} onChange={onChange} placeholder="Necesaria para guardar cambios" required /></label>

          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</button>
        </form>

        {error ? <p className="form-message form-error">{error}</p> : null}
        {success ? <p className="form-message form-success">{success}</p> : null}

        <Link className="back-link" to="/">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}
