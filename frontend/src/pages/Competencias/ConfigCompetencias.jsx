import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarCompetencias, listarResultados } from "../../services/api";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

export default function ConfigCompetencia() {
  const [competencias, setCompetencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [idFiltro, setIdFiltro] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargandoRes, setCargandoRes] = useState(false);

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const cargarCompetencias = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await listarCompetencias();
      setCompetencias(data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("No estás autenticado o tu sesión expiró.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para consultar las competencias.");
      } else {
        setError("No se pudieron cargar las competencias.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCompetencias();
  }, []);

  // Cada vez que cambia el filtro, se traen los resultados de esa competencia
  useEffect(() => {
    if (!idFiltro) {
      setResultados([]);
      return;
    }

    const cargarResultados = async () => {
      try {
        setCargandoRes(true);
        setResultados(await listarResultados(idFiltro));
      } catch (err) {
        console.error(err);
        setResultados([]);
      } finally {
        setCargandoRes(false);
      }
    };

    cargarResultados();
  }, [idFiltro]);

  const competenciasVisibles = idFiltro
    ? competencias.filter((c) => String(c.Id_Comp) === idFiltro)
    : competencias;

  const competenciaSeleccionada = competencias.find(
    (c) => String(c.Id_Comp) === idFiltro
  );

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 mb-0">Lista de Competencias</h2>

            <button
              className="btn btn-success btn-sm action-create"
              onClick={() => navigate("/competencias/nueva")}
            >
              Crear Competencia
            </button>
          </div>

          {!cargando && !error && competencias.length > 0 && (
            <div className="mb-3">
              <label className="form-label small text-muted">
                Filtrar por competencia
              </label>
              <select
                className="form-select"
                value={idFiltro}
                onChange={(e) => setIdFiltro(e.target.value)}
              >
                <option value="">Todas las competencias</option>
                {competencias.map((c) => (
                  <option key={c.Id_Comp} value={String(c.Id_Comp)}>
                    {c.Nom_Comp}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cargando ? (
            <p className="mb-0">Cargando competencias...</p>
          ) : error ? (
            <>
              <div className="alert alert-danger">{error}</div>

              <button
                className="btn btn-primary"
                onClick={cargarCompetencias}
              >
                Intentar nuevamente
              </button>
            </>
          ) : competencias.length === 0 ? (
            <div className="alert alert-info">
              No hay competencias registradas.
            </div>
          ) : (
            <ul className="list-group">
              {competenciasVisibles.map((competencia) => (
                <li
                  key={competencia.Id_Comp}
                  className="list-group-item py-3"
                >
                  <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    <div>
                      <strong>{competencia.Nom_Comp}</strong>

                      <small className="text-muted d-block">
                        Código: {competencia.Id_Comp}
                      </small>

                      <small className="text-muted d-block mt-1">
                        {competencia.Des_Comp}
                      </small>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() =>
                          navigate(
                            `/competencias/editar/${competencia.Id_Comp}`
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          navigate(
                            `/competencias/eliminar/${competencia.Id_Comp}`,
                            {
                              state: {
                                nombre: competencia.Nom_Comp,
                              },
                            }
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {idFiltro && (
            <div className="mt-4">
              <h3 className="h6 mb-3">
                Resultados de aprendizaje de {competenciaSeleccionada?.Nom_Comp}
              </h3>

              {cargandoRes ? (
                <p className="mb-0">Cargando resultados...</p>
              ) : resultados.length === 0 ? (
                <div className="alert alert-info mb-0">
                  Esta competencia no tiene resultados de aprendizaje.
                </div>
              ) : (
                <ul className="list-group">
                  {resultados.map((ra) => (
                    <li key={ra.Id_RA} className="list-group-item">
                      <strong>{ra.Nom_RA}</strong>
                      {ra.Des_RA && (
                        <small className="text-muted d-block mt-1">
                          {ra.Des_RA}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}