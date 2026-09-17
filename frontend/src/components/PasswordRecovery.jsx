import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recoverPassword } from "../services/api";
import "../styles/Login.css";

export default function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

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
    setMensaje("");
    setLoading(true);

    try {
      // ENVIAMOS EL CORREO COMO OBJETO: { email: "..." }
      await recoverPassword({ email });

      setMensaje(
        "Si el correo está registrado, recibirás una contraseña temporal en unos minutos."
      );

      setEmail("");
    } catch (err) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "No fue posible procesar la solicitud."
        );
      } else {
        setError(
          "Error al conectar con el servidor (" +
            (err.message || "red") +
            ")"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Login_container">
      <nav className="login-navbar">
        <div className="nav-links">
          <a href="/">Inicio</a>

          <a
            href="/password"
            style={{ color: "rgb(0, 201, 90)" }}
          >
            Recuperar contraseña
          </a>
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

      <div className="password-recovery-content">
        <p>
          Digite su correo{" "}
          <span style={{ color: "rgb(0, 129, 32)" }}>
            electrónico
          </span>
          , para solicitar una nueva contraseña.
        </p>

        <form
          className="formulario_login"
          onSubmit={handleSubmit}
        >
          <input
            className="input-login"
            type="email"
            placeholder="Correo@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="login-success">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
