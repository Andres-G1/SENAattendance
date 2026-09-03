import { Link, useNavigate } from 'react-router-dom'
import '../../styles/navbar.css'

/**
 * Navbar del rol Aprendiz.
 * @param {{ user: { Nom_Apr: string } }} props
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
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/aprendiz">
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
          data-bs-target="#navAprendiz"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navAprendiz">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link className="nav-link active px-3 py-2" to="/aprendiz">
                Inicio
              </Link>
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
                  {user?.Nom_Apr || "Cargando..."}
                </div>
                <span className="badge-aprendiz">Aprendiz</span>
              </div>
              <div className="avatar">{obtenerInicial()}</div>
            </div>

            <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
              <li>
                <a className="dropdown-menu-item dropdown-item" href="/config/porfile_aprendiz">
                  Mi Perfil
                </a>
              </li>
              <li>
                <a
                  className="dropdown-menu-item dropdown-item"
                  href="/config/module_config_aprendiz"
                >
                  Configuración
                </a>
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
