
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

const API_URL = "http://localhost:8000";

export default function Delete() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError("");

      try {
        const res = await fetch(
          `${API_URL}/resultados-aprendizaje/${id}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);

          throw new Error(
            data?.detail ||
              "No se pudo cargar el resultado de aprendizaje."
          );
        }

        const data = await res.json();
        setResultado(data);
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

  async function handleDelete(e) {
    e.preventDefault();
    setError("");
    setEliminando(true);

    try {
      const res = await fetch(
        `${API_URL}/resultados-aprendizaje/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(
          data?.detail ||
            "No se pudo eliminar el resultado de aprendizaje."
        );
      }

      navigate("/administrador/resultados-aprendizaje", {
        state: {
          mensaje: "Resultado de aprendizaje eliminado correctamente.",
        },
      });
    } catch (err) {
      setError(
        err.message || "Ocurrió un error al eliminar el registro."
      );
    } finally {
      setEliminando(false);
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

  if (!resultado) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

        <main className="container my-5">
          <div className="alert alert-danger" role="alert">
            {error || "No se encontró el resultado de aprendizaje."}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              navigate("/administrador/resultados-aprendizaje")
            }
          >
            Volver
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-5">
        <div
          className="page-card card shadow-sm text-dark"
          style={{ maxWidth: 650, margin: "0 auto" }}
        >
          <div className="card-header bg-danger text-white py-3">
            <h1 className="h5 mb-0">
              Eliminar Resultado de Aprendizaje
            </h1>

            <small className="text-light">
              Registro #{resultado.Id_RA}
            </small>
          </div>

          <div className="card-body p-4">
            <p className="lead">
              ¿Estás seguro de que deseas eliminar este resultado
              de aprendizaje?
            </p>

            <p className="text-secondary">
              Esta acción puede afectar las fichas o asignaciones
              relacionadas con este registro.
            </p>

            <div className="mb-4">
              <p>
                <strong>ID:</strong> {resultado.Id_RA}
              </p>

              <p>
                <strong>Nombre:</strong> {resultado.Nom_RA}
              </p>

              <p>
                <strong>Competencia:</strong>{" "}
                {resultado.Nom_Comp || "Sin competencia"}
              </p>

              <p>
                <strong>Descripción:</strong>{" "}
                {resultado.Des_RA || "Sin descripción"}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleDelete}>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-danger"
                  type="submit"
                  disabled={eliminando}
                >
                  {eliminando
                    ? "Eliminando..."
                    : "Eliminar definitivamente"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate("/administrador/resultados-aprendizaje")
                  }
                  disabled={eliminando}
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
