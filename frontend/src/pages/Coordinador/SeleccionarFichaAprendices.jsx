import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar";

const API_URL = "http://localhost:8000";

export default function SeleccionarFichaAprendices() {
  const [carreras, setCarreras] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const user = { Nom_Adm: localStorage.getItem("firstName") || "Usuario" };

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resCarreras, resFichas] = await Promise.all([
          fetch(`${API_URL}/carreras/`),
          fetch(`${API_URL}/fichas/`),
        ]);
        if (!resCarreras.ok || !resFichas.ok) {
          throw new Error("No se pudo cargar la información");
        }
        setCarreras(await resCarreras.json());
        setFichas(await resFichas.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  const fichasPorCarrera = carreras
    .map((carrera) => ({
      ...carrera,
      fichas: fichas.filter(
        (f) =>
          f.Id_Car === carrera.Id_Car &&
          String(f.Num_Fic).includes(busqueda.trim())
      ),
    }))
    .filter((c) => c.fichas.length > 0);

  return (
    <>
      <CoordinadorNavbar user={user} />

      <div className="bg-light min-vh-100 py-5">
        <main className="container" style={{ maxWidth: 700 }}>
          <Link
            to="/administrador/carga-usuarios"
            className="small text-decoration-none"
          >
            ← Volver
          </Link>

          <div className="d-flex flex-wrap justify-content-between align-items-center my-3 gap-3">
            <div>
              <h2 className="fw-bold text-dark h4 mb-1">Subir aprendices</h2>
              <p className="text-muted small mb-0">
                Elige la ficha a la que pertenecen los aprendices.
              </p>
            </div>

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ficha..."
              className="form-control"
              style={{ maxWidth: 200 }}
            />
          </div>

          {cargando && <p className="text-center text-muted">Cargando fichas...</p>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!cargando && !error && fichasPorCarrera.length === 0 && (
            <div className="alert alert-info">
              No hay fichas que coincidan. Crea una en Fichas o cambia la búsqueda.
            </div>
          )}

          {fichasPorCarrera.map((carrera) => (
            <div
              className="rounded-4 p-4 bg-white mb-3"
              style={{ border: "2px solid #00851d" }}
              key={carrera.Id_Car}
            >
              <h5 className="fw-bold text-dark mb-3">{carrera.Nom_Car}</h5>

              <ul className="list-group">
                {carrera.fichas.map((ficha) => (
                  <li
                    key={ficha.Id_Fic}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>Ficha: {ficha.Num_Fic}</strong>
                      <span className="badge bg-secondary ms-2">
                        {ficha.Jor_Fic}
                      </span>
                    </div>

                    <Link
                      to={`/administrador/aprendices/fichas/${ficha.Id_Fic}/cargar`}
                      className="btn btn-sm text-white"
                      style={{ backgroundColor: "#00851d" }}
                    >
                      Subir aprendices
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </main>
      </div>
    </>
  );
}
