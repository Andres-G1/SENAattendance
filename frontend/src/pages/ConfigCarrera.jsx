import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCarreras } from "../services/carreraService";
import CoordinadorNavbar from '../components/navbars/CoordinadorNavbar.jsx';

export default function CarreraList() {
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nombreCompleto = localStorage.getItem('firstName') || ''; 
  const firstName = nombreCompleto.split(' ')[0];

  useEffect(() => {
    cargarCarreras();
  }, []);

  async function cargarCarreras() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCarreras();
      setCarreras(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4" style={{ maxWidth: 950 }}>
        <div className="card border-0 shadow-sm p-4 bg-white rounded-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold text-dark h5 mb-0">Lista de Carreras</h2>
            <Link to="/carreras/nueva" className="btn btn-success btn-sm rounded-3 fw-semibold">
              + Nueva Carrera
            </Link>
          </div>

          {loading && <p className="text-muted text-center py-4">Cargando carreras...</p>}

          {!loading && error && (
            <p className="text-danger text-center py-4">
              Error al cargar las carreras: {error}
            </p>
          )}

          {!loading && !error && (
            <ul className="list-group list-group-flush">
              {carreras.length > 0 ? (
                carreras.map((carrera) => (
                  <li
                    key={carrera.Id_Car}
                    className="list-group-item d-flex justify-content-between align-items-center py-3 px-0"
                  >
                    <div>
                      <strong className="text-dark">{carrera.Nom_Car}</strong>
                    </div>

                    <div>
                      <Link
                        to={`/carreras/editar/${carrera.Id_Car}`}
                        className="btn btn-warning btn-sm me-2 rounded-3"
                      >
                        Editar
                      </Link>
                      <Link
                        to={`/carreras/eliminar/${carrera.Id_Car}`}
                        className="btn btn-danger btn-sm rounded-3"
                      >
                        Eliminar
                      </Link>
                    </div>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted text-center py-4 px-0">
                  No hay carreras registradas
                </li>
              )}
            </ul>
          )}
        </div>
      </main>
    </> 
  );
}
