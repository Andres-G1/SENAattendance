/**
 * FallasNovedades.jsx
 * Sección "Fallas y Novedades" para el panel del aprendiz.
 *
 * ⚠️ SOLO FRONTEND por ahora: los datos vienen de MOCK_FALLAS.
 * Cuando el back esté listo, reemplazar el array por un fetch a
 * algo como GET /api/aprendiz/{id}/fallas y mapear la respuesta
 * al mismo shape: { id, fecha, ficha, tipo, estado, motivo }
 */

const MOCK_FALLAS = [
  {
    id: 1,
    fecha: "11/08/2026",
    ficha: "2825431 - ADSI",
    tipo: "Falla",
    estado: "No justificada",
    badge: "bg-danger",
    motivo: null,
  },
  {
    id: 2,
    fecha: "19/08/2026",
    ficha: "2825431 - ADSI",
    tipo: "Falla",
    estado: "Pendiente de revisión",
    badge: "bg-warning text-dark",
    motivo: "Cita médica - soporte cargado, esperando revisión del instructor",
  },
  {
    id: 3,
    fecha: "27/08/2026",
    ficha: "2825431 - ADSI",
    tipo: "Novedad",
    estado: "Justificada",
    badge: "bg-success",
    motivo: "Incapacidad médica aprobada",
  },
  {
    id: 4,
    fecha: "31/08/2026",
    ficha: "2825431 - ADSI",
    tipo: "Falla",
    estado: "Pendiente de revisión",
    badge: "bg-warning text-dark",
    motivo: "Excusa por calamidad doméstica - en revisión",
  },
];

export default function FallasNovedades({ onClose }) {
  const total = MOCK_FALLAS.length;
  const noJustificadas = MOCK_FALLAS.filter((f) => f.estado === "No justificada").length;
  const pendientes = MOCK_FALLAS.filter((f) => f.estado === "Pendiente de revisión").length;
  const justificadas = MOCK_FALLAS.filter((f) => f.estado === "Justificada").length;

  return (
    <div className="card border-0 shadow-sm p-4 bg-white rounded-4 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Fallas y Novedades</h5>
        {onClose && (
          <button className="btn-close" type="button" onClick={onClose} aria-label="Close"></button>
        )}
      </div>

      <div className="row g-3 mb-4 text-center">
        <div className="col-6 col-md-3">
          <div className="border rounded-3 p-3">
            <div className="fs-4 fw-bold">{total}</div>
            <div className="small text-muted">Registradas</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded-3 p-3">
            <div className="fs-4 fw-bold text-danger">{noJustificadas}</div>
            <div className="small text-muted">No justificadas</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded-3 p-3">
            <div className="fs-4 fw-bold text-warning">{pendientes}</div>
            <div className="small text-muted">Pendientes</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded-3 p-3">
            <div className="fs-4 fw-bold text-success">{justificadas}</div>
            <div className="small text-muted">Justificadas</div>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-muted text-center mb-0">No tienes fallas registradas.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr className="small text-uppercase">
                <th>Fecha</th>
                <th>Ficha</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Motivo / Excusa</th>
              </tr>
            </thead>
            <tbody className="small">
              {MOCK_FALLAS.map((f) => (
                <tr key={f.id}>
                  <td>{f.fecha}</td>
                  <td>{f.ficha}</td>
                  <td>{f.tipo}</td>
                  <td>
                    <span className={`badge ${f.badge}`}>{f.estado}</span>
                  </td>
                  <td className="text-muted">{f.motivo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}