import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearCompetencia } from "../../services/api";

export default function CreateCompetencia() {
  const navigate = useNavigate();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    Nom_Comp: "",
    Des_Comp: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formulario.Nom_Comp.trim() || !formulario.Des_Comp.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        Nom_Comp: formulario.Nom_Comp.trim(),
        Des_Comp: formulario.Des_Comp.trim(),
      };

      await crearCompetencia(datos);

      alert("Competencia registrada correctamente.");
      navigate("/administrador/competencias");
    } catch (err) {
      console.error("Error al crear competencia:", err);

      if (err.response?.status === 400) {
        setError(err.response.data.detail || "Datos inválidos.");
      } else if (err.response?.status === 401) {
        setError("Tu sesión expiró. Inicia sesión nuevamente.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para crear competencias.");
      } else {
        setError(err.response?.data?.detail || "No se pudo registrar la competencia.");
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="container my-5">
      <div className="page-card card shadow-sm" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">Crear Nueva Competencia</h1>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label htmlFor="Nom_Comp" className="form-label">
                  Nombre de la Competencia
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="Nom_Comp"
                  name="Nom_Comp"
                  maxLength={150}
                  value={formulario.Nom_Comp}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-12">
                <label htmlFor="Des_Comp" className="form-label">
                  Descripción
                </label>
                <textarea
                  className="form-control"
                  id="Des_Comp"
                  name="Des_Comp"
                  rows={4}
                  value={formulario.Des_Comp}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? "Registrando..." : "Registrar Competencia"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/competencias")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}