import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";
import { activarFicha, desactivarFicha } from "../../services/fichaService";

const API_URL = "http://localhost:8000"; // ajusta según tu configuración

export default function Estado() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState(null);
  const [carrera, setCarrera] = useState(null);
  const [incluirAprendices, setIncluirAprendices] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const resFicha = await fetch(`${API_URL}/fichas/${id}`);
      if (!resFicha.ok) throw new Error("No se pudo cargar la ficha");
      const dataFicha = await resFicha.json();
      setFicha(dataFicha);

      const resCarrera = await fetch(`${API_URL}/carreras/${dataFicha.Id_Car}`);
      if (resCarrera.ok) {
        setCarrera(await resCarrera.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const estaActiva = ficha?.Es_Fic !== false;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      if (estaActiva) {
        await desactivarFicha(id, incluirAprendices);
      } else {
        await activarFicha(id, incluirAprendices);
      }
      navigate("/administrador/fichas");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-center my-4">Cargando...</p>;
  if (error && !ficha) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />
      <main className="container my-5">
        <div className="page-card card shadow-sm text-dark">
          <div
            className={`card-header text-white py-3 ${estaActiva ? "bg-secondary" : "bg-success"}`}
          >
            <h1 className="h5 mb-0">
              {estaActiva ? "Desactivar Ficha" : "Activar Ficha"}
            </h1>
            <small className="text-light">
              {carrera?.Nom_Car} · {ficha?.Num_Fic}
            </small>
          </div>

          <div className="card-body p-4">
            <div className="mb-4">
              <strong>Programa de formación:</strong> {carrera?.Nom_Car}
              <br />
              <strong>Ficha:</strong> {ficha?.Num_Fic}
              <br />
              <strong>Estado actual:</strong>{" "}
              {estaActiva ? (
                <span className="badge bg-success">Activa</span>
              ) : (
                <span className="badge bg-secondary">Desactivada</span>
              )}
            </div>

            {estaActiva ? (
              <div className="alert alert-warning">
                Al desactivar la ficha:
                <ul className="mb-0 mt-2">
                  <li>Los instructores ya no podrán tomar asistencia en ella.</li>
                  <li>No se podrán asignar instructores ni aprendices a la ficha.</li>
                  <li>No se generarán avisos de lista no llamada.</li>
                  <li>
                    El historial de asistencia se conserva y el coordinador puede
                    seguir consultándolo y exportándolo.
                  </li>
                </ul>
              </div>
            ) : (
              <div className="alert alert-info">
                Al activar la ficha volverá a estar disponible para tomar
                asistencia y hacer asignaciones.
              </div>
            )}

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="incluirAprendices"
                checked={incluirAprendices}
                onChange={(e) => setIncluirAprendices(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="incluirAprendices">
                {estaActiva
                  ? "Desactivar también a todos los aprendices de esta ficha (no podrán iniciar sesión)"
                  : "Activar también a todos los aprendices de esta ficha"}
              </label>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className={`btn ${estaActiva ? "btn-secondary" : "btn-success"}`}
                  type="submit"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : estaActiva
                      ? "Desactivar ficha"
                      : "Activar ficha"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => navigate("/administrador/fichas")}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
