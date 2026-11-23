import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/boton-flotante-logo.css";

/* Rutas donde no se muestra el botón (login y recuperación) */
const RUTAS_OCULTAS = ["/", "/password"];

/* PDFs de las guías (carpeta frontend/public/guias) */
const GUIA_GENERAL = "/guias/1_Inicio_de_sesion_y_cuenta.pdf";
const GUIAS_POR_ROL = {
  Coordinador: "/guias/2_Rol_Coordinador.pdf",
  Instructor: "/guias/3_Rol_Instructor.pdf",
  Aprendiz: "/guias/4_Rol_Aprendiz.pdf",
};

export default function BotonFlotanteLogo() {
  const location = useLocation();
  const guiaRol = GUIAS_POR_ROL[localStorage.getItem("role")];
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  /* Cerrar el menú al cambiar de página */
  useEffect(() => {
    setAbierto(false);
  }, [location.pathname]);

  /* Cerrar al hacer clic fuera o al presionar Escape */
  useEffect(() => {
    if (!abierto) return;

    const alHacerClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    const alPresionarTecla = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  if (RUTAS_OCULTAS.includes(location.pathname)) return null;

  return (
    <div className="boton-flotante-contenedor" ref={contenedorRef}>
      {/* Guía general: igual para los 3 roles */}
      <a
        href={GUIA_GENERAL}
        target="_blank"
        rel="noopener noreferrer"
        className={`boton-flotante-opcion ${abierto ? "visible" : ""}`}
        tabIndex={abierto ? 0 : -1}
        aria-hidden={!abierto}
      >
        <span className="boton-flotante-opcion-circulo">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </span>
        <span className="boton-flotante-opcion-texto">
          Inicio de sesión y cuenta
        </span>
      </a>

      {/* Guía según el rol del usuario */}
      {guiaRol && (
        <a
          href={guiaRol}
          target="_blank"
          rel="noopener noreferrer"
          className={`boton-flotante-opcion ${abierto ? "visible" : ""}`}
          tabIndex={abierto ? 0 : -1}
          aria-hidden={!abierto}
        >
          <span className="boton-flotante-opcion-circulo">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
              <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className="boton-flotante-opcion-texto">
            Guía de funcionamiento
          </span>
        </a>
      )}

      <button
        type="button"
        className={`boton-flotante-logo ${abierto ? "activo" : ""}`}
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="SENA Attendance"
        aria-expanded={abierto}
        title="SENA Attendance"
      >
        <img src="/Logoblanco.png" alt="Logo SENA Attendance" />
      </button>
    </div>
  );
}
