import { Link } from "react-router-dom";
import "../../styles/CargaUsuarios.css";

function CargaUsuarios() {
  return (
    <div className="carga-usuarios">

      {/* ENCABEZADO */}
      <div className="carga-header">
        <h1>Carga masiva de usuarios</h1>

        <p>
          Sube los listados de aprendices, instructores o administradores
          en formato CSV o Excel.
        </p>
      </div>

      {/* TARJETAS */}
      <div className="carga-lista">

        {/* APRENDICES */}
        <div className="carga-card">

          <div className="carga-icon">
            📄
          </div>

          <div className="carga-info">

            <h2>Aprendices</h2>

            <p>
              Listado de aprendices para registrar o actualizar en el sistema.
            </p>

            <Link
              to="/administrador/aprendices/cargar"
              className="carga-btn"
            >
              Subir documento / Excel
            </Link>

          </div>

        </div>


        {/* INSTRUCTORES */}
        <div className="carga-card">

          <div className="carga-icon">
            📄
          </div>

          <div className="carga-info">

            <h2>Instructores</h2>

            <p>
              Listado de instructores para registrar o actualizar en el sistema.
            </p>

            <Link
              to="/administrador/instructores/cargar"
              className="carga-btn"
            >
              Subir documento / Excel
            </Link>

          </div>

        </div>


        {/* ADMINISTRADORES */}
        <div className="carga-card">

          <div className="carga-icon">
            📄
          </div>

          <div className="carga-info">

            <h2>Administradores</h2>

            <p>
              Listado de administradores para registrar o actualizar en el sistema.
            </p>

            <Link
              to="/administrador/administradores/cargar"
              className="carga-btn"
            >
              Subir documento / Excel
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CargaUsuarios;