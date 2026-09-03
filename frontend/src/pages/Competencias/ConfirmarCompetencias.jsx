import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import CoordinadorNavbar from "/src/components/navbars/CoordinadorNavbar.jsx";
import { eliminarCompetencia } from "../../services/api";

export default function ConfirmarCompetencia() {
  const { id } = useParams();
  const { state } = useLocation(); // { nombre }
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const nombre = state?.nombre || "esta competencia";

  const handleConfirmar = async () => {
    setEnviando(true);
    try {
      await eliminarCompetencia(id);
      navigate("/administrador/competencias");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo eliminar la competencia.");
      setEnviando(false);
    }
  };

  return (
    <>
      <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

      <main className="container my-4 d-flex justify-content-center">
        <div
          className="rounded-4 overflow-hidden shadow"
          style={{ maxWidth: 420, width: "100%" }}
        >
          <div className="bg-danger text-white p-3">
            <h5 className="fw-bold mb-0">Eliminar Competencia</h5>
            <small>{nombre}</small>
          </div>

          <div className="bg-white p-4">
            <p className="text-primary mb-3">
              ¿Estás seguro de que deseas eliminar esta competencia?
            </p>
            <p className="mb-1">
              <strong>Competencia:</strong> {nombre}
            </p>

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-danger"
                disabled={enviando}
                onClick={handleConfirmar}
              >
                {enviando ? "Procesando..." : "Eliminar definitivamente"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/competencias")}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}