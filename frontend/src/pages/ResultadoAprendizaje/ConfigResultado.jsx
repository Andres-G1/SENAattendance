
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const API_URL = "http://localhost:8000";

export default function ResultadosAprendizaje() {
  const [competencias, setCompetencias] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError(null);

    try {
      const [resCompetencias, resResultados] = await Promise.all([
        fetch(`${API_URL}/competencias/`),
        fetch(`${API_URL}/resultados-aprendizaje/`),
      ]);

      if (!resCompetencias.ok || !resResultados.ok) {
        throw new Error("No se pudo cargar la información.");
      }

      const [dataCompetencias, dataResultados] = await Promise.all([
        resCompetencias.json(),
        resResultados.json(),
      ]);

      setCompetencias(dataCompetencias);
      setResultados(dataResultados);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const competenciasConResultados = competencias.map((competencia) => ({
    ...competencia,
    resultados: resultados.filter(
      (resultado) =>
        Number(resultado.Id_Comp) === Number(competencia.Id_Comp)
    ),
  }));

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4">
        <div className="card p-4 shadow-sm mb-4 bg-white">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <h2 className="h4 mb-1">
                Configuración de Resultados de Aprendizaje
              </h2>
              <p className="text-muted small mb-0">
                Administra los resultados de aprendizaje asociados a cada
                competencia.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() =>
                  navigate("/administrador/resultados-aprendizaje/crear")
                }
              >
                + Nuevo Resultado
              </button>
            </div>
          </div>
        </div>

        {location.state?.mensaje && (
          <div className="alert alert-success alert-dismissible fade show">
            {location.state.mensaje}
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() =>
                navigate(location.pathname, { replace: true, state: null })
              }
            />
          </div>
        )}

        <div className="card p-4 shadow-sm">
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0 text-secondary">
              Resultados por Competencia
            </h3>

            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={cargarDatos}
              disabled={cargando}
            >
              Actualizar
            </button>
          </div>

          {cargando ? (
            <p className="text-center my-4">
              Cargando resultados de aprendizaje...
            </p>
          ) : error ? (
            <div className="alert alert-danger">
              <p className="mb-2">{error}</p>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={cargarDatos}
              >
                Reintentar
              </button>
            </div>
          ) : competenciasConResultados.length > 0 ? (
            competenciasConResultados.map((competencia) => (
              <div className="card mb-3" key={competencia.Id_Comp}>
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{competencia.Nom_Comp}</h5>
                  <span className="badge bg-success">
                    {competencia.resultados.length} resultado(s)
                  </span>
                </div>

                <div className="card-body">
                  {competencia.resultados.length > 0 ? (
                    <ul className="list-group">
                      {competencia.resultados.map((resultado) => (
                        <li
                          key={resultado.Id_RA}
                          className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 py-3"
                        >
                          <div>
                            <strong>{resultado.Nom_RA}</strong>
                            <p className="text-muted small mb-1 mt-1">
                              {resultado.Des_RA ||
                                "Sin descripción registrada."}
                            </p>
                            <small className="text-secondary">
                              Código: {resultado.Id_RA}
                            </small>
                          </div>

                          <div className="d-flex flex-wrap gap-2">
                            <Link
                              to={`/administrador/resultados-aprendizaje/editar/${resultado.Id_RA}`}
                              state={{ resultado }}
                              className="btn btn-warning btn-sm"
                            >
                              Editar
                            </Link>

                            <Link
                              to={`/administrador/resultados-aprendizaje/eliminar/${resultado.Id_RA}`}
                              state={{ resultado }}
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
                      No hay resultados registrados en esta competencia.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-info">
              No hay competencias registradas.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
