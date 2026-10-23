
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const API_URL = "http://localhost:8000";

export default function EditarResultadoAprendizaje() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [competencias, setCompetencias] = useState([]);

  const [form, setForm] = useState({
    Id_Comp: "",
    Nom_RA: "",
    Des_RA: "",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError("");

      try {
        const [resCompetencias, resResultado] = await Promise.all([
          fetch(`${API_URL}/competencias/`),
          fetch(`${API_URL}/resultados-aprendizaje/${id}`),
        ]);

        if (!resCompetencias.ok) {
          throw new Error("No se pudieron cargar las competencias.");
        }

        if (!resResultado.ok) {
          throw new Error(
            "No se pudo cargar el resultado de aprendizaje."
          );
        }

        const dataCompetencias = await resCompetencias.json();
        const dataResultado = await resResultado.json();

        setCompetencias(dataCompetencias);

        setForm({
          Id_Comp: String(dataResultado.Id_Comp ?? ""),
          Nom_RA: dataResultado.Nom_RA ?? "",
          Des_RA: dataResultado.Des_RA ?? "",
        });
      } catch (err) {
        setError(
          err.message || "Ocurrió un error al cargar los datos."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.Id_Comp) {
      setError("Debes seleccionar una competencia.");
      return;
    }

    if (!form.Nom_RA.trim()) {
      setError("El nombre del resultado es obligatorio.");
      return;
    }

    if (form.Nom_RA.trim().length > 150) {
      setError(
        "El nombre no puede superar los 150 caracteres."
      );
      return;
    }

    setGuardando(true);

    try {
      const res = await fetch(
        `${API_URL}/resultados-aprendizaje/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Id_Comp: Number(form.Id_Comp),
            Nom_RA: form.Nom_RA.trim(),
            Des_RA: form.Des_RA.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(
          data?.detail ||
            "No se pudieron guardar los cambios."
        );
      }

      navigate("/administrador/resultados-aprendizaje", {
        state: {
          mensaje:
            "Resultado de aprendizaje actualizado correctamente.",
        },
      });
    } catch (err) {
      setError(
        err.message || "Ocurrió un error al guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

        <p className="text-center my-4">
          Cargando resultado de aprendizaje...
        </p>
      </>
    );
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-5">
        <div
          className="page-card card shadow-sm"
          style={{ maxWidth: 650, margin: "0 auto" }}
        >
          <div className="card-header bg-warning text-dark py-3">
            <h1 className="h5 mb-0">
              Modificar Resultado de Aprendizaje
            </h1>

            <small>
              Actualiza la información del resultado seleccionado.
            </small>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-12">
                  <label
                    htmlFor="competencia"
                    className="form-label"
                  >
                    Competencia
                  </label>

                  <select
                    id="competencia"
                    name="Id_Comp"
                    className="form-select"
                    value={form.Id_Comp}
                    onChange={handleChange}
                    required
                    disabled={guardando}
                  >
                    <option value="">
                      Selecciona una competencia
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
                </div>

                <div className="col-md-12">
                  <label
                    htmlFor="nombre"
                    className="form-label"
                  >
                    Nombre del resultado
                  </label>

                  <input
                    type="text"
                    id="nombre"
                    name="Nom_RA"
                    className="form-control"
                    value={form.Nom_RA}
                    onChange={handleChange}
                    placeholder="Escribe el nombre del resultado"
                    maxLength={150}
                    required
                    disabled={guardando}
                  />
                </div>

                <div className="col-md-12">
                  <label
                    htmlFor="descripcion"
                    className="form-label"
                  >
                    Descripción
                  </label>

                  <textarea
                    id="descripcion"
                    name="Des_RA"
                    className="form-control"
                    rows={4}
                    value={form.Des_RA}
                    onChange={handleChange}
                    placeholder="Describe el resultado de aprendizaje"
                    disabled={guardando}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="alert alert-danger mt-3"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate(
                      "/administrador/resultados-aprendizaje"
                    )
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
