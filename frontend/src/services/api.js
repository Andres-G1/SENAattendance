import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// =====================================================
// ENVIAR TOKEN AUTOMÁTICAMENTE
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// LOGIN
// =====================================================

export const login = async (typeid, id, password) => {
  const response = await api.post("/users/login", {
    typeid,
    id,
    password,
  });

  return response.data;
};

// =====================================================
// APRENDICES
// =====================================================

// Listar todos los aprendices
export const listarAprendices = async () => {
  const response = await api.get("/usuarios/aprendices");
  return response.data;
};

// Obtener un aprendiz específico
export const obtenerAprendiz = async (idAprendiz) => {
  const response = await api.get(`/usuarios/aprendiz/${idAprendiz}`);
  return response.data;
};

// Crear usuario
export const crearUsuario = async (datos) => {
  const response = await api.post("/usuarios/crear", datos);
  return response.data;
};

// Actualizar aprendiz
export const actualizarAprendiz = async (idAprendiz, datos) => {
  const response = await api.put(
    `/usuarios/aprendiz/${idAprendiz}`,
    datos
  );

  return response.data;
};

// Desactivar aprendiz
export const desactivarAprendiz = async (idAprendiz) => {
  const response = await api.patch(
    `/usuarios/aprendiz/${idAprendiz}/desactivar`
  );

  return response.data;
};

// Activar aprendiz
export const activarAprendiz = async (idAprendiz) => {
  const response = await api.patch(
    `/usuarios/aprendiz/${idAprendiz}/activar`
  );

  return response.data;
};

// =====================================================
// CARRERAS
// =====================================================

export const listarCarreras = async () => {
  const response = await api.get("/usuarios/carreras");
  return response.data;
};

// =====================================================
// FICHAS
// =====================================================

export const listarFichas = async () => {
  const response = await api.get("/usuarios/fichas");
  return response.data;
};

export default api;