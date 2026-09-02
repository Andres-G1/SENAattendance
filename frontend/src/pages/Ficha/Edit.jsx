import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [carreras, setCarreras] = useState([]);
  const [form, setForm] = useState({
    Id_Car: "",
    Num_Fic: "",
    Fec_inicio_Fic: "",
    Fec_Fin_Fic: "",
    Jor_Fic: "",
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [resCarreras, resFicha] = await Promise.all([
        fetch(`${API_URL}/carreras/`),
        fetch(`${API_URL}/fichas/${id}`),
      ]);

      if (!resCarreras.ok) throw new Error("No se pudieron cargar las carreras");
      if (!resFicha.ok) throw new Error("No se pudo cargar la ficha");

      const dataCarreras = await resCarreras.json();
      const dataFicha = await resFicha.json();

      setCarreras(dataCarreras);
      setForm({
        Id_Car: dataFicha.Id_Car,
        Num_Fic: dataFicha.Num_Fic,
        Fec_inicio_Fic: dataFicha.Fec_inicio_Fic,
        Fec_Fin_Fic: dataFicha.Fec_Fin_Fic,
        Jor_Fic: dataFicha.Jor_Fic,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
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
      const res = await fetch(`${API_URL}/fichas/${id}`, {
        method: "PUT",
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
        throw new Error(data?.detail || "No se pudo guardar los cambios");
      }

      navigate("/administrador/fichas");
    } catch (err) {
      setError(err.message);
    }
  }

  if (cargando) return <p className="text-center my-4">Cargando ficha...</p>;

  return (
    <main className="container my-5">
      <div
        className="page-card card shadow-sm"
        style={{ maxWidth: 650, margin: "0 auto" }}
      >
        <div className="card-header bg-warning text-dark py-3">
          <h1 className="h5 mb-0">Modificar Ficha</h1>
          <small className="text-dark-50">
            Ficha original: {form.Num_Fic}
          </small>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label htmlFor="career" className="form-label">
                  Carrera
                </label>
                <select
                  name="Id_Car"
                  id="career"
                  className="form-select"
                  value={form.Id_Car}
                  onChange={handleChange}
                  required
                >
                  {carreras.map((c) => (
                    <option key={c.Id_Car} value={c.Id_Car}>
                      {c.Nom_Car}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-12">
                <label htmlFor="token" className="form-label">
                  Número de Ficha
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="token"
                  name="Num_Fic"
                  value={form.Num_Fic}
                  onChange={handleChange}
                  placeholder="Ej: 3407200"
                  required
                />
              </div>

              <div className="col-md-6">
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
              <div className="col-md-6">
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

              <div className="col-md-12">
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
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/fichas")}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}