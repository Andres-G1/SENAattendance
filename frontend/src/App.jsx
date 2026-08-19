import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import AprendizMenu from "./pages/AprendizMenu";
import InstructorMenu from "./pages/InstructorMenu";
import AdministradorMenu from "./pages/AdministradorMenu";
import RutaProtegida from "./components/RutaProtegida";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/aprendiz"
          element={
            <RutaProtegida rolPermitido="Aprendiz">
              <AprendizMenu />
            </RutaProtegida>
          }
        />

        <Route
          path="/instructor"
          element={
            <RutaProtegida rolPermitido="Instructor">
              <InstructorMenu />
            </RutaProtegida>
          }
        />

        <Route
          path="/administrador"
          element={
            <RutaProtegida rolPermitido="Coordinador">
              <AdministradorMenu />
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