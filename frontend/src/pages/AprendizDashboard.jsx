import { useState, useEffect } from 'react'
import AprendizNavbar from '../components/navbars/AprendizNavbar.jsx'
import useCurrentDate from '../hooks/useCurrentDate.js'
import FallasNovedades from './Aprendiz/FallasNovedades.jsx'

const API_BASE = "http://localhost:8000";

export default function AprendizDashboard() {
  const currentDate = useCurrentDate();
  const nombreCompleto = localStorage.getItem('firstName') || '';
  const firstName = nombreCompleto.split(' ')[0];
  const idAprendiz = localStorage.getItem('user_id');

  const [mostrarFallas, setMostrarFallas] = useState(false);

  // =====================================================
  // ESTADO DE ASISTENCIA (reemplaza los valores hardcodeados)
  // =====================================================

  const [estado, setEstado] = useState(null);
  const [cargandoEstado, setCargandoEstado] = useState(true);

  useEffect(() => {
    if (!idAprendiz) {
      setCargandoEstado(false);
      return;
    }

    fetch(`${API_BASE}/asistencia/aprendiz/${idAprendiz}/estado`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar el estado de asistencia");
        }
        return res.json();
      })
      .then((data) => setEstado(data))
      .catch((error) => {
        console.error(error);
        setEstado(null);
      })
      .finally(() => setCargandoEstado(false));
  }, [idAprendiz]);

  // Porcentaje de asistencia = 100 - (proporción de fallas netas)
  // Nota: esto asume que el total de sesiones esperadas se puede
  // derivar; si el backend no lo devuelve, ajusta aquí.
  const colorSemaforo = {
    ROJO: { bg: "bg-danger-subtle", text: "text-danger" },
    AMARILLO: { bg: "bg-warning-subtle", text: "text-warning" },
    VERDE: { bg: "bg-success-subtle", text: "text-success" },
  };

  const colores = estado
    ? colorSemaforo[estado.semaforo]
    : colorSemaforo.VERDE;

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

                {cargandoEstado ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-success" />
                  </div>
                ) : !estado ? (
                  <p className="text-muted small mb-0">
                    No se pudo cargar tu información de asistencia.
                  </p>
                ) : (
                  <>
                    <div className="d-flex align-items-baseline mb-2">
                      <span className={`display-4 fw-extrabold tracking-tight ${colores.text}`}>
                        {estado.acumulado}
                      </span>
                      <span className="text-muted ms-2 fw-medium">
                        fallas acumuladas
                      </span>
                    </div>

                    <div className="progress mb-4" style={{ height: 8 }}>
                      <div
                        className={`progress-bar rounded-pill ${
                          estado.semaforo === 'ROJO'
                            ? 'bg-danger'
                            : estado.semaforo === 'AMARILLO'
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{ width: `${Math.min(100, (estado.acumulado / 5) * 100)}%` }}
                        aria-valuenow={estado.acumulado}
                        aria-valuemin="0"
                        aria-valuemax="5"
                      ></div>
                    </div>

                    <hr className="text-muted opacity-25 my-4" />

                    <div className={`d-flex justify-content-between align-items-center p-3 rounded-3 ${colores.bg}`}>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className={`p-2 rounded-circle d-flex align-items-center justify-content-center ${colores.bg} ${colores.text}`}
                          style={{ width: 32, height: 32 }}
                        >
                          <small className="fw-bold">!</small>
                        </div>
                        <span className="text-secondary fw-medium small">
                          Racha actual sin asistir
                        </span>
                      </div>
                      <span className={`badge fs-6 px-3 rounded-pill ${
                        estado.semaforo === 'ROJO' ? 'bg-danger' :
                        estado.semaforo === 'AMARILLO' ? 'bg-warning text-dark' :
                        'bg-success'
                      }`}>
                        {estado.racha_dias} día(s)
                      </span>
                    </div>

                    {estado.deserta_por_racha && (
                      <div className="alert alert-danger mt-3 mb-0 small">
                        ⚠ Llevas 3 días seguidos sin asistir. Contacta a tu instructor o coordinación cuanto antes.
                      </div>
                    )}

                    {!estado.deserta_por_racha && estado.deserta_por_acumulado && (
                      <div className="alert alert-danger mt-3 mb-0 small">
                        ⚠ Alcanzaste el máximo de fallas acumuladas permitidas.
                      </div>
                    )}
                  </>
                )}
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

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setMostrarFallas((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' && setMostrarFallas((v) => !v)}
                  className="card text-decoration-none bg-white border-0 shadow-sm p-4 rounded-4 card-hover-premium flex-grow-1"
                  style={{ cursor: 'pointer' }}
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
                        <span className="text-danger small fw-medium">
                          {mostrarFallas ? 'Ocultar' : 'Ver Detalle'} &rarr;
                        </span>
                      </div>
                      <p className="text-muted small mb-0">
                        Monitorea los reportes de inasistencia y verifica si el instructor ya aprobó tus
                        excusas médicas presentadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {mostrarFallas && <FallasNovedades onClose={() => setMostrarFallas(false)} idAprendiz={idAprendiz} />}
        </main>
      </div>
    </>
  )
}