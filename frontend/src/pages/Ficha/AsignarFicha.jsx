import { useState, useEffect } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";
import Dropdown from "../../components/Dropdown";

const API_BASE = "http://localhost:8000";

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// =====================================================
// ESTILOS
// =====================================================

const STYLES = `
.app-theme .af-card { overflow:visible; }
.af-icon { background:var(--app-green-soft); color:var(--app-green-dark); border-radius:14px; }
.af-section { background:#f6f8fa; border:1px solid var(--app-border); border-radius:16px; padding:1.25rem; }
.af-label { font-size:.8rem; font-weight:600; color:var(--app-navy); margin-bottom:.35rem; display:block; }
.af-pill-count { background:var(--app-green); color:#fff; font-size:.72rem; font-weight:600; padding:.2rem .6rem; border-radius:999px; }

/* Resultados elegidos */
.af-chosen { display:flex; align-items:center; gap:.75rem; background:var(--app-green-soft); border:1px solid rgba(0,133,29,.2); border-left:5px solid var(--app-green); border-radius:12px; padding:.55rem .8rem; }
.af-chosen-title { flex:1; font-size:.85rem; font-weight:600; color:var(--app-green-dark); }
.af-chosen-day { width:150px; flex-shrink:0; }
.af-remove { width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border:0; border-radius:50%; background:rgba(0,107,24,.1); color:var(--app-green-dark); font-size:1.1rem; line-height:1; transition:background .15s; }
.af-remove:hover { background:var(--app-green-dark); color:#fff; }
@media (max-width:575px) {
  .af-chosen { flex-wrap:wrap; }
  .af-chosen-title { flex-basis:100%; }
  .af-chosen-day { flex:1; width:auto; }
}

/* Lista de resultados */
.af-ra-list { max-height:320px; overflow-y:auto; padding-right:4px; }
.af-ra { display:flex; align-items:flex-start; gap:.8rem; width:100%; text-align:left; background:#fff; border:2px solid var(--app-border); border-radius:12px; padding:.8rem .9rem; transition:border-color .15s, background .15s; }
.af-ra:hover { border-color:rgba(0,133,29,.45); background:#f8fbf9; }
.af-ra.active { border-color:var(--app-green); background:var(--app-green-soft); }
.af-ra-check { width:22px; height:22px; margin-top:2px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; border:2px solid #adb5bd; background:#fff; color:#fff; font-size:.75rem; }
.af-ra.active .af-ra-check { background:var(--app-green); border-color:var(--app-green); }
.af-ra-title { display:block; font-weight:600; color:var(--app-navy); }
.af-ra.active .af-ra-title { color:var(--app-green-dark); }
.af-ra-desc { display:block; margin-top:.2rem; font-size:.82rem; color:var(--app-muted); }

/* Fechas y botón */
.af-date { border:1.5px solid #d5dee8; border-radius:10px; padding:.6rem .9rem; accent-color:var(--app-green); }
.af-date:focus { border-color:var(--app-green); box-shadow:0 0 0 .2rem rgba(0,133,29,.12); }
.af-submit { background:var(--app-green); color:#fff; border:0; border-radius:12px; font-weight:600; padding:.7rem 1.5rem; box-shadow:0 4px 14px rgba(0,107,24,.2); transition:background .15s, transform .1s; }
.af-submit:hover:not(:disabled) { background:var(--app-green-dark); transform:translateY(-1px); }
.af-submit:disabled { opacity:.7; }
`;

// =====================================================
// PÁGINA
// =====================================================

