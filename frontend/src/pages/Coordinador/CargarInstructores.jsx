import { useState } from "react";
import { cargarInstructores } from "../../services/api";

function CargarInstructores() {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  // Seleccionar archivo
  const seleccionarArchivo = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (!archivoSeleccionado) {
      return;
    }

    setArchivo(archivoSeleccionado);
    setResultado(null);
    setError("");
  };

  // Subir archivo
  const subirArchivo = async () => {
    if (!archivo) {
      setError("Por favor selecciona un archivo.");
      return;
    }

    setCargando(true);
    setError("");
    setResultado(null);

    try {
      const respuesta = await cargarInstructores(archivo);

      setResultado(respuesta);
    } catch (err) {
      console.error(err);

      const mensaje =
        err.response?.data?.detail ||
        "Ocurrió un error al cargar el archivo.";

      setError(
        typeof mensaje === "string"
          ? mensaje
          : mensaje.mensaje || "Error al procesar el archivo."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-vh-100 py-5"
      style={{ backgroundColor: "#f4f6f8" }}
    >
      <main className="container" style={{ maxWidth: "900px" }}>

        {/* ENCABEZADO */}
        <div className="text-center mb-5">
          <h1 className="fw-bold text-dark mb-2">
            Carga masiva de instructores
          </h1>

          <p className="text-muted mb-0">
            Sube un archivo Excel o CSV para registrar varios
            instructores automáticamente.
          </p>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div
          className="bg-white rounded-4 p-4 p-md-5 shadow-sm"
          style={{
            border: "1px solid #e1e5e8",
          }}
        >

          {/* TITULO */}
          <div className="d-flex align-items-center gap-3 mb-4">

            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#e6f4d7",
                color: "#1b5e20",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            <div>
              <h2 className="fw-bold text-dark mb-1 h4">
                Seleccionar archivo
              </h2>

              <p className="text-muted small mb-0">
                Listado de instructores para registrar o actualizar.
              </p>
            </div>

          </div>

          {/* INPUT */}
          <input
            type="file"
            className="form-control form-control-lg"
            accept=".xlsx,.xls,.csv"
            onChange={seleccionarArchivo}
          />

          <div className="form-text mt-2">
            Formatos permitidos: XLSX, XLS y CSV.
          </div>

          {/* ARCHIVO SELECCIONADO */}
          {archivo && (
            <div className="alert alert-info mt-4 mb-0">
              <strong>Archivo seleccionado:</strong>{" "}
              {archivo.name}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="alert alert-danger mt-4 mb-0">
              {error}
            </div>
          )}

          {/* BOTON */}
          <button
            type="button"
            className="btn w-100 text-white fw-semibold mt-4 py-3 rounded-3"
            style={{
              backgroundColor: "#00851d",
              border: "none",
            }}
            onClick={subirArchivo}
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Procesando...
              </>
            ) : (
              "Cargar instructores"
            )}
          </button>

        </div>

        {/* RESULTADO */}
        {resultado && (
          <div
            className="bg-white rounded-4 p-4 p-md-5 shadow-sm mt-4"
            style={{
              border: "1px solid #e1e5e8",
            }}
          >

            <h2 className="fw-bold text-success h5 mb-4">
              ✅ Archivo procesado correctamente
            </h2>

            {/* ESTADISTICAS */}
            <div className="row g-3">

              <div className="col-6 col-md-3">
                <div className="border rounded-3 p-3 h-100">
                  <small className="text-muted">
                    Procesadas
                  </small>

                  <h3 className="fw-bold mb-0 mt-1">
                    {resultado.procesadas ?? 0}
                  </h3>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="border rounded-3 p-3 h-100">
                  <small className="text-muted">
                    Creadas
                  </small>

                  <h3 className="fw-bold text-success mb-0 mt-1">
                    {resultado.creadas ?? 0}
                  </h3>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="border rounded-3 p-3 h-100">
                  <small className="text-muted">
                    Actualizadas
                  </small>

                  <h3 className="fw-bold mb-0 mt-1">
                    {resultado.actualizadas ?? 0}
                  </h3>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="border rounded-3 p-3 h-100">
                  <small className="text-muted">
                    Errores
                  </small>

                  <h3 className="fw-bold text-danger mb-0 mt-1">
                    {resultado.total_errores ?? 0}
                  </h3>
                </div>
              </div>

            </div>

            {/* DETALLE DE ERRORES */}
            {resultado.errores?.length > 0 && (
              <div className="mt-4">

                <h3 className="fw-bold h6 mb-3">
                  Detalle de errores
                </h3>

                <div className="list-group">

                  {resultado.errores.map((err, index) => (
                    <div
                      key={index}
                      className="list-group-item"
                    >
                      <strong>
                        Fila {err.fila}:
                      </strong>{" "}
                      {err.error}
                    </div>
                  ))}

                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default CargarInstructores;