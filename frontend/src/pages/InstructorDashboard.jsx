import { useEffect, useState } from 'react'
import InstructorNavbar from '../components/navbars/InstructorNavbar.jsx'
import useCurrentDate from '../hooks/useCurrentDate.js'

export default function InstructorDashboard() {
  const currentDate = useCurrentDate()
  const nombreCompleto = localStorage.getItem('firstName') || '';
  const firstName = nombreCompleto.split(' ')[0];
  const idInstructor = localStorage.getItem('user_id');

  const [fichas, setFichas] = useState([]);
  const [loadingFichas, setLoadingFichas] = useState(true);

  useEffect(() => {
    if (!idInstructor) {
      setLoadingFichas(false);
      return;
    }

    fetch(`http://localhost:8000/asignaciones/instructor/${idInstructor}/fichas`)
      .then(res => res.json())
      .then(data => setFichas(data))
      .catch(err => console.error('Error al cargar fichas:', err))
      .finally(() => setLoadingFichas(false));
  }, [idInstructor]);

  return (
    <>
      <InstructorNavbar user={{ Nom_Ins: firstName }} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 950 }}>
          <div className="row align-items-center mb-5">
            <div className="col-12 col-md-8 text-center text-md-start">
              <h1 className="fw-bold text-dark display-6 mb-1">¡Bienvenido Instructor, {firstName}!</h1>
              <p className="text-muted mb-0">{currentDate}</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-5">
              <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4">
                <h5 className="fw-bold text-dark mb-4 small text-uppercase tracking-wider text-muted">
                  Mis Fichas Activas
                </h5>

                <div className="d-flex align-items-baseline mb-3">
                  <span className="display-4 fw-extrabold text-primary tracking-tight">
                    {loadingFichas ? '...' : fichas.length}
                  </span>
                  <span className="text-muted ms-2 fw-medium">Grupos a cargo</span>
                </div>

                <p className="text-muted small mb-4">
                  Recuerda validar y cerrar las novedades de asistencia antes del cierre de cada mes
                  formativo.
                </p>

                <hr className="text-muted opacity-25 my-3" />

                <div className="d-flex justify-content-between align-items-center bg-warning-subtle p-3 rounded-3 border-start border-warning border-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-warning-emphasis fw-medium small">
                      Aprendices con alertas por fallas
                    </span>
                  </div>
                  <span className="badge bg-warning text-dark fw-bold rounded-pill">3 Alertas</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="d-flex flex-column h-100 justify-content-between gap-4">
                <a
                  href="#control-asistencia"
                  className="card text-decoration-none bg-white border-0 shadow-sm p-4 rounded-4 card-hover-premium flex-grow-1"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-3 rounded-3 bg-primary-subtle text-primary border border-primary-subtle">
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
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="fw-bold text-dark mb-0">Revisar Asistencias</h5>
                        <span className="text-primary small fw-medium">Ingresar &rarr;</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Consulta el consolidado de ingresos, gestiona retardos y evalúa el porcentaje de
                        asistencia general de tus fichas.
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Recuadro de abajo — fichas asignadas */}
          <div
            id="mis-fichas"
            className="rounded-4 p-4 bg-white mt-5"
            style={{ border: "2px solid #00851d" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="p-3 rounded-3"
                style={{ backgroundColor: "#E6F4D7", color: "#1B5E20" }}
              >
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h5 className="fw-bold text-dark mb-0">Fichas Asignadas</h5>
            </div>

            <p className="text-muted small mb-4">
              Grupos de formación que tienes actualmente a cargo.
            </p>

            {loadingFichas ? (
              <p className="text-muted small">Cargando fichas...</p>
            ) : fichas.length === 0 ? (
              <p className="text-muted small mb-0">No tienes fichas asignadas actualmente.</p>
            ) : (
              <>
                <div
                  className="d-inline-block rounded-3 px-4 py-3 mb-4"
                  style={{ backgroundColor: "#E6F4D7" }}
                >
                  <div className="fw-bold fs-4" style={{ color: "#1B5E20" }}>
                    {fichas.length}
                  </div>
                  <div className="small text-muted">A cargo</div>
                </div>

                <div className="d-flex flex-column gap-2">
                  {fichas.map((f) => (
                    <div
                      key={f.Id_Fic}
                      className="d-flex align-items-center gap-3 p-3 rounded-3"
                      style={{ border: "1px solid #e0e0e0" }}
                    >
                      <div
                        className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: "#E6F4D7", color: "#1B5E20" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div>
                        <span className="fw-medium text-dark">Ficha {f.Num_Fic}</span>
                        <span className="text-muted small"> · {f.Jor_Fic}</span>
                        <span className="text-muted small">
                          {" "}
                          · {f.Fec_inicio_Fic} a {f.Fec_Fin_Fic}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}