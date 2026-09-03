import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import CoordinadorNavbar from "/src/components/navbars/CoordinadorNavbar.jsx";
import { desactivarAdministrador, activarAdministrador } from "../../services/api";

export default function ConfirmarAdministrador() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const nombre = state?.nombre || "este administrador";
  const tipo = state?.tipo || "desactivar";
  const esDesactivar = tipo === "desactivar";

  const handleConfirmar = async () => {
    setEnviando(true);
    try {
      if (esDesactivar) {
        await desactivarAdministrador(id);
      } else {
        await activarAdministrador(id);
      }
      navigate("/administrador/administradores");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo completar la acción.");
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
          <div className="bg-success text-white p-3">
            <h5 className="fw-bold mb-0">
              {esDesactivar ? "Desactivar Administrador" : "Activar Administrador"}
            </h5>
            <small>{nombre}</small>
          </div>

          <div className="bg-white p-4">
            <p className="text-primary mb-3">
              {esDesactivar
                ? "¿Estás seguro de que deseas desactivar este administrador?"
                : "¿Deseas activar nuevamente a este administrador?"}
            </p>
            <p className="mb-1">
              <strong>Nombre:</strong> {nombre}
            </p>

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-danger"
                disabled={enviando}
                onClick={handleConfirmar}
              >
                {enviando
                  ? "Procesando..."
                  : esDesactivar
                  ? "Desactivar definitivamente"
                  : "Activar"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/administradores")}
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