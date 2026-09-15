import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

const ETIQUETAS_TIPO = {
  falla: { texto: "Falla", color: "#dc3545" },
  excusa: { texto: "Excusa", color: "#0dcaf0" },
  retardo: { texto: "Retardo", color: "#ffc107" },
};

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}, ${anio}`;
}

export default function FallasNovedades({ onClose, idAprendiz }) {

  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idAprendiz) {
      setCargando(false);
      return;
    }

    fetch(`${API_BASE}/asistencia/aprendiz/${idAprendiz}/novedades`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron cargar tus novedades.");
        }
        return res.json();
      })
      .then((data) => setNovedades(data))
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setCargando(false));
  }, [idAprendiz]);

  const totalFallas = novedades.filter((n) => n.Es_Asi === "falla").length;
  const totalExcusas = novedades.filter((n) => n.Es_Asi === "excusa").length;
  const totalRetardos = novedades.filter((n) => n.Es_Asi === "retardo").length;

  return (
    <div
      className="rounded-4 p-4 bg-white mt-4"
      style={{ border: "2px solid #00851d" }}
    >
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="d-flex align-items-center gap-3">
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h5 className="fw-bold text-dark mb-0">Fallas y Novedades</h5>
        </div>

        {onClose && (
          <button className="btn-close" type="button" onClick={onClose} aria-label="Close"></button>
        )}
      </div>

      <p className="text-muted small mb-4">
        Días registrados en los que no tuviste asistencia normal.
      </p>

      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border" style={{ color: "#00851d" }} />
        </div>
      ) : error ? (
        <p className="text-danger text-center mb-0">{error}</p>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{ backgroundColor: "#f8d7da" }}
              >
                <div className="fs-4 fw-bold text-danger">{totalFallas}</div>
                <div className="small text-muted">Fallas</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{ backgroundColor: "#cff4fc" }}
              >
                <div className="fs-4 fw-bold" style={{ color: "#0dcaf0" }}>{totalExcusas}</div>
                <div className="small text-muted">Excusas</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div
                className="rounded-3 p-3 text-center"
                style={{ backgroundColor: "#fff3cd" }}
              >
                <div className="fs-4 fw-bold" style={{ color: "#997404" }}>{totalRetardos}</div>
                <div className="small text-muted">Retardos</div>
              </div>
            </div>
          </div>

          {novedades.length === 0 ? (
            <p className="text-muted text-center mb-0">No tienes novedades registradas.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {novedades.map((n) => {

                const etiqueta = ETIQUETAS_TIPO[n.Es_Asi] || { texto: n.Es_Asi, color: "#6c757d" };

                return (
                  <div
                    key={n.Id_Asi}
                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{ border: "1px solid #cfe8d5" }}
                  >
                    <div
                      className="p-2 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 40, height: 40, flexShrink: 0,
                        backgroundColor: "#E6F4D7", color: "#1B5E20",
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
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>

                    <div className="flex-grow-1">
                      <span className="fw-semibold text-dark text-capitalize">
                        {formatearFecha(n.Fec_Asi)}
                      </span>
                      <span className="text-muted small ms-2">
                        · Ficha {n.Num_Fic}
                        {n.Competencia ? ` — ${n.Competencia}` : ""}
                      </span>
                    </div>

                    <span
                      className="badge rounded-pill"
                      style={{ backgroundColor: etiqueta.color, color: "#fff" }}
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