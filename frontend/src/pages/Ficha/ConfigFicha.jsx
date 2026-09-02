import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function FichaList() {
  const [carreras, setCarreras] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [resCarreras, resFichas] = await Promise.all([
        fetch(`${API_URL}/carreras/`),
        fetch(`${API_URL}/fichas/`),
      ]);

      if (!resCarreras.ok || !resFichas.ok) {
        throw new Error("No se pudo cargar la información");
      }

      const dataCarreras = await resCarreras.json();
      const dataFichas = await resFichas.json();

      setCarreras(dataCarreras);
      setFichas(dataFichas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Agrupa las fichas por carrera, igual que hacía el template Jinja
  const fichasPorCarrera = carreras.map((carrera) => ({
    ...carrera,
    fichas: fichas.filter((f) => f.Id_Car === carrera.Id_Car),
  }));

  if (cargando) return <p className="text-center my-4">Cargando fichas...</p>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <main className="container my-4">
      <div className="card p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Lista de Fichas por Carrera</h2>
          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate("/fichas/nueva")}
          >
            + Nuevo Token
          </button>
        </div>

        {fichasPorCarrera.length > 0 ? (
          fichasPorCarrera.map((carrera) => (
            <div className="card mb-3" key={carrera.Id_Car}>
              <div className="card-header bg-light">
                <h5 className="mb-0">{carrera.Nom_Car}</h5>
              </div>
              <div className="card-body">
                {carrera.fichas.length > 0 ? (
                  <ul className="list-group">
                    {carrera.fichas.map((ficha) => (
                      <li
                        key={ficha.Id_Fic}
                        className="list-group-item d-flex justify-content-between align-items-center py-2"
                      >
                        <div>
                          <strong>Ficha: {ficha.Num_Fic}</strong>
                          <span className="badge bg-secondary ms-2">
                            {ficha.Jor_Fic}
                          </span>
                        </div>

                        <div>
                          <Link
                            to={`/fichas/editar/${ficha.Id_Fic}`}
                            className="btn btn-warning btn-sm me-2"
                          >
                            Editar
                          </Link>
                          <Link
                            to={`/fichas/eliminar/${ficha.Id_Fic}`}
                            className="btn btn-danger btn-sm"
                          >
                            Eliminar
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">
                    No hay fichas en esta carrera
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-info" role="alert">
            No hay carreras registradas
          </div>
        )}
      </div>
    </main>
  );
} 