import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarCompetencias } from "../../services/api";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

export default function ConfigCompetencia() {
  const [competencias, setCompetencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const cargarCompetencias = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await listarCompetencias();
      setCompetencias(data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("No estás autenticado o tu sesión expiró.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para consultar las competencias.");
      } else {
        setError("No se pudieron cargar las competencias.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCompetencias();
  }, []);

  if (cargando) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="card p-4 shadow-sm">
            <p className="mb-0">Cargando competencias...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={cargarCompetencias}>
            Intentar nuevamente
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 mb-0">Lista de Competencias</h2>
            <button
              className="btn btn-success btn-sm"
              onClick={() => navigate("/competencias/nueva")}
            >
              + Crear Competencia
            </button>
          </div>

          {competencias.length === 0 ? (
            <div className="alert alert-info">No hay competencias registradas.</div>
          ) : (
            <ul className="list-group">
              {competencias.map((competencia) => (
                <li
                  key={competencia.Id_Comp}
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                >
                  <div>
                    <strong>{competencia.Nom_Comp}</strong>
                    <small className="text-muted d-block">
                      ID: {competencia.Id_Comp}
                    </small>
                    <small className="d-block mt-1 text-muted">
                      {competencia.Des_Comp}
                    </small>
                  </div>

                  <div>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() =>
                        navigate(`/competencias/editar/${competencia.Id_Comp}`)
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        navigate(`/competencias/eliminar/${competencia.Id_Comp}`, {
                          state: { nombre: competencia.Nom_Comp },
                        })
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}