import { useEffect } from 'react'; // <-- AGREGADO: Importamos useEffect para el cronómetro
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Footer from "./components/footer/Footer.jsx";
import Login from "./components/Login";
import RutaProtegida from "./components/RutaProtegida";
import "./hooks/useCurrentDate"
import AprendizDashboard from "./pages/AprendizDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdministradorDashboard from "./pages/AdministradorDashboard";
import InstructorAsistencia from "./pages/Instructor/InstructorAsistencia";
import ConfigCarrera from "./pages/Carrera/ConfigCarrera";
import CreateC from "./pages/Carrera/Create";
import EditC from "./pages/Carrera/Edit";
import DeleteC from "./pages/Carrera/Delete";
import ConfigFicha from "./pages/Ficha/ConfigFicha";
import CreateF from "./pages/Ficha/Create";
import EditF from "./pages/Ficha/Edit";
import DeleteF from "./pages/Ficha/Delete";
import CargaUsuarios from "./pages/Coordinador/CargaUsuarios";
import CargarAdministradores from "./pages/Coordinador/CargarAdministradores";
import CargarInstructores from "./pages/Coordinador/CargarInstructores";
import CargarAprendices from "./pages/Coordinador/CargarAprendices";
import SubirArchivosMenu from "./pages/CargaArchivos/SubirArchivosMenu";
import AsignarFicha from "./pages/Ficha/AsignarFicha";
import Aprendices from "./pages/Coordinador/Aprendiz";
import CrearAprendiz from "./pages/Coordinador/Create";
import EditarAprendiz from "./pages/Coordinador/Edit";
import ConfirmarAprendiz from "./pages/Coordinador/ConfirmarAprendiz";
import Instructores from "./pages/Coordinador/Instructores";
import CrearInstructor from "./pages/Coordinador/CrearInstructor";
import EditarInstructor from "./pages/Coordinador/EditarInstructor";
import ConfirmarInstructor from "./pages/Coordinador/ConfirmarInstructor";
import Administradores from "./pages/Coordinador/Administradores";
import CrearAdministrador from "./pages/Coordinador/CrearAdministrador";
import EditarAdministrador from "./pages/Coordinador/EditarAdministrador";
import ConfirmarAdministrador from "./pages/Coordinador/ConfirmarAdministrador";
import ConfigCompetencia from "./pages/Competencias/ConfigCompetencias";
import CreateCompetencia from "./pages/Competencias/Create";
import EditCompetencia from "./pages/Competencias/Edit";
import ConfirmarCompetencia from "./pages/Competencias/ConfirmarCompetencias";
import ActualizarPerfil from "./ActualizarPerfl";
import MiPerfil from "./MiPerfil";

function App() {

  // =====================================================
  // GUARDIÁN SILENCIOSO DE EXPIRACIÓN EN VIVO
  // =====================================================
  useEffect(() => {
    const verificarExpiracionEnVivo = () => {
      const token = localStorage.getItem("access_token"); 
      if (!token) return;

      try {
        const partes = token.split('.');
        if (partes.length !== 3) return; 

        // Decodificamos el payload interno del JWT
        const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(payloadBase64));

        if (payload.exp) {
          const tiempoActual = Math.floor(Date.now() / 1000);
          
          // Margen de gracia automático (30 segundos) alineado con PyJWT
          const tiempoExpiracionReal = payload.exp + 30; 
          const segundosRestantes = tiempoExpiracionReal - tiempoActual;

          if (segundosRestantes <= 0) {
            ejecutarCierreDeSesion();
          } else {
            // Programa el cierre exacto en segundo plano
            const temporizador = setTimeout(() => {
              ejecutarCierreDeSesion();
            }, segundosRestantes * 1000);

            return () => clearTimeout(temporizador);
          }
        }
      } catch (error) {
        console.error("Error al validar el tiempo del token en segundo plano:", error);
      }
    };

    const ejecutarCierreDeSesion = () => {
      console.warn("Tiempo cumplido. Cerrando sesión de la plataforma del SENA...");
      localStorage.removeItem("access_token"); 
      
      // AJUSTADO: Apunta a la raíz (/) que es donde mapeas tu <Login />
      window.location.href = "/?expirado=true"; 
    };

    verificarExpiracionEnVivo();
  }, []); 

  // =====================================================
  // CONTINUACIÓN DE TU RENDER DE RUTAS (CON UN SÓLO RETURN)
  // =====================================================
