import { useState, useEffect } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

const API_BASE = "http://localhost:8000";

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

export default function AsignarFicha() {
  const [fichas, setFichas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [resultados, setResultados] = useState([]);

  const [selectedFicha, setSelectedFicha] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedCompetencia, setSelectedCompetencia] = useState("");
  const [selectedResultado, setSelectedResultado] = useState("");
  const [selectedDia, setSelectedDia] = useState("");

  const [fechaInicioRA, setFechaInicioRA] = useState("");
  const [fechaFinRA, setFechaFinRA] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  // =====================================================
  // CARGAR FICHAS, INSTRUCTORES, COMPETENCIAS Y RESULTADOS
  // =====================================================

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

        if (!resFichas.ok) {
          throw new Error("No se pudieron cargar las fichas.");
        }

        if (!resInstructores.ok) {
          throw new Error("No se pudieron cargar los instructores.");
        }

        if (!resCompetencias.ok) {
          throw new Error("No se pudieron cargar las competencias.");
        }

        if (!resResultados.ok) {
          throw new Error(
            "No se pudieron cargar los resultados de aprendizaje."
          );
        }

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

  // =====================================================
  // DATOS DERIVADOS
  // =====================================================

  const fichaSeleccionada = fichas.find(
    (f) => String(f.Id_Fic) === String(selectedFicha)
  );

  // Solo los resultados que pertenecen a la competencia elegida
  const resultadosFiltrados = selectedCompetencia
    ? resultados.filter(
        (ra) => String(ra.Id_Comp) === String(selectedCompetencia)
      )
    : [];

  // =====================================================
  // HANDLERS DE CAMBIO
  // =====================================================

  const handleFichaChange = (e) => {
    setSelectedFicha(e.target.value);
    setFechaInicioRA("");
    setFechaFinRA("");
    setMensaje(null);
  };

  const handleCompetenciaChange = (e) => {
    setSelectedCompetencia(e.target.value);
    setSelectedResultado(""); // el resultado anterior ya no aplica
    setMensaje(null);
  };

  // =====================================================
  // ENVIAR ASIGNACIÓN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!selectedFicha) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una ficha.",
      });
      return;
    }

    if (!selectedInstructor) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar un instructor.",
      });
      return;
    }

    if (!selectedCompetencia) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una competencia.",
      });
      return;
    }

    if (!selectedResultado) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar un resultado de aprendizaje.",
      });
      return;
    }

    if (!selectedDia) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar un día.",
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
        texto:
          "La fecha final no puede ser anterior a la fecha inicial.",
      });
      return;
    }

    if (fichaSeleccionada) {
      const inicioFicha = String(fichaSeleccionada.Fec_inicio_Fic).slice(0, 10);
      const finFicha = String(fichaSeleccionada.Fec_Fin_Fic).slice(0, 10);

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

    // Los nombres deben coincidir con el modelo de FastAPI.
    // La competencia solo se usa para filtrar, no se envía.
    const bodyData = {
      Id_Fic: Number(selectedFicha),
      Id_Ins: Number(selectedInstructor),
      Id_RA: Number(selectedResultado),
      Dia: selectedDia,
      Fec_Inicio_RA: fechaInicioRA,
      Fec_Fin_RA: fechaFinRA,
    };

    setEnviando(true);

    try {
      const res = await fetch(`${API_BASE}/asignaciones/instructor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Error al realizar la asignación (${res.status}).`
        );
      }

      setMensaje({
        tipo: "exito",
        texto: data.mensaje || "Resultado de aprendizaje asignado correctamente.",
      });

      setSelectedFicha("");
      setSelectedInstructor("");
      setSelectedCompetencia("");
      setSelectedResultado("");
      setSelectedDia("");
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

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>
          <div
            className="rounded-4 p-4 bg-white"
            style={{ border: "2px solid #00851d" }}
          >
            {/* ENCABEZADO */}
            <div className="d-flex align-items-center gap-3 mb-3">
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
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>

              <h5 className="fw-bold text-dark mb-0">
                Asignar resultado de aprendizaje
              </h5>
            </div>

            <p className="text-muted small mb-4">
              Selecciona la ficha, el instructor, la competencia, el
              resultado de aprendizaje, el día y el período en que se
              impartirá.
            </p>

            {/* ESTADOS DE CARGA */}
            {cargando ? (
              <div className="text-muted small py-3">
                Cargando datos...
              </div>
            ) : errorCarga ? (
              <div className="alert alert-danger small mb-0">
                {errorCarga}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* MENSAJE */}
                {mensaje && (
                  <div
                    role="alert"
                    className={`alert ${
                      mensaje.tipo === "exito"
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                )}

                {/* FICHA */}
                <div className="mb-3">
                  <label
                    htmlFor="Id_Fic"
                    className="form-label small fw-medium"
                  >
                    Seleccionar ficha
                  </label>

                  <select
                    id="Id_Fic"
                    className="form-select"
                    value={selectedFicha}
                    onChange={handleFichaChange}
                    required
                  >
                    <option value="">-- Seleccione una ficha --</option>

                    {fichas.map((f) => (
                      <option key={f.Id_Fic} value={f.Id_Fic}>
                        Ficha {f.Num_Fic}
                      </option>
                    ))}
                  </select>

                  {fichaSeleccionada && (
                    <div className="mt-2 small text-muted">
                      <strong>Período de la ficha:</strong>{" "}
                      {String(fichaSeleccionada.Fec_inicio_Fic).slice(0, 10)}
                      {" → "}
                      {String(fichaSeleccionada.Fec_Fin_Fic).slice(0, 10)}
                    </div>
                  )}
                </div>

                {/* INSTRUCTOR */}
                <div className="mb-3">
                  <label
                    htmlFor="Id_Ins"
                    className="form-label small fw-medium"
                  >
                    Seleccionar instructor
                  </label>

                  <select
                    id="Id_Ins"
                    className="form-select"
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione un instructor --</option>

                    {instructores.map((i) => (
                      <option key={i.Id_Ins} value={i.Id_Ins}>
                        {i.Nom_Ins} {i.Ape_Ins} - {i.Num_ide_Ins}
                      </option>
                    ))}
                  </select>
                </div>

                {/* COMPETENCIA (FILTRO) */}
                <div className="mb-3">
                  <label
                    htmlFor="Id_Comp"
                    className="form-label small fw-medium"
                  >
                    Seleccionar competencia
                  </label>

                  <select
                    id="Id_Comp"
                    className="form-select"
                    value={selectedCompetencia}
                    onChange={handleCompetenciaChange}
                    required
                  >
                    <option value="">-- Seleccione una competencia --</option>

                    {competencias.map((c) => (
                      <option key={c.Id_Comp} value={c.Id_Comp}>
                        {c.Nom_Comp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RESULTADO DE APRENDIZAJE */}
                <div className="mb-3">
                  <label
                    htmlFor="Id_RA"
                    className="form-label small fw-medium"
                  >
                    Seleccionar resultado de aprendizaje
                  </label>

                  <select
                    id="Id_RA"
                    className="form-select"
                    value={selectedResultado}
                    onChange={(e) => setSelectedResultado(e.target.value)}
                    disabled={!selectedCompetencia}
                    required
                  >
                    <option value="">
                      {selectedCompetencia
                        ? "-- Seleccione un resultado de aprendizaje --"
                        : "-- Primero seleccione una competencia --"}
                    </option>

                    {resultadosFiltrados.map((ra) => (
                      <option key={ra.Id_RA} value={ra.Id_RA}>
                        {ra.Nom_RA}
                      </option>
                    ))}
                  </select>

                  {selectedCompetencia && resultadosFiltrados.length === 0 && (
                    <div className="form-text text-danger">
                      Esta competencia no tiene resultados de aprendizaje
                      registrados.
                    </div>
                  )}

                  {selectedResultado && (
                    <div className="form-text">
                      {resultadosFiltrados.find(
                        (ra) => String(ra.Id_RA) === String(selectedResultado)
                      )?.Des_RA || ""}
                    </div>
                  )}
                </div>

                {/* DÍA */}
                <div className="mb-3">
                  <label
                    htmlFor="Dia"
                    className="form-label small fw-medium"
                  >
                    Día en que se dicta
                  </label>

                  <select
                    id="Dia"
                    className="form-select"
                    value={selectedDia}
                    onChange={(e) => setSelectedDia(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione un día --</option>

                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FECHA INICIO */}
                <div className="mb-3">
                  <label
                    htmlFor="Fec_Inicio_RA"
                    className="form-label small fw-medium"
                  >
                    Inicio del resultado de aprendizaje
                  </label>
                  <input
                    id="Fec_Inicio_RA"
                    type="date"
                    className="form-control"
                    value={fechaInicioRA}
                    onChange={(e) => setFechaInicioRA(e.target.value)}
                    min={
                      fichaSeleccionada
                        ? String(fichaSeleccionada.Fec_inicio_Fic).slice(0, 10)
                        : undefined
                    }
                    max={
                      fichaSeleccionada
                        ? String(fichaSeleccionada.Fec_Fin_Fic).slice(0, 10)
                        : undefined
                    }
                    required
                  />

                  <div className="form-text">
                    Fecha desde la cual el instructor comienza a impartir
                    este resultado.
                  </div>
                </div>

                {/* FECHA FIN */}
                <div className="mb-4">
                  <label
                    htmlFor="Fec_Fin_RA"
                    className="form-label small fw-medium"
                  >
                    Finalización del resultado de aprendizaje
                  </label>
                  <input
                    id="Fec_Fin_RA"
                    type="date"
                    className="form-control"
                    value={fechaFinRA}
                    onChange={(e) => setFechaFinRA(e.target.value)}
                    min={
                      fechaInicioRA ||
                      (fichaSeleccionada
                        ? String(fichaSeleccionada.Fec_inicio_Fic).slice(0, 10)
                        : undefined)
                    }
                    max={
                      fichaSeleccionada
                        ? String(fichaSeleccionada.Fec_Fin_Fic).slice(0, 10)
                        : undefined
                    }
                    required
                  />

                  <div className="form-text">
                    Fecha hasta la cual el instructor impartirá este resultado.
                  </div>
                </div>

                {/* BOTÓN */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn rounded-3 w-100 fw-semibold py-2 shadow-sm text-white"
                  style={{ backgroundColor: "#00851d" }}
                >
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Asignando...
                    </>
                  ) : (
                    "Asignar resultado de aprendizaje"
                  )}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </>
  );
}