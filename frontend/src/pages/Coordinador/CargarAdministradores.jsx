import { useState } from "react";
import { cargarAdministradores } from "../../services/api";

function CargarAdministradores() {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const seleccionarArchivo = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (!archivoSeleccionado) {
      return;
    }

    setArchivo(archivoSeleccionado);
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
      const respuesta = await cargarAdministradores(archivo);

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
    <div className="container py-4">

      <div className="mb-4">
        <h2 className="fw-bold">
          Carga masiva de administradores
        </h2>

        <p className="text-muted">
          Sube un archivo Excel o CSV para registrar varios
          administradores automáticamente.
        </p>
      </div>

      <div className="card shadow-sm border-0 rounded-4">

        <div className="card-body p-4">

          <h5 className="fw-bold mb-3">
            Seleccionar archivo
          </h5>

          <input
            type="file"
            className="form-control"
            accept=".xlsx,.csv"
            onChange={seleccionarArchivo}
          />

          <div className="form-text mt-2">
            Formatos permitidos: XLSX y CSV.
          </div>

          {archivo && (
            <div className="alert alert-info mt-3">
              <strong>Archivo seleccionado:</strong>{" "}
              {archivo.name}
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3">
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary mt-3 px-4"
            onClick={subirArchivo}
            disabled={cargando}
          >
            {cargando
              ? "Procesando..."
              : "Cargar administradores"}
          </button>

        </div>

      </div>

      {resultado && (
        <div className="card shadow-sm border-0 rounded-4 mt-4">

          <div className="card-body p-4">

            <h5 className="fw-bold text-success mb-4">
              ✅ Archivo procesado correctamente
            </h5>

            <div className="row g-3">

              <div className="col-md-3">
                <div className="border rounded-3 p-3">
                  <small className="text-muted">
                    Procesadas
                  </small>

                  <h3 className="fw-bold mb-0">
                    {resultado.procesadas}
                  </h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="border rounded-3 p-3">
                  <small className="text-muted">
                    Creadas
                  </small>

                  <h3 className="fw-bold mb-0">
                    {resultado.creadas}
                  </h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="border rounded-3 p-3">
                  <small className="text-muted">
                    Actualizadas
                  </small>

                  <h3 className="fw-bold mb-0">
                    {resultado.actualizadas}
                  </h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="border rounded-3 p-3">
                  <small className="text-muted">
                    Errores
                  </small>

                  <h3 className="fw-bold mb-0">
                    {resultado.total_errores}
                  </h3>
                </div>
              </div>

            </div>

            {resultado.errores?.length > 0 && (
              <div className="mt-4">

                <h6 className="fw-bold">
                  Detalle de errores
                </h6>

                <div className="list-group">

                  {resultado.errores.map((error, index) => (
                    <div
                      key={index}
                      className="list-group-item"
                    >
                      <strong>
                        Fila {error.fila}:
                      </strong>{" "}
                      {error.error}
                    </div>
                  ))}

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default CargarAdministradores;