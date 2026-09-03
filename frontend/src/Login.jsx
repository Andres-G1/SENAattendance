import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import senaLogo from "./assets/Senalogo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ typeid: "", id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = Array.isArray(data.detail)
          ? "Error de validación en datos"
          : data.detail;
        throw new Error(detail || "Credenciales inválidas");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user_id", String(data.user_id));
      navigate(data.redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Login_container">
      <nav className="login-navbar">
        <div className="nav-links">
          <Link to="/" style={{ color: "rgb(0, 201, 90)" }}>
            Inicio
          </Link>
          <Link to="/recuperar-contrasena">Recuperar contraseña</Link>
        </div>
        <div className="titulo">
          <img
            src={senaLogo}
            alt="Logo SENA"
            width="40"
            height="40"
          />
        </div>
      </nav>

      <form className="formulario_login" onSubmit={handleSubmit}>
        <select
          className="input-login"
          name="typeid"
          value={form.typeid}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Tipo de documento
          </option>
          <option value="CC">Cédula de Ciudadanía (CC)</option>
          <option value="TI">Tarjeta de Identidad (TI)</option>
          <option value="CE">Cédula de Extranjería (CE)</option>
          <option value="PEP">PEP</option>
          <option value="PPT">Permiso por protección temporal (PPT)</option>
        </select>

        <input
          className="input-login"
          type="text"
          placeholder="Documento de identidad"
          required
          name="id"
          value={form.id}
          onChange={handleChange}
        />

        <input
          className="input-login"
          type="password"
          placeholder="Contraseña"
          required
          name="password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Login"}
        </button>
      </form>
    </div>
  );
}
