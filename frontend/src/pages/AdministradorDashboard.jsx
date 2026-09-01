import { Link } from 'react-router-dom' 
import CoordinadorNavbar from '../components/navbars/CoordinadorNavbar.jsx'
import useCurrentDate from '../hooks/useCurrentDate.js'

export default function CoordinadorDashboard() {
  const currentDate = useCurrentDate()
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
      
      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 950 }}>
          <div className="row align-items-center mb-5">
            <div className="col-12 col-md-8 text-center text-md-start">
              <h1 className="fw-bold text-dark display-6 mb-1">¡Bienvenido Coordinador, {firstName}!</h1>
              <p className="text-muted mb-0">{currentDate}</p>
            </div>
          </div>

          <h4 className="fw-bold text-dark mb-4 small text-uppercase tracking-wider text-muted">
            Gestión de Usuarios
          </h4>

          <div className="row g-4 mb-5">
            <div className="col-12 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="p-3 rounded-3 bg-success-subtle text-success">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">Gestion de Usuarios</h5>
                </div>
                <p className="text-muted small mb-4">
                  Registro de aprendices, instructores y coordinadores del sistema.
                </p>
                <div className="d-flex flex-column gap-2 mt-auto">
                  {/* 2. Cambiado de <a> a <Link to="..."> */}
                  <Link
                    to="/coordinador/module_aprendiz_config"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Aprendices
                  </Link>
                  <Link
                    to="/coordinador/module_instructor_config"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Instructores
                  </Link>
                  <Link
                    to="/coordinador/module_coordinador_config"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Administradores
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4 border border-primary-subtle">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="p-3 rounded-3 bg-primary-subtle text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">Gestion de usuarios (PDF / Excel)</h5>
                </div>
                <p className="text-muted small mb-4">
                  Carga de listados oficiales de SofíaPlus en formato PDF o Excel.
                </p>

                {/* Si es una ancla interna (#) puede permanecer como <a> */}
                <a
                  href="#registro-carga-archivo"
                  className="btn btn-primary rounded-3 mt-auto w-100 fw-semibold py-2 shadow-sm"
                >
                  Subir Documento / PDF
                </a>
              </div>
            </div>
          </div>

          <h4 className="fw-bold text-dark mb-4 small text-uppercase tracking-wider text-muted">
            Gestión de fichas
          </h4>

          <div className="row g-4 mb-5">
            <div className="col-12 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="p-3 rounded-3 bg-success-subtle text-success">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  </div>
                  <h5 className="fw-bold text-dark mb-0">Gestion de Fichas</h5>
                </div>
                <p className="text-muted small mb-4">Registro de fichas, carreras y competencias del programa.</p>
                <div className="d-flex flex-column gap-2 mt-auto">
                  <Link
                    to="/token/module_token_config"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Fichas
                  </Link>
                  
                  {/* 3. CORREGIDO: to="/administrador/carreras" para que coincida con App.jsx */}
                  <Link
                    to="/administrador/carreras"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Carreras
                  </Link>
                  
                  <Link
                    to="/administrador/competencias"
                    className="btn btn-outline-success rounded-3 w-100 fw-semibold py-2"
                  >
                    Gestionar Competencias
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
