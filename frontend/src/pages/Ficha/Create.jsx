import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function Create() {
  const [carreras, setCarreras] = useState([]);
  const [form, setForm] = useState({
    Id_Car: "",
    Num_Fic: "",
    Fec_inicio_Fic: "",
    Fec_Fin_Fic: "",
    Jor_Fic: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCarreras();
  }, []);

  async function cargarCarreras() {
    try {
      const res = await fetch(`${API_URL}/carreras/`);
      if (!res.ok) throw new Error("No se pudieron cargar las carreras");
      const data = await res.json();
      setCarreras(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_URL}/fichas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id_Car: Number(form.Id_Car),
          Num_Fic: Number(form.Num_Fic),
          Fec_inicio_Fic: form.Fec_inicio_Fic,
          Fec_Fin_Fic: form.Fec_Fin_Fic,
          Jor_Fic: form.Jor_Fic,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la ficha");
      }

      navigate("/administrador/fichas");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container my-5">
      <div
        className="page-card card shadow-sm"
        style={{ maxWidth: 600, margin: "0 auto" }}
      >
        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">Crear Nueva Ficha</h1>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="career" className="form-label">
                Selecciona una Carrera
              </label>
              <select
                name="Id_Car"
                id="career"
                className="form-select"
                value={form.Id_Car}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  -- Selecciona una carrera --
                </option>
                {carreras.map((c) => (
                  <option key={c.Id_Car} value={c.Id_Car}>
                    {c.Nom_Car}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="token" className="form-label">
                Número de Ficha
              </label>
              <input
                type="number"
                className="form-control"
                id="token"
                name="Num_Fic"
                placeholder="Ej: 3407200"
                value={form.Num_Fic}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="fec_inicio" className="form-label">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="fec_inicio"
                  name="Fec_inicio_Fic"
                  value={form.Fec_inicio_Fic}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="fec_fin" className="form-label">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="fec_fin"
                  name="Fec_Fin_Fic"
                  value={form.Fec_Fin_Fic}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="jornada" className="form-label">
                Jornada
              </label>
              <select
                name="Jor_Fic"
                id="jornada"
                className="form-select"
                value={form.Jor_Fic}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  -- Selecciona la jornada --
                </option>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success">
                Crear Ficha
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/fichas")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}