import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// =====================================================
// INTERCEPTOR: adjunta el token a cada petición
// =====================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// AUTH
// =====================================================
export const login = async (typeid, id, password) => {
  const response = await api.post("/users/login", { typeid, id, password });
  return response.data;
};

// =====================================================
// APRENDICES  (router: /usuarios)
// =====================================================
export const listarAprendices = async () => {
  const response = await api.get("/usuarios/aprendices");
  return response.data;
};

export const obtenerAprendiz = async (id) => {
  const response = await api.get(`/usuarios/aprendiz/${id}`);
  return response.data;
};

export const crearUsuario = async (datos) => {
  const response = await api.post("/usuarios/crear", datos);
  return response.data;
};

export const actualizarAprendiz = async (id, datos) => {
  const response = await api.put(`/usuarios/aprendiz/${id}`, datos);
  return response.data;
};

export const desactivarAprendiz = async (id) => {
  const response = await api.patch(`/usuarios/aprendiz/${id}/desactivar`);
  return response.data;
};

export const activarAprendiz = async (id) => {
  const response = await api.patch(`/usuarios/aprendiz/${id}/activar`);
  return response.data;
};

// =====================================================
// INSTRUCTORES  (router: /usuarios)
// =====================================================
export const listarInstructores = async () => {
  const response = await api.get("/usuarios/instructores");
  return response.data;
};

export const obtenerInstructor = async (id) => {
  const response = await api.get(`/usuarios/instructor/${id}`);
  return response.data;
};

export const actualizarInstructor = async (id, datos) => {
  const response = await api.put(`/usuarios/instructor/${id}`, datos);
  return response.data;
};

export const desactivarInstructor = async (id) => {
  const response = await api.patch(`/usuarios/instructor/${id}/desactivar`);
  return response.data;
};

export const activarInstructor = async (id) => {
  const response = await api.patch(`/usuarios/instructor/${id}/activar`);
  return response.data;
};
// =====================================================
// ADMINISTRADORES  (router: /usuarios)
// =====================================================
export const listarAdministradores = async () => {
  const response = await api.get("/usuarios/administradores");
  return response.data;
};

export const obtenerAdministrador = async (id) => {
  const response = await api.get(`/usuarios/administrador/${id}`);
  return response.data;
};

export const actualizarAdministrador = async (id, datos) => {
  const response = await api.put(`/usuarios/administrador/${id}`, datos);
  return response.data;
};

export const desactivarAdministrador = async (id) => {
  const response = await api.patch(`/usuarios/administrador/${id}/desactivar`);
  return response.data;
};

export const activarAdministrador = async (id) => {
  const response = await api.patch(`/usuarios/administrador/${id}/activar`);
  return response.data;
};
// =====================================================
// COMPETENCIAS  (router: /competencias)
// =====================================================
export const listarCompetencias = async () => {
  const response = await api.get("/competencias/");
  return response.data;
};

export const crearCompetencia = async (datos) => {
  const response = await api.post("/competencias/", datos);
  return response.data;
};

export const actualizarCompetencia = async (id, datos) => {
  const response = await api.put(`/competencias/${id}`, datos);
  return response.data;
};

export const eliminarCompetencia = async (id) => {
  const response = await api.delete(`/competencias/${id}`);
  return response.data;
};
export default api;