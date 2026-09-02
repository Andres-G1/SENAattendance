import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearUsuario } from "../../services/api";

export default function CrearAdministrador() {
  const navigate = useNavigate();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    tipo_identificacion: "CC",
    numero_identificacion: "",
    correo: "",
    contraseña: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formulario.nombre ||
      !formulario.apellido ||
      !formulario.tipo_identificacion ||
      !formulario.numero_identificacion ||
      !formulario.correo ||
      !formulario.contraseña
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        rol: "Administrador",
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        tipo_identificacion: formulario.tipo_identificacion,
        numero_identificacion: Number(formulario.numero_identificacion),
        correo: formulario.correo.trim(),
        contraseña: formulario.contraseña,
      };

      await crearUsuario(datos);

      alert("Administrador registrado correctamente.");
      navigate("/administrador/administradores");
    } catch (err) {
      console.error("Error al crear administrador:", err);

      if (err.response?.status === 400) {
        setError(err.response.data.detail || "El documento o correo ya está registrado.");
      } else if (err.response?.status === 401) {
        setError("Tu sesión expiró. Inicia sesión nuevamente.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para crear administradores.");
      } else {
        setError(err.response?.data?.detail || "No se pudo registrar el administrador.");
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="container my-5">
      <div className="page-card card shadow-sm" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">Crear Nuevo Administrador</h1>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="tipo_identificacion" className="form-label">
                  Tipo de Documento
                </label>
                <select
                  id="tipo_identificacion"
                  name="tipo_identificacion"
                  className="form-select"
                  value={formulario.tipo_identificacion}
                  onChange={handleChange}
                  required
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PEP">PEP</option>
                  <option value="PPT">PPT</option>
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="numero_identificacion" className="form-label">
                  Número de Documento
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="numero_identificacion"
                  name="numero_identificacion"
                  value={formulario.numero_identificacion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nombre"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="apellido" className="form-label">
                  Apellido
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="apellido"
                  name="apellido"
                  value={formulario.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-12">
                <label htmlFor="correo" className="form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="correo"
                  name="correo"
                  value={formulario.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-12">
                <label htmlFor="contraseña" className="form-label">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="contraseña"
                  name="contraseña"
                  value={formulario.contraseña}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? "Registrando..." : "Registrar Administrador"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/administradores")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}