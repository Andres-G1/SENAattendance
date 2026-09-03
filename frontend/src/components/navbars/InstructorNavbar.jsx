import { Link } from 'react-router-dom'
import '../../styles/navbar.css'
/**
 * Navbar del rol Instructor.
 *
 * Nota: la plantilla Jinja original (instructor.html) cerraba e
 *
 * @param {{ user: { Nom_Ins: string } }} props
 */
export default function InstructorNavbar({ user }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-sena px-3 navbar-dark">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/instructor">
          <img
            src="/Logoblanco.png"
            width="50"
            height="50"
            alt="SENA"
          />
          <span className="fw-bold">SENA Attendance</span>
        </Link>

        <ul className="navbar-nav flex-row gap-1 d-none d-lg-flex ms-3">
          <li className="nav-item">
            <Link className="nav-link active px-3 py-2" to="/instructor">
              Inicio
            </Link>
          </li>
          <li className="nav-item">
            <a className="nav-link px-3 py-2" href="/instructor#mis-fichas">
              Mis Fichas
            </a>
          </li>
        </ul>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navInstructor"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navInstructor">
          <ul className="navbar-nav d-lg-none gap-1 mb-2">
            <li className="nav-item">
              <Link className="nav-link active px-3 py-2" to="/instructor">
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link px-3 py-2" href="/instructor#mis-fichas">
                Mis Fichas
              </a>
            </li>
          </ul>

          <div className="dropdown ms-lg-auto">
            <div
              className="user-pill dropdown-toggle"
              id="dropdownUser"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="text-end lh-sm">
                <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>
                  {user?.Nom_Ins}
                </div>
                <span className="badge-aprendiz">Instructor</span>
              </div>
              <div className="avatar">{user?.Nom_Ins[0]}</div>
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