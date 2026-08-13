import { useState } from "react";
import "./login.css";

const API_URL = "http://localhost:8000/inicio_sesion";

const TIPOS_IDENTIFICACION = [
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "TI", label: "Tarjeta de Identidad (TI)" },
  { value: "CE", label: "Cédula de Extranjería (CE)" },
  { value: "PEP", label: "PEP" },
  { value: "PPT", label: "Permiso por protección temporal (PPT)" },
];

const RUTA_POR_ROL = {
  aprendiz: "/aprendiz",
  instructor: "/instructor",
  administrador: "/coordinador",
};

export default function Login({ onLoginSuccess }) {
  const [tipoIdentificacion, setTipoIdentificacion] = useState("");
  const [numIdentificacion, setNumIdentificacion] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tipoIdentificacion || !numIdentificacion || !contraseña) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_identificacion: tipoIdentificacion,
          num_identificacion: Number(numIdentificacion),
          contraseña: contraseña,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.detail || "Credenciales incorrectas");
        return;
      }

      // El backend ya devuelve un token JWT en datos.token
      localStorage.setItem("token", datos.token);

      if (onLoginSuccess) {
        onLoginSuccess(datos);
      }

      window.location.href = RUTA_POR_ROL[datos.rol] || "/";
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="Login_container">
      <navbar>
        <div className="nav-links">
          <a href="/" style={{ color: "rgb(0, 201, 90)" }}>
            Inicio
          </a>
          <a href="/recuperar-contrasena">Recuperar contraseña</a>
        </div>
        <div className="titulo">
          <img
            src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
            alt="Logo SENA"
            width="40"
            height="40"
          />
        </div>
      </navbar>

      <form className="formulario_login" onSubmit={manejarSubmit}>
        <select
          className="input-login"
          style={{ width: "250px" }}
          value={tipoIdentificacion}
          onChange={(e) => setTipoIdentificacion(e.target.value)}
          required
        >
          <option value="" disabled>
            Tipo de documento
          </option>
          {TIPOS_IDENTIFICACION.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
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
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
        />

        {error && <p className="error-login">{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Login"}
        </button>
      </form>
    </div>
  );
}