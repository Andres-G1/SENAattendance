import { useState, useEffect } from "react";

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

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga(null);
      try {
        const [resFichas, resInstructores, resAprendices] = await Promise.all([
          fetch("http://localhost:8000/fichas"),
          fetch("http://localhost:8000/usuarios/instructores"),
          fetch("http://localhost:8000/usuarios/aprendices"),
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
    
    // 🛠️ CORRECCIÓN 1: Se cambiaron los endpoints para apuntar al prefijo /asignaciones de FastAPI
    const url = tipoAsignacion === "instructor"
      ? "http://localhost:8000/asignaciones/instructor"
      : "http://localhost:8000/asignaciones/aprendiz";

    // 🛠️ CORRECCIÓN 2: Se mapearon las propiedades de los objetos de acuerdo a tu base de datos y UI
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
        setMensaje({ tipo: "success", texto: "Asignación realizada correctamente" });
        // Limpiamos los selects tras guardar con éxito
        setSelectedFicha("");
        setSelectedUsuario("");
      } else {
        const errorDetail = await res.json();
        setMensaje({ 
          tipo: "danger", 
          texto: `Error: ${errorDetail.detail || "No se pudo realizar la asignación"}` 
        });
      }
    } catch (err) {
      console.error("Error en la asignación:", err);
      setMensaje({ tipo: "danger", texto: "No se pudo conectar con el servidor" });
    }
  };

  if (cargando) {
    return (
      <div className="container mt-4">
        <h2>Asignar Fichas</h2>
        <p className="text-muted">Cargando datos...</p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="container mt-4">
        <h2>Asignar Fichas</h2>
        <div className="alert alert-danger">{errorCarga}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Asignar Fichas</h2>

      {mensaje && <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>{mensaje.texto}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Tipo de Asignación</label>
          <select
            className="form-select"
            value={tipoAsignacion}
            onChange={(e) => { setTipoAsignacion(e.target.value); setSelectedUsuario(""); setMensaje(null); }}
          >
            <option value="instructor">Asignar Instructor a Ficha</option>
            <option value="aprendiz">Asignar Aprendiz a Ficha</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Seleccionar Ficha</label>
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

        <div className="mb-3">
          <label className="form-label">
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

        <button type="submit" className="btn btn-primary">Asignar</button>
      </form>
    </div>
  );
}
