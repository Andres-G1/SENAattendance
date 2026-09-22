import { useEffect, useState } from "react";

import InstructorNavbar from "/src/components/navbars/InstructorNavbar.jsx";

const API_BASE = "http://localhost:8000";

// =====================================================
// ESTADOS DE ASISTENCIA
// =====================================================

const ESTADOS = [
  {
    valor: "presente",
    nombre: "Presente",
    color: "#198754",
    texto: "#fff",
  },
  {
    valor: "retardo",
    nombre: "Retardo",
    color: "#ffc107",
    texto: "#000",
  },
  {
    valor: "falla",
    nombre: "Falla",
    color: "#dc3545",
    texto: "#fff",
  },
  {
    valor: "excusa",
    nombre: "Excusa",
    color: "#0dcaf0",
    texto: "#000",
  },
];

const A_BACKEND = {
  presente: "Presente",
  retardo: "Retardo",
  falla: "Falla",
  excusa: "Excusa",
};

const DESDE_BACKEND = {
  Presente: "presente",
  Retardo: "retardo",
  Falla: "falla",
  Excusa: "excusa",
};

// =====================================================
// COLORES DEL SEMÁFORO
// =====================================================

const COLOR_SEMAFORO = {
  ROJO: {
    fondo: "#dc3545",
    texto: "#fff",
  },
  AMARILLO: {
    fondo: "#ffc107",
    texto: "#000",
  },
  VERDE: {
    fondo: "#198754",
    texto: "#fff",
  },
};

// =====================================================
// DÍAS DE LA SEMANA
// =====================================================

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

// =====================================================
// FUNCIONES PARA FECHAS
// =====================================================

function obtenerDiaSemana(fecha) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.split("-");

  const fechaLocal = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
  );

  return DIAS_SEMANA[fechaLocal.getDay()];
}

function normalizarDia(dia) {
  if (!dia) return "";

  return dia
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Convierte una fecha Date a YYYY-MM-DD
function convertirAISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

// Obtiene la fecha de hoy
function obtenerFechaHoy() {
  return convertirAISO(new Date());
}

// Obtiene el índice del día de la semana
function obtenerIndiceDia(dia) {
  const diaNormalizado = normalizarDia(dia);

  return DIAS_SEMANA.findIndex(
    (diaSemana) =>
      normalizarDia(diaSemana) === diaNormalizado
  );
}

// =====================================================
// FUNCIONES PARA EL PERÍODO DE LA COMPETENCIA
// =====================================================

// Convierte cualquier formato de fecha recibido
// por el backend a YYYY-MM-DD
function soloFecha(valor) {
  if (!valor) return "";

  return valor.toString().slice(0, 10);
}

// Suma o resta días a una fecha YYYY-MM-DD
function sumarDias(fecha, cantidad) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.split("-");

  const fechaLocal = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
  );

  fechaLocal.setDate(
    fechaLocal.getDate() + cantidad
  );

  return convertirAISO(fechaLocal);
}

// Obtiene las fechas de inicio y fin
// de la competencia seleccionada
function obtenerLimitesPeriodo(asignacion) {
  if (!asignacion) {
    return {
      inicio: "",
      fin: "",
    };
  }

  return {
    inicio: soloFecha(
      asignacion.Fec_Inicio_Comp
    ),
    fin: soloFecha(
      asignacion.Fec_Fin_Comp
    ),
  };
}

// =====================================================
// FECHA INICIAL
// =====================================================

// Busca la fecha más reciente correspondiente
// al día de la clase, pero respetando el período
// de la competencia.
//
// Ejemplo:
// Competencia: 01/09/2026 - 30/10/2026
// Día: martes
//
// Si hoy es martes 22/09/2026:
// devuelve 22/09/2026.
//
// Si hoy es 29/09/2026:
// devuelve 29/09/2026.
//
// Si el período ya terminó:
// devuelve el último martes que esté dentro
// del período.
//
// Si todavía no ha comenzado:
// devuelve la primera fecha válida solamente
// si no es futura.

function obtenerFechaInicial(asignacion) {
  const indicePermitido =
    obtenerIndiceDia(asignacion?.Dia);

  if (indicePermitido === -1) {
    return "";
  }

  const { inicio, fin } =
    obtenerLimitesPeriodo(asignacion);

  const hoy = obtenerFechaHoy();

  // Si no existen fechas del período,
  // conserva el comportamiento anterior.
  if (!inicio && !fin) {
    const diaHoy = new Date().getDay();

    let diferencia =
      diaHoy - indicePermitido;

    if (diferencia < 0) {
      diferencia += 7;
    }

    const fechaInicial = new Date();

    fechaInicial.setDate(
      fechaInicial.getDate() - diferencia
    );

    return convertirAISO(fechaInicial);
  }

  // El límite superior nunca será una fecha futura.
  let limiteSuperior = hoy;

  if (fin && fin < limiteSuperior) {
    limiteSuperior = fin;
  }

  // Si la competencia todavía no empieza,
  // no mostramos una fecha futura.
  if (inicio && inicio > hoy) {
    return "";
  }

  // Buscamos hacia atrás hasta 6 días
  // para encontrar el día correspondiente.
  for (let i = 0; i <= 6; i++) {
    const fechaCandidata =
      sumarDias(limiteSuperior, -i);

    if (
      inicio &&
      fechaCandidata < inicio
    ) {
      break;
    }

    if (
      normalizarDia(
        obtenerDiaSemana(fechaCandidata)
      ) === normalizarDia(asignacion.Dia)
    ) {
      return fechaCandidata;
    }
  }

  return "";
}

// =====================================================
// CAMBIAR SEMANA
// =====================================================

function cambiarFechaPorSemana(
  fechaActual,
  cantidadSemanas
) {
  if (!fechaActual) return "";

  const [anio, mes, dia] =
    fechaActual.split("-");

  const fecha = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
  );

  fecha.setDate(
    fecha.getDate() +
      cantidadSemanas * 7
  );

  return convertirAISO(fecha);
}

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "";

  const [anio, mes, dia] =
    fecha.split("-");

  const fechaLocal = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
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
}

// =====================================================
// COMPONENTE
// =====================================================

export default function InstructorAsistencia() {
  const nombreCompleto =
    localStorage.getItem("firstName") || "";

  const firstName =
    nombreCompleto.split(" ")[0];

  const idInstructor =
    localStorage.getItem("user_id");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [asignaciones, setAsignaciones] =
    useState([]);

  const [fichaSeleccionada, setFichaSeleccionada] =
    useState(null);

  const [selectedAsignacion, setSelectedAsignacion] =
    useState(null);

  const [fecha, setFecha] =
    useState("");

  const [aprendices, setAprendices] =
    useState([]);

  const [estados, setEstados] =
    useState({});

  const [estadosAprendices, setEstadosAprendices] =
    useState({});

  const [cargandoAsignaciones, setCargandoAsignaciones] =
    useState(true);

  const [cargandoAprendices, setCargandoAprendices] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState(null);

  // =====================================================
  // OBTENER FICHAS DEL INSTRUCTOR
  // =====================================================

  useEffect(() => {
    if (!idInstructor) {
      setCargandoAsignaciones(false);
      return;
    }

    fetch(
      `${API_BASE}/asistencia/instructor/${idInstructor}/asignaciones`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "No se pudieron cargar las fichas"
          );
        }

        return res.json();
      })
      .then((data) => {
        console.log(
          "Asignaciones:",
          data
        );

        setAsignaciones(data);
      })
      .catch((error) => {
        console.error(error);

        setMensaje({
          tipo: "error",
          texto:
            "No se pudieron cargar las fichas asignadas.",
        });
      })
      .finally(() => {
        setCargandoAsignaciones(false);
      });
  }, [idInstructor]);

  // =====================================================
  // OBTENER FICHAS ÚNICAS
  // =====================================================

  const fichas = [];

  asignaciones.forEach(
    (asignacion) => {
      const existe = fichas.some(
        (ficha) =>
          ficha.Id_Fic ===
          asignacion.Id_Fic
      );

      if (!existe) {
        fichas.push(asignacion);
      }
    }
  );

  // =====================================================
  // SELECCIONAR FICHA
  // =====================================================

  function seleccionarFicha(ficha) {
    setFichaSeleccionada(ficha);
    setSelectedAsignacion(null);
    setFecha("");
    setAprendices([]);
    setEstados({});
    setEstadosAprendices({});
    setMensaje(null);
  }

  // =====================================================
  // ASIGNACIONES DE LA FICHA
  // =====================================================

  const asignacionesFicha =
    fichaSeleccionada
      ? asignaciones.filter(
          (asignacion) =>
            asignacion.Id_Fic ===
            fichaSeleccionada.Id_Fic
        )
      : [];

  // =====================================================
  // SELECCIONAR CLASE
  // =====================================================

  function seleccionarAsignacion(
    asignacion
  ) {
    setSelectedAsignacion(
      asignacion
    );

    // La fecha se obtiene automáticamente
    // respetando el período de la competencia.
    const fechaInicial =
      obtenerFechaInicial(
        asignacion
      );

    setFecha(fechaInicial);

    setAprendices([]);
    setEstados({});
    setEstadosAprendices({});
    setMensaje(null);
  }

  // =====================================================
  // CAMBIAR DÍA DE ASISTENCIA
  // =====================================================

  function cambiarDia(direccion) {
    if (
      !selectedAsignacion ||
      !fecha
    ) {
      return;
    }

    const nuevaFecha =
      cambiarFechaPorSemana(
        fecha,
        direccion
      );

    const {
      inicio,
      fin,
    } = obtenerLimitesPeriodo(
      selectedAsignacion
    );

    // No permitir fechas anteriores
    // al inicio de la competencia.
    if (
      inicio &&
      nuevaFecha < inicio
    ) {
      setMensaje({
        tipo: "error",
        texto:
          "No puedes retroceder más. Esta fecha está fuera del período de la competencia.",
      });

      return;
    }

    // No permitir fechas posteriores
    // al final de la competencia.
    if (
      fin &&
      nuevaFecha > fin
    ) {
      setMensaje({
        tipo: "error",
        texto:
          "No puedes avanzar más. Esta fecha está fuera del período de la competencia.",
      });

      return;
    }

    // También verificamos que siga siendo
    // el día de formación correcto.
    const diaNuevaFecha =
      normalizarDia(
        obtenerDiaSemana(
          nuevaFecha
        )
      );

    const diaPermitido =
      normalizarDia(
        selectedAsignacion.Dia
      );

    if (
      diaNuevaFecha !==
      diaPermitido
    ) {
      return;
    }

    setMensaje(null);
    setFecha(nuevaFecha);
  }

  // =====================================================
  // CARGAR APRENDICES CUANDO CAMBIA LA FECHA
  // =====================================================

  useEffect(() => {
    if (
      !selectedAsignacion ||
      !fecha
    ) {
      return;
    }

    cargarClase();
  }, [
    fecha,
    selectedAsignacion,
  ]);

  // =====================================================
  // CARGAR APRENDICES + ASISTENCIA EXISTENTE
  // =====================================================

  async function cargarClase() {
    setCargandoAprendices(true);
    setMensaje(null);

    try {
      const url =
        `${API_BASE}/asistencia/clase/` +
        `${selectedAsignacion.Id_Fic}/` +
        `${selectedAsignacion.Id_Ins}/` +
        `${selectedAsignacion.Id_Comp}/` +
        `${encodeURIComponent(
          selectedAsignacion.Dia
        )}/` +
        `${fecha}`;

      console.log(
        "Cargando:",
        url
      );

      const response =
        await fetch(url);

      if (!response.ok) {
        let error;

        try {
          error =
            await response.json();
        } catch {
          error = {};
        }

        throw new Error(
          error.detail ||
            "No se pudo cargar la clase."
        );
      }

      const data =
        await response.json();

      setAprendices(data);

      // =================================================
      // CARGAR ESTADOS EXISTENTES
      // =================================================

      const nuevosEstados = {};

      data.forEach((aprendiz) => {
        nuevosEstados[
          aprendiz.Id_Apr
        ] =
          DESDE_BACKEND[
            aprendiz.Es_Asi
          ] || "presente";
      });

      setEstados(nuevosEstados);

      // =================================================
      // CARGAR SEMÁFOROS
      // =================================================

      const nuevosSemaforos = {};

      await Promise.all(
        data.map(
          async (aprendiz) => {
            try {
              const res =
                await fetch(
                  `${API_BASE}/asistencia/aprendiz/${aprendiz.Id_Apr}/estado`
                );

              if (res.ok) {
                nuevosSemaforos[
                  aprendiz.Id_Apr
                ] =
                  await res.json();
              }
            } catch {
              // No interrumpe la carga
            }
          }
        )
      );

      setEstadosAprendices(
        nuevosSemaforos
      );
    } catch (error) {
      console.error(error);

      setAprendices([]);
      setEstados({});
      setEstadosAprendices({});

      setMensaje({
        tipo: "error",
        texto: error.message,
      });
    } finally {
      setCargandoAprendices(false);
    }
  }

  // =====================================================
  // CAMBIAR ESTADO DE UN APRENDIZ
  // =====================================================

  function cambiarEstado(
    Id_Apr,
    estado
  ) {
    setEstados((prev) => ({
      ...prev,
      [Id_Apr]: estado,
    }));
  }

  // =====================================================
  // GUARDAR ASISTENCIA
  // =====================================================

  async function guardarAsistencia() {
    if (!selectedAsignacion) {
      setMensaje({
        tipo: "error",
        texto:
          "Selecciona una clase.",
      });

      return;
    }

    if (!fecha) {
      setMensaje({
        tipo: "error",
        texto:
          "No se pudo determinar la fecha de asistencia.",
      });

      return;
    }

    // =================================================
    // VALIDAR PERÍODO DE LA COMPETENCIA
    // =================================================

    const {
      inicio,
      fin,
    } = obtenerLimitesPeriodo(
      selectedAsignacion
    );

    if (
      (inicio && fecha < inicio) ||
      (fin && fecha > fin)
    ) {
      setMensaje({
        tipo: "error",
        texto:
          "No puedes registrar asistencia fuera del período de la competencia.",
      });

      return;
    }

    // =================================================
    // VALIDAR DÍA
    // =================================================

    const diaSeleccionado =
      normalizarDia(
        obtenerDiaSemana(fecha)
      );

    const diaPermitido =
      normalizarDia(
        selectedAsignacion.Dia
      );

    if (
      diaSeleccionado !==
      diaPermitido
    ) {
      setMensaje({
        tipo: "error",
        texto:
          `No puedes registrar asistencia porque esta clase corresponde al día ${selectedAsignacion.Dia}.`,
      });

      return;
    }

    setGuardando(true);
    setMensaje(null);

    const nuevosSemaforos = {
      ...estadosAprendices,
    };

    try {
      for (
        const aprendiz of aprendices
      ) {
        const estado =
          estados[
            aprendiz.Id_Apr
          ];

        if (!estado) {
          continue;
        }

        const response =
          await fetch(
            `${API_BASE}/asistencia`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                Fec_Asi: fecha,

                Es_Asi:
                  A_BACKEND[estado],

                Id_Apr:
                  aprendiz.Id_Apr,

                Id_Fic:
                  selectedAsignacion.Id_Fic,

                Id_Ins:
                  selectedAsignacion.Id_Ins,

                Id_Comp:
                  selectedAsignacion.Id_Comp,

                Dia:
                  selectedAsignacion.Dia,
              }),
            }
          );

        if (!response.ok) {
          let error;

          try {
            error =
              await response.json();
          } catch {
            error = {};
          }

          throw new Error(
            error.detail ||
              "Error guardando asistencia."
          );
        }

        const resultado =
          await response.json();

        if (resultado.estado) {
          nuevosSemaforos[
            aprendiz.Id_Apr
          ] =
            resultado.estado;
        }
      }

      setEstadosAprendices(
        nuevosSemaforos
      );

      setMensaje({
        tipo: "exito",
        texto:
          "Asistencia guardada correctamente.",
      });
    } catch (error) {
      console.error(error);

      setEstadosAprendices(
        nuevosSemaforos
      );

      setMensaje({
        tipo: "error",
        texto: error.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  // =====================================================
  // VOLVER A FICHAS
  // =====================================================

  function volverAFichas() {
    setFichaSeleccionada(null);
    setSelectedAsignacion(null);
    setFecha("");
    setAprendices([]);
    setEstados({});
    setEstadosAprendices({});
    setMensaje(null);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <InstructorNavbar
        user={{
          Nom_Ins: firstName,
        }}
      />

      <div className="bg-light min-vh-100 py-5">
        <main
          className="container"
          style={{
            maxWidth: 1000,
          }}
        >
          {/* ================================================= */}
          {/* ENCABEZADO */}
          {/* ================================================= */}

          <div className="mb-4">
            <h1 className="fw-bold text-dark">
              Control de Asistencia
            </h1>

            <p className="text-muted mb-0">
              Selecciona una ficha para registrar
              la asistencia de sus aprendices.
            </p>
          </div>

          {/* ================================================= */}
          {/* MENSAJES */}
          {/* ================================================= */}

          {mensaje && (
            <div
              className={
                mensaje.tipo === "exito"
                  ? "alert alert-success"
                  : "alert alert-danger"
              }
            >
              {mensaje.texto}
            </div>
          )}

          {/* ================================================= */}
          {/* PASO 1 - FICHAS */}
          {/* ================================================= */}

          {!fichaSeleccionada && (
            <div
              className="bg-white rounded-4 p-4 shadow-sm"
              style={{
                border:
                  "2px solid #00851d",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-bold mb-1">
                    Mis fichas
                  </h5>

                  <p className="text-muted small mb-0">
                    Selecciona la ficha en la que
                    deseas tomar asistencia.
                  </p>
                </div>

                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor:
                      "#E6F4D7",
                    color:
                      "#1B5E20",
                  }}
                >
                  {fichas.length} fichas
                </span>
              </div>

              {cargandoAsignaciones ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border"
                    style={{
                      color:
                        "#00851d",
                    }}
                  />

                  <p className="text-muted mt-3 mb-0">
                    Cargando fichas...
                  </p>
                </div>
              ) : fichas.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">
                    No tienes fichas asignadas.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {fichas.map(
                    (ficha) => (
                      <div
                        key={
                          ficha.Id_Fic
                        }
                        className="col-12 col-md-6"
                      >
                        <button
                          type="button"
                          className="w-100 text-start bg-white rounded-4 p-4"
                          onClick={() =>
                            seleccionarFicha(
                              ficha
                            )
                          }
                          style={{
                            border:
                              "1px solid #ddd",
                            transition:
                              "0.2s",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="p-3 rounded-3"
                              style={{
                                backgroundColor:
                                  "#E6F4D7",
                                color:
                                  "#1B5E20",
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

                            <div className="flex-grow-1">
                              <div className="fw-bold fs-5 text-dark">
                                Ficha{" "}
                                {ficha.Num_Fic ||
                                  ficha.Id_Fic}
                              </div>

                              <div className="text-muted small mt-1">
                                Jornada:{" "}
                                {ficha.Jor_Fic ||
                                  "No definida"}
                              </div>

                              <div
                                className="small mt-1"
                                style={{
                                  color:
                                    "#00851d",
                                }}
                              >
                                Ver clases →
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* PASO 2 - CLASES */}
          {/* ================================================= */}

          {fichaSeleccionada &&
            !selectedAsignacion && (
              <div>
                <button
                  type="button"
                  className="btn btn-link text-decoration-none px-0 mb-3"
                  onClick={
                    volverAFichas
                  }
                >
                  ← Volver a mis fichas
                </button>

                <div
                  className="bg-white rounded-4 p-4 shadow-sm"
                  style={{
                    border:
                      "2px solid #00851d",
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        backgroundColor:
                          "#E6F4D7",
                        color:
                          "#1B5E20",
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

                    <div>
                      <h4 className="fw-bold mb-1">
                        Ficha{" "}
                        {fichaSeleccionada.Num_Fic ||
                          fichaSeleccionada.Id_Fic}
                      </h4>

                      <p className="text-muted mb-0">
                        Selecciona la clase que
                        corresponde al día de formación.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {asignacionesFicha.map(
                      (asignacion) => (
                        <button
                          type="button"
                          key={
                            `${asignacion.Id_Fic}-` +
                            `${asignacion.Id_Ins}-` +
                            `${asignacion.Id_Comp}-` +
                            `${asignacion.Dia}`
                          }
                          className="w-100 text-start bg-white rounded-3 p-3"
                          onClick={() =>
                            seleccionarAsignacion(
                              asignacion
                            )
                          }
                          style={{
                            border:
                              "1px solid #ddd",
                          }}
                        >
                          <div className="row align-items-center">
                            <div className="col-md-8">
                              <div className="fw-bold text-dark">
                                {asignacion.Competencia ||
                                  `Competencia ${asignacion.Id_Comp}`}
                              </div>

                              <div className="text-muted small mt-1">
                                Día de formación:{" "}
                                <span
                                  className="fw-semibold"
                                  style={{
                                    color:
                                      "#1B5E20",
                                  }}
                                >
                                  {asignacion.Dia}
                                </span>
                              </div>

                              {asignacion.Jor_Fic && (
                                <div className="text-muted small">
                                  Jornada:{" "}
                                  {asignacion.Jor_Fic}
                                </div>
                              )}
                            </div>

                            <div className="col-md-4 text-md-end mt-2 mt-md-0">
                              <span
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor:
                                    "#E6F4D7",
                                  color:
                                    "#1B5E20",
                                }}
                              >
                                Registrar →
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* ================================================= */}
          {/* PASO 3 - ASISTENCIA */}
          {/* ================================================= */}

          {selectedAsignacion && (
            <div>
              <button
                type="button"
                className="btn btn-link text-decoration-none px-0 mb-3"
                onClick={() => {
                  setSelectedAsignacion(null);
                  setFecha("");
                  setAprendices([]);
                  setEstados({});
                  setEstadosAprendices({});
                  setMensaje(null);
                }}
              >
                ← Volver a las clases
              </button>

              {/* ================================================= */}
              {/* INFORMACIÓN + BARRA DE FECHA */}
              {/* ================================================= */}

              <div
                className="bg-white rounded-4 p-4 shadow-sm mb-4"
                style={{
                  border:
                    "2px solid #00851d",
                }}
              >
                <h5 className="fw-bold mb-4">
                  Registrar asistencia
                </h5>

                <div
                  className="p-3 rounded-3 mb-4"
                  style={{
                    backgroundColor:
                      "#E6F4D7",
                  }}
                >
                  <div className="fw-bold text-dark fs-5">
                    Ficha{" "}
                    {selectedAsignacion.Num_Fic ||
                      selectedAsignacion.Id_Fic}
                  </div>

                  <div className="small text-muted mt-1">
                    Competencia:{" "}
                    <span className="fw-medium text-dark">
                      {selectedAsignacion.Competencia ||
                        `Competencia ${selectedAsignacion.Id_Comp}`}
                    </span>
                  </div>

                  <div className="small text-muted">
                    Día de formación:{" "}
                    <span
                      className="fw-semibold"
                      style={{
                        color:
                          "#1B5E20",
                      }}
                    >
                      {selectedAsignacion.Dia}
                    </span>
                  </div>

                  {selectedAsignacion.Jor_Fic && (
                    <div className="small text-muted">
                      Jornada:{" "}
                      {selectedAsignacion.Jor_Fic}
                    </div>
                  )}
                </div>

                {/* ================================================= */}
                {/* BARRA PARA CAMBIAR FECHA */}
                {/* ================================================= */}

                <div
                  className="rounded-3 p-3"
                  style={{
                    background:
                      "linear-gradient(#006b18 0%, #00851d 55%, #0a9f2e 100%)",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() =>
                        cambiarDia(-1)
                      }
                    >
                      ← Anterior
                    </button>

                    <div className="text-center text-white flex-grow-1">
                      <div
                        className="small"
                        style={{
                          opacity: 0.9,
                        }}
                      >
                        Día de formación
                      </div>

                      <div className="fw-bold text-capitalize">
                        {formatearFecha(
                          fecha
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() =>
                        cambiarDia(1)
                      }
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>

                <div className="form-text mt-2">
                  Puedes cambiar únicamente entre las
                  fechas correspondientes al día de
                  formación de esta clase.
                </div>
              </div>

              {/* ================================================= */}
              {/* LISTA DE APRENDICES */}
              {/* ================================================= */}

              {fecha && (
                <div className="bg-white rounded-4 p-4 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">
                        Aprendices
                      </h5>

                      <p className="text-muted small mb-0">
                        Fecha:{" "}
                        {formatearFecha(
                          fecha
                        )}
                      </p>
                    </div>

                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor:
                          "#E6F4D7",
                        color:
                          "#1B5E20",
                      }}
                    >
                      {aprendices.length} aprendices
                    </span>
                  </div>

                  {cargandoAprendices ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border"
                        style={{
                          color:
                            "#00851d",
                        }}
                      />

                      <p className="text-muted mt-3">
                        Cargando aprendices...
                      </p>
                    </div>
                  ) : aprendices.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      No hay aprendices
                      registrados en esta ficha.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {aprendices.map(
                        (aprendiz) => {
                          const semaforo =
                            estadosAprendices[
                              aprendiz.Id_Apr
                            ];

                          const colores =
                            semaforo
                              ? COLOR_SEMAFORO[
                                  semaforo.semaforo
                                ]
                              : null;

                          return (
                            <div
                              key={
                                aprendiz.Id_Apr
                              }
                              className="border rounded-3 p-3"
                            >
                              <div className="row align-items-center">
                                {/* APRENDIZ */}

                                <div className="col-md-5">
                                  <div className="fw-bold d-flex align-items-center flex-wrap gap-2">
                                    {
                                      aprendiz.Nom_Apr
                                    }{" "}
                                    {
                                      aprendiz.Ape_Apr
                                    }

                                    {semaforo &&
                                      colores && (
                                        <span
                                          className="badge rounded-pill"
                                          style={{
                                            backgroundColor:
                                              colores.fondo,
                                            color:
                                              colores.texto,
                                            fontWeight:
                                              600,
                                          }}
                                          title={
                                            `Fallas brutas: ${semaforo.fallas_brutas} · ` +
                                            `Excusas: ${semaforo.excusas} · ` +
                                            `Racha actual: ${semaforo.racha_dias} día(s)`
                                          }
                                        >
                                          {
                                            semaforo.acumulado
                                          }{" "}
                                          fallas
                                        </span>
                                      )}
                                  </div>

                                  <div className="text-muted small">
                                    Documento:{" "}
                                    {
                                      aprendiz.Num_ide_Apr
                                    }
                                  </div>

                                  {semaforo &&
                                    semaforo.deserta_por_racha && (
                                      <div
                                        className="small mt-1 fw-semibold"
                                        style={{
                                          color:
                                            "#dc3545",
                                        }}
                                      >
                                        3 fallas
                                        seguidas
                                        — riesgo
                                        de
                                        deserción
                                      </div>
                                    )}

                                  {semaforo &&
                                    !semaforo.deserta_por_racha &&
                                    semaforo.deserta_por_acumulado && (
                                      <div
                                        className="small mt-1 fw-semibold"
                                        style={{
                                          color:
                                            "#dc3545",
                                        }}
                                      >
                                        Fallas
                                        acumuladas
                                        al máximo
                                        — riesgo
                                        de
                                        deserción
                                      </div>
                                    )}
                                </div>

                                {/* ESTADOS */}

                                <div className="col-md-7">
                                  <div className="d-flex flex-wrap gap-2">
                                    {ESTADOS.map(
                                      (estado) => {
                                        const activo =
                                          estados[
                                            aprendiz.Id_Apr
                                          ] ===
                                          estado.valor;

                                        return (
                                          <button
                                            key={
                                              `${aprendiz.Id_Apr}-` +
                                              `${estado.valor}`
                                            }
                                            type="button"
                                            className="btn btn-sm"
                                            onClick={() =>
                                              cambiarEstado(
                                                aprendiz.Id_Apr,
                                                estado.valor
                                              )
                                            }
                                            style={{
                                              backgroundColor:
                                                activo
                                                  ? estado.color
                                                  : "#f1f1f1",

                                              color:
                                                activo
                                                  ? estado.texto
                                                  : "#333",

                                              border:
                                                "1px solid #ddd",

                                              fontWeight:
                                                activo
                                                  ? "600"
                                                  : "400",
                                            }}
                                          >
                                            {
                                              estado.nombre
                                            }
                                          </button>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* ================================================= */}
                  {/* GUARDAR */}
                  {/* ================================================= */}

                  {aprendices.length > 0 && (
                    <button
                      type="button"
                      className="btn text-white fw-semibold w-100 mt-4 py-2"
                      style={{
                        backgroundColor:
                          "#00851d",
                      }}
                      disabled={guardando}
                      onClick={
                        guardarAsistencia
                      }
                    >
                      {guardando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar asistencia"
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}