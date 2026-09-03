import { Link, useNavigate } from 'react-router-dom'
import '../../styles/navbar.css'

/**
 * Navbar del rol Coordinador.
 * @param {{ user: { Nom_Adm: string } }} props
 */
export default function CoordinadorNavbar({ user }) {
  const navigate = useNavigate();

  const cerrarSesion = (e) => {
    e.preventDefault(); 
    localStorage.clear(); 
    navigate("/", { replace: true });
  };

  const obtenerInicial = () => {
    if (user && user.Nom_Adm) {
      return user.Nom_Adm.charAt(0).toUpperCase();
    }
    return "U"; 
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-sena px-3 navbar-dark">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/administrador">
          <img
            src="/Logoblanco.png"
            width="50"
            height="50"
            alt="SENA"
          />
          <span className="fw-bold">SENA Attendance</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navCoordinador"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navCoordinador">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link className="nav-link active px-3 py-2" to="/administrador">
                Inicio
              </Link>
            </li>

            {/* Menú Dropdown de Usuarios */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle active px-3 py-2"
                href="#"
                id="navUsuarios"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Usuarios
              </a>
              <ul className="dropdown-menu" aria-labelledby="navUsuarios">
                <li>
                  <Link className="dropdown-item" to="/administrador/aprendices">
                    Gestionar Aprendices
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/administrador/Instructores">
                    Gestionar Instructores
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/administrador/administradores">
                    Gestionar Coordinadores
                  </Link>
                </li>
              </ul>
            </li>

            {/* Menú Dropdown de Académico */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle active px-3 py-2"
                href="#"
                id="navAcademico"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Académico
              </a>
              <ul className="dropdown-menu" aria-labelledby="navAcademico">
                <li>
                  <Link className="dropdown-item" to="/administrador/fichas">
                    Gestionar Fichas
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/administrador/carreras">
                    Gestionar Carreras
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/administrador/competencias">
                    Gestionar Competencias
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle active px-3 py-2"
                href="#"
                id="navAcademico"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Gestion Grupos
              </a>
              <ul className="dropdown-menu" aria-labelledby="navAcademico">
                <li>
                  <Link className="dropdown-item" to="/fichas/asignar">
                    Asignación de Fichas
                  </Link>
                </li>
              </ul>
            </li>
          </ul>

          <div className="dropdown">
            <div
              className="user-pill dropdown-toggle"
              id="dropdownUser"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ cursor: "pointer" }}
            >
              <div className="text-end lh-smme-2">
                <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>
                  {user?.Nom_Adm || "Cargando..."}
                </div>
                <span className="badge-aprendiz">Coordinador</span>
              </div>
              <div className="avatar">{obtenerInicial()}</div>
            </div>

            <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
              <li>
                <Link className="dropdown-menu-item dropdown-item" to="/config/porfile_users">
                  Mi Perfil
                </Link>
              </li>
              <li>
                <Link className="dropdown-menu-item dropdown-item" to="/config/module_config">
                  Configuración
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a className="dropdown-item text-danger fw-bold" href="/" onClick={cerrarSesion}>
                  Cerrar sesión
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}
