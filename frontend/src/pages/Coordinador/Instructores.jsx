import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listarInstructores,
  desactivarInstructor,
  activarInstructor,
} from "../../services/api";

export default function Instructores() {
  const [instructores, setInstructores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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

  const handleDesactivar = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas desactivar a ${nombre}?`
    );
    if (!confirmar) return;

    try {
      await desactivarInstructor(id);
      alert("Instructor desactivado correctamente.");
      cargarInstructores();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo desactivar el instructor.");
    }
  };

  const handleActivar = async (id, nombre) => {
    const confirmar = window.confirm(`¿Deseas activar nuevamente a ${nombre}?`);
    if (!confirmar) return;

    try {
      await activarInstructor(id);
      alert("Instructor activado correctamente.");
      cargarInstructores();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo activar el instructor.");
    }
  };

  if (cargando) {
    return (
      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <p className="mb-0">Cargando instructores...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container my-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={cargarInstructores}>
          Intentar nuevamente
        </button>
      </main>
    );
  }

  return (
    <main className="container my-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Lista de Instructores</h2>
          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate("/administrador/instructores/crear")}
          >
            Crear nuevo usuario
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
                        onClick={() => handleDesactivar(instructor.Id_Ins, nombreCompleto)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleActivar(instructor.Id_Ins, nombreCompleto)}
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
  );
}