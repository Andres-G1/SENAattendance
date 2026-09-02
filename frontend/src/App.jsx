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

// Gestión de aprendices (coordinador)
import Aprendices from "./pages/Coordinador/Aprendiz";
import CrearAprendiz from "./pages/Coordinador/Create";
import EditarAprendiz from "./pages/Coordinador/Edit";
// Gestion de Instructores (Coordinador)
import Instructores from "./pages/Coordinador/Instructores";
import CrearInstructor from "./pages/Coordinador/CrearInstructor";
import EditarInstructor from "./pages/Coordinador/EditarInstructor";

// Gestión de administradores (coordinador)
import Administradores from "./pages/Coordinador/Administradores";
import CrearAdministrador from "./pages/Coordinador/CrearAdministrador";
import EditarAdministrador from "./pages/Coordinador/EditarAdministrador";

// Gestión de Competencias
import ConfigCompetencia from "./pages/Competencias/ConfigCompetencias";
import CreateCompetencia from "./pages/Competencias/Create";
import EditCompetencia from "./pages/Competencias/Edit";

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

        {/* cualquier ruta desconocida vuelve al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;