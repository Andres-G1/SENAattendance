import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const login = async (typeid, id, password) => {
  const response = await api.post("/users/login", { typeid, id, password });
  return response.data;
};

export default api;