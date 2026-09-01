const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function handleResponse(res) {
  if (!res.ok) {
    let detail = "Error en la solicitud";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // respuesta sin cuerpo JSON (ej. 204)
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getCarreras() {
  const res = await fetch(`${API_URL}/carreras/`);
  return handleResponse(res);
}

export async function getCarrera(id) {
  const res = await fetch(`${API_URL}/carreras/${id}`);
  return handleResponse(res);
}

export async function createCarrera({ Nom_Car, Des_Car }) {
  const res = await fetch(`${API_URL}/carreras/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nom_Car, Des_Car }),
  });
  return handleResponse(res);
}

export async function updateCarrera(id, { Nom_Car, Des_Car }) {
  const res = await fetch(`${API_URL}/carreras/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nom_Car, Des_Car }),
  });
  return handleResponse(res);
}

export async function deleteCarrera(id) {
  const res = await fetch(`${API_URL}/carreras/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function verificarMenuCarrera() {
  const token = localStorage.getItem("token"); 
  
  const respuesta = await fetch("http://localhost:8000/menuconfig-carreras", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  if (!respuesta.ok) {
    throw new Error("Error al verificar el rol del menú");
  }
  
  return await respuesta.json(); 
}