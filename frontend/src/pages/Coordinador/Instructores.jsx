import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

import { listarInstructores } from "../../services/api";

export default function Instructores() {
  const [instructores, setInstructores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const cargarInstructores = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await listarInstructores();
      setInstructores(data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("No estás autenticado o tu sesión expiró.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para consultar los instructores.");
      } else {
        setError("No se pudieron cargar los instructores.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInstructores();
  }, []);

  if (cargando) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="card p-4 shadow-sm">
            <p className="mb-0">Cargando instructores...</p>
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
          <button className="btn btn-primary" onClick={cargarInstructores}>
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
            <h2 className="h5 mb-0">Lista de Instructores</h2>
            <button
              className="btn btn-success btn-sm"
              onClick={() => navigate("/administrador/instructores/crear")}
            >
              + Crear nuevo usuario
            </button>
          </div>

          {instructores.length === 0 ? (
            <div className="alert alert-info">No hay instructores registrados.</div>
          ) : (
            <ul className="list-group">
              {instructores.map((instructor) => {
                const nombreCompleto = `${instructor.Nom_Ins} ${instructor.Ape_Ins}`;

                return (
                  <li
                    key={instructor.Id_Ins}
                    className="list-group-item d-flex justify-content-between align-items-center py-3"
                  >
                    <div>
                      <strong>{nombreCompleto}</strong>
                      <small className="text-muted d-block">
                        ID: {instructor.Id_Ins} - {instructor.Cor_Ins}
                      </small>
                      <small className="d-block mt-1">
                        Estado:{" "}
                        {instructor.Es_Ins ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                      </small>
                    </div>

                    <div>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() =>
                          navigate(`/administrador/instructores/editar/${instructor.Id_Ins}`)
                        }
                      >
                        Editar
                      </button>

                      {instructor.Es_Ins ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            navigate(`/administrador/instructores/desactivar/${instructor.Id_Ins}`, {
                              state: { nombre: nombreCompleto, tipo: "desactivar" },
                            })
                          }
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            navigate(`/administrador/instructores/activar/${instructor.Id_Ins}`, {
                              state: { nombre: nombreCompleto, tipo: "activar" },
                            })
                          }
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}