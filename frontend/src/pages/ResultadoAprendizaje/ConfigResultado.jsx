import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const API_URL = "http://localhost:8000";

export default function ResultadosAprendizaje() {
  const [competencias, setCompetencias] = useState([]);
  const [resultados, setResultados] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    Nom_RA: "",
    Des_RA: "",
    Id_Comp: "",
  });

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  // --------------------------------------------------
  // CARGAR COMPETENCIAS Y RESULTADOS
  // --------------------------------------------------

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

      if (!resCompetencias.ok) {
        throw new Error(
          `Error al cargar competencias (${resCompetencias.status})`
        );
      }

      if (!resResultados.ok) {
        throw new Error(
          `Error al cargar resultados (${resResultados.status})`
        );
      }

      const [dataCompetencias, dataResultados] = await Promise.all([
        resCompetencias.json(),
        resResultados.json(),
      ]);

      setCompetencias(dataCompetencias);
      setResultados(dataResultados);
    } catch (err) {
      console.error("Error cargando resultados de aprendizaje:", err);
      setError(
        err.message ||
          "No se pudo conectar con el servidor. Verifica que el backend esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  }

  // --------------------------------------------------
  // CAMBIAR CAMPOS DEL FORMULARIO
  // --------------------------------------------------

  function handleChange(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  // --------------------------------------------------
  // CREAR RESULTADO DE APRENDIZAJE
  // --------------------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);

    const nombre = formulario.Nom_RA.trim();

    if (!nombre) {
      setMensaje({
        tipo: "error",
        texto: "El nombre del resultado de aprendizaje es obligatorio.",
      });
      return;
    }

    if (!formulario.Id_Comp) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una competencia.",
      });
      return;
    }

    const bodyData = {
      Nom_RA: nombre,
      Des_RA: formulario.Des_RA.trim() || null,
      Id_Comp: Number(formulario.Id_Comp),
    };

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/resultados-aprendizaje/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        }
      );

      const data = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : `No se pudo crear el resultado (${respuesta.status}).`
        );
      }

      setResultados((anteriores) => [data, ...anteriores]);

      setFormulario({
        Nom_RA: "",
        Des_RA: "",
        Id_Comp: "",
      });

      setMostrarFormulario(false);

      setMensaje({
        tipo: "exito",
        texto: "Resultado de aprendizaje creado correctamente.",
      });
    } catch (err) {
      console.error("Error creando resultado:", err);

      setMensaje({
        tipo: "error",
        texto: err.message || "No se pudo crear el resultado.",
      });
    } finally {
      setGuardando(false);
    }
  }

  // --------------------------------------------------
  // AGRUPAR RESULTADOS POR COMPETENCIA
  // --------------------------------------------------

  const competenciasConResultados = competencias.map((competencia) => ({
    ...competencia,
    resultados: resultados.filter(
      (resultado) =>
        Number(resultado.Id_Comp) === Number(competencia.Id_Comp)
    ),
  }));

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4">
        {/* ENCABEZADO */}

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

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate(-1)}
              >
                Volver
              </button>

              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  setMensaje(null);
                  setMostrarFormulario((anterior) => !anterior);
                }}
              >
                {mostrarFormulario
                  ? "Cancelar"
                  : "+ Nuevo Resultado"}
              </button>
            </div>
          </div>
        </div>

        {/* MENSAJES */}

        {mensaje && (
          <div
            className={`alert ${
              mensaje.tipo === "exito"
                ? "alert-success"
                : "alert-danger"
            } alert-dismissible fade show`}
            role="alert"
          >
            {mensaje.texto}

            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() => setMensaje(null)}
            />
          </div>
        )}

        {/* FORMULARIO */}

        {mostrarFormulario && (
          <div className="card p-4 shadow-sm mb-4">
            <h3 className="h5 mb-3">Registrar Resultado de Aprendizaje</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="Id_Comp" className="form-label">
                  Competencia
                </label>

                <select
                  id="Id_Comp"
                  name="Id_Comp"
                  className="form-select"
                  value={formulario.Id_Comp}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    -- Seleccione una competencia --
                  </option>

                  {competencias.map((competencia) => (
                    <option
                      key={competencia.Id_Comp}
                      value={competencia.Id_Comp}
                    >
                      {competencia.Nom_Comp}
                    </option>
                  ))}
                </select>

                {competencias.length === 0 && (
                  <div className="form-text text-danger">
                    No hay competencias disponibles. Registra una competencia
                    primero.
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="Nom_RA" className="form-label">
                  Nombre del resultado
                </label>

                <input
                  id="Nom_RA"
                  name="Nom_RA"
                  type="text"
                  className="form-control"
                  placeholder="Ej. Implementar soluciones de software"
                  maxLength={150}
                  value={formulario.Nom_RA}
                  onChange={handleChange}
                  required
                />

                <div className="form-text">
                  Máximo 150 caracteres.
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="Des_RA" className="form-label">
                  Descripción
                </label>

                <textarea
                  id="Des_RA"
                  name="Des_RA"
                  className="form-control"
                  rows={3}
                  placeholder="Describe qué debe alcanzar el aprendiz..."
                  value={formulario.Des_RA}
                  onChange={handleChange}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={guardando}
                  onClick={() => {
                    setMostrarFormulario(false);
                    setFormulario({
                      Nom_RA: "",
                      Des_RA: "",
                      Id_Comp: "",
                    });
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={guardando || competencias.length === 0}
                >
                  {guardando ? "Guardando..." : "Guardar Resultado"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTADO */}

        <div className="card p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center gap-2 mb-4">
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
            <p className="text-center text-muted my-4">
              Cargando resultados de aprendizaje...
            </p>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              <p className="mb-2">{error}</p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={cargarDatos}
              >
                Reintentar
              </button>
            </div>
          ) : competenciasConResultados.length > 0 ? (
            competenciasConResultados.map((competencia) => (
              <div className="card mb-3" key={competencia.Id_Comp}>
                <div className="card-header bg-light d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                  <div>
                    <h5 className="mb-1">
                      {competencia.Nom_Comp}
                    </h5>

                    <small className="text-muted">
                      Competencia #{competencia.Id_Comp}
                    </small>
                  </div>

                  <span className="badge bg-success">
                    {competencia.resultados.length} resultado(s)
                  </span>
                </div>

                <div className="card-body">
                  {competencia.resultados.length > 0 ? (
                    <div className="list-group">
                      {competencia.resultados.map((resultado) => (
                        <div
                          key={resultado.Id_RA}
                          className="list-group-item py-3"
                        >
                          <div className="d-flex flex-column flex-sm-row justify-content-between gap-2">
                            <div>
                              <h6 className="mb-1">
                                {resultado.Nom_RA}
                              </h6>

                              <p className="text-muted small mb-0">
                                {resultado.Des_RA ||
                                  "Sin descripción registrada."}
                              </p>

                              <small className="text-secondary d-block mt-2">
                                Código del resultado: {resultado.Id_RA}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">
                      Esta competencia todavía no tiene resultados de
                      aprendizaje registrados.
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