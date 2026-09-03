import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CoordinadorNavbar from '/src/components/navbars/CoordinadorNavbar.jsx';

import {
  listarAprendices,
} from "../../services/api";

export default function Aprendices() {
  const [aprendices, setAprendices] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);
  const [mostrarFallas, setMostrarFallas] = useState(false);

  const navigate = useNavigate();

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const cargarAprendices = async () => {
    try {
      setCargando(true);
      setError("");
      const data = await listarAprendices();
      setAprendices(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("No estás autenticado o tu sesión expiró.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para consultar los aprendices.");
      } else {
        setError("No se pudieron cargar los aprendices.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAprendices();
  }, []);

  const abrirHistorialFallas = (nombre) => {
    setAprendizSeleccionado(nombre);
    setMostrarFallas(true);
  };

  if (cargando) {
    return (
      <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
        <main className="container my-4">
          <div className="card p-4 shadow-sm">
            <p className="mb-0">Cargando aprendices...</p>
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
          <button className="btn btn-primary" onClick={cargarAprendices}>
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
        <div className="card p-4 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 mb-0">Lista de Aprendices</h2>
            <button
              className="btn btn-success btn-sm"
              onClick={() => navigate("/administrador/aprendices/crear")}
            >
               Crear nuevo usuario
            </button>
          </div>

          {aprendices.length === 0 ? (
            <div className="alert alert-info">No hay aprendices registrados.</div>
          ) : (
            <ul className="list-group">
              {aprendices.map((aprendiz) => {
                const nombreCompleto = `${aprendiz.Nom_Apr} ${aprendiz.Ape_Apr}`;

                return (
                  <li
                    key={aprendiz.Id_Apr}
                    className="list-group-item d-flex justify-content-between align-items-center py-3"
                  >
                    <div>
                      <strong>{nombreCompleto}</strong>
                      <span className="badge bg-info text-dark ms-2">
                        Ficha: {aprendiz.Num_Fic || "Sin asignar"}
                      </span>
                      <small className="text-muted d-block">
                        ID: {aprendiz.Id_Apr} - {aprendiz.Cor_Apr}
                      </small>
                      <small className="d-block mt-1">
                        Estado:{" "}
                        {aprendiz.Es_Apr ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                      </small>
                    </div>

                    <div>
                      <button
                        className="btn btn-outline-danger btn-sm me-2"
                        onClick={() => abrirHistorialFallas(nombreCompleto)}
                      >
                        ⚠️ Ver Fallas
                      </button>

                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() =>
                          navigate(`/administrador/aprendices/editar/${aprendiz.Id_Apr}`)
                        }
                      >
                        Editar
                      </button>

                      {aprendiz.Es_Apr ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            navigate(`/administrador/aprendices/desactivar/${aprendiz.Id_Apr}`, {
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
                            navigate(`/administrador/aprendices/activar/${aprendiz.Id_Apr}`, {
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

        {mostrarFallas && (
          <div className="card p-4 shadow-sm border-danger">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h6 mb-0 text-danger font-weight-bold">
                📊 Reporte e Inasistencias de: <span className="text-dark">{aprendizSeleccionado}</span>
              </h3>
              <button
                className="btn-close"
                type="button"
                onClick={() => setMostrarFallas(false)}
                aria-label="Close"
              ></button>
            </div>

            <p className="small text-muted mb-3">Vista de simulación de control académico para la sustentación del jurado.</p>

            <div className="table-responsive">
              <table className="table table-sm table-hover text-center align-middle">
                <thead className="table-light">
                  <tr className="small text-uppercase">
                    <th>Competencia / Guía</th>
                    <th>Fecha</th>
                    <th>Horas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody className="small">
                  <tr>
                    <td className="text-start">Desarrollo de software según requerimientos técnicos</td>
                    <td>15/02/2026</td>
                    <td>6 horas</td>
                    <td><span className="badge bg-danger">Injustificada</span></td>
                  </tr>
                  <tr>
                    <td className="text-start">Promover la interacción idónea consigo mismo (Ética)</td>
                    <td>22/02/2026</td>
                    <td>3 horas</td>
                    <td><span className="badge bg-warning text-dark">Justificada</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}