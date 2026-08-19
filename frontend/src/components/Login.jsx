import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/Login.css";

export default function Login({ onLoginSuccess }) {
  const [typeid, setTypeid] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
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

        <input
          className="input-login"
          type="password"
          placeholder="Contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}