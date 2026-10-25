import { useEffect, useMemo, useState } from "react";

import AprendizNavbar from "/src/components/navbars/AprendizNavbar.jsx"; // ⚠️ AJUSTAR ruta/nombre
import DateCalendar from "/src/components/DateCalendar.jsx";
import useCurrentDate from "/src/hooks/useCurrentDate.js";

const API_BASE = "http://localhost:8000";

// =========================================================
// UTILIDADES
// =========================================================

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const fechaLocal = new Date(`${fecha}T00:00:00`);

  return fechaLocal.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function obtenerEstado(estado) {
  if (!estado) {
    return { texto: "Sin estado", clase: "attendance-status--unknown" };
  }

  const normalizado = estado.toLowerCase();

  if (normalizado.includes("presente")) {
    return { texto: "Presente", clase: "attendance-status--present" };
  }

  if (normalizado.includes("retardo") || normalizado.includes("retraso")) {
    return { texto: "Retardo", clase: "attendance-status--late" };
  }

  if (normalizado.includes("excusa")) {
    return { texto: "Excusa", clase: "attendance-status--excused" };
  }

  if (normalizado.includes("falla") || normalizado.includes("inasistencia")) {
    return { texto: "Falla", clase: "attendance-status--absent" };
  }

  return { texto: estado, clase: "attendance-status--unknown" };
}

// =========================================================
// COMPONENTE
// =========================================================

