import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listarCompetencias, actualizarCompetencia } from "../../services/api";

export default function EditCompetencia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    Nom_Comp: "",
    Des_Comp: "",
  });

  useEffect(() => {
    const cargarCompetencia = async () => {
      try {
        const lista = await listarCompetencias();
        const competencia = lista.find(
          (c) => String(c.Id_Comp) === String(id)
        );

        if (!competencia) {
          setError("No se encontró la competencia solicitada.");
          return;
        }

        setFormulario({
          Nom_Comp: competencia.Nom_Comp || "",
          Des_Comp: competencia.Des_Comp || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "No se pudo cargar la competencia.");
      } finally {
        setCargando(false);
      }
    };

    cargarCompetencia();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formulario.Nom_Comp.trim() || !formulario.Des_Comp.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        Nom_Comp: formulario.Nom_Comp.trim(),
        Des_Comp: formulario.Des_Comp.trim(),
      };

      await actualizarCompetencia(id, datos);

      alert("Competencia actualizada correctamente.");
      navigate("/administrador/competencias");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo actualizar la competencia.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <main className="container my-5">
        <div className="alert alert-info">Cargando información de la competencia...</div>
      </main>
    );
  }

  if (error && !formulario.Nom_Comp) {
    return (
      <main className="container my-5">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  }

  return (
    <main className="container my-5">
      <div className="card shadow-sm" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="card-header bg-warning text-dark py-3">
          <h1 className="h5 mb-0">Modificar Competencia</h1>
          <small>ID: {id}</small>
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
                  id="Nom_Comp"
                  name="Nom_Comp"
                  className="form-control"
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
                  id="Des_Comp"
                  name="Des_Comp"
                  className="form-control"
                  rows={4}
                  value={formulario.Des_Comp}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/competencias")}
              >
                Cancelar
              </button>

              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}