export default function AsignarFicha() {
  const [fichas, setFichas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [resultados, setResultados] = useState([]);

  const [selectedFicha, setSelectedFicha] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedCompetencia, setSelectedCompetencia] = useState("");
  const [selectedResultados, setSelectedResultados] = useState([]);
  const [diasPorRA, setDiasPorRA] = useState({});

  const [fechaInicioRA, setFechaInicioRA] = useState("");
  const [fechaFinRA, setFechaFinRA] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  // ---------- CARGAR DATOS ----------

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga(null);

      try {
        const [resFichas, resInstructores, resCompetencias, resResultados] =
          await Promise.all([
            fetch(`${API_BASE}/fichas`),
            fetch(`${API_BASE}/usuarios/instructores`),
            fetch(`${API_BASE}/competencias`),
            fetch(`${API_BASE}/resultados-aprendizaje`),
          ]);

        if (!resFichas.ok) throw new Error("No se pudieron cargar las fichas.");
        if (!resInstructores.ok)
          throw new Error("No se pudieron cargar los instructores.");
        if (!resCompetencias.ok)
          throw new Error("No se pudieron cargar las competencias.");
        if (!resResultados.ok)
          throw new Error(
            "No se pudieron cargar los resultados de aprendizaje."
          );

        const [
          dataFichas,
          dataInstructores,
          dataCompetencias,
          dataResultados,
        ] = await Promise.all([
          resFichas.json(),
          resInstructores.json(),
          resCompetencias.json(),
          resResultados.json(),
        ]);

        setFichas(dataFichas);
        setInstructores(dataInstructores);
        setCompetencias(dataCompetencias);
        setResultados(dataResultados);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setErrorCarga(
          err.message ||
            "No se pudieron cargar los datos. Verifica el backend."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // ---------- DATOS DERIVADOS ----------

  const fichaSeleccionada = fichas.find(
    (f) => String(f.Id_Fic) === String(selectedFicha)
  );

  const resultadosFiltrados = selectedCompetencia
    ? resultados.filter(
        (ra) => String(ra.Id_Comp) === String(selectedCompetencia)
      )
    : [];

  const resultadosElegidos = resultados.filter((ra) =>
    selectedResultados.includes(String(ra.Id_RA))
  );

  const opcionesFichas = fichas.map((f) => ({
    value: f.Id_Fic,
    label: `Ficha ${f.Num_Fic}`,
  }));

  const opcionesInstructores = instructores.map((i) => ({
    value: i.Id_Ins,
    label: `${i.Nom_Ins} ${i.Ape_Ins} - ${i.Num_ide_Ins}`,
  }));

  const opcionesCompetencias = competencias.map((c) => ({
    value: c.Id_Comp,
    label: c.Nom_Comp,
  }));

  const opcionesDias = DIAS_SEMANA.map((d) => ({ value: d, label: d }));

  const inicioFicha = fichaSeleccionada
    ? String(fichaSeleccionada.Fec_inicio_Fic).slice(0, 10)
    : undefined;
  const finFicha = fichaSeleccionada
    ? String(fichaSeleccionada.Fec_Fin_Fic).slice(0, 10)
    : undefined;

  // ---------- HANDLERS ----------

  const handleFichaChange = (valor) => {
    setSelectedFicha(valor);
    setFechaInicioRA("");
    setFechaFinRA("");
    setMensaje(null);
  };

  const handleCompetenciaChange = (valor) => {
    setSelectedCompetencia(valor);
    setMensaje(null);
  };

  const toggleResultado = (id) => {
    const idStr = String(id);
    setSelectedResultados((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
    setDiasPorRA((prev) => {
      const copia = { ...prev };
      delete copia[idStr];
      return copia;
    });
  };

  const cambiarDia = (id, dia) => {
    setDiasPorRA((prev) => ({ ...prev, [String(id)]: dia }));
  };

  // ---------- ENVIAR ----------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!selectedFicha) {
      setMensaje({ tipo: "error", texto: "Debes seleccionar una ficha." });
      return;
    }

    if (!selectedInstructor) {
      setMensaje({ tipo: "error", texto: "Debes seleccionar un instructor." });
      return;
    }

    if (selectedResultados.length === 0) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar al menos un resultado de aprendizaje.",
      });
      return;
    }

    const sinDia = selectedResultados.filter((id) => !diasPorRA[id]);
    if (sinDia.length > 0) {
      setMensaje({
        tipo: "error",
        texto: "Debes asignar un día a cada resultado seleccionado.",
      });
      return;
    }

    if (!fechaInicioRA || !fechaFinRA) {
      setMensaje({
        tipo: "error",
        texto: "Debes indicar las fechas de inicio y finalización.",
      });
      return;
    }

    if (fechaFinRA < fechaInicioRA) {
      setMensaje({
        tipo: "error",
        texto: "La fecha final no puede ser anterior a la fecha inicial.",
      });
      return;
    }

    if (fichaSeleccionada) {
      if (fechaInicioRA < inicioFicha) {
        setMensaje({
          tipo: "error",
          texto: `El resultado no puede comenzar antes del inicio de la ficha (${inicioFicha}).`,
        });
        return;
      }

      if (fechaFinRA > finFicha) {
        setMensaje({
          tipo: "error",
          texto: `El resultado no puede terminar después del cierre de la ficha (${finFicha}).`,
        });
        return;
      }
    }

    const bodyData = {
      Id_Fic: Number(selectedFicha),
      Id_Ins: Number(selectedInstructor),
      Asignaciones: selectedResultados.map((id) => ({
        Id_RA: Number(id),
        Dia: diasPorRA[id],
      })),
      Fec_Inicio_RA: fechaInicioRA,
      Fec_Fin_RA: fechaFinRA,
    };

    setEnviando(true);

    try {
      const res = await fetch(`${API_BASE}/asignaciones/instructor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let motivo = `Error al realizar la asignación (${res.status}).`;

        if (typeof data.detail === "string") {
          motivo = data.detail;
        } else if (Array.isArray(data.detail)) {
          motivo = data.detail
            .map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`)
            .join(" | ");
        }

        throw new Error(motivo);
      }

      setMensaje({
        tipo: "exito",
        texto: data.mensaje || "Asignaciones creadas correctamente.",
      });

      setSelectedFicha("");
      setSelectedInstructor("");
      setSelectedCompetencia("");
      setSelectedResultados([]);
      setDiasPorRA({});
      setFechaInicioRA("");
      setFechaFinRA("");
    } catch (err) {
      console.error("Error al asignar:", err);
      setMensaje({
        tipo: "error",
        texto: err.message || "No se pudo conectar con el servidor.",
      });
    } finally {
      setEnviando(false);
    }
  };

  // ---------- RENDER ----------

  return (
    <>
      <style>{STYLES}</style>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 920 }}>
          <div className="card page-card af-card p-3 p-md-4">
            {/* ENCABEZADO */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="af-icon p-3">
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
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>

              <div>
                <h5 className="fw-bold text-dark mb-0">
                  Asignar resultados de aprendizaje
                </h5>
                <p className="text-muted small mb-0">
                  Elige la ficha, el instructor, los resultados (cada uno con su
                  día) y el período.
                </p>
              </div>
            </div>

            <hr className="mt-3 mb-4" style={{ opacity: 0.1 }} />

            {cargando ? (
              <div className="text-muted small py-3">Cargando datos...</div>
            ) : errorCarga ? (
              <div className="alert alert-danger small mb-0">{errorCarga}</div>
            ) : (
              <form onSubmit={handleSubmit} className="row g-3">
                {mensaje && (
                  <div
                    role="alert"
                    className={`alert col-12 mb-0 ${
                      mensaje.tipo === "exito"
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                )}

                {/* FICHA */}
                <div className="col-12 col-md-6">
                  <label htmlFor="Id_Fic" className="af-label">
                    Ficha
                  </label>
                  <Dropdown
                    id="Id_Fic"
                    value={selectedFicha}
                    onChange={handleFichaChange}
                    options={opcionesFichas}
                    placeholder="Seleccione una ficha"
                    searchable
                  />

                  {fichaSeleccionada && (
                    <div className="mt-2 small text-muted">
                      <strong>Período de la ficha:</strong> {inicioFicha}
                      {" → "}
                      {finFicha}
                    </div>
                  )}
                </div>

                {/* INSTRUCTOR */}
                <div className="col-12 col-md-6">
                  <label htmlFor="Id_Ins" className="af-label">
                    Instructor
                  </label>
                  <Dropdown
                    id="Id_Ins"
                    value={selectedInstructor}
                    onChange={setSelectedInstructor}
                    options={opcionesInstructores}
                    placeholder="Seleccione un instructor"
                    searchable
                  />
                </div>

                {/* RESULTADOS */}
                <div className="col-12">
                  <section className="af-section">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-semibold text-dark mb-0">
                        Resultados de aprendizaje
                      </h6>
                      {selectedResultados.length > 0 && (
                        <span className="af-pill-count">
                          {selectedResultados.length} seleccionado(s)
                        </span>
                      )}
                    </div>
                    <p className="small text-muted mb-3">
                      Filtra por competencia, marca los resultados y elige el
                      día de cada uno. Puedes repetir el mismo día.
                    </p>

                    {resultadosElegidos.length > 0 && (
                      <div className="d-flex flex-column gap-2 mb-3">
                        {resultadosElegidos.map((ra) => (
                          <div key={ra.Id_RA} className="af-chosen">
                            <span className="af-chosen-title">{ra.Nom_RA}</span>

                            <div className="af-chosen-day">
                              <Dropdown
                                small
                                value={diasPorRA[String(ra.Id_RA)] || ""}
                                onChange={(d) => cambiarDia(ra.Id_RA, d)}
                                options={opcionesDias}
                                placeholder="Día..."
                              />
                            </div>

                            <button
                              type="button"
                              aria-label="Quitar"
                              className="af-remove"
                              onClick={() => toggleResultado(ra.Id_RA)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label htmlFor="Id_Comp" className="af-label">
                      Competencia
                    </label>
                    <div className="mb-3">
                      <Dropdown
                        id="Id_Comp"
                        value={selectedCompetencia}
                        onChange={handleCompetenciaChange}
                        options={opcionesCompetencias}
                        placeholder="Seleccione una competencia"
                        searchable
                      />
                    </div>

                    {!selectedCompetencia ? (
                      <div className="text-muted small">
                        Selecciona una competencia para ver sus resultados.
                      </div>
                    ) : resultadosFiltrados.length === 0 ? (
                      <div className="text-danger small">
                        Esta competencia no tiene resultados de aprendizaje
                        registrados.
                      </div>
                    ) : (
                      <div className="af-ra-list d-flex flex-column gap-2">
                        {resultadosFiltrados.map((ra) => {
                          const activo = selectedResultados.includes(
                            String(ra.Id_RA)
                          );

                          return (
                            <button
                              type="button"
                              key={ra.Id_RA}
                              onClick={() => toggleResultado(ra.Id_RA)}
                              aria-pressed={activo}
                              className={`af-ra ${activo ? "active" : ""}`}
                            >
                              <span className="af-ra-check">
                                {activo && "✓"}
                              </span>

                              <span>
                                <span className="af-ra-title">{ra.Nom_RA}</span>
                                {ra.Des_RA && (
                                  <span className="af-ra-desc">
                                    {ra.Des_RA}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* PROGRAMACIÓN */}
                <div className="col-12">
                  <section className="af-section">
                    <h6 className="fw-semibold text-dark mb-1">Programación</h6>
                    <p className="small text-muted mb-3">
                      Define las fechas del período.
                    </p>

                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="Fec_Inicio_RA" className="af-label">
                          Fecha de inicio
                        </label>
                        <input
                          id="Fec_Inicio_RA"
                          type="date"
                          className="form-control af-date"
                          value={fechaInicioRA}
                          onChange={(e) => setFechaInicioRA(e.target.value)}
                          min={inicioFicha}
                          max={finFicha}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="Fec_Fin_RA" className="af-label">
                          Fecha de finalización
                        </label>
                        <input
                          id="Fec_Fin_RA"
                          type="date"
                          className="form-control af-date"
                          value={fechaFinRA}
                          onChange={(e) => setFechaFinRA(e.target.value)}
                          min={fechaInicioRA || inicioFicha}
                          max={finFicha}
                          required
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* BOTÓN */}
                <div className="col-12 d-flex justify-content-md-end">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="af-submit w-100 col-md-6"
                  >
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Asignando...
                      </>
                    ) : (
                      "Asignar resultados de aprendizaje"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </>
  );
}