import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import AprendizMenu from "./pages/AprendizMenu";
import InstructorMenu from "./pages/InstructorMenu";
import AdministradorMenu from "./pages/AdministradorMenu";
import RutaProtegida from "./components/RutaProtegida";

import Aprendices from "./pages/coordinador/aprendices";
import CrearAprendiz from "./pages/coordinador/crearaprendiz";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* APRENDIZ */}
        <Route
          path="/aprendiz"
          element={
            <RutaProtegida rolPermitido="Aprendiz">
              <AprendizMenu />
            </RutaProtegida>
          }
        />

        {/* INSTRUCTOR */}
        <Route
          path="/instructor"
          element={
            <RutaProtegida rolPermitido="Instructor">
              <InstructorMenu />
            </RutaProtegida>
          }
        />

        {/* COORDINADOR */}

        <Route
          path="/administrador"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AdministradorMenu />
            </RutaProtegida>
          }
        />

        {/* LISTA DE APRENDICES */}

        <Route
          path="/administrador/aprendices"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <Aprendices />
            </RutaProtegida>
          }
        />

        {/* CREAR APRENDIZ */}

        <Route
          path="/administrador/aprendices/crear"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <CrearAprendiz />
            </RutaProtegida>
          }
        />

        {/* GESTIONAR APRENDICES */}
        <Route
          path="/administrador/aprendices"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <Aprendices />
            </RutaProtegida>
          }
        />

        {/* RUTA DESCONOCIDA */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;