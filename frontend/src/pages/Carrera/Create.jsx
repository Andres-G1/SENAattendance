import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCarrera, createCarrera, updateCarrera } from "/src/services/carreraService";
import CoordinadorNavbar from '/src/components/navbars/CoordinadorNavbar.jsx';

export default function CarreraForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState({ Nom_Car: "", Des_Car: "" });
  const [loading, setLoading] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  useEffect(() => {
    if (!esEdicion) return;

    async function cargarCarrera() {
      try {
        const data = await getCarrera(id);
        setForm({ Nom_Car: data.Nom_Car, Des_Car: data.Des_Car });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    cargarCarrera();
  }, [id, esEdicion]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.Nom_Car.trim() || !form.Des_Car.trim()) {
      setError("Ambos campos son obligatorios");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      if (esEdicion) {
        await updateCarrera(id, form);
      } else {
        await createCarrera(form);
      }
      navigate("/administrador/carreras");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <main className="container my-4">
        <p className="text-muted text-center py-4">Cargando...</p>
      </main>
    );
  }

return (
    <>
    <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

    <main className="container my-5">
      <div className="page-card card shadow-sm" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">
            {esEdicion ? "Editar Carrera" : "Crear Nueva Carrera"}
          </h1>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="Nom_Car" className="form-label">
                Nombre de la Carrera
              </label>
              <input
                type="text"
                className="form-control"
                id="Nom_Car"
                name="Nom_Car"
                placeholder="Ej: ADSO"
                value={form.Nom_Car}
                onChange={handleChange}
                disabled={guardando}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="Des_Car" className="form-label">
                Descripción
              </label>
              <textarea
                className="form-control"
                id="Des_Car"
                name="Des_Car"
                rows={3}
                placeholder="Breve descripción de la carrera"
                value={form.Des_Car}
                onChange={handleChange}
                disabled={guardando}
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : esEdicion
                  ? "Guardar Cambios"
                  : "Crear Carrera"}
              </button>
              <Link to="/administrador/carreras" className="btn btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
    </> 
  );
}