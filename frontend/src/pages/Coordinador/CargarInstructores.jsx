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
    <div className="container py-4">


      {/* ENCABEZADO */}
      <div className="mb-4">
        <h2 className="fw-bold">
          Carga masiva de instructores
        </h2>


        <p className="text-muted">
          Sube un archivo Excel o CSV para registrar varios
          instructores automáticamente.
        </p>
      </div>


      {/* TARJETA DE CARGA */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">


          <h5 className="fw-bold mb-3">
            Seleccionar archivo
          </h5>


          <input
            type="file"
            className="form-control"
            accept=".xlsx,.xls,.csv"
            onChange={seleccionarArchivo}
          />


          <div className="form-text mt-2">
            Formatos permitidos: XLSX, XLS y CSV.
          </div>


          {/* ARCHIVO SELECCIONADO */}
          {archivo && (
            <div className="alert alert-info mt-3">
              <strong>Archivo seleccionado:</strong>{" "}
              {archivo.name}
            </div>
          )}


          {/* ERROR */}
          {error && (
            <div className="alert alert-danger mt-3">
              {error}
            </div>
          )}


          {/* BOTÓN */}
          <button
            type="button"
            className="btn btn-primary mt-3 px-4"
            onClick={subirArchivo}
            disabled={cargando}
          >
            {cargando
              ? "Procesando..."
              : "Cargar instructores"}
          </button>


        </div>
      </div>


      {/* RESULTADO */}
      {resultado && (
        <div className="card shadow-sm border-0 rounded-4 mt-4">
          <div className="card-body p-4">


            <h5 className="fw-bold text-success mb-4">
              ✅ Archivo procesado correctamente
            </h5>


            {/* ESTADÍSTICAS */}
            <div className="row g-3">


              {/* PROCESADAS */}
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


              {/* CREADAS */}
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


              {/* ACTUALIZADAS */}
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


              {/* ERRORES */}
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


            {/* DETALLE DE ERRORES */}
            {resultado.errores?.length > 0 && (
              <div className="mt-4">


                <h6 className="fw-bold">
                  Detalle de errores
                </h6>


                <div className="list-group">


                  {resultado.errores.map(
                    (error, index) => (
                      <div
                        key={index}
                        className="list-group-item"
                      >
                        <strong>
                          Fila {error.fila}:
                        </strong>{" "}
                        {error.error}
                      </div>
                    )
                  )}


                </div>


              </div>
            )}


          </div>
        </div>
      )}


    </div>
  );
}


export default CargarInstructores;
