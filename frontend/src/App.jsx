import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import RutaProtegida from "./components/RutaProtegida";
import "./hooks/useCurrentDate"
import AprendizDashboard from "./pages/AprendizDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdministradorDashboard from "./pages/AdministradorDashboard";

import ConfigCarrera from "./pages/ConfigCarrera"; 
import CreateC from "./pages/Carrera/Create";
import EditC from "./pages/Carrera/Edit";
import DeleteC from "./pages/Carrera/Delete";

/*
import ConfigFicha from "./pages/ConfigFicha"; 
import CreateF from "./pages/Ficha/Create"; 
import EditF from "./pages/Ficha/Edit";
import DeleteF from "./pages/Ficha/Delete";
*/
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

        {/* cualquier ruta desconocida vuelve al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

        /*
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
        */  