import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCarrera, deleteCarrera } from "/src/services/carreraService";
import CoordinadorNavbar from '/src/components/navbars/CoordinadorNavbar.jsx';

export default function CarreraDelete() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [carrera, setCarrera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  useEffect(() => {
    async function cargarCarrera() {
      try {
        const data = await getCarrera(id);
        setCarrera(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    cargarCarrera();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    setEliminando(true);
    setError(null);
    try {
      await deleteCarrera(id);
      navigate("/administrador/carreras");
    } catch (err) {
      setError(err.message);
      setEliminando(false);
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
      <div className="page-card card shadow-sm text-dark">
        <div className="card-header bg-danger text-white py-3">
          <h1 className="h5 mb-0">Eliminar Carrera</h1>
          <small className="text-light">{carrera?.Nom_Car}</small>
        </div>
        <div className="card-body p-4">
          <p className="lead">¿Estás seguro de que deseas eliminar esta carrera?</p>
          <div className="mb-4">
            <strong>Carrera:</strong> {carrera?.Nom_Car}
            <br />
            <span className="text-muted">
              Al eliminar esta carrera también se eliminarán todas las fichas asociadas.
            </span>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-danger" type="submit" disabled={eliminando}>
                {eliminando ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
              <Link className="btn btn-secondary" to="/administrador/carreras">
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