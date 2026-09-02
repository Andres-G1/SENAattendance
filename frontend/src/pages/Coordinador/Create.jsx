import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { crearUsuario } from "../../services/api";
import { getCarreras } from "../../services/carreraService";
import { obtenerFichas } from "../../services/fichaService";

export default function CrearAprendiz() {
  const navigate = useNavigate();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [carreras, setCarreras] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [fichasFiltradas, setFichasFiltradas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    tipo_identificacion: "CC",
    numero_identificacion: "",
    correo: "",
    contraseña: "",
    Id_Car: "",
    Id_Fic: "",
  });

  // =====================================================
  // CARGAR CARRERAS Y FICHAS
  // =====================================================

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const [carrerasData, fichasData] = await Promise.all([
          getCarreras(),
          obtenerFichas(),
        ]);

        console.log("Carreras cargadas:", carrerasData);
        console.log("Fichas cargadas:", fichasData);

        setCarreras(carrerasData);
        setFichas(fichasData);

      } catch (err) {
        console.error("Error cargando carreras y fichas:", err);

        if (err.response?.status === 401) {
          setError("Tu sesión expiró. Inicia sesión nuevamente.");
        } else if (err.response?.status === 403) {
          setError("No tienes permisos para crear aprendices.");
        } else {
          setError("No se pudieron cargar carreras y fichas.");
        }
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // =====================================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // =====================================================
    // CAMBIO DE CARRERA
    // =====================================================

    if (name === "Id_Car") {
      setFormulario((anterior) => ({
        ...anterior,
        Id_Car: value,
        Id_Fic: "",
      }));

      // Si no seleccionó carrera, limpiar fichas
      if (!value) {
        setFichasFiltradas([]);
        return;
      }

      // Filtrar las fichas que pertenecen a la carrera seleccionada
      const fichasDeLaCarrera = fichas.filter(
        (ficha) => String(ficha.Id_Car) === String(value)
      );

      console.log("Carrera seleccionada:", value);
      console.log("Fichas de esta carrera:", fichasDeLaCarrera);

      setFichasFiltradas(fichasDeLaCarrera);

      return;
    }

    // =====================================================
    // RESTO DE CAMPOS
    // =====================================================

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  // =====================================================
  // REGISTRAR APRENDIZ
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // VALIDAR CAMPOS
    // =====================================================

    if (
      !formulario.nombre ||
      !formulario.apellido ||
      !formulario.tipo_identificacion ||
      !formulario.numero_identificacion ||
      !formulario.correo ||
      !formulario.contraseña ||
      !formulario.Id_Car ||
      !formulario.Id_Fic
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      // =====================================================
      // DATOS QUE SE ENVÍAN AL BACKEND
      // =====================================================

      const datos = {
        rol: "Aprendiz",
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        tipo_identificacion: formulario.tipo_identificacion,
        numero_identificacion: Number(
          formulario.numero_identificacion
        ),
        correo: formulario.correo.trim(),
        contraseña: formulario.contraseña,
        Id_Fic: Number(formulario.Id_Fic),
      };

      console.log("Datos enviados a FastAPI:", datos);

      const respuesta = await crearUsuario(datos);

      console.log("Respuesta de FastAPI:", respuesta);

      alert("Aprendiz registrado correctamente.");

      // Volver a la lista
      navigate("/administrador/aprendices");

    } catch (err) {
      console.error("Error al crear aprendiz:", err);

      if (err.response?.status === 400) {
        setError(
          err.response.data.detail ||
          "El documento o correo ya está registrado."
        );
      } else if (err.response?.status === 401) {
        setError("Tu sesión expiró. Inicia sesión nuevamente.");
      } else if (err.response?.status === 403) {
        setError("No tienes permisos para crear aprendices.");
      } else {
        setError(
          err.response?.data?.detail ||
          "No se pudo registrar el aprendiz."
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <main className="container my-5">
        <div className="card shadow-sm p-4">
          <p className="mb-0">
            Cargando carreras y fichas...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <main className="container my-5">

      <div
        className="page-card card shadow-sm"
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >

        {/* =====================================================
            CABECERA
        ====================================================== */}

        <div className="card-header bg-success text-white py-3">
          <h1 className="h5 mb-0">
            Crear Nuevo Aprendiz
          </h1>
        </div>

        {/* =====================================================
            FORMULARIO
        ====================================================== */}

        <div className="card-body p-4">

          <form onSubmit={handleSubmit}>

            <div className="row g-3">

              {/* =================================================
                  TIPO DE DOCUMENTO
              ================================================== */}

              <div className="col-md-6">

                <label
                  htmlFor="tipo_identificacion"
                  className="form-label"
                >
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

                  <option value="CC">
                    Cédula de Ciudadanía (CC)
                  </option>

                  <option value="TI">
                    Tarjeta de Identidad (TI)
                  </option>

                  <option value="CE">
                    Cédula de Extranjería (CE)
                  </option>

                  <option value="PEP">
                    PEP
                  </option>

                  <option value="PPT">
                    PPT
                  </option>

                </select>

              </div>

              {/* =================================================
                  NÚMERO DE DOCUMENTO
              ================================================== */}

              <div className="col-md-6">

                <label
                  htmlFor="numero_identificacion"
                  className="form-label"
                >
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

              {/* =================================================
                  NOMBRE
              ================================================== */}

              <div className="col-md-6">

                <label
                  htmlFor="nombre"
                  className="form-label"
                >
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

              {/* =================================================
                  APELLIDO
              ================================================== */}

              <div className="col-md-6">

                <label
                  htmlFor="apellido"
                  className="form-label"
                >
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

              {/* =================================================
                  CORREO
              ================================================== */}

              <div className="col-md-12">

                <label
                  htmlFor="correo"
                  className="form-label"
                >
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

              {/* =================================================
                  CONTRASEÑA
              ================================================== */}

              <div className="col-md-12">

                <label
                  htmlFor="contraseña"
                  className="form-label"
                >
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

              {/* =================================================
                  CARRERA
              ================================================== */}

              <div className="col-md-12">

                <label
                  htmlFor="Id_Car"
                  className="form-label"
                >
                  Carrera
                </label>

                <select
                  id="Id_Car"
                  name="Id_Car"
                  className="form-select"
                  value={formulario.Id_Car}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    -- Selecciona una carrera --
                  </option>

                  {carreras.map((carrera) => (
                    <option
                      key={carrera.Id_Car}
                      value={carrera.Id_Car}
                    >
                      {carrera.Nom_Car}
                    </option>
                  ))}

                </select>

              </div>

              {/* =================================================
                  FICHA
              ================================================== */}

              <div className="col-md-12">

                <label
                  htmlFor="Id_Fic"
                  className="form-label"
                >
                  Ficha
                </label>

                <select
                  id="Id_Fic"
                  name="Id_Fic"
                  className="form-select"
                  value={formulario.Id_Fic}
                  onChange={handleChange}
                  required
                  disabled={!formulario.Id_Car}
                >

                  <option value="">
                    {!formulario.Id_Car
                      ? "-- Primero selecciona una carrera --"
                      : fichasFiltradas.length === 0
                        ? "-- No hay fichas para esta carrera --"
                        : "-- Selecciona una ficha --"
                    }
                  </option>

                  {fichasFiltradas.map((ficha) => (
                    <option
                      key={ficha.Id_Fic}
                      value={ficha.Id_Fic}
                    >
                      {ficha.Num_Fic}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* =====================================================
                ERROR
            ====================================================== */}

            {error && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =====================================================
                BOTONES
            ====================================================== */}

            <div className="d-flex gap-2 mt-4">

              <button
                type="submit"
                className="btn btn-success"
                disabled={guardando}
              >
                {guardando
                  ? "Registrando..."
                  : "Registrar Aprendiz"
                }
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  navigate("/administrador/aprendices")
                }
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