return (
  <BrowserRouter>

  {/* CONTENEDOR GENERAL */}
  <div className="d-flex flex-column min-vh-100">

    {/* CONTENIDO PRINCIPAL */}
    <div className="flex-grow-1">

      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* ==============================
            APRENDIZ
        ============================== */}

        <Route
          path="/aprendiz"
          element={
            <RutaProtegida rolPermitido="Aprendiz">
              <AprendizDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/config/perfil"
          element={
            <RutaProtegida>
              <MiPerfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/config/porfile_users"
          element={
            <RutaProtegida>
              <MiPerfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/config/porfile_aprendiz"
          element={
            <RutaProtegida>
              <MiPerfil />
            </RutaProtegida>
          }
        />

        <Route
          path="/config/modulo_config"
          element={
            <RutaProtegida>
              <ActualizarPerfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/config/module_config"
          element={
            <RutaProtegida>
              <ActualizarPerfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/config/module_config_aprendiz"
          element={
            <RutaProtegida>
              <ActualizarPerfil />
            </RutaProtegida>
          }
        />


        {/* ==============================
            INSTRUCTOR
        ============================== */}

        <Route
          path="/instructor"
          element={
            <RutaProtegida rolPermitido="Instructor">
              <InstructorDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/instructor/asistencia"
          element={
            <RutaProtegida rolPermitido="Instructor">
              <InstructorAsistencia />
            </RutaProtegida>
          }
        />


        {/* ==============================
            ADMINISTRADOR
        ============================== */}

        <Route
          path="/administrador"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AdministradorDashboard />
            </RutaProtegida>
          }
        />

        {/* ==============================
            CARRERAS
        ============================== */}

        <Route
          path="/administrador/carga-usuarios"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CargaUsuarios />
            </RutaProtegida>
          }
        />
        <Route
          path="/administrador/carreras"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfigCarrera />
            </RutaProtegida>
          }
        />

        <Route
          path="/carreras/nueva"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CreateC />
            </RutaProtegida>
          }
        />

        <Route
          path="/carreras/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditC />
            </RutaProtegida>
          }
        />

        <Route
          path="/carreras/eliminar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <DeleteC />
            </RutaProtegida>
          }
        />


        {/* ==============================
            FICHAS
        ============================== */}

        <Route
          path="/administrador/fichas"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfigFicha />
            </RutaProtegida>
          }
        />

        <Route
          path="/fichas/nueva"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CreateF />
            </RutaProtegida>
          }
        />

        <Route
          path="/fichas/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditF />
            </RutaProtegida>
          }
        />

        <Route
          path="/fichas/eliminar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <DeleteF />
            </RutaProtegida>
          }
        />

        <Route
          path="/fichas/subir-archivos"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <SubirArchivosMenu />
            </RutaProtegida>
          }
        />

        <Route
          path="/fichas/asignar"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AsignarFicha />
            </RutaProtegida>
          }
        />


        {/* ==============================
            APRENDICES
        ============================== */}

        <Route
          path="/administrador/aprendices"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <Aprendices />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/aprendices/crear"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CrearAprendiz />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/aprendices/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditarAprendiz />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/aprendices/desactivar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarAprendiz />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/aprendices/cargar"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CargarAprendices />
            </RutaProtegida>
          }
        />
        <Route
          path="/administrador/administradores/cargar"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CargarAdministradores />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/aprendices/activar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarAprendiz />
            </RutaProtegida>
          }
        />


        {/* ==============================
            INSTRUCTORES
        ============================== */}

        <Route
          path="/administrador/instructores"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <Instructores />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/instructores/crear"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CrearInstructor />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/instructores/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditarInstructor />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/instructores/desactivar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarInstructor />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/instructores/activar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarInstructor />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/instructores/cargar"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CargarInstructores />
            </RutaProtegida>
          }
        />


        {/* ==============================
            ADMINISTRADORES
        ============================== */}

        <Route
          path="/administrador/administradores"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <Administradores />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/administradores/crear"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CrearAdministrador />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/administradores/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditarAdministrador />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/administradores/desactivar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarAdministrador />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador/administradores/activar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarAdministrador />
            </RutaProtegida>
          }
        />


        {/* ==============================
            COMPETENCIAS
        ============================== */}

        <Route
          path="/administrador/competencias"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfigCompetencia />
            </RutaProtegida>
          }
        />

        <Route
          path="/competencias/nueva"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CreateCompetencia />
            </RutaProtegida>
          }
        />

        <Route
          path="/competencias/editar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <EditCompetencia />
            </RutaProtegida>
          }
        />

        <Route
          path="/competencias/eliminar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarCompetencia />
            </RutaProtegida>
          }
        />


        {/* ==============================
            RUTA DESCONOCIDA
        ============================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </div>


    {/* ==============================
        FOOTER GLOBAL
    ============================== */}

    <Footer />

  </div>

</BrowserRouter>


);
}

export default App;