export default function AprendizAsistencia() {
  const currentDate = useCurrentDate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];
  const idAprendiz = Number(localStorage.getItem("user_id"));

  // =========================================================
  // ESTADOS
  // =========================================================

  const [ficha, setFicha] = useState(null);
  const [asistencias, setAsistencias] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [soloMias, setSoloMias] = useState(false);
  const [diaActual, setDiaActual] = useState(0);

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [errorCalendario, setErrorCalendario] = useState("");

  // =========================================================
  // CARGAR LA ASISTENCIA DE MI FICHA
  // =========================================================

  useEffect(() => {
    if (!idAprendiz) {
      setCargando(false);
      setError("No se encontró tu sesión. Inicia sesión de nuevo.");
      return;
    }

    fetch(`${API_BASE}/asistencia/aprendiz/${idAprendiz}/ficha`)
      .then(async (res) => {
        if (!res.ok) {
          let detalle;

          try {
            detalle = await res.json();
          } catch {
            detalle = {};
          }

          throw new Error(
            detalle.detail || "No fue posible consultar la asistencia."
          );
        }

        return res.json();
      })
      .then((data) => {
        setFicha(data.ficha);
        setAsistencias(data.registros || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [idAprendiz]);

  // =========================================================
  // ¿LOS REGISTROS TRAEN EL ID DEL APRENDIZ?
  // =========================================================
  // Si el backend incluye Id_Apr en cada registro, se puede resaltar
  // la fila propia y activar el filtro "solo mi asistencia".

  const puedeIdentificarMias = asistencias.some(
    (registro) => registro.Id_Apr !== undefined
  );

  function esMia(registro) {
    return Number(registro.Id_Apr) === idAprendiz;
  }

  // =========================================================
  // DÍAS DISPONIBLES
  // =========================================================

  const diasDisponibles = useMemo(() => {
    const fechas = [
      ...new Set(
        asistencias.map((registro) => registro.Fec_Asi).filter(Boolean)
      ),
    ];

    return fechas.sort((a, b) => new Date(b) - new Date(a));
  }, [asistencias]);

  const fechaSeleccionada = diasDisponibles[diaActual] || null;

  // =========================================================
  // ASISTENCIAS DEL DÍA
  // =========================================================

  const asistenciasDelDia = useMemo(() => {
    if (!fechaSeleccionada) {
      return [];
    }

    const texto = busqueda.trim().toLowerCase();

    return asistencias.filter((registro) => {
      const mismaFecha = registro.Fec_Asi === fechaSeleccionada;

      const coincide =
        !texto || (registro.Aprendiz || "").toLowerCase().includes(texto);

      const pasaFiltroMias =
        !soloMias || !puedeIdentificarMias || esMia(registro);

      return mismaFecha && coincide && pasaFiltroMias;
    });
  }, [asistencias, fechaSeleccionada, busqueda, soloMias]);

  // =========================================================
  // CAMBIAR DÍA
  // =========================================================

  const cambiarDia = (direccion) => {
    setErrorCalendario("");

    setDiaActual((actual) => {
      const nuevo = actual + direccion;

      if (nuevo < 0) {
        return 0;
      }

      if (nuevo >= diasDisponibles.length) {
        return diasDisponibles.length - 1;
      }

      return nuevo;
    });
  };

  // =========================================================
  // ELEGIR FECHA DESDE EL CALENDARIO
  // =========================================================

  const elegirFechaCalendario = (valor) => {
    if (!valor) {
      return;
    }

    const indice = diasDisponibles.indexOf(valor);

    if (indice === -1) {
      setErrorCalendario(
        `No hay asistencia registrada el ${formatearFecha(valor)}.`
      );
      return;
    }

    setErrorCalendario("");
    setDiaActual(indice);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <AprendizNavbar user={{ Nom_Apr: firstName }} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: "1100px" }}>
          {/* ENCABEZADO */}

          <div className="mb-4">
            <h1 className="fw-bold text-dark">Asistencia de mi ficha</h1>

            <p className="text-muted mb-1">
              Consulta la asistencia registrada en tu ficha.
            </p>

            <small className="text-muted">{currentDate}</small>
          </div>

          {/* CUADRO PRINCIPAL */}

          <div
            className="bg-white rounded-4 p-4 shadow-sm"
            style={{ border: "2px solid #00851d" }}
          >
            {/* INFORMACIÓN DE LA FICHA */}

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">
                  {ficha ? `Ficha ${ficha.Num_Fic}` : "Mi ficha"}
                </h5>

                <p className="text-muted small mb-0">
                  Historial de asistencia día por día.
                </p>
              </div>

              <span
                className="badge rounded-pill"
                style={{ backgroundColor: "#E6F4D7", color: "#1B5E20" }}
              >
                {diasDisponibles.length} días con registros
              </span>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* CARGANDO */}

            {cargando && (
              <div className="border rounded-3 text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: "#00851d" }}
                  role="status"
                />

                <p className="text-muted mt-3 mb-0">
                  Consultando asistencia...
                </p>
              </div>
            )}

            {/* SIN REGISTROS */}

            {!cargando && !error && asistencias.length === 0 && (
              <div className="border rounded-3 text-center py-5">
                <h6 className="fw-bold">No hay registros</h6>

                <p className="text-muted small mb-0">
                  Todavía no hay asistencias registradas para tu ficha.
                </p>
              </div>
            )}

            {/* RESULTADOS */}

            {!cargando && asistencias.length > 0 && (
              <>
                {/* BUSCADOR */}

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Buscar por nombre
                  </label>

                  <div className="row align-items-center">
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre del aprendiz"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>

                    {puedeIdentificarMias && (
                      <div className="col-12 col-md-6 mt-2 mt-md-0">
                        <div className="form-check">
                          <input
                            id="soloMias"
                            type="checkbox"
                            className="form-check-input"
                            checked={soloMias}
                            onChange={(e) => setSoloMias(e.target.checked)}
                          />

                          <label
                            htmlFor="soloMias"
                            className="form-check-label"
                          >
                            Ver solo mi asistencia
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* NAVEGACIÓN DE FECHA */}

                <div
                  className="rounded-3 p-3 mb-3"
                  style={{
                    background:
                      "linear-gradient(#006b18 0%, #00851d 55%, #0a9f2e 100%)",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => cambiarDia(-1)}
                      disabled={diaActual === 0}
                    >
                      ← Más reciente
                    </button>

                    <div className="text-center text-white">
                      <div className="small" style={{ opacity: 0.9 }}>
                        Día {diaActual + 1} de {diasDisponibles.length}
                      </div>

                      <div className="fw-bold text-capitalize">
                        {formatearFecha(fechaSeleccionada)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => cambiarDia(1)}
                      disabled={diaActual === diasDisponibles.length - 1}
                    >
                      Más antiguo →
                    </button>
                  </div>
                </div>

                {/* CALENDARIO OPCIONAL */}

                <div className="mb-4">
                  <button
                    type="button"
                    className="attendance-calendar-toggle btn btn-sm btn-outline-success"
                    onClick={() => {
                      setMostrarCalendario((prev) => !prev);
                      setErrorCalendario("");
                    }}
                  >
                    {mostrarCalendario
                      ? "Ocultar calendario"
                      : "Elegir fecha desde el calendario"}
                  </button>

                  {mostrarCalendario && (
                    <div className="attendance-calendar-panel rounded-3 p-3 mt-3">
                      <p className="form-label fw-semibold mb-1">
                        Fecha de la asistencia
                      </p>

                      <DateCalendar
                        value={fechaSeleccionada || ""}
                        availableDates={diasDisponibles}
                        ariaLabel="Fechas con asistencia registrada"
                        onChange={elegirFechaCalendario}
                      />

                      <div className="form-text">
                        Hay registros en {diasDisponibles.length} día(s). Elige
                        una de esas fechas.
                      </div>

                      {errorCalendario && (
                        <div className="small text-danger mt-1">
                          {errorCalendario}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CONTADOR */}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="fw-semibold">Registros del día</span>

                    <div className="text-muted small">
                      Asistencia registrada en esta fecha
                    </div>
                  </div>

                  <span
                    className="badge rounded-pill"
                    style={{ backgroundColor: "#E6F4D7", color: "#1B5E20" }}
                  >
                    {asistenciasDelDia.length}
                  </span>
                </div>

                {/* TABLA */}

                {asistenciasDelDia.length > 0 ? (
                  <div className="table-responsive border rounded-3">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-3">Aprendiz</th>
                          <th>Resultado de aprendizaje</th>
                          <th>Competencia</th>
                          <th>Instructor</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>

                      <tbody>
                        {asistenciasDelDia.map((registro, index) => {
                          const estado = obtenerEstado(registro.Estado);
                          const propia =
                            puedeIdentificarMias && esMia(registro);

                          return (
                            <tr
                              key={registro.Id_Asi || index}
                              style={
                                propia
                                  ? { backgroundColor: "#E6F4D7" }
                                  : undefined
                              }
                            >
                              <td className="px-3 fw-semibold">
                                {registro.Aprendiz || "-"}

                                {propia && (
                                  <span
                                    className="badge rounded-pill ms-2"
                                    style={{
                                      backgroundColor: "#00851d",
                                      color: "#fff",
                                    }}
                                  >
                                    Yo
                                  </span>
                                )}
                              </td>

                              <td>{registro.ResultadoAprendizaje || "-"}</td>

                              <td className="text-muted">
                                {registro.Competencia || "-"}
                              </td>

                              <td>{registro.Instructor || "-"}</td>

                              <td className="text-center">
                                <span
                                  className={`badge rounded-pill px-3 py-2 ${estado.clase}`}
                                >
                                  {estado.texto}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border rounded-3 text-center py-4">
                    <p className="text-muted small mb-0">
                      No hay asistencia para la búsqueda en este día.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}