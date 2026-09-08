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

  const [selectedFicha, setSelectedFicha] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedCompetencia, setSelectedCompetencia] = useState("");
  const [selectedDia, setSelectedDia] = useState("");

  // NUEVAS FECHAS
  const [fechaInicioComp, setFechaInicioComp] = useState("");
  const [fechaFinComp, setFechaFinComp] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  // --------------------------------------------------
  // CARGAR DATOS
  // --------------------------------------------------
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga(null);

      try {
        const [
          resFichas,
          resInstructores,
          resCompetencias,
        ] = await Promise.all([
          fetch(`${API_BASE}/fichas`),
          fetch(`${API_BASE}/usuarios/instructores`),
          fetch(`${API_BASE}/competencias`),
        ]);

        if (!resFichas.ok) {
          throw new Error(
            `Error al cargar fichas (status ${resFichas.status})`
          );
        }

        if (!resInstructores.ok) {
          throw new Error(
            `Error al cargar instructores (status ${resInstructores.status})`
          );
        }

        if (!resCompetencias.ok) {
          throw new Error(
            `Error al cargar competencias (status ${resCompetencias.status})`
          );
        }

        const [
          dataFichas,
          dataInstructores,
          dataCompetencias,
        ] = await Promise.all([
          resFichas.json(),
          resInstructores.json(),
          resCompetencias.json(),
        ]);

        setFichas(dataFichas);
        setInstructores(dataInstructores);
        setCompetencias(dataCompetencias);

      } catch (err) {
        console.error(
          "Error cargando datos de AsignarFicha:",
          err
        );

        setErrorCarga(
          err.message ||
            "No se pudieron cargar los datos. Verifica que el backend esté corriendo."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // --------------------------------------------------
  // OBTENER FICHA SELECCIONADA
  // --------------------------------------------------
  const fichaSeleccionada = fichas.find(
    (f) => String(f.Id_Fic) === String(selectedFicha)
  );

  // --------------------------------------------------
  // CAMBIAR FICHA
  // --------------------------------------------------
  const handleFichaChange = (e) => {
    const idFicha = e.target.value;

    setSelectedFicha(idFicha);

    // Cuando cambia la ficha, limpiamos las fechas
    setFechaInicioComp("");
    setFechaFinComp("");
    setMensaje(null);
  };

  // --------------------------------------------------
  // ENVIAR ASIGNACIÓN
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje(null);

    // ----------------------------------------------
    // VALIDACIONES
    // ----------------------------------------------

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

    if (!selectedDia) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar un día.",
      });
      return;
    }

    if (!fechaInicioComp || !fechaFinComp) {
      setMensaje({
        tipo: "error",
        texto: "Debes indicar la fecha de inicio y finalización de la competencia.",
      });
      return;
    }

    // ----------------------------------------------
    // VALIDAR QUE LA FECHA FINAL SEA MAYOR
    // QUE LA FECHA INICIAL
    // ----------------------------------------------

    if (fechaFinComp < fechaInicioComp) {
      setMensaje({
        tipo: "error",
        texto: "La fecha final de la competencia no puede ser anterior a la fecha inicial.",
      });
      return;
    }

    // ----------------------------------------------
    // VALIDAR PERÍODO DE LA FICHA
    // ----------------------------------------------

    if (fichaSeleccionada) {
      const inicioFicha = fichaSeleccionada.Fec_inicio_Fic;
      const finFicha = fichaSeleccionada.Fec_Fin_Fic;

      if (fechaInicioComp < inicioFicha) {
        setMensaje({
          tipo: "error",
          texto: `La competencia no puede comenzar antes del inicio de la ficha (${inicioFicha}).`,
        });
        return;
      }

      if (fechaFinComp > finFicha) {
        setMensaje({
          tipo: "error",
          texto: `La competencia no puede terminar después del cierre de la ficha (${finFicha}).`,
        });
        return;
      }
    }

    // ----------------------------------------------
    // BODY
    // ----------------------------------------------

    const bodyData = {
      Id_Fic: parseInt(selectedFicha),
      Id_Ins: parseInt(selectedInstructor),
      Id_Comp: parseInt(selectedCompetencia),
      Dia: selectedDia,

      // NUEVAS FECHAS
      Fec_Inicio_Comp: fechaInicioComp,
      Fec_Fin_Comp: fechaFinComp,
    };

    console.log("Datos enviados:", bodyData);

    setEnviando(true);

    try {
      const res = await fetch(
        `${API_BASE}/asignaciones/instructor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMensaje({
          tipo: "exito",
          texto:
            data.mensaje ||
            "Asignación realizada correctamente.",
        });

        // Limpiar formulario
        setSelectedFicha("");
        setSelectedInstructor("");
        setSelectedCompetencia("");
        setSelectedDia("");
        setFechaInicioComp("");
        setFechaFinComp("");

      } else {
        setMensaje({
          tipo: "error",
          texto:
            data.detail ||
            `Error al realizar la asignación (status ${res.status})`,
        });
      }

    } catch (err) {
      console.error(
        "Error en la asignación:",
        err
      );

      setMensaje({
        tipo: "error",
        texto:
          "No se pudo conectar con el servidor.",
      });

    } finally {
      setEnviando(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">

        <main
          className="container"
          style={{ maxWidth: 700 }}
        >

          <div
            className="rounded-4 p-4 bg-white"
            style={{
              border: "2px solid #00851d",
            }}
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
                Asignar Instructor a Ficha
              </h5>

            </div>

            <p className="text-muted small mb-4">
              Selecciona la ficha, el instructor, la competencia,
              el día y el período en que se impartirá la competencia.
            </p>

            {/* CARGANDO */}
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
                    className={
                      `small mb-3 ${
                        mensaje.tipo === "exito"
                          ? "text-success"
                          : "text-danger"
                      }`
                    }
                  >
                    {mensaje.tipo === "exito"
                      ? "✓ "
                      : "⚠ "}

                    {mensaje.texto}
                  </div>
                )}

                {/* FICHA */}
                <div className="mb-3">

                  <label className="form-label small fw-medium">
                    Seleccionar Ficha
                  </label>

                  <select
                    className="form-select"
                    value={selectedFicha}
                    onChange={handleFichaChange}
                    required
                  >

                    <option value="">
                      -- Seleccione una Ficha --
                    </option>

                    {fichas.map((f) => (

                      <option
                        key={f.Id_Fic}
                        value={f.Id_Fic}
                      >
                        Ficha {f.Num_Fic} ({f.Jor_Fic})
                      </option>

                    ))}

                  </select>

                  {/* MOSTRAR PERÍODO DE LA FICHA */}
                  {fichaSeleccionada && (
                    <div className="mt-2 small text-muted">
                      <strong>Período de la ficha:</strong>{" "}
                      {fichaSeleccionada.Fec_inicio_Fic}
                      {" → "}
                      {fichaSeleccionada.Fec_Fin_Fic}
                    </div>
                  )}

                </div>

                {/* INSTRUCTOR */}
                <div className="mb-3">

                  <label className="form-label small fw-medium">
                    Seleccionar Instructor
                  </label>

                  <select
                    className="form-select"
                    value={selectedInstructor}
                    onChange={(e) =>
                      setSelectedInstructor(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      -- Seleccione --
                    </option>

                    {instructores.map((i) => (

                      <option
                        key={i.Id_Ins}
                        value={i.Id_Ins}
                      >
                        {i.Nom_Ins} {i.Ape_Ins} -{" "}
                        {i.Num_ide_Ins}
                      </option>

                    ))}

                  </select>

                </div>

                {/* COMPETENCIA */}
                <div className="mb-3">

                  <label className="form-label small fw-medium">
                    Seleccionar Competencia
                  </label>

                  <select
                    className="form-select"
                    value={selectedCompetencia}
                    onChange={(e) =>
                      setSelectedCompetencia(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      -- Seleccione una Competencia --
                    </option>

                    {competencias.map((c) => (

                      <option
                        key={c.Id_Comp}
                        value={c.Id_Comp}
                      >
                        {c.Nom_Comp}
                      </option>

                    ))}

                  </select>

                </div>

                {/* DÍA */}
                <div className="mb-3">

                  <label className="form-label small fw-medium">
                    Día en que se dicta
                  </label>

                  <select
                    className="form-select"
                    value={selectedDia}
                    onChange={(e) =>
                      setSelectedDia(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      -- Seleccione un Día --
                    </option>

                    {DIAS_SEMANA.map((dia) => (

                      <option
                        key={dia}
                        value={dia}
                      >
                        {dia}
                      </option>

                    ))}

                  </select>

                </div>

                {/* FECHA INICIO */}
                <div className="mb-3">

                  <label className="form-label small fw-medium">
                    Inicio de la competencia
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={fechaInicioComp}
                    onChange={(e) =>
                      setFechaInicioComp(
                        e.target.value
                      )
                    }
                    min={
                      fichaSeleccionada?.Fec_inicio_Fic ||
                      undefined
                    }
                    max={
                      fichaSeleccionada?.Fec_Fin_Fic ||
                      undefined
                    }
                    required
                  />

                  <div className="form-text">
                    Fecha desde la cual el instructor comienza
                    a impartir esta competencia.
                  </div>

                </div>

                {/* FECHA FIN */}
                <div className="mb-4">

                  <label className="form-label small fw-medium">
                    Finalización de la competencia
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={fechaFinComp}
                    onChange={(e) =>
                      setFechaFinComp(
                        e.target.value
                      )
                    }
                    min={
                      fechaInicioComp ||
                      fichaSeleccionada?.Fec_inicio_Fic ||
                      undefined
                    }
                    max={
                      fichaSeleccionada?.Fec_Fin_Fic ||
                      undefined
                    }
                    required
                  />

                  <div className="form-text">
                    Fecha hasta la cual el instructor
                    impartirá esta competencia.
                  </div>

                </div>

                {/* BOTÓN */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn rounded-3 w-100 fw-semibold py-2 shadow-sm text-white"
                  style={{
                    backgroundColor: "#00851d",
                  }}
                >

                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Asignando...
                    </>
                  ) : (
                    "Asignar Instructor"
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
