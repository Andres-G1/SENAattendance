import { useState } from "react";
import { Link } from "react-router-dom";
import "./configuracion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function RecuperarContrasena() {
  const [form, setForm] = useState({ typeid: "", id: "", correo: "", contraseña_nueva: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/recuperar-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: Number(form.id) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "No fue posible recuperar la contraseña");
      setSuccess(data.detail);
      setForm({ typeid: "", id: "", correo: "", contraseña_nueva: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="config-page">
      <section className="config-card">
        <p className="config-eyebrow">Acceso a la cuenta</p>
        <h2>Recuperar contraseña</h2>
        <p className="config-description">Confirma tus datos para establecer una nueva contraseña.</p>
        <form onSubmit={onSubmit} className="config-form">
          <label>Tipo de documento
            <select name="typeid" value={form.typeid} onChange={onChange} required>
              <option value="" disabled>Selecciona una opción</option>
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="PEP">PEP</option>
              <option value="PPT">Permiso por protección temporal (PPT)</option>
            </select>
          </label>
          <label>Número de documento<input name="id" type="number" value={form.id} onChange={onChange} placeholder="Número de documento" required /></label>
          <label>Correo electrónico<input name="correo" type="email" value={form.correo} onChange={onChange} placeholder="correo@ejemplo.com" required /></label>
          <label>Nueva contraseña<input name="contraseña_nueva" type="password" value={form.contraseña_nueva} onChange={onChange} placeholder="Ingresa una nueva contraseña" required /></label>
          <button type="submit" disabled={loading}>{loading ? "Validando..." : "Recuperar contraseña"}</button>
        </form>
        {error ? <p className="form-message form-error">{error}</p> : null}
        {success ? <p className="form-message form-success">{success}</p> : null}
        <Link className="back-link" to="/">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}