import { useState, useRef } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";
import {
  cargarAprendices,
  cargarInstructores,
  cargarAdministradores,
} from "../../services/api";

const CATEGORIES = [
  {
    key: "aprendices",
    label: "Aprendices",
    hint: "Listado de aprendices para registrar o actualizar (.csv, .xlsx)",
    uploadFn: cargarAprendices,
  },
  {
    key: "instructores",
    label: "Instructores",
    hint: "Listado de instructores para registrar o actualizar (.csv, .xlsx)",
    uploadFn: cargarInstructores,
  },
  {
    key: "administradores",
    label: "Administradores",
    hint: "Listado de administradores para registrar o actualizar (.csv, .xlsx)",
    uploadFn: cargarAdministradores,
  },
];

function UploadCard({ category, file, status, resultado, error, onPick, onClear, onUpload }) {
  const inputRef = useRef(null);

  return (
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

        <h5 className="fw-bold text-dark mb-0">{category.label}</h5>
      </div>

      <p className="text-muted small mb-4">{category.hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="d-none"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(category.key, f);
          e.target.value = "";
        }}
      />

      {error && !file && (
        <div className="alert alert-danger py-2 small mb-3">{error}</div>
      )}

      {!file ? (
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
            <span className="small fw-medium text-break">{file.name}</span>
            {status !== "uploading" && (
              <button
                type="button"
                className="btn-close ms-2"
                aria-label="Quitar"
                onClick={() => onClear(category.key)}
              />
            )}
          </div>

          {error && <div className="small text-danger mb-2">{error}</div>}

          {status === "done" ? (
            <div className="small">
              <span className="text-success fw-semibold">
                ✓ {resultado?.creadas ?? 0} registrada(s)
                {resultado?.actualizadas ? `, ${resultado.actualizadas} actualizada(s)` : ""}
              </span>
              {resultado?.total_errores > 0 && (
                <div className="text-danger mt-1">
                  {resultado.total_errores} fila(s) con error (ver detalle abajo)
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={status === "uploading"}
              onClick={() => onUpload(category.key)}
              className="btn btn-sm w-100 text-white"
              style={{ backgroundColor: "#21750c" }}
            >
              {status === "uploading" ? (
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

      {resultado?.errores?.length > 0 && (
        <div className="mt-3">
          <h6 className="fw-bold small">Detalle de errores</h6>
          <div className="list-group">
            {resultado.errores.map((err, index) => (
              <div key={index} className="list-group-item small">
                <strong>Fila {err.fila}:</strong> {err.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CargaUsuarios() {
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState({});
  const [resultados, setResultados] = useState({});
  const [errores, setErrores] = useState({});

  function handlePick(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setStatus((prev) => ({ ...prev, [key]: "idle" }));
    setResultados((prev) => ({ ...prev, [key]: null }));
    setErrores((prev) => ({ ...prev, [key]: "" }));
  }

  function handleClear(key) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStatus((prev) => ({ ...prev, [key]: "idle" }));
    setResultados((prev) => ({ ...prev, [key]: null }));
    setErrores((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleUpload(key) {
    const category = CATEGORIES.find((c) => c.key === key);
    const file = files[key];
    if (!file || !category) return;

    setStatus((prev) => ({ ...prev, [key]: "uploading" }));
    setErrores((prev) => ({ ...prev, [key]: "" }));

    try {
      const respuesta = await category.uploadFn(file);
      setResultados((prev) => ({ ...prev, [key]: respuesta }));
      setStatus((prev) => ({ ...prev, [key]: "done" }));
    } catch (err) {
      console.error(err);

      const mensaje =
        err.response?.data?.detail ||
        "Ocurrió un error al cargar el archivo.";

      setErrores((prev) => ({
        ...prev,
        [key]:
          typeof mensaje === "string"
            ? mensaje
            : mensaje.mensaje || "Error al procesar el archivo.",
      }));
      setStatus((prev) => ({ ...prev, [key]: "idle" }));
    }
  }

  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>
          <div className="mb-4">
            <h2 className="fw-bold text-dark h4 mb-1">
              Gestión de usuarios (PDF/Excel)
            </h2>

            <p className="text-muted small mb-0">
              Sube un archivo Excel o CSV para registrar aprendices,
              instructores o administradores automáticamente.
            </p>
          </div>

          <div className="d-flex flex-column gap-4">
            {CATEGORIES.map((category) => (
              <UploadCard
                key={category.key}
                category={category}
                file={files[category.key]}
                status={status[category.key] || "idle"}
                resultado={resultados[category.key]}
                error={errores[category.key]}
                onPick={handlePick}
                onClear={handleClear}
                onUpload={handleUpload}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

export default CargaUsuarios;