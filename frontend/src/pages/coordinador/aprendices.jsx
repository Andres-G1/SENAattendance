import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listarAprendices,
  desactivarAprendiz,
  activarAprendiz,
} from "../../services/api";

export default function Aprendices() {
  const [aprendices, setAprendices] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // =====================================================
  // CARGAR APRENDICES
  // =====================================================

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

  // =====================================================
  // EJECUTAR AL ABRIR LA PÁGINA
  // =====================================================

  useEffect(() => {
    cargarAprendices();
  }, []);

  // =====================================================
  // DESACTIVAR APRENDIZ
  // =====================================================

  const handleDesactivar = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas desactivar a ${nombre}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await desactivarAprendiz(id);

      alert("Aprendiz desactivado correctamente.");

      cargarAprendices();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "No se pudo desactivar el aprendiz."
      );
    }
  };

  // =====================================================
  // ACTIVAR APRENDIZ
  // =====================================================

  const handleActivar = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Deseas activar nuevamente a ${nombre}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await activarAprendiz(id);

      alert("Aprendiz activado correctamente.");

      cargarAprendices();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "No se pudo activar el aprendiz."
      );
    }
  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <main className="container my-4">
        <div className="card p-4 shadow-sm">
          <p className="mb-0">Cargando aprendices...</p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="container my-4">
        <div className="alert alert-danger">
          {error}
        </div>

        <button
          className="btn btn-primary"
          onClick={cargarAprendices}
        >
          Intentar nuevamente
        </button>
      </main>
    );
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <main className="container my-4">

      <div className="card p-4 shadow-sm">

        {/* ENCABEZADO */}

        <div className="d-flex justify-content-between align-items-center mb-4">

          <h2 className="h5 mb-0">
            Lista de Aprendices
          </h2>

          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate("/administrador/aprendices/crear")}
          >
            Crear nuevo usuario
          </button>

        </div>

        {/* LISTA */}

        {aprendices.length === 0 ? (

          <div className="alert alert-info">
            No hay aprendices registrados.
          </div>

        ) : (

          <ul className="list-group">

            {aprendices.map((aprendiz) => {

              const nombreCompleto =
                `${aprendiz.Nom_Apr} ${aprendiz.Ape_Apr}`;

              return (

                <li
                  key={aprendiz.Id_Apr}
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                >

                  {/* INFORMACIÓN */}

                  <div>

                    <strong>
                      {nombreCompleto}
                    </strong>

                    <span className="badge bg-info text-dark ms-2">
                      Ficha:{" "}
                        {aprendiz.Num_Fic || "Sin asignar"}
                    </span>

                    <small className="text-muted d-block">
                      ID: {aprendiz.Id_Apr} - {aprendiz.Cor_Apr}
                    </small>

                    <small className="d-block mt-1">

                      Estado:{" "}

                      {aprendiz.Es_Apr ? (
                        <span className="badge bg-success">
                          Activo
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          Inactivo
                        </span>
                      )}

                    </small>

                  </div>

                  {/* BOTONES */}

                  <div>

                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() =>
                        navigate(
                          `/administrador/aprendices/editar/${aprendiz.Id_Apr}`
                        )
                      }
                    >
                      Editar
                    </button>

                    {aprendiz.Es_Apr ? (

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDesactivar(
                            aprendiz.Id_Apr,
                            nombreCompleto
                          )
                        }
                      >
                        Desactivar
                      </button>

                    ) : (

                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          handleActivar(
                            aprendiz.Id_Apr,
                            nombreCompleto
                          )
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
  );
}