
const MOCK_FALLAS = [
  {
    id: 1,
    fecha: "11/08/2026",
    ficha: "2825431 - ADSI",
  },
  {
    id: 2,
    fecha: "19/08/2026",
    ficha: "2825431 - ADSI",
  },
  {
    id: 3,
    fecha: "27/08/2026",
    ficha: "2825431 - ADSI",
  },
  {
    id: 4,
    fecha: "31/08/2026",
    ficha: "2825431 - ADSI",
  },
];

function formatearFecha(fechaStr) {
  const [dia, mes, anio] = fechaStr.split("/");
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}, ${anio}`;
}

export default function FallasNovedades({ onClose }) {
  const total = MOCK_FALLAS.length;

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
        Días registrados en los que no asististe a formación.
      </p>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="rounded-3 p-3 text-center"
            style={{ backgroundColor: "#E6F4D7" }}
          >
            <div className="fs-4 fw-bold" style={{ color: "#1B5E20" }}>
              {total}
            </div>
            <div className="small text-muted">Registradas</div>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-muted text-center mb-0">No tienes fallas registradas.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {MOCK_FALLAS.map((f) => (
            <div
              key={f.id}
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ border: "1px solid #cfe8d5" }}
            >
              <div
                className="p-2 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 40, height: 40, flexShrink: 0, backgroundColor: "#E6F4D7", color: "#1B5E20" }}
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
                  {formatearFecha(f.fecha)}
                </span>
                <span className="text-muted small ms-2">· Ficha {f.ficha}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}