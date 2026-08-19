import { Link } from 'react-router-dom'

/**
 * Navbar del rol Coordinador.
 * @param {{ user: { Nom_Adm: string } }} props
 */
export default function CoordinadorNavbar({ user }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-sena px-3 navbar-dark">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/coordinador">
          <img
            src="/Senalogo.png"
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
              <Link className="nav-link active px-3 py-2" to="/coordinador">
                Inicio
              </Link>
            </li>

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
                  <a className="dropdown-item" href="/coordinador/module_aprendiz_config">
                    Gestionar Aprendices
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/coordinador/module_instructor_config">
                    Gestionar Instructores
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/coordinador/module_coordinador_config">
                    Gestionar Coordinadores
                  </a>
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
                Académico
              </a>
              <ul className="dropdown-menu" aria-labelledby="navAcademico">
                <li>
                  <a className="dropdown-item" href="/token/module_token_config">
                    Gestionar Fichas
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/career/module_career_config">
                    Gestionar Carreras
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/coordinador/module_career_config">
                    Gestionar Competencias
                  </a>
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
            >
              <div className="text-end lh-sm">
                <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>
                  {user?.Nom_Adm}
                </div>
                <span className="badge-aprendiz">Coordinador</span>
              </div>
              <div className="avatar">{user?.Nom_Adm[0]}</div>
            </div>

            <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
              <li>
                <a className="dropdown-menu-item dropdown-item" href="/config/porfile_users">
                  Mi Perfil
                </a>
              </li>
              <li>
                <a className="dropdown-menu-item dropdown-item" href="/config/module_config">
                  Configuración
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a className="dropdown-item text-danger fw-bold" href="/">
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
