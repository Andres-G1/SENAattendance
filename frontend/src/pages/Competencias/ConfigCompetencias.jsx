import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearResultadoAprendizaje,
  listarCompetencias,
  listarResultadosAprendizaje,
} from "../../services/api";
import { obtenerFichas } from "../../services/fichaService";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

export default function ConfigCompetencia() {
  const [competencias, setCompetencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [competenciaActiva, setCompetenciaActiva] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [guardandoResultado, setGuardandoResultado] = useState(false);
  const [errorResultados, setErrorResultados] = useState("");
  const [formularioResultado, setFormularioResultado] = useState({
    Nom_RA: "",
    Des_RA: "",
    Id_Fic: "",
  });

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

  const alternarResultados = async (competencia) => {
    if (competenciaActiva?.Id_Comp === competencia.Id_Comp) {
      setCompetenciaActiva(null);
      setErrorResultados("");
      return;
    }

    setCompetenciaActiva(competencia);
    setCargandoResultados(true);
    setErrorResultados("");
    setFormularioResultado({ Nom_RA: "", Des_RA: "", Id_Fic: "" });

    try {
      const [listaResultados, listaFichas] = await Promise.all([
        listarResultadosAprendizaje(competencia.Id_Comp),
        obtenerFichas(),
      ]);
      setResultados(listaResultados);
      setFichas(listaFichas);
    } catch (err) {
      setErrorResultados(
        err.response?.data?.detail || err.message || "No se pudieron cargar los resultados."
      );
      setResultados([]);
      setFichas([]);
    } finally {
      setCargandoResultados(false);
    }
  };

  const handleCrearResultado = async (event) => {
    event.preventDefault();
    setErrorResultados("");

    try {
      setGuardandoResultado(true);
      const nuevoResultado = await crearResultadoAprendizaje({
        Nom_RA: formularioResultado.Nom_RA.trim(),
        Des_RA: formularioResultado.Des_RA.trim() || null,
        Id_Fic: Number(formularioResultado.Id_Fic),
        Id_Comp: competenciaActiva.Id_Comp,
      });
      setResultados((anteriores) => [nuevoResultado, ...anteriores]);
      setFormularioResultado({ Nom_RA: "", Des_RA: "", Id_Fic: "" });
    } catch (err) {
      setErrorResultados(
        err.response?.data?.detail || "No se pudo guardar el resultado de aprendizaje."
      );
    } finally {
      setGuardandoResultado(false);
    }
  };

  if (cargando) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="card p-4 shadow-sm">
            <p className="mb-0">Cargando competencias...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={cargarCompetencias}>
            Intentar nuevamente
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 mb-0">Lista de Competencias</h2>
            <button
              className="btn btn-success btn-sm"
              onClick={() => navigate("/competencias/nueva")}
            >
              + Crear Competencia
            </button>
          </div>

          {competencias.length === 0 ? (
            <div className="alert alert-info">No hay competencias registradas.</div>
          ) : (
            <ul className="list-group">
              {competencias.map((competencia) => (
                <li
                  key={competencia.Id_Comp}
                  className="list-group-item py-3"
                >
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <div>
                      <strong>{competencia.Nom_Comp}</strong>
                      <small className="text-muted d-block">
                        Código: {competencia.Id_Comp}
                      </small>
                      <small className="d-block mt-1 text-muted">
                        {competencia.Des_Comp}
                      </small>
                    </div>

                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => alternarResultados(competencia)}
                      >
                        {competenciaActiva?.Id_Comp === competencia.Id_Comp
                          ? "Ocultar resultados"
                          : "Resultados de aprendizaje"}
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() =>
                          navigate(`/competencias/editar/${competencia.Id_Comp}`)
                        }
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          navigate(`/competencias/eliminar/${competencia.Id_Comp}`, {
                            state: { nombre: competencia.Nom_Comp },
                          })
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {competenciaActiva?.Id_Comp === competencia.Id_Comp && (
                    <section className="border-top mt-3 pt-3" aria-label="Resultados de aprendizaje">
                      <h3 className="h6">Resultados vinculados al código {competencia.Id_Comp}</h3>

                      {cargandoResultados ? (
                        <p className="text-muted">Cargando resultados...</p>
                      ) : (
                        <>
                          {errorResultados && (
                            <div className="alert alert-danger py-2" role="alert">
                              {errorResultados}
                            </div>
                          )}

                          {resultados.length === 0 ? (
                            <p className="text-muted">Esta competencia aún no tiene resultados registrados.</p>
                          ) : (
                            <ul className="list-group mb-3">
                              {resultados.map((resultado) => (
                                <li className="list-group-item" key={resultado.Id_RA}>
                                  <strong>{resultado.Nom_RA}</strong>
                                  <span className="text-muted ms-2">
                                    Ficha {resultado.Num_Fic}
                                  </span>
                                  {resultado.Des_RA && <p className="mb-0 mt-1">{resultado.Des_RA}</p>}
                                </li>
                              ))}
                            </ul>
                          )}

                          <form onSubmit={handleCrearResultado}>
                            <div className="row g-2 align-items-end">
                              <div className="col-md-4">
                                <label className="form-label" htmlFor="Nom_RA">Resultado de aprendizaje</label>
                                <input
                                  className="form-control"
                                  id="Nom_RA"
                                  maxLength={150}
                                  value={formularioResultado.Nom_RA}
                                  onChange={(event) =>
                                    setFormularioResultado((anterior) => ({
                                      ...anterior,
                                      Nom_RA: event.target.value,
                                    }))
                                  }
                                  required
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label" htmlFor="Des_RA">Descripción</label>
                                <input
                                  className="form-control"
                                  id="Des_RA"
                                  value={formularioResultado.Des_RA}
                                  onChange={(event) =>
                                    setFormularioResultado((anterior) => ({
                                      ...anterior,
                                      Des_RA: event.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label" htmlFor="Id_Fic">Ficha</label>
                                <select
                                  className="form-select"
                                  id="Id_Fic"
                                  value={formularioResultado.Id_Fic}
                                  onChange={(event) =>
                                    setFormularioResultado((anterior) => ({
                                      ...anterior,
                                      Id_Fic: event.target.value,
                                    }))
                                  }
                                  required
                                >
                                  <option value="">Seleccionar ficha</option>
                                  {fichas.map((ficha) => (
                                    <option key={ficha.Id_Fic} value={ficha.Id_Fic}>
                                      {ficha.Num_Fic}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-1 d-grid">
                                <button className="btn btn-success" type="submit" disabled={guardandoResultado}>
                                  {guardandoResultado ? "..." : "Agregar"}
                                </button>
                              </div>
                            </div>
                          </form>
                        </>
                      )}
                    </section>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}