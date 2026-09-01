import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCarrera, updateCarrera } from "/src/services/carreraService";
import CoordinadorNavbar from '/src/components/navbars/CoordinadorNavbar.jsx';

export default function CarreraAlter() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ Nom_Car: "", Des_Car: "" });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  useEffect(() => {
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
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setGuardando(true);
    setError(null);
    try {
      await updateCarrera(id, form);
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
      <div className="page-card card shadow-sm">
        <div className="card-header bg-warning text-dark py-3">
          <h1 className="h5 mb-0">Modificar Carrera</h1>
          <small className="text-muted">{form.Nom_Car}</small>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label htmlFor="Nom_Car" className="form-label">
                  Nombre de Carrera
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="Nom_Car"
                  name="Nom_Car"
                  value={form.Nom_Car}
                  onChange={handleChange}
                  placeholder="Ej: ADSO"
                  disabled={guardando}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            <div className="form-actions mt-4">
              <Link to="/administrador/carreras" className="btn btn-secondary">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
    </>
  );
}
