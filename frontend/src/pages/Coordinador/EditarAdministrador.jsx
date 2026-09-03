import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerAdministrador, actualizarAdministrador } from "../../services/api";
import CoordinadorNavbar from "../../components/navbars/CoordinadorNavbar.jsx";

export default function EditarAdministrador() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const nombreCompleto = localStorage.getItem("firstName") || "";
  const firstName = nombreCompleto.split(" ")[0];

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    tipo_identificacion: "CC",
    numero_identificacion: "",
    correo: "",
    contraseña: "",
  });

  useEffect(() => {
    const cargarAdministrador = async () => {
      try {
        const data = await obtenerAdministrador(id);

        setFormulario({
          nombre: data.Nom_Adm || "",
          apellido: data.Ape_Adm || "",
          tipo_identificacion: data.Tip_ide_Adm || "CC",
          numero_identificacion: data.Num_ide_Adm || "",
          correo: data.Cor_Adm || "",
          contraseña: "",
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "No se pudo cargar el administrador.");
      } finally {
        setCargando(false);
      }
    };

    cargarAdministrador();
  }, [id]);

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
      !formulario.numero_identificacion ||
      !formulario.correo
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        tipo_identificacion: formulario.tipo_identificacion,
        numero_identificacion: Number(formulario.numero_identificacion),
        correo: formulario.correo.trim(),
      };

      if (formulario.contraseña.trim() !== "") {
        datos.contraseña = formulario.contraseña;
      }

      await actualizarAdministrador(id, datos);

      alert("Administrador actualizado correctamente.");
      navigate("/administrador/administradores");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudo actualizar el administrador.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <main className="container my-5">
        <div className="alert alert-info">Cargando información del administrador...</div>
      </main>
    );
  }

  return (

  <>
        <CoordinadorNavbar user={{ Nom_Adm: firstName }} />

    <main className="container my-5">
      <div className="card shadow-sm" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">Modificar Datos del Administrador</h1>
          <small>ID: {id}</small>
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
                <label htmlFor="nombre" className="form-label">
                  Nombres
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className="form-control"
                  value={formulario.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="apellido" className="form-label">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  className="form-control"
                  value={formulario.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="numero_identificacion" className="form-label">
                  Número de Documento
                </label>
                <input
                  type="number"
                  id="numero_identificacion"
                  name="numero_identificacion"
                  className="form-control"
                  value={formulario.numero_identificacion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="correo" className="form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  className="form-control"
                  value={formulario.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="contraseña" className="form-label">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="contraseña"
                  name="contraseña"
                  className="form-control"
                  value={formulario.contraseña}
                  onChange={handleChange}
                  placeholder="Dejar en blanco para no modificar"
                />
                <small className="text-muted">
                  Solo escribe una contraseña si deseas cambiarla.
                </small>
              </div>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/administrador/administradores")}
              >
                Cancelar
              </button>

              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>

    </>
  );
}