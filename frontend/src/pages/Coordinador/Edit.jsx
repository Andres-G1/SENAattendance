import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obtenerAprendiz,
  actualizarAprendiz,
} from "../../services/api";


export default function EditarAprendiz() {
  const { id } = useParams();
  const navigate = useNavigate();


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
    Id_Fic: "",
  });


  // =====================================================
  // CARGAR APRENDIZ
  // =====================================================


  useEffect(() => {
    const cargarAprendiz = async () => {
      try {
        const data = await obtenerAprendiz(id);


        setFormulario({
          nombre: data.Nom_Apr || "",
          apellido: data.Ape_Apr || "",
          tipo_identificacion: data.Tip_ide_Apr || "CC",
          numero_identificacion: data.Num_ide_Apr || "",
          correo: data.Cor_Apr || "",
          contraseña: "",
          Id_Fic: data.Id_Fic || "",
        });


      } catch (err) {
        console.error(err);


        setError(
          err.response?.data?.detail ||
          "No se pudo cargar el aprendiz."
        );


      } finally {
        setCargando(false);
      }
    };


    cargarAprendiz();
  }, [id]);


  // =====================================================
  // CAMBIAR CAMPOS
  // =====================================================


  const handleChange = (e) => {
    const { name, value } = e.target;


    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };


  // =====================================================
  // GUARDAR CAMBIOS
  // =====================================================


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
        tipo_identificacion:
          formulario.tipo_identificacion,
        numero_identificacion:
          Number(formulario.numero_identificacion),
        correo: formulario.correo.trim(),
      };


      // Solo cambiar contraseña si escribió una nueva
      if (formulario.contraseña.trim() !== "") {
        datos.contraseña = formulario.contraseña;
      }


      // Solo enviamos ficha si existe
      if (formulario.Id_Fic) {
        datos.Id_Fic = Number(formulario.Id_Fic);
      }


      console.log("Datos que se enviarán:", datos);


      await actualizarAprendiz(id, datos);


      alert("Aprendiz actualizado correctamente.");


      navigate("/administrador/aprendices");


    } catch (err) {
      console.error(err);


      setError(
        err.response?.data?.detail ||
        "No se pudo actualizar el aprendiz."
      );


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
        <div className="alert alert-info">
          Cargando información del aprendiz...
        </div>
      </main>
    );
  }


  // =====================================================
  // FORMULARIO
  // =====================================================


  return (
    <main className="container my-5">


      <div
        className="card shadow-sm"
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >


        {/* CABECERA */}


        <div className="card-header bg-warning text-dark py-3">


          <h1 className="h5 mb-0">
            Modificar Datos del Aprendiz
          </h1>


          <small>
            ID: {id}
          </small>


        </div>


        {/* CUERPO */}


        <div className="card-body p-4">


          <form onSubmit={handleSubmit}>


            <div className="row g-3">


              {/* TIPO DOCUMENTO */}


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
                  value={
                    formulario.tipo_identificacion
                  }
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


              {/* NOMBRE */}


              <div className="col-md-6">


                <label
                  htmlFor="nombre"
                  className="form-label"
                >
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


              {/* APELLIDO */}


              <div className="col-md-6">


                <label
                  htmlFor="apellido"
                  className="form-label"
                >
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


              {/* DOCUMENTO */}


              <div className="col-md-6">


                <label
                  htmlFor="numero_identificacion"
                  className="form-label"
                >
                  Número de Documento
                </label>


                <input
                  type="number"
                  id="numero_identificacion"
                  name="numero_identificacion"
                  className="form-control"
                  value={
                    formulario.numero_identificacion
                  }
                  onChange={handleChange}
                  required
                />


              </div>


              {/* CORREO */}


              <div className="col-md-6">


                <label
                  htmlFor="correo"
                  className="form-label"
                >
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


              {/* CONTRASEÑA */}


              <div className="col-md-6">


                <label
                  htmlFor="contraseña"
                  className="form-label"
                >
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
                  Solo escribe una contraseña si
                  deseas cambiarla.
                </small>


              </div>


            </div>


            {/* ERROR */}


            {error && (
              <div className="alert alert-danger mt-3">
                {error}
              </div>
            )}


            {/* BOTONES */}


            <div className="d-flex gap-2 mt-4">


              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  navigate("/administrador/aprendices")
                }
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="btn btn-success"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar Cambios"}
              </button>


            </div>


          </form>


        </div>


      </div>


    </main>
  );
}
