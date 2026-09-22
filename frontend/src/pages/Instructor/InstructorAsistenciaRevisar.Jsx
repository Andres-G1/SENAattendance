
import { useEffect, useMemo, useState } from "react";

import InstructorNavbar from "/src/components/navbars/InstructorNavbar.jsx";
import useCurrentDate from "/src/hooks/useCurrentDate.js";

const API_BASE = "http://localhost:8000";

// =========================================================
// COMPONENTE
// =========================================================

export default function InstructorAsistenciaRevisar() {
  const currentDate = useCurrentDate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const idInstructor = localStorage.getItem("user_id");

  // =========================================================
  // ESTADOS
  // =========================================================

  const [fichas, setFichas] = useState([]);
  const [fichaSeleccionada, setFichaSeleccionada] = useState("");

  const [asistencias, setAsistencias] = useState([]);

  const [loadingFichas, setLoadingFichas] = useState(true);
  const [loadingAsistencias, setLoadingAsistencias] =
    useState(false);

  const [error, setError] = useState("");

  const [documentoBusqueda, setDocumentoBusqueda] =
    useState("");

  const [diaActual, setDiaActual] = useState(0);

  // =========================================================
  // CARGAR FICHAS
  // =========================================================

  useEffect(() => {
    if (!idInstructor) {
      setLoadingFichas(false);
      return;
    }

    fetch(
      `${API_BASE}/asignaciones/instructor/${idInstructor}/fichas`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al obtener las fichas");
        }

        return res.json();
      })
      .then((data) => {
        setFichas(data);
      })
      .catch((err) => {
        console.error(err);
        setError("No fue posible cargar las fichas.");
      })
      .finally(() => {
        setLoadingFichas(false);
      });
  }, [idInstructor]);

  // =========================================================
  // CONSULTAR ASISTENCIA
  // =========================================================

  const consultarAsistencia = () => {
    if (!fichaSeleccionada) {
      setError("Selecciona una ficha primero.");
      return;
    }

    setError("");
    setLoadingAsistencias(true);
    setDocumentoBusqueda("");
    setDiaActual(0);

    fetch(
      `${API_BASE}/asistencia/instructor/${idInstructor}/revisar/${fichaSeleccionada}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Error al consultar la asistencia"
          );
        }

        return res.json();
      })
      .then((data) => {
        setAsistencias(data);
      })
      .catch((err) => {
        console.error(err);

        setAsistencias([]);

        setError(
          "No fue posible consultar la asistencia."
        );
      })
      .finally(() => {
        setLoadingAsistencias(false);
      });
  };

  // =========================================================
  // DÍAS DISPONIBLES
  // =========================================================

  const diasDisponibles = useMemo(() => {
    const fechas = [
      ...new Set(
        asistencias
          .map((registro) => registro.Fec_Asi)
          .filter(Boolean)
      ),
    ];

    return fechas.sort(
      (a, b) => new Date(b) - new Date(a)
    );
  }, [asistencias]);

  // =========================================================
  // FECHA SELECCIONADA
  // =========================================================

  const fechaSeleccionada =
    diasDisponibles[diaActual] || null;

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    const fechaLocal = new Date(
      `${fecha}T00:00:00`
    );

    return fechaLocal.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // ASISTENCIAS DEL DÍA
  // =========================================================

  const asistenciasDelDia = useMemo(() => {
    if (!fechaSeleccionada) {
      return [];
    }

    return asistencias.filter((registro) => {
      const mismaFecha =
        registro.Fec_Asi === fechaSeleccionada;

      const mismoDocumento =
        !documentoBusqueda ||
        String(registro.Num_ide_Apr || "").includes(
          documentoBusqueda
        );

      return mismaFecha && mismoDocumento;
    });
  }, [
    asistencias,
    fechaSeleccionada,
    documentoBusqueda,
  ]);

  // =========================================================
  // CAMBIAR DÍA
  // =========================================================

  const cambiarDia = (direccion) => {
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
  // ESTADO
  // =========================================================

  const obtenerEstado = (estado) => {
    if (!estado) {
      return {
        texto: "Sin estado",
        clase: "bg-secondary-subtle text-secondary",
      };
    }

    const normalizado = estado.toLowerCase();

    if (normalizado.includes("presente")) {
      return {
        texto: "Presente",
        clase: "bg-success-subtle text-success",
      };
    }

    if (
      normalizado.includes("retardo") ||
      normalizado.includes("retraso")
    ) {
      return {
        texto: "Retardo",
        clase:
          "bg-warning-subtle text-warning-emphasis",
      };
    }

    if (normalizado.includes("excusa")) {
      return {
        texto: "Excusa",
        clase: "bg-info-subtle text-info-emphasis",
      };
    }

    if (
      normalizado.includes("falla") ||
      normalizado.includes("inasistencia")
    ) {
      return {
        texto: "Falla",
        clase: "bg-danger-subtle text-danger",
      };
    }

    return {
      texto: estado,
      clase: "bg-secondary-subtle text-secondary",
    };
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <InstructorNavbar
        user={{ Nom_Ins: firstName }}
      />

      <div
        className="bg-light min-vh-100 py-5"
      >
        <main
          className="container"
          style={{ maxWidth: "1000px" }}
        >
          {/* =================================================
              ENCABEZADO
          ================================================= */}

          <div className="mb-4">
            <h1 className="fw-bold text-dark">
              Revisar asistencia
            </h1>

            <p className="text-muted mb-1">
              Consulta la asistencia registrada en
              las fichas asignadas.
            </p>

            <small className="text-muted">
              {currentDate}
            </small>
          </div>

          {/* =================================================
              CUADRO PRINCIPAL
          ================================================= */}

          <div
            className="bg-white rounded-4 p-4 shadow-sm"
            style={{
              border: "2px solid #00851d",
            }}
          >
            {/* =================================================
                SELECCIÓN DE FICHA
            ================================================= */}

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-1">
                    Consultar asistencia
                  </h5>

                  <p className="text-muted small mb-0">
                    Selecciona una ficha para revisar
                    sus registros de asistencia.
                  </p>
                </div>

                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: "#E6F4D7",
                    color: "#1B5E20",
                  }}
                >
                  {fichas.length} fichas
                </span>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-8">
                  <label className="form-label fw-semibold">
                    Ficha
                  </label>

                  <select
                    className="form-select"
                    value={fichaSeleccionada}
                    onChange={(e) => {
                      setFichaSeleccionada(
                        e.target.value
                      );

                      setAsistencias([]);
                      setDocumentoBusqueda("");
                      setDiaActual(0);
                      setError("");
                    }}
                    disabled={loadingFichas}
                  >
                    <option value="">
                      {loadingFichas
                        ? "Cargando fichas..."
                        : "Selecciona una ficha"}
                    </option>

                    {fichas.map((ficha) => (
                      <option
                        key={ficha.Id_Fic}
                        value={ficha.Id_Fic}
                      >
                        {ficha.Num_Fic ||
                          ficha.Id_Fic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <button
                    type="button"
                    className="btn text-white fw-semibold w-100"
                    style={{
                      backgroundColor: "#00851d",
                    }}
                    onClick={consultarAsistencia}
                    disabled={
                      !fichaSeleccionada ||
                      loadingAsistencias
                    }
                  >
                    {loadingAsistencias
                      ? "Consultando..."
                      : "Consultar asistencia"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-3 mb-0">
                  {error}
                </div>
              )}
            </div>

            {/* =================================================
                ESTADO INICIAL
            ================================================= */}

            {!fichaSeleccionada && (
              <div className="border rounded-3 text-center py-5">
                <h6 className="fw-bold text-dark">
                  Selecciona una ficha
                </h6>

                <p className="text-muted small mb-0">
                  Aquí aparecerá el historial de
                  asistencia.
                </p>
              </div>
            )}

            {/* =================================================
                CARGANDO
            ================================================= */}

            {loadingAsistencias && (
              <div className="border rounded-3 text-center py-5">
                <div
                  className="spinner-border"
                  style={{
                    color: "#00851d",
                  }}
                  role="status"
                />

                <p className="text-muted mt-3 mb-0">
                  Consultando asistencia...
                </p>
              </div>
            )}

            {/* =================================================
                SIN REGISTROS
            ================================================= */}

            {fichaSeleccionada &&
              !loadingAsistencias &&
              asistencias.length === 0 && (
                <div className="border rounded-3 text-center py-5">
                  <h6 className="fw-bold">
                    No hay registros
                  </h6>

                  <p className="text-muted small mb-0">
                    No existen asistencias registradas
                    para esta ficha.
                  </p>
                </div>
              )}

            {/* =================================================
                RESULTADOS
            ================================================= */}

            {fichaSeleccionada &&
              !loadingAsistencias &&
              asistencias.length > 0 && (
                <>
                  {/* =================================================
                      BUSCADOR
                  ================================================= */}

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Buscar por documento
                    </label>

                    <div className="row">
                      <div className="col-12 col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Número de documento"
                          value={documentoBusqueda}
                          onChange={(e) =>
                            setDocumentoBusqueda(
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      NAVEGACIÓN DE FECHA
                  ================================================= */}

                  <div
                    className="rounded-3 p-3 mb-4"
                    style={{
                      background:
                        "linear-gradient(#006b18 0%, #00851d 55%, #0a9f2e 100%)",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() =>
                          cambiarDia(-1)
                        }
                        disabled={diaActual === 0}
                      >
                        ← Anterior
                      </button>

                      <div className="text-center text-white">
                        <div
                          className="small"
                          style={{
                            opacity: 0.9,
                          }}
                        >
                          Día {diaActual + 1} de{" "}
                          {diasDisponibles.length}
                        </div>

                        <div className="fw-bold text-capitalize">
                          {formatearFecha(
                            fechaSeleccionada
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() =>
                          cambiarDia(1)
                        }
                        disabled={
                          diaActual ===
                          diasDisponibles.length - 1
                        }
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      CONTADOR
                  ================================================= */}

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="fw-semibold">
                        Registros del día
                      </span>

                      <div className="text-muted small">
                        Asistencia registrada en esta fecha
                      </div>
                    </div>

                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "#E6F4D7",
                        color: "#1B5E20",
                      }}
                    >
                      {asistenciasDelDia.length}
                    </span>
                  </div>

                  {/* =================================================
                      TABLA
                  ================================================= */}

                  {asistenciasDelDia.length > 0 ? (
                    <div className="table-responsive border rounded-3">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="px-3">
                              Aprendiz
                            </th>

                            <th>
                              Documento
                            </th>

                            <th>
                              Competencia
                            </th>

                            <th>
                              Instructor
                            </th>

                            <th className="text-center">
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {asistenciasDelDia.map(
                            (registro, index) => {
                              const estado =
                                obtenerEstado(
                                  registro.Estado
                                );

                              return (
                                <tr
                                  key={
                                    registro.Id_Asi ||
                                    index
                                  }
                                >
                                  <td className="px-3 fw-semibold">
                                    {registro.Aprendiz ||
                                      "-"}
                                  </td>

                                  <td className="text-muted">
                                    {registro.Num_ide_Apr ||
                                      "-"}
                                  </td>

                                  <td>
                                    {registro.Competencia ||
                                      "-"}
                                  </td>

                                  <td>
                                    {registro.Instructor ||
                                      "-"}
                                  </td>

                                  <td className="text-center">
                                    <span
                                      className={`badge rounded-pill px-3 py-2 ${estado.clase}`}
                                    >
                                      {estado.texto}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border rounded-3 text-center py-4">
                      <p className="text-muted small mb-0">
                        No hay asistencia para el
                        documento buscado en este día.
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