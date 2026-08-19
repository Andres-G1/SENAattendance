import AprendizNavbar from '../components/navbars/AprendizNavbar.jsx'
import useCurrentDate from '../hooks/useCurrentDate.js'

export default function AprendizDashboard() {
  const currentDate = useCurrentDate();
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  return (
    <>
      <AprendizNavbar user={{ Nom_Apr: firstName }} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 950 }}>
          <div className="row align-items-center mb-5">
            <div className="col-12 col-md-8 text-center text-md-start">
              <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold mb-2">
                Panel de Consulta
              </span>
              <h1 className="fw-bold text-dark display-6 mb-1">¡Buen día Aprendiz, {firstName}!</h1>
              <p className="text-muted mb-0">{currentDate}</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-5">
              <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4">
                <h5 className="fw-bold text-dark mb-4 small text-uppercase tracking-wider text-muted">
                  Resumen de Rendimiento
                </h5>

                <div className="d-flex align-items-baseline mb-2">
                  <span className="display-4 fw-extrabold text-success tracking-tight">92%</span>
                  <span className="text-muted ms-2 fw-medium">de asistencia</span>
                </div>

                <div className="progress mb-4" style={{ height: 8 }}>
                  <div
                    className="progress-bar bg-success rounded-pill"
                    role="progressbar"
                    style={{ width: '92%' }}
                    aria-valuenow="92"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>

                <hr className="text-muted opacity-25 my-4" />

                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="p-2 bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32 }}
                    >
                      <small className="fw-bold">!</small>
                    </div>
                    <span className="text-secondary fw-medium small">Inasistencias registradas</span>
                  </div>
                  <span className="badge bg-danger fs-6 px-3 rounded-pill">0 Fallas</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="d-flex flex-column h-100 justify-content-between gap-4">
                <a
                  href="#historial"
                  className="card text-decoration-none bg-white border-0 shadow-sm p-4 rounded-4 card-hover-premium flex-grow-1"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-3 rounded-3 bg-success-subtle text-success border border-success-subtle">
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
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="fw-bold text-dark mb-0">Mis Asistencias</h5>
                        <span className="text-success small fw-medium">Ver Todo &rarr;</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Revisa el calendario detallado, horas acumuladas y las bitácoras de los días en
                        formación.
                      </p>
                    </div>
                  </div>
                </a>

                <a
                  href="#justificaciones"
                  className="card text-decoration-none bg-white border-0 shadow-sm p-4 rounded-4 card-hover-premium flex-grow-1"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-3 rounded-3 bg-danger-subtle text-danger border border-danger-subtle">
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
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="fw-bold text-dark mb-0">Fallas y Novedades</h5>
                        <span className="text-danger small fw-medium">Ver Detalle &rarr;</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Monitorea los reportes de inasistencia y verifica si el instructor ya aprobó tus
                        excusas médicas presentadas.
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
