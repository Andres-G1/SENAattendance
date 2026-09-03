import { useState, useEffect } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

const API_BASE = "http://localhost:8000";

export default function AsignarFicha() {
  const [fichas, setFichas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [aprendices, setAprendices] = useState([]);

  const [tipoAsignacion, setTipoAsignacion] = useState("instructor"); // "instructor" o "aprendiz"
  const [selectedFicha, setSelectedFicha] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga(null);
      try {
        const [resFichas, resInstructores, resAprendices] = await Promise.all([
          fetch(`${API_BASE}/fichas`),
          fetch(`${API_BASE}/usuarios/instructores`),
          fetch(`${API_BASE}/usuarios/aprendices`),
        ]);

        if (!resFichas.ok) throw new Error(`Error al cargar fichas (status ${resFichas.status})`);
        if (!resInstructores.ok) throw new Error(`Error al cargar instructores (status ${resInstructores.status})`);
        if (!resAprendices.ok) throw new Error(`Error al cargar aprendices (status ${resAprendices.status})`);

        const [dataFichas, dataInstructores, dataAprendices] = await Promise.all([
          resFichas.json(),
          resInstructores.json(),
          resAprendices.json(),
        ]);

        setFichas(dataFichas);
        setInstructores(dataInstructores);
        setAprendices(dataAprendices);
      } catch (err) {
        console.error("Error cargando datos de AsignarFicha:", err);
        setErrorCarga(err.message || "No se pudieron cargar los datos. Verifica que el backend esté corriendo.");
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    const url = tipoAsignacion === "instructor"
      ? `${API_BASE}/asignaciones/instructor`
      : `${API_BASE}/asignaciones/aprendiz`;

    const bodyData = tipoAsignacion === "instructor"
      ? { Id_Fic: parseInt(selectedFicha), Id_Ins: parseInt(selectedUsuario) }
      : { Id_Fic: parseInt(selectedFicha), Id_Apr: parseInt(selectedUsuario) };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setMensaje({ tipo: "exito", texto: "Asignación realizada correctamente" });
      } else {
        setMensaje({ tipo: "error", texto: `Error al realizar la asignación (status ${res.status})` });
      }
    } catch (err) {
      console.error("Error en la asignación:", err);
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>

          <div className="mb-4">
          </div>

          <div
            className="rounded-4 p-4 bg-white"
            style={{ border: "2px solid #00851d" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
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
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>

              <h5 className="fw-bold text-dark mb-0">Asignación de Fichas</h5>
            </div>

            <p className="text-muted small mb-4">
              Selecciona el tipo de asignación, la ficha y la persona a asignar.
            </p>

            {cargando ? (
              <div className="text-muted small py-3">Cargando datos...</div>
            ) : errorCarga ? (
              <div className="alert alert-danger small mb-0">{errorCarga}</div>
            ) : (
              <form onSubmit={handleSubmit}>
                {mensaje && (
                  <div
                    className={`small mb-3 ${
                      mensaje.tipo === "exito" ? "text-success" : "text-danger"
                    }`}
                  >
                    {mensaje.tipo === "exito" ? "✓ " : ""}
                    {mensaje.texto}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-medium">Tipo de Asignación</label>
                  <select
                    className="form-select"
                    value={tipoAsignacion}
                    onChange={(e) => {
                      setTipoAsignacion(e.target.value);
                      setSelectedUsuario("");
                    }}
                  >
                    <option value="instructor">Asignar Instructor a Ficha</option>
                    <option value="aprendiz">Asignar Aprendiz a Ficha</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-medium">Seleccionar Ficha</label>
                  <select
                    className="form-select"
                    value={selectedFicha}
                    onChange={(e) => setSelectedFicha(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione una Ficha --</option>
                    {fichas.map((f) => (
                      <option key={f.Id_Fic} value={f.Id_Fic}>
                        Ficha {f.Num_Fic} ({f.Jor_Fic})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-medium">
                    {tipoAsignacion === "instructor" ? "Seleccionar Instructor" : "Seleccionar Aprendiz"}
                  </label>
                  <select
                    className="form-select"
                    value={selectedUsuario}
                    onChange={(e) => setSelectedUsuario(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione --</option>
                    {tipoAsignacion === "instructor"
                      ? instructores.map((i) => (
                          <option key={i.Id_Ins} value={i.Id_Ins}>
                            {i.Nom_Ins} {i.Ape_Ins} - {i.Num_ide_Ins}
                          </option>
                        ))
                      : aprendices.map((a) => (
                          <option key={a.Id_Apr} value={a.Id_Apr}>
                            {a.Nom_Apr} {a.Ape_Apr} - {a.Num_ide_Apr}
                          </option>
                        ))}
                  </select>
                </div>

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
                    "Asignar"
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