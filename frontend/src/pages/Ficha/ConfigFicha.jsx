import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx"; // ajusta la ruta según dónde esté este archivo

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function FichaList() {
  const [carreras, setCarreras] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

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

  const fichasPorCarrera = carreras.map((carrera) => ({
    ...carrera,
    fichas: fichas.filter((f) => f.Id_Car === carrera.Id_Car),
  }));

  if (cargando) return <p className="text-center my-4">Cargando fichas...</p>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4">
        <div className="card p-4 shadow-sm mb-4 bg-white">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <h2 className="h4 mb-1">Configuración General de Fichas</h2>
              <p className="text-muted small mb-0">Gestiona los grupos y carga la información masiva del sistema.</p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm"
                onClick={() => navigate("/fichas/nueva")}
              >
                + Nueva Ficha 
              </button>
            </div>
          </div>
        </div>

        <div className="card p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="h5 mb-0 text-secondary">Lista de Fichas por Carrera</h3>
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
    </>
  );
}