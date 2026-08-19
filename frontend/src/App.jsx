import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import RutaProtegida from "./components/RutaProtegida";
import "./hooks/useCurrentDate"
import AprendizDashboard from "./pages/AprendizDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdministradorDashboard from "./pages/AdministradorDashboard";

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

        {/* cualquier ruta desconocida vuelve al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;