import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";
import { cargarAprendicesPorFicha } from "../../services/api";
import { obtenerFicha } from "../../services/fichaService";

function CargarAprendices() {
  const { idFicha } = useParams();

  const [ficha, setFicha] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const user = { Nom_Adm: localStorage.getItem("firstName") || "Usuario" };

  useEffect(() => {
    obtenerFicha(idFicha)
      .then(setFicha)
      .catch(() => setError("No se pudo cargar la ficha."));
  }, [idFicha]);

  const seleccionarArchivo = (e) => {
    const seleccionado = e.target.files[0];
    if (!seleccionado) return;
    setArchivo(seleccionado);
    setResultado(null);
    setError("");
  };

  const quitarArchivo = () => {
    setArchivo(null);
    setResultado(null);
    setError("");
  };

  const subirArchivo = async () => {
    if (!archivo) {
      setError("Por favor selecciona un archivo.");
      return;
    }

    setCargando(true);
    setError("");
    setResultado(null);

    try {
      const respuesta = await cargarAprendicesPorFicha(idFicha, archivo);
      setResultado(respuesta);
    } catch (err) {
      console.error(err);
      const mensaje =
        err.response?.data?.detail || "Ocurrió un error al cargar el archivo.";
      setError(
        typeof mensaje === "string"
          ? mensaje
          : mensaje.mensaje || "Error al procesar el archivo."
      );
    } finally {
      setCargando(false);
    }
  };

  const numeroFicha = ficha?.Num_Fic ?? ficha?.ficha?.Num_Fic;

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>
          <Link
            to="/administrador/aprendices/fichas"
            className="small text-decoration-none"
          >
            ← Volver a las fichas
          </Link>

          <div className="my-3">
            <h2 className="fw-bold text-dark h4 mb-1">
              Subir aprendices{numeroFicha ? ` — Ficha ${numeroFicha}` : ""}
            </h2>
            <p className="text-muted small mb-0">
              Sube un Excel o CSV: todos los aprendices quedarán en esta ficha.
              Columnas: Tipo_Identificacion, Numero_Identificacion, Nombre,
              Apellido, Correo.
            </p>
          </div>

          <div className="d-flex flex-column gap-4">
            <div
              className="rounded-4 p-4 bg-white"
              style={{ border: "2px solid #00851d" }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="d-none"
                onChange={(e) => {
                  seleccionarArchivo(e);
                  e.target.value = "";
                }}
              />

              {error && !archivo && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              {!archivo ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="btn rounded-3 w-100 fw-semibold py-2 shadow-sm text-white"
                  style={{ backgroundColor: "#00851d" }}
                >
                  Subir Documento / Excel
                </button>
              ) : (
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="small fw-medium text-break">
                      {archivo.name}
                    </span>
                    {!cargando && (
                      <button
                        type="button"
                        className="btn-close ms-2"
                        aria-label="Quitar"
                        onClick={quitarArchivo}
                      />
                    )}
                  </div>

                  {error && <div className="small text-danger mb-2">{error}</div>}

                  {resultado ? (
                    <div className="small text-success fw-semibold">
                      ✓ {resultado.creadas ?? 0} registrada(s)
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={cargando}
                      onClick={subirArchivo}
                      className="btn btn-sm w-100 text-white"
                      style={{ backgroundColor: "#21750c" }}
                    >
                      {cargando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Subiendo...
                        </>
                      ) : (
                        "Confirmar subida"
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {resultado && (
              <div
                className="rounded-4 p-4 bg-white"
                style={{ border: "2px solid #00851d" }}
              >
                <h5 className="fw-bold text-success mb-4">
                  ✅ Archivo procesado correctamente
                </h5>

                <div className="row g-3">
                  {[
                    ["Procesadas", resultado.procesadas],
                    ["Creadas", resultado.creadas],
                    ["Actualizadas", resultado.actualizadas],
                    ["Errores", resultado.total_errores],
                  ].map(([titulo, valor]) => (
                    <div className="col-6 col-md-3" key={titulo}>
                      <div className="border rounded-3 p-3">
                        <small className="text-muted">{titulo}</small>
                        <h3 className="fw-bold mb-0">{valor}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                {resultado.errores?.length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-bold">Detalle de errores</h6>
                    <div className="list-group">
                      {resultado.errores.map((err, index) => (
                        <div key={index} className="list-group-item">
                          <strong>Fila {err.fila}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default CargarAprendices;
