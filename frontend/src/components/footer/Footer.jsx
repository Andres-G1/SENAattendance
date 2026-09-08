import "../../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-content">

          {/* MARCA */}
            <div className="footer-brand">

                <div className="footer-brand-header">

                <img
                    src="/public/logoblanco.png"
                    alt="Logo SENA Attendance"
                    width="80"
                    height="80"
                />

                <div>
                    <h4>SENA Attendance</h4>

                    <span>
                    Gestión inteligente de asistencia
                    </span>
                </div>

            </div>

            <p>
                Plataforma diseñada para facilitar el registro,
                seguimiento y control de la asistencia de aprendices
                e instructores del SENA.
            </p>

            </div>



          {/* SISTEMA */}
          <div className="footer-section">

            <h6>Sistema</h6>

            <ul>

              <li>Control de asistencia</li>

              <li>Gestión de fichas</li>

              <li>Gestión de aprendices</li>

              <li>Gestión de instructores</li>

            </ul>

          </div>


          {/* INFORMACIÓN */}
          <div className="footer-section">

            <h6>Información</h6>

            <ul>

              <li>

                Aprendices e instructores
              </li>

              <li>

                Registro de novedades
              </li>

              <li>

                Seguimiento de asistencia
              </li>

              <li>

                Alertas y notificaciones
              </li>

            </ul>

          </div>

        </div>


        {/* SEPARADOR */}
        <div className="footer-divider"></div>


        {/* PARTE INFERIOR */}
        <div className="footer-bottom">

          <p>
            © {new Date().getFullYear()} SENA Attendance
          </p>

          <span>
            Sistema de gestión académica
          </span>

        </div>

      </div>

    </footer>
  );
}