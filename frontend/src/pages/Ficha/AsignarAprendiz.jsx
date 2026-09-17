import { useState, useEffect } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

const API_BASE = "http://localhost:8000";

export default function AsignarAprendiz() {
  const [aprendices, setAprendices] = useState([]);
  const [fichas, setFichas] = useState([]);

  const [selectedAprendiz, setSelectedAprendiz] = useState("");
  const [selectedFicha, setSelectedFicha] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  // ==================================================
  // CARGAR APRENDICES Y FICHAS
  // ==================================================
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga(null);

      try {
        const res = await fetch(
          `${API_BASE}/users/aprendiz/datos-carga`
        );

        if (!res.ok) {
          throw new Error(
            `Error al cargar los datos (status ${res.status})`
          );
        }

        const data = await res.json();

        setAprendices(data.aprendices || []);
        setFichas(data.fichas || []);
      } catch (err) {
        console.error(
          "Error cargando datos de AsignarAprendiz:",
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

  // ==================================================
  // APRENDIZ SELECCIONADO
  // ==================================================
  const aprendizSeleccionado = aprendices.find(
    (a) =>
      String(a.Id_Apr) === String(selectedAprendiz)
  );

  // ==================================================
  // FICHA SELECCIONADA
  // ==================================================
  const fichaSeleccionada = fichas.find(
    (f) =>
      String(f.Id_Fic) === String(selectedFicha)
  );

  // ==================================================
  // CAMBIAR APRENDIZ
  // ==================================================
  const handleAprendizChange = (e) => {
    setSelectedAprendiz(e.target.value);
    setMensaje(null);
  };

  // ==================================================
  // CAMBIAR FICHA
  // ==================================================
  const handleFichaChange = (e) => {
    setSelectedFicha(e.target.value);
    setMensaje(null);
  };

  // ==================================================
  // ENVIAR ASIGNACIÓN
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje(null);

    // Validar aprendiz
    if (!selectedAprendiz) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar un aprendiz.",
      });
      return;
    }

    // Validar ficha
    if (!selectedFicha) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una ficha.",
      });
      return;
    }

    // Evitar enviar si ya tiene ficha
    if (aprendizSeleccionado?.Id_Fic) {
      setMensaje({
        tipo: "error",
        texto:
          "Este aprendiz ya tiene una ficha asignada.",
      });
      return;
    }

    const bodyData = {
      Id_Apr: parseInt(selectedAprendiz),
      Id_Fic: parseInt(selectedFicha),
    };

    console.log("Datos enviados:", bodyData);

    setEnviando(true);

    try {
      const res = await fetch(
        `${API_BASE}/users/aprendiz`,
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
            "Aprendiz asignado correctamente.",
        });

        // Actualizar aprendiz localmente
        setAprendices((prev) =>
          prev.map((aprendiz) =>
            String(aprendiz.Id_Apr) ===
            String(selectedAprendiz)
              ? {
                  ...aprendiz,
                  Id_Fic: parseInt(selectedFicha),
                }
              : aprendiz
          )
        );

        // Limpiar formulario
        setSelectedAprendiz("");
        setSelectedFicha("");
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

  // ==================================================
  // RENDER
  // ==================================================
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
                Asignar Aprendiz a Ficha
              </h5>
            </div>

            <p className="text-muted small mb-4">
              Selecciona el aprendiz y la ficha a la
              que deseas asignarlo.
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
                    className={`small mb-3 ${
                      mensaje.tipo === "exito"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {mensaje.tipo === "exito"
                      ? "✓ "
                      : "⚠ "}
                    {mensaje.texto}
                  </div>
                )}

                {/* APRENDIZ */}
                <div className="mb-3">
                  <label className="form-label small fw-medium">
                    Seleccionar Aprendiz
                  </label>

                  <select
                    className="form-select"
                    value={selectedAprendiz}
                    onChange={handleAprendizChange}
                    required
                    disabled={enviando}
                  >
                    <option value="">
                      -- Seleccione un Aprendiz --
                    </option>

                    {aprendices.map((a) => (
                      <option
                        key={a.Id_Apr}
                        value={a.Id_Apr}
                      >
                        {a.Nom_Apr} {a.Ape_Apr} -{" "}
                        {a.Num_ide_Apr}
                        {a.Id_Fic
                          ? " (Ya asignado)"
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* INFORMACIÓN DEL APRENDIZ */}
                  {aprendizSeleccionado && (
                    <div className="mt-2 small text-muted">
                      <div>
                        <strong>Documento:</strong>{" "}
                        {aprendizSeleccionado.Num_ide_Apr}
                      </div>

                      <div>
                        <strong>Correo:</strong>{" "}
                        {aprendizSeleccionado.Cor_Apr ||
                          "No registrado"}
                      </div>

                      {aprendizSeleccionado.Id_Fic && (
                        <div className="text-warning mt-1">
                          ⚠ Este aprendiz ya tiene una
                          ficha asignada.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* FICHA */}
                <div className="mb-4">
                  <label className="form-label small fw-medium">
                    Seleccionar Ficha
                  </label>

                  <select
                    className="form-select"
                    value={selectedFicha}
                    onChange={handleFichaChange}
                    required
                    disabled={enviando}
                  >
                    <option value="">
                      -- Seleccione una Ficha --
                    </option>

                    {fichas.map((f) => (
                      <option
                        key={f.Id_Fic}
                        value={f.Id_Fic}
                      >
                        Ficha {f.Num_Fic}
                        {f.Jor_Fic
                          ? ` (${f.Jor_Fic})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* INFORMACIÓN DE LA FICHA */}
                  {fichaSeleccionada && (
                    <div className="mt-2 small text-muted">
                      {fichaSeleccionada.Fec_inicio_Fic &&
                        fichaSeleccionada.Fec_Fin_Fic && (
                          <>
                            <strong>
                              Período de la ficha:
                            </strong>{" "}
                            {fichaSeleccionada.Fec_inicio_Fic}
                            {" → "}
                            {fichaSeleccionada.Fec_Fin_Fic}
                          </>
                        )}
                    </div>
                  )}
                </div>

                {/* BOTÓN */}
                <button
                  type="submit"
                  disabled={
                    enviando ||
                    Boolean(
                      aprendizSeleccionado?.Id_Fic
                    )
                  }
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
                    "Asignar Aprendiz"
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
