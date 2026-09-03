import { useState, useRef } from "react";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

// Ajusta el puerto si tu backend no corre en 8000
const API_BASE = "http://localhost:8000";

const ENDPOINTS = {
  fichas: `${API_BASE}/fichas/upload`,
  carreras: `${API_BASE}/carreras/upload`,
  competencias: `${API_BASE}/competencias/upload`,
};

const CATEGORIES = [
  {
    key: "fichas",
    label: "Fichas",
    hint: "Listado plano de fichas activas (.csv, .xlsx)",
  },
  {
    key: "carreras",
    label: "Carreras",
    hint: "Listado plano de programas / carreras (.csv, .xlsx)",
  },
  {
    key: "competencias",
    label: "Competencias",
    hint: "Listado plano de competencias asociadas (.csv, .xlsx)",
  },
];

function UploadCard({ category, file, status, resultado, onPick, onClear, onUpload }) {
  const inputRef = useRef(null);

  return (
    <div className="w-100">
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
          accept=".csv,.xlsx,.xls"
          className="d-none"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(category.key, f);
            e.target.value = "";
          }}
        />

        {!file ? (
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

            {status === "done" ? (
              <div className="small">
                <span className="text-success fw-semibold">
                  ✓ {resultado?.creadas ?? 0} registrada(s)
                </span>
                {resultado?.errores?.length > 0 && (
                  <div className="text-danger mt-1">
                    {resultado.errores.length} fila(s) con error (ver consola)
                  </div>
                )}
              </div>
            ) : status === "error" ? (
              <div className="small text-danger">No se pudo subir. Intenta de nuevo.</div>
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
      </div>
    </div>
  );
}

export default function SubirArchivosMenu() {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState({});
  const [resultados, setResultados] = useState({});

  // Tu app guarda la sesión en keys sueltas (firstName, user_id, role, access_token),
  // no como un objeto "user". Armamos lo que CoordinadorNavbar necesita a partir de eso.
  const user = {
    Nom_Adm: localStorage.getItem("firstName") || "Usuario",
  };

  const visibleCategories = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  function handlePick(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setStatus((prev) => ({ ...prev, [key]: "idle" }));
  }

  function handleClear(key) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStatus((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleUpload(key) {
    const file = files[key];
    if (!file) return;
    setStatus((prev) => ({ ...prev, [key]: "uploading" }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(ENDPOINTS[key], { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "upload failed");

      setResultados((prev) => ({ ...prev, [key]: data }));
      setStatus((prev) => ({ ...prev, [key]: "done" }));
    } catch (err) {
      console.error(err);
      setStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>

          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h2 className="fw-bold text-dark h4 mb-1">Cargar archivos planos</h2>
              <p className="text-muted small mb-0">
                Sube los listados de fichas, carreras o competencias en CSV o Excel.
              </p>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoría..."
              className="form-control"
              style={{ maxWidth: "240px" }}
            />
          </div>

          <div className="d-flex flex-column gap-4">
            {visibleCategories.map((cat) => (
              <UploadCard
                key={cat.key}
                category={cat}
                file={files[cat.key]}
                status={status[cat.key] || "idle"}
                resultado={resultados[cat.key]}
                onPick={handlePick}
                onClear={handleClear}
                onUpload={handleUpload}
              />
            ))}
            {visibleCategories.length === 0 && (
              <p className="text-center text-muted py-5">
                Ninguna categoría coincide con "{query}".
              </p>
            )}
          </div>

        </main>
      </div>
    </>
  );
}