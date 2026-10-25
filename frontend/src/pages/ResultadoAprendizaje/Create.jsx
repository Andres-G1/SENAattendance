import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const API_URL = "http://localhost:8000";

export default function CrearResultadoAprendizaje() {
  const [competencias, setCompetencias] = useState([]);

  const [form, setForm] = useState({
    Nom_RA: "",
    Des_RA: "",
    Id_Comp: "",
  });

  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  // Cargar las competencias disponibles
  useEffect(() => {
    cargarCompetencias();
  }, []);

  async function cargarCompetencias() {
    try {
      const res = await fetch(`${API_URL}/competencias/`);

      if (!res.ok) {
        throw new Error("No se pudieron cargar las competencias.");
      }

      const data = await res.json();
      setCompetencias(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Actualizar los campos del formulario
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Crear el resultado de aprendizaje
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/resultados-aprendizaje/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Nom_RA: form.Nom_RA.trim(),
          Des_RA: form.Des_RA.trim() || null,
          Id_Comp: Number(form.Id_Comp),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(
          data?.detail || "No se pudo crear el resultado de aprendizaje."
        );
      }

      navigate("/administrador/resultado");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-5">
        <div
          className="page-card card shadow-sm"
          style={{ maxWidth: 650, margin: "0 auto" }}
        >
          <div className="card-header bg-success text-white py-3">
            <h1 className="h5 mb-0">
              Crear Resultado de Aprendizaje
            </h1>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              {/* Nombre del resultado */}
              <div className="mb-3">
                <label htmlFor="Nom_RA" className="form-label">
                  Nombre del Resultado de Aprendizaje
                </label>

                <input
                  type="text"
                  className="form-control"
                  id="Nom_RA"
                  name="Nom_RA"
                  placeholder="Ej: Identificar los requisitos del software"
                  maxLength={150}
                  value={form.Nom_RA}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="mb-3">
                <label htmlFor="Des_RA" className="form-label">
                  Descripción
                </label>

                <textarea
                  className="form-control"
                  id="Des_RA"
                  name="Des_RA"
                  placeholder="Describe el resultado de aprendizaje..."
                  rows={4}
                  value={form.Des_RA}
                  onChange={handleChange}
                />
              </div>

              {/* Competencia asociada */}
              <div className="mb-3">
                <label htmlFor="Id_Comp" className="form-label">
                  Competencia Asociada
                </label>

                <select
                  className="form-select"
                  id="Id_Comp"
                  name="Id_Comp"
                  value={form.Id_Comp}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    -- Selecciona una competencia --
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

                {competencias.length === 0 && !error && (
                  <small className="text-muted">
                    Cargando competencias...
                  </small>
                )}
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-success action-create"
                  disabled={cargando || competencias.length === 0}
                >
                  {cargando
                    ? "Creando..."
                    : "Crear Resultado de Aprendizaje"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate("/administrador/resultado")
                  }
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
