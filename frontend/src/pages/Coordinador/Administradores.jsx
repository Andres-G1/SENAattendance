import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listarAdministradores,
  desactivarAdministrador,
  activarAdministrador,
} from "../../services/api";

export default function Administradores() {
  const [administradores, setAdministradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const cargarAdministradores = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await listarAdministradores();
      setAdministradores(data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("No estás autenticado o tu sesión expiró.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para consultar los administradores.");
      } else {
        setError("No se pudieron cargar los administradores.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAdministradores();
  }, []);

  const handleDesactivar = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas desactivar a ${nombre}?`
    );
    if (!confirmar) return;

    try {
      await desactivarAdministrador(id);
      alert("Administrador desactivado correctamente.");
      cargarAdministradores();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo desactivar el administrador.");
    }
  };

  const handleActivar = async (id, nombre) => {
    const confirmar = window.confirm(`¿Deseas activar nuevamente a ${nombre}?`);
    if (!confirmar) return;

    try {
      await activarAdministrador(id);
      alert("Administrador activado correctamente.");
      cargarAdministradores();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo activar el administrador.");
    }
  };

  if (cargando) {
    return (
      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <p className="mb-0">Cargando administradores...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container my-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={cargarAdministradores}>
          Intentar nuevamente
        </button>
      </main>
    );
  }

  return (
    <main className="container my-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Lista de Administradores</h2>
          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate("/administrador/administradores/crear")}
          >
            Crear nuevo usuario
          </button>
        </div>

        {administradores.length === 0 ? (
          <div className="alert alert-info">No hay administradores registrados.</div>
        ) : (
          <ul className="list-group">
            {administradores.map((administrador) => {
              const nombreCompleto = `${administrador.Nom_Adm} ${administrador.Ape_Adm}`;

              return (
                <li
                  key={administrador.Id_Adm}
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                >
                  <div>
                    <strong>{nombreCompleto}</strong>
                    <small className="text-muted d-block">
                      ID: {administrador.Id_Adm} - {administrador.Cor_Adm}
                    </small>
                    <small className="d-block mt-1">
                      Estado:{" "}
                      {administrador.Es_Adm ? (
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
                        navigate(`/administrador/administradores/editar/${administrador.Id_Adm}`)
                      }
                    >
                      Editar
                    </button>

                    {administrador.Es_Adm ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDesactivar(administrador.Id_Adm, nombreCompleto)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleActivar(administrador.Id_Adm, nombreCompleto)}
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