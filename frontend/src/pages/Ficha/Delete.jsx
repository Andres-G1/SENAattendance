import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function Delete() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState(null);
  const [carrera, setCarrera] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const resFicha = await fetch(`${API_URL}/fichas/${id}`);
      if (!resFicha.ok) throw new Error("No se pudo cargar la ficha");
      const dataFicha = await resFicha.json();
      setFicha(dataFicha);

      const resCarrera = await fetch(`${API_URL}/carreras/${dataFicha.Id_Car}`);
      if (resCarrera.ok) {
        setCarrera(await resCarrera.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_URL}/fichas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo eliminar la ficha");
      }

      navigate("/administrador/fichas");
    } catch (err) {
      setError(err.message);
    }
  }

  if (cargando) return <p className="text-center my-4">Cargando...</p>;
  if (error && !ficha) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <main className="container my-5">
      <div className="page-card card shadow-sm text-dark">
        <div className="card-header bg-danger text-white py-3">
          <h1 className="h5 mb-0">Eliminar Token</h1>
          <small className="text-light">
            {carrera?.Nom_Car} · {ficha?.Num_Fic}
          </small>
        </div>
        <div className="card-body p-4">
          <p className="lead">¿Estás seguro de que deseas eliminar este token?</p>
          <div className="mb-4">
            <strong>Carrera:</strong> {carrera?.Nom_Car}
            <br />
            <strong>Token:</strong> {ficha?.Num_Fic}
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleDelete}>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-danger" type="submit">
                Eliminar definitivamente
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