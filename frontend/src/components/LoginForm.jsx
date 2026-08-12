import { useState } from "react";
import { iniciarSesion } from "../services/auth";
import "./login.css";

function LoginForm() {
  const [tipoIdentificacion, setTipoIdentificacion] = useState("");
  const [numIdentificacion, setNumIdentificacion] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await iniciarSesion(tipoIdentificacion, numIdentificacion, contrasena);
      setUsuario(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (usuario) {
    return (
      <div className="Login_container">
        <h2>
          Bienvenido, {usuario.nombre} {usuario.apellido} ({usuario.rol})
        </h2>
      </div>
    );
  }

  return (
    <div className="Login_container">
      <nav className="navbar">
        <div className="nav-links">
          <a href="/" style={{ color: "rgb(0, 201, 90)" }}>Inicio</a>
          <a href="/users/password">Recuperar contraseña</a>
        </div>
        <div className="titulo">
          <img
            src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
            alt="Logo SENA"
            width="40"
            height="40"
          />
        </div>
      </nav>

      <form className="formulario_login" onSubmit={handleSubmit}>
        <select
          className="input-login"
          style={{ width: "250px" }}
          value={tipoIdentificacion}
          onChange={(e) => setTipoIdentificacion(e.target.value)}
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
          value={numIdentificacion}
          onChange={(e) => setNumIdentificacion(e.target.value)}
          required
        />

        <input
          className="input-login"
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginForm;