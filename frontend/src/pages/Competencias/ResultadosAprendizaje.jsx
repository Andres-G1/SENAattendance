import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  activarResultadoAprendizaje,
  crearResultadoAprendizaje,
  desactivarResultadoAprendizaje,
  listarCompetencias,
  listarResultadosAprendizaje,
} from "../../services/api";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const FORMULARIO_INICIAL = { Nom_RA: "", Des_RA: "", Id_Comp: "" };

export default function ResultadosAprendizaje() {
  const [competencias, setCompetencias] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const firstName = (localStorage.getItem("firstName") || "").split(" ")[0];

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [listaCompetencias, listaResultados] = await Promise.all([
          listarCompetencias(),
          listarResultadosAprendizaje(),
        ]);
        setCompetencias(listaCompetencias);
        setResultados(listaResultados);
      } catch (err) {
        setError(err.response?.data?.detail || "No se pudieron cargar los resultados de aprendizaje.");
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  async function handleCrearResultado(event) {
    event.preventDefault();
    setError("");

    try {
      setGuardando(true);
      const nuevoResultado = await crearResultadoAprendizaje({
        Nom_RA: formulario.Nom_RA.trim(),
        Des_RA: formulario.Des_RA.trim() || null,
        Id_Comp: Number(formulario.Id_Comp),
      });
      setResultados((anteriores) => [nuevoResultado, ...anteriores]);
      setFormulario(FORMULARIO_INICIAL);
      setMostrarFormulario(false);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo guardar el resultado de aprendizaje.");
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(resultado) {
    setError("");
    setCambiandoEstado(resultado.Id_RA);
    try {
      const actualizar = resultado.Es_RA
        ? desactivarResultadoAprendizaje
        : activarResultadoAprendizaje;
      const resultadoActualizado = await actualizar(resultado.Id_RA);
      setResultados((anteriores) => anteriores.map((anterior) =>
        anterior.Id_RA === resultadoActualizado.Id_RA ? resultadoActualizado : anterior
      ));
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo cambiar el estado del resultado.");
    } finally {
      setCambiandoEstado(null);
    }
  }

  const competenciasConResultados = competencias.map((competencia) => ({
    ...competencia,
    resultados: resultados.filter(
      (resultado) => Number(resultado.Id_Comp) === Number(competencia.Id_Comp)
    ),
  }));

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4">
        <div className="card p-4 shadow-sm mb-4 bg-white">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <h1 className="h4 mb-1">Resultados de aprendizaje</h1>
              <p className="text-muted small mb-0">
                Administra los resultados vinculados a cada competencia.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/administrador" className="btn btn-outline-secondary btn-sm">
                Volver al panel
              </Link>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => setMostrarFormulario((mostrar) => !mostrar)}
              >
                {mostrarFormulario ? "Cancelar" : "+ Crear resultado"}
              </button>
            </div>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="card p-4 shadow-sm mb-4">
            <h2 className="h5 mb-3">Nuevo resultado de aprendizaje</h2>
            <form onSubmit={handleCrearResultado}>
              <div className="row g-3">
                <div className="col-12 col-md-5">
                  <label className="form-label" htmlFor="Nom_RA">Resultado de aprendizaje</label>
                  <input
                    className="form-control"
                    id="Nom_RA"
                    maxLength={150}
                    value={formulario.Nom_RA}
                    onChange={(event) => setFormulario((anterior) => ({
                      ...anterior,
                      Nom_RA: event.target.value,
                    }))}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="Des_RA">Descripción</label>
                  <input
                    className="form-control"
                    id="Des_RA"
                    value={formulario.Des_RA}
                    onChange={(event) => setFormulario((anterior) => ({
                      ...anterior,
                      Des_RA: event.target.value,
                    }))}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label" htmlFor="Id_Comp">Competencia</label>
                  <select
                    className="form-select"
                    id="Id_Comp"
                    value={formulario.Id_Comp}
                    onChange={(event) => setFormulario((anterior) => ({
                      ...anterior,
                      Id_Comp: event.target.value,
                    }))}
                    required
                  >
                    <option value="">Elegir competencia</option>
                    {competencias.map((competencia) => (
                      <option key={competencia.Id_Comp} value={competencia.Id_Comp}>
                        {competencia.Nom_Comp} ({competencia.Id_Comp})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setFormulario(FORMULARIO_INICIAL);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar resultado"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="h5 mb-0 text-secondary">Resultados por competencia</h2>
          </div>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {cargando && <p className="text-muted mb-0">Cargando resultados...</p>}
          {!cargando && !error && competencias.length === 0 && (
            <div className="alert alert-info mb-0">No hay competencias registradas.</div>
          )}

          {!cargando && !error && competenciasConResultados.map((competencia) => (
            <section className="card mb-3" key={competencia.Id_Comp}>
              <div className="card-header bg-light">
                <h3 className="h6 mb-0">{competencia.Nom_Comp}</h3>
                <small className="text-muted">Código: {competencia.Id_Comp}</small>
              </div>
              <div className="card-body">
                {competencia.resultados.length > 0 ? (
                  <ul className="list-group">
                    {competencia.resultados.map((resultado) => (
                      <li
                        className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 py-2"
                        key={resultado.Id_RA}
                      >
                        <div>
                          <strong>{resultado.Nom_RA}</strong>
                          <span className={`badge ms-2 ${resultado.Es_RA ? "bg-success" : "bg-secondary"}`}>
                            {resultado.Es_RA ? "Activo" : "Inactivo"}
                          </span>
                          {resultado.Des_RA && (
                            <small className="text-muted d-block mt-1">{resultado.Des_RA}</small>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${resultado.Es_RA ? "btn-danger" : "btn-success"}`}
                          onClick={() => alternarEstado(resultado)}
                          disabled={cambiandoEstado === resultado.Id_RA}
                        >
                          {cambiandoEstado === resultado.Id_RA
                            ? "Actualizando..."
                            : resultado.Es_RA ? "Desactivar" : "Activar"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No hay resultados registrados para esta competencia.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}