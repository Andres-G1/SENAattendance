import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/Login.css";

export default function Login({ onLoginSuccess }) {
  const [typeid, setTypeid] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(typeid, Number(id), password);

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("firstName", data.firstName);

      if (onLoginSuccess) onLoginSuccess(data);

      navigate(data.redirect);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(err.response.data.detail || "Credenciales inválidas");
      } else {
        setError("Error al conectar con el servidor");
      }
    }
  };

  return (
    <div className="Login_container">
      <nav className="login-navbar">
        <div className="nav-links">
          <a href="/" style={{ color: "rgb(0, 201, 90)" }}>Inicio</a>
          <a href="/users/password">Recuperar contraseña</a>
        </div>
        <div className="titulo">
          <img
            src="/Senalogo.png"
            alt="Logo SENA"
            width="50"
            height="50"
          />
        </div>
      </nav>

      <form className="formulario_login" onSubmit={handleSubmit}>
        <select
          className="input-login"
          name="typeid"
          value={typeid}
          onChange={(e) => setTypeid(e.target.value)}
          required
        >
          <option value="" disabled>Tipo de documento</option>
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
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        <div style={{ position: "relative", width: "100%" }}>
          <input
            className="input-login"
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", paddingRight: "2.5rem" }}
          />

          <button
            type="button"
            onClick={() => setMostrarPassword((prev) => !prev)}
            aria-label={
              mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            style={{
              position: "absolute",
              left: "clamp(2rem, 70vw, 27.75rem)",
              top: "41%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            {mostrarPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}