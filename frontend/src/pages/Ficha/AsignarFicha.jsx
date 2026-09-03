import { useState, useEffect } from "react";

export default function AsignarFicha() {
  const [fichas, setFichas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [aprendices, setAprendices] = useState([]);

  const [tipoAsignacion, setTipoAsignacion] = useState("instructor"); // "instructor" o "aprendiz"
  const [selectedFicha, setSelectedFicha] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    // Cargar Fichas, Instructores y Aprendices desde la API
    fetch("http://localhost:8000/fichas").then(res => res.json()).then(setFichas);
    fetch("http://localhost:8000/instructores").then(res => res.json()).then(setInstructores);
    fetch("http://localhost:8000/aprendices").then(res => res.json()).then(setAprendices);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = tipoAsignacion === "instructor" 
      ? "http://localhost:8000/fichas/asignar-instructor" 
      : "http://localhost:8000/fichas/asignar-aprendiz";

    const bodyData = tipoAsignacion === "instructor" 
      ? { Id_Fic: parseInt(selectedFicha), Id_Ins: parseInt(selectedUsuario) }
      : { Id_Fic: parseInt(selectedFicha), Id_Apr: parseInt(selectedUsuario) };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      setMensaje({ tipo: "success", texto: "Asignación realizada correctamente" });
    } else {
      setMensaje({ tipo: "danger", texto: "Error al realizar la asignación" });
    }
  };

  return (
    <div className="container mt-4">
      <h2>Asignar Fichas</h2>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Tipo de Asignación</label>
          <select 
            className="form-select" 
            value={tipoAsignacion} 
            onChange={(e) => { setTipoAsignacion(e.target.value); setSelectedUsuario(""); }}
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