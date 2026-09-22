import { useEffect, useMemo, useState } from "react";

import InstructorNavbar from "/src/components/navbars/InstructorNavbar.jsx";
import useCurrentDate from "/src/hooks/useCurrentDate.js";

const API_BASE = "http://localhost:8000";

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

  // Búsqueda por documento
  const [documentoBusqueda, setDocumentoBusqueda] =
    useState("");

  // Día actual
  const [diaActual, setDiaActual] = useState(0);

  // =========================================================
  // CARGAR FICHAS DEL INSTRUCTOR
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
          throw new Error(
            "Error al obtener las fichas"
          );
        }

        return res.json();
      })
      .then((data) => {
        console.log(
          "Fichas del instructor:",
          data
        );

        setFichas(data);
      })
      .catch((err) => {
        console.error("Error:", err);

        setError(
          "No fue posible cargar las fichas."
        );
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
      setError(
        "Selecciona una ficha primero."
      );

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
        console.log(
          "Asistencia encontrada:",
          data
        );

        setAsistencias(data);
      })
      .catch((err) => {
        console.error("Error:", err);

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
  // OBTENER DÍAS DISPONIBLES
  // =========================================================

  const diasDisponibles = useMemo(() => {
    const fechas = [
      ...new Set(
        asistencias
          .map(
            (registro) => registro.Fec_Asi
          )
          .filter(Boolean)
      ),
    ];

    return fechas.sort(
      (a, b) =>
        new Date(b) - new Date(a)
    );
  }, [asistencias]);

  // =========================================================
  // CORREGIR DÍA ACTUAL SI CAMBIA LA INFORMACIÓN
  // =========================================================

  useEffect(() => {
    if (
      diaActual >= diasDisponibles.length &&
      diasDisponibles.length > 0
    ) {
      setDiaActual(0);
    }
  }, [
    diasDisponibles,
    diaActual,
  ]);

  // =========================================================
  // FECHA ACTUAL SELECCIONADA
  // =========================================================

  const fechaSeleccionada =
    diasDisponibles[diaActual] || null;

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaLocal = new Date(
      `${fecha}T00:00:00`
    );

    return fechaLocal.toLocaleDateString(
      "es-CO",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // ASISTENCIAS DEL DÍA
  // =========================================================

  const asistenciasDelDia = useMemo(() => {
    if (!fechaSeleccionada) {
      return [];
    }

    return asistencias.filter(
      (registro) => {
        const mismaFecha =
          registro.Fec_Asi ===
          fechaSeleccionada;

        const mismoDocumento =
          !documentoBusqueda ||
          String(
            registro.Num_ide_Apr || ""
          ).includes(
            documentoBusqueda
          );

        return (
          mismaFecha &&
          mismoDocumento
        );
      }
    );
  }, [
    asistencias,
    fechaSeleccionada,
    documentoBusqueda,
  ]);

  // =========================================================
  // CAMBIAR DE DÍA
  // =========================================================

  const cambiarDia = (direccion) => {
    setDiaActual((actual) => {
      const nuevo =
        actual + direccion;

      if (nuevo < 0) {
        return 0;
      }

      if (
        nuevo >=
        diasDisponibles.length
      ) {
        return (
          diasDisponibles.length - 1
        );
      }

      // Al cambiar de día mantenemos
      // la búsqueda por documento
      return nuevo;
    });
  };

  // =========================================================
  // OBTENER ESTILO DEL ESTADO
  // =========================================================

  const obtenerEstado = (estado) => {
    if (!estado) {
      return {
        texto: "Sin estado",
        clase:
          "bg-secondary-subtle text-secondary",
        icono: "•",
      };
    }

    const estadoNormalizado =
      estado.toLowerCase();

    if (
      estadoNormalizado.includes(
        "presente"
      )
    ) {
      return {
        texto: "Presente",
        clase:
          "bg-success-subtle text-success",
        icono: "✓",
      };
    }

    if (
      estadoNormalizado.includes(
        "retardo"
      ) ||
      estadoNormalizado.includes(
        "retraso"
      )
    ) {
      return {
        texto: "Retardo",
        clase:
          "bg-warning-subtle text-warning-emphasis",
        icono: "⏱",
      };
    }

    if (
      estadoNormalizado.includes(
        "excusa"
      )
    ) {
      return {
        texto: "Excusa",
        clase:
          "bg-info-subtle text-info-emphasis",
        icono: "📝",
      };
    }

    if (
      estadoNormalizado.includes(
        "falla"
      ) ||
      estadoNormalizado.includes(
        "inasistencia"
      )
    ) {
      return {
        texto: "Falla",
        clase:
          "bg-danger-subtle text-danger",
        icono: "✕",
      };
    }

    return {
      texto: estado,
      clase:
        "bg-secondary-subtle text-secondary",
      icono: "•",
    };
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <InstructorNavbar
        user={{
          Nom_Ins: firstName,
        }}
      />

      <div
        className="min-vh-100 py-5"
        style={{
          backgroundColor: "#f5f7fa",
        }}
      >
        <main
          className="container"
          style={{
            maxWidth: 1150,
          }}
        >

          {/* =================================================
              ENCABEZADO
          ================================================= */}

          <div className="mb-4">

            <div className="d-flex align-items-center gap-3">

              <div
                className="rounded-4 d-flex align-items-center justify-content-center"
                style={{
                  width: 55,
                  height: 55,
                  backgroundColor:
                    "#e8f5e9",
                  fontSize: 26,
                }}
              >
                📋
              </div>

              <div>
                <h1 className="fw-bold text-dark mb-1">
                  Revisar Asistencia
                </h1>

                <p className="text-muted mb-0">
                  Consulta la asistencia de tus
                  fichas por día.
                </p>
              </div>

            </div>

            <small className="text-muted d-block mt-2">
              {currentDate}
            </small>

          </div>

          {/* =================================================
              SELECCIONAR FICHA
          ================================================= */}

          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">

            <div className="d-flex align-items-center gap-2 mb-3">

              <span
                style={{
                  fontSize: 20,
                }}
              >
                📚
              </span>

              <h5 className="fw-bold mb-0">
                Seleccionar ficha
              </h5>

            </div>

            <div className="row g-3 align-items-end">

              <div className="col-12 col-md-8">

                <label className="form-label fw-medium">
                  Ficha
                </label>

                <select
                  className="form-select form-select-lg"
                  value={
                    fichaSeleccionada
                  }
                  onChange={(e) => {
                    setFichaSeleccionada(
                      e.target.value
                    );

                    setAsistencias([]);

                    setDocumentoBusqueda("");

                    setDiaActual(0);

                    setError("");
                  }}
                  disabled={
                    loadingFichas
                  }
                >

                  <option value="">
                    {loadingFichas
                      ? "Cargando fichas..."
                      : "Selecciona una ficha"}
                  </option>

                  {fichas.map(
                    (ficha) => (
                      <option
                        key={
                          ficha.Id_Fic
                        }
                        value={
                          ficha.Id_Fic
                        }
                      >
                        {ficha.Num_Fic ||
                          ficha.Id_Fic}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="col-12 col-md-4">

                <button
                  type="button"
                  className="btn btn-success btn-lg w-100"
                  onClick={
                    consultarAsistencia
                  }
                  disabled={
                    !fichaSeleccionada ||
                    loadingAsistencias
                  }
                >
                  {loadingAsistencias
                    ? "Consultando..."
                    : "🔍 Consultar asistencia"}
                </button>

              </div>

            </div>

            {error && (
              <div className="alert alert-danger mt-3 mb-0 rounded-3">
                {error}
              </div>
            )}

          </div>

          {/* =================================================
              CONTENIDO
          ================================================= */}

          <div className="card border-0 shadow-sm rounded-4 p-4">

            {/* SIN FICHA */}

            {!fichaSeleccionada && (
              <div className="text-center py-5">

                <div
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 85,
                    height: 85,
                    backgroundColor:
                      "#f1f3f5",
                    fontSize: 38,
                  }}
                >
                  📋
                </div>

                <h5 className="fw-bold">
                  Selecciona una ficha
                </h5>

                <p className="text-muted mb-0">
                  Selecciona una ficha para
                  consultar su asistencia.
                </p>

              </div>
            )}

            {/* CARGANDO */}

            {loadingAsistencias && (
              <div className="text-center py-5">

                <div
                  className="spinner-border text-success mb-3"
                  role="status"
                >
                  <span className="visually-hidden">
                    Cargando...
                  </span>
                </div>

                <p className="text-muted mb-0">
                  Consultando asistencia...
                </p>

              </div>
            )}

            {/* SIN REGISTROS */}

            {fichaSeleccionada &&
              !loadingAsistencias &&
              asistencias.length === 0 && (
                <div className="text-center py-5">

                  <div
                    style={{
                      fontSize: 45,
                    }}
                  >
                    📭
                  </div>

                  <h5 className="fw-bold mt-3">
                    No hay registros
                  </h5>

                  <p className="text-muted mb-0">
                    Esta ficha no tiene
                    asistencias registradas.
                  </p>

                </div>
              )}

            {/* =================================================
                CONTENIDO DE ASISTENCIAS
            ================================================= */}

            {fichaSeleccionada &&
              !loadingAsistencias &&
              asistencias.length > 0 && (
                <>

                  {/* =================================================
                      BUSCADOR POR DOCUMENTO
                  ================================================= */}

                  <div
                    className="p-3 rounded-4 mb-4"
                    style={{
                      backgroundColor:
                        "#f8f9fa",
                      border:
                        "1px solid #e9ecef",
                    }}
                  >

                    <label className="form-label fw-bold">
                      🔎 Buscar aprendiz por
                      número de documento
                    </label>

                    <div className="input-group input-group-lg">

                      <span className="input-group-text bg-white">
                        🪪
                      </span>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: 1023456789"
                        value={
                          documentoBusqueda
                        }
                        onChange={(e) =>
                          setDocumentoBusqueda(
                            e.target.value
                          )
                        }
                      />

                      {documentoBusqueda && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            setDocumentoBusqueda(
                              ""
                            )
                          }
                        >
                          Limpiar
                        </button>
                      )}

                    </div>

                    <small className="text-muted">
                      Escribe el número de documento
                      completo o una parte de él.
                    </small>

                  </div>

                  {/* =================================================
                      NAVEGADOR DE DÍAS
                  ================================================= */}

                  <div
                    className="rounded-4 p-4 mb-4"
                    style={{
                      background:
                        "linear-gradient( #006b18 0%, #00851d 55%, #0a9f2e 100%)",
                      color: "white",
                    }}
                  >

                    <div className="d-flex align-items-center justify-content-between gap-3">

                      {/* BOTÓN ANTERIOR */}

                      <button
                        type="button"
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                        }}
                        onClick={() =>
                          cambiarDia(-1)
                        }
                        disabled={
                          diaActual === 0
                        }
                      >
                        ←
                      </button>

                      {/* FECHA */}

                      <div className="text-center">

                        <div
                          className="small opacity-75 mb-1"
                        >
                          Día de asistencia
                        </div>

                        <h4 className="fw-bold text-capitalize mb-1">
                          {formatearFecha(
                            fechaSeleccionada
                          )}
                        </h4>

                        <div className="small opacity-75">
                          Día{" "}
                          {diaActual + 1} de{" "}
                          {
                            diasDisponibles.length
                          }
                        </div>

                      </div>

                      {/* BOTÓN SIGUIENTE */}

                      <button
                        type="button"
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                        }}
                        onClick={() =>
                          cambiarDia(1)
                        }
                        disabled={
                          diaActual ===
                          diasDisponibles.length -
                            1
                        }
                      >
                        →
                      </button>

                    </div>

                  </div>

                  {/* =================================================
                      RESUMEN DEL DÍA
                  ================================================= */}

                  <div className="d-flex flex-wrap gap-2 mb-4">

                    <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                      {" "}
                      {
                        asistenciasDelDia.length
                      }{" "}
                      registros
                    </span>

                    {documentoBusqueda && (
                      <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                         Documento:{" "}
                        {
                          documentoBusqueda
                        }
                      </span>
                    )}

                  </div>

                  {/* =================================================
                      TABLA
                  ================================================= */}

                  {asistenciasDelDia.length >
                  0 ? (
                    <div
                      className="table-responsive rounded-4"
                      style={{
                        border:
                          "1px solid #e9ecef",
                      }}
                    >

                      <table className="table align-middle mb-0">

                        <thead
                          style={{
                            backgroundColor:
                              "#f8f9fa",
                          }}
                        >

                          <tr>

                            <th className="px-4 py-3">
                              Aprendiz
                            </th>

                            <th className="py-3">
                              Competencia
                            </th>

                            <th className="py-3">
                              Instructor
                            </th>

                            <th className="py-3 text-center">
                              Estado
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {asistenciasDelDia.map(
                            (
                              registro,
                              index
                            ) => {

                              const estado =
                                obtenerEstado(
                                  registro.Estado
                                );

                              return (
                                <tr
                                  key={
                                    registro.Id_Asi ||
                                    `${registro.Fec_Asi}-${registro.Id_Apr}-${index}`
                                  }
                                >

                                  {/* APRENDIZ */}

                                  <td className="px-4">

                                    <div className="d-flex align-items-center gap-3">

                                      <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                          width: 42,
                                          height: 42,
                                          backgroundColor:
                                            "#e9ecef",
                                          fontSize:
                                            18,
                                          flexShrink: 0,
                                        }}
                                      >
                                        👤
                                      </div>

                                      <div>

                                        <div className="fw-semibold">
                                          {registro.Aprendiz ||
                                            "Sin nombre"}
                                        </div>

                                        <small className="text-muted">
                                          CC{" "}
                                          {registro.Num_ide_Apr ||
                                            "No disponible"}
                                        </small>

                                      </div>

                                    </div>

                                  </td>

                                  {/* COMPETENCIA */}

                                  <td>

                                    <span className="fw-medium">
                                      {registro.Competencia ||
                                        "Sin competencia"}
                                    </span>

                                  </td>

                                  {/* INSTRUCTOR */}

                                  <td>

                                    <div className="d-flex align-items-center gap-2">

                                      <span>
                                        
                                      </span>

                                      <span>
                                        {registro.Instructor ||
                                          "Sin instructor"}
                                      </span>

                                    </div>

                                  </td>

                                  {/* ESTADO */}

                                  <td className="text-center">

                                    <span
                                      className={`badge rounded-pill px-3 py-2 ${estado.clase}`}
                                    >
                                      {
                                        estado.icono
                                      }{" "}
                                      {
                                        estado.texto
                                      }
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
                    <div className="text-center py-5">

                      <div
                        style={{
                          fontSize: 45,
                        }}
                      >
                    
                      </div>

                      <h5 className="fw-bold mt-3">
                        No hay resultados
                      </h5>

                      <p className="text-muted mb-0">
                        No se encontró asistencia
                        para ese documento en
                        este día.
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