import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import PantallaCarga from "./components/PantallaCarga";
import Footer from "./components/footer/Footer.jsx";
import Login from "./components/Login";
import PasswordRecovery from "./components/PasswordRecovery";
import RutaProtegida from "./components/RutaProtegida";
import "./hooks/useCurrentDate";

/* ==============================
   PÁGINAS (carga perezosa)
============================== */
const AprendizDashboard = lazy(() => import("./pages/AprendizDashboard"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const AdministradorDashboard = lazy(() => import("./pages/AdministradorDashboard"));

const InstructorAsistenciaRevisar = lazy(() => import("./pages/Instructor/InstructorAsistenciaRevisar"));
const InstructorAsistencia = lazy(() => import("./pages/Instructor/InstructorAsistencia"));

const ConfigCarrera = lazy(() => import("./pages/Carrera/ConfigCarrera"));
const CreateC = lazy(() => import("./pages/Carrera/Create"));
const EditC = lazy(() => import("./pages/Carrera/Edit"));
const DeleteC = lazy(() => import("./pages/Carrera/Delete"));

const AsignarAprendiz = lazy(() => import("./pages/Ficha/AsignarAprendiz.jsx"));
const ConfigFicha = lazy(() => import("./pages/Ficha/ConfigFicha"));
const CreateF = lazy(() => import("./pages/Ficha/Create"));
const EditF = lazy(() => import("./pages/Ficha/Edit"));
const DeleteF = lazy(() => import("./pages/Ficha/Delete"));
const AsignarFicha = lazy(() => import("./pages/Ficha/AsignarFicha"));

const CargaUsuarios = lazy(() => import("./pages/Coordinador/CargaUsuarios"));
const CargarAdministradores = lazy(() => import("./pages/Coordinador/CargarAdministradores"));
const CargarInstructores = lazy(() => import("./pages/Coordinador/CargarInstructores"));
const CargarAprendices = lazy(() => import("./pages/Coordinador/CargarAprendices"));
const SubirArchivosMenu = lazy(() => import("./pages/CargaArchivos/SubirArchivosMenu"));

const Aprendices = lazy(() => import("./pages/Coordinador/Aprendiz"));
const CrearAprendiz = lazy(() => import("./pages/Coordinador/Create"));
const EditarAprendiz = lazy(() => import("./pages/Coordinador/Edit"));
const ConfirmarAprendiz = lazy(() => import("./pages/Coordinador/ConfirmarAprendiz"));

const Instructores = lazy(() => import("./pages/Coordinador/Instructores"));
const CrearInstructor = lazy(() => import("./pages/Coordinador/CrearInstructor"));
const EditarInstructor = lazy(() => import("./pages/Coordinador/EditarInstructor"));
const ConfirmarInstructor = lazy(() => import("./pages/Coordinador/ConfirmarInstructor"));

const Administradores = lazy(() => import("./pages/Coordinador/Administradores"));
const CrearAdministrador = lazy(() => import("./pages/Coordinador/CrearAdministrador"));
const EditarAdministrador = lazy(() => import("./pages/Coordinador/EditarAdministrador"));
const ConfirmarAdministrador = lazy(() => import("./pages/Coordinador/ConfirmarAdministrador"));

const ConfigCompetencia = lazy(() => import("./pages/Competencias/ConfigCompetencias"));
const CreateCompetencia = lazy(() => import("./pages/Competencias/Create"));
const EditCompetencia = lazy(() => import("./pages/Competencias/Edit"));
const ConfirmarCompetencia = lazy(() => import("./pages/Competencias/ConfirmarCompetencias"));

const ActualizarPerfil = lazy(() => import("./ActualizarPerfl"));
const MiPerfil = lazy(() => import("./MiPerfil"));

/* ==============================
   RUTAS SIN PANTALLA DE CARGA
   (login y recuperación de contraseña)
============================== */
const RUTAS_SIN_CARGA = ["/", "/password"];

/* ==============================
   PANTALLA DE CARGA EN CADA RUTA
   (ms = duración en milisegundos)
============================== */
function CargaPorRuta({ children, ms = 1000 }) {
  const location = useLocation();
  const sinCarga = RUTAS_SIN_CARGA.includes(location.pathname);
  const [cargando, setCargando] = useState(!sinCarga);

  useEffect(() => {
    if (sinCarga) {
      setCargando(false);
      return;
    }

    setCargando(true);
    const temporizador = setTimeout(() => setCargando(false), ms);
    return () => clearTimeout(temporizador);
  }, [location.pathname, ms, sinCarga]);

  return (
    <>
      {cargando && !sinCarga && <PantallaCarga texto="Cargando..." />}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* CONTENEDOR GENERAL */}
      <div className="d-flex flex-column min-vh-100">
        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-grow-1">
          <Suspense fallback={<PantallaCarga texto="Cargando..." />}>
            <CargaPorRuta>
              <Routes>
                {/* LOGIN */}
                <Route path="/" element={<Login />} />

                <Route path="/password" element={<PasswordRecovery />} />

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
                <Route
                  path="/instructor/revisar-asistencia"
                  element={
                    <RutaProtegida rolPermitido="Instructor">
                      <InstructorAsistenciaRevisar />
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
                  path="/fichas/AsignarAprendiz"
                  element={
                    <RutaProtegida rolPermitido="Coordinador">
                      <AsignarAprendiz />
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

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CargaPorRuta>
          </Suspense>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;