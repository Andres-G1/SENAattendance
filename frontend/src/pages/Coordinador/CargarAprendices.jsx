import { useState, useRef } from "react";
import { cargarAprendices } from "../../services/api";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

function CargarAprendices() {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Igual que en SubirArchivosMenu: la sesión se guarda en keys sueltas
  // (firstName, user_id, role, access_token), no como un objeto "user".
  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  const seleccionarArchivo = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (!archivoSeleccionado) {
      return;
    }

    setArchivo(archivoSeleccionado);
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
      const respuesta = await cargarAprendices(archivo);

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
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>

        <div className="mb-4">
          <h2 className="fw-bold text-dark h4 mb-1">
            Carga masiva de aprendices
          </h2>

          <p className="text-muted small mb-0">
            Sube un archivo Excel o CSV para registrar varios aprendices
            automáticamente.
          </p>
        </div>

        <div className="d-flex flex-column gap-4">

          <div
            className="rounded-4 p-4 bg-white"
            style={{ border: "2px solid #00851d" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="p-3 rounded-3"
                style={{ backgroundColor: "#E6F4D7", color: "#1B5E20" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
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

              <h5 className="fw-bold text-dark mb-0">Aprendices</h5>
            </div>

            <p className="text-muted small mb-4">
              Formatos permitidos: XLSX y CSV.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              className="d-none"
              onChange={(e) => {
                seleccionarArchivo(e);
                e.target.value = "";
              }}
            />

            {error && !archivo && (
              <div className="alert alert-danger py-2 small mb-3">
                {error}
              </div>
            )}

            {!archivo ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn rounded-3 mt-auto w-100 fw-semibold py-2 shadow-sm text-white"
                style={{ backgroundColor: "#00851d" }}
              >
                Subir Documento / Excel
              </button>
            ) : (
              <div className="border rounded-3 p-3 bg-light mt-auto">
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

                {error && (
                  <div className="small text-danger mb-2">{error}</div>
                )}

                {resultado ? (
                  <div className="small">
                    <span className="text-success fw-semibold">
                      ✓ {resultado.creadas ?? 0} registrada(s)
                    </span>
                    {resultado.total_errores > 0 && (
                      <div className="text-danger mt-1">
                        {resultado.total_errores} fila(s) con error (ver
                        detalle abajo)
                      </div>
                    )}
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
                <div className="col-md-3">
                  <div className="border rounded-3 p-3">
                    <small className="text-muted">Procesadas</small>
                    <h3 className="fw-bold mb-0">{resultado.procesadas}</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="border rounded-3 p-3">
                    <small className="text-muted">Creadas</small>
                    <h3 className="fw-bold mb-0">{resultado.creadas}</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="border rounded-3 p-3">
                    <small className="text-muted">Actualizadas</small>
                    <h3 className="fw-bold mb-0">{resultado.actualizadas}</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="border rounded-3 p-3">
                    <small className="text-muted">Errores</small>
                    <h3 className="fw-bold mb-0">{resultado.total_errores}</h3>
                  </div>
                </div>
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