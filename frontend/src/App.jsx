import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import RutaProtegida from "./components/RutaProtegida";
import "./hooks/useCurrentDate"
import AprendizDashboard from "./pages/AprendizDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdministradorDashboard from "./pages/AdministradorDashboard";

import ConfigCarrera from "./pages/Carrera/ConfigCarrera"; 
import CreateC from "./pages/Carrera/Create";
import EditC from "./pages/Carrera/Edit";
import DeleteC from "./pages/Carrera/Delete";

import ConfigFicha from "./pages/Ficha/ConfigFicha";
import CreateF from "./pages/Ficha/Create";
import EditF from "./pages/Ficha/Edit";
import DeleteF from "./pages/Ficha/Delete";
import SubirArchivosMenu from "./pages/CargaArchivos/SubirArchivosMenu";
import AsignarFicha from "./pages/Ficha/AsignarFicha"; // nuevo componente, lo puso Maday

// Gestión de aprendices (coordinador)
import Aprendices from "./pages/Coordinador/Aprendiz";
import CrearAprendiz from "./pages/Coordinador/Create";
import EditarAprendiz from "./pages/Coordinador/Edit";
import ConfirmarAprendiz from "./pages/Coordinador/ConfirmarAprendiz";

// Gestion de Instructores (Coordinador)
import Instructores from "./pages/Coordinador/Instructores";
import CrearInstructor from "./pages/Coordinador/CrearInstructor";
import EditarInstructor from "./pages/Coordinador/EditarInstructor";
import ConfirmarInstructor from "./pages/Coordinador/ConfirmarInstructor";

// Gestión de administradores (coordinador)
import Administradores from "./pages/Coordinador/Administradores";
import CrearAdministrador from "./pages/Coordinador/CrearAdministrador";
import EditarAdministrador from "./pages/Coordinador/EditarAdministrador";
import ConfirmarAdministrador from "./pages/Coordinador/ConfirmarAdministrador";

// Gestión de Competencias
import ConfigCompetencia from "./pages/Competencias/ConfigCompetencias";
import CreateCompetencia from "./pages/Competencias/Create";
import EditCompetencia from "./pages/Competencias/Edit";
import ConfirmarCompetencia from "./pages/Competencias/ConfirmarCompetencias";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/aprendiz"
          element={
            <RutaProtegida rolPermitido="Aprendiz">
              <AprendizDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/instructor"
          element={
            <RutaProtegida rolPermitido="Instructor">
              <InstructorDashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AdministradorDashboard />
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

        {/* NUEVA RUTA: Agregada con protección de rol para el menú de subida que te pidió Sebas */}
        <Route
          path="/fichas/subir-archivos"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <SubirArchivosMenu />
            </RutaProtegida>
          }
        />

        {/* Asignación de fichas a instructores */}
        <Route
          path="/fichas/asignar"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AsignarFicha />
            </RutaProtegida>
          }
        />

        {/* Gestión de aprendices */}
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
          path="/administrador/aprendices/activar/:id"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <ConfirmarAprendiz />
            </RutaProtegida>
          }
        />

        {/* Gestión de instructores */}
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

        {/* Gestión de administradores */}
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

        {/* Gestión de competencias */}
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

        {/* cualquier ruta desconocida vuelve al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;