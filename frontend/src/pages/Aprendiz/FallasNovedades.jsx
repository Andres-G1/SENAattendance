import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

const ETIQUETAS_TIPO = {
  falla: {
    texto: "Falla",
    color: "#dc3545",
  },
  excusa: {
    texto: "Excusa",
    color: "#0dcaf0",
  },
  retardo: {
    texto: "Retardo",
    color: "#ffc107",
  },
};

function normalizarTipo(tipo) {
  return String(tipo || "")
    .trim()
    .toLowerCase();
}

function formatearFecha(fechaISO) {
  if (!fechaISO) {
    return "Fecha no disponible";
  }

  const fecha = String(fechaISO).split("T")[0];

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return String(fechaISO);
  }

  const [anio, mes, dia] = partes;

  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const numeroMes = parseInt(mes, 10);

  if (
    isNaN(numeroMes) ||
    numeroMes < 1 ||
    numeroMes > 12
  ) {
    return String(fechaISO);
  }

  return `${parseInt(dia, 10)} de ${meses[numeroMes - 1]}, ${anio}`;
}

export default function FallasNovedades({
  onClose,
  idAprendiz,
}) {
  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idAprendiz) {
      setNovedades([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    fetch(
      `${API_BASE}/asistencia/aprendiz/${idAprendiz}/novedades`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "No se pudieron cargar tus novedades."
          );
        }

        return res.json();
      })
      .then((data) => {
        console.log(
          "Novedades recibidas:",
          data
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "El servidor no devolvió una lista de novedades válida."
          );
        }

        setNovedades(data);
      })
      .catch((err) => {
        console.error(
          "Error cargando novedades:",
          err
        );

        setError(err.message);
        setNovedades([]);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [idAprendiz]);

  const totalFallas = novedades.filter(
    (n) =>
      normalizarTipo(n.Es_Asi) === "falla"
  ).length;

  const totalExcusas = novedades.filter(
    (n) =>
      normalizarTipo(n.Es_Asi) === "excusa"
  ).length;

  const totalRetardos = novedades.filter(
    (n) =>
      normalizarTipo(n.Es_Asi) === "retardo"
  ).length;

  return (
    <div
      className="rounded-4 p-4 bg-white mt-4"
      style={{
        border: "2px solid #00851d",
      }}
    >
      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: "#E6F4D7",
              color: "#1B5E20",
            }}
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
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
              />

              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
              />

              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              />

              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
              />
            </svg>
          </div>

          <h5 className="fw-bold text-dark mb-0">
            Fallas y Novedades
          </h5>
        </div>

        {onClose && (
          <button
            className="btn-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          />
        )}
      </div>

      {/* DESCRIPCIÓN */}
      <p className="text-muted small mb-4">
        Días registrados en los que no tuviste
        asistencia normal.
      </p>

      {/* CARGANDO */}
      {cargando ? (
        <div className="text-center py-4">
          <div
            className="spinner-border"
            style={{
              color: "#00851d",
            }}
          />
        </div>
      ) : error ? (
        /* ERROR */
        <p className="text-danger text-center mb-0">
          {error}
        </p>
      ) : (
        <>
          {/* RESUMEN */}
          <div className="row g-3 mb-4">

            {/* FALLAS */}
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{
                  backgroundColor: "#f8d7da",
                }}
              >
                <div className="fs-4 fw-bold text-danger">
                  {totalFallas}
                </div>

                <div className="small text-muted">
                  Fallas
                </div>
              </div>
            </div>

            {/* EXCUSAS */}
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{
                  backgroundColor: "#cff4fc",
                }}
              >
                <div
                  className="fs-4 fw-bold"
                  style={{
                    color: "#0dcaf0",
                  }}
                >
                  {totalExcusas}
                </div>

                <div className="small text-muted">
                  Excusas
                </div>
              </div>
            </div>

            {/* RETARDOS */}
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{
                  backgroundColor: "#fff3cd",
                }}
              >
                <div
                  className="fs-4 fw-bold"
                  style={{
                    color: "#997404",
                  }}
                >
                  {totalRetardos}
                </div>

                <div className="small text-muted">
                  Retardos
                </div>
              </div>
            </div>
          </div>

          {/* SIN NOVEDADES */}
          {novedades.length === 0 ? (
            <p className="text-muted text-center mb-0">
              No tienes novedades registradas.
            </p>
          ) : (
            /* LISTADO */
            <div className="d-flex flex-column gap-3">
              {novedades.map((n) => {
                const tipo = normalizarTipo(
                  n.Es_Asi
                );

                const etiqueta =
                  ETIQUETAS_TIPO[tipo] || {
                    texto:
                      n.Es_Asi ||
                      "Desconocido",
                    color: "#6c757d",
                  };

                return (
                  <div
                    key={n.Id_Asi}
                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{
                      border:
                        "1px solid #cfe8d5",
                    }}
                  >
                    {/* ICONO */}
                    <div
                      className="p-2 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        backgroundColor:
                          "#E6F4D7",
                        color: "#1B5E20",
                      }}
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
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                        />

                        <line
                          x1="16"
                          y1="2"
                          x2="16"
                          y2="6"
                        />

                        <line
                          x1="8"
                          y1="2"
                          x2="8"
                          y2="6"
                        />

                        <line
                          x1="3"
                          y1="10"
                          x2="21"
                          y2="10"
                        />
                      </svg>
                    </div>

                    {/* INFORMACIÓN */}
                    <div className="flex-grow-1">
                      <span className="fw-semibold text-dark">
                        {formatearFecha(
                          n.Fec_Asi
                        )}
                      </span>

                      <span className="text-muted small ms-2">
                        · Ficha {n.Num_Fic}

                        {n.Competencia
                          ? ` — ${n.Competencia}`
                          : ""}
                      </span>
                    </div>

                    {/* TIPO */}
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor:
                          etiqueta.color,
                        color:
                          tipo === "retardo"
                            ? "#212529"
                            : "#fff",
                      }}
                    >
                      {etiqueta.texto}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
