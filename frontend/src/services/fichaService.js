const API_URL = "http://localhost:8000"; // ajusta según tu configuración

async function manejarRespuesta(res, mensajeError) {
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || mensajeError);
  }
  return res.json();
}

export async function obtenerFichas() {
  const res = await fetch(`${API_URL}/fichas/`);
  return manejarRespuesta(res, "No se pudo cargar la información");
}

export async function obtenerFicha(fichaId) {
  const res = await fetch(`${API_URL}/fichas/${fichaId}`);
  return manejarRespuesta(res, "No se pudo cargar la ficha");
}

export async function crearFicha(datos) {
  const res = await fetch(`${API_URL}/fichas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res, "No se pudo crear la ficha");
}

export async function actualizarFicha(fichaId, datos) {
  const res = await fetch(`${API_URL}/fichas/${fichaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res, "No se pudo guardar los cambios");
}

export async function eliminarFicha(fichaId) {
  const res = await fetch(`${API_URL}/fichas/${fichaId}`, {
    method: "DELETE",
  });
  return manejarRespuesta(res, "No se pudo eliminar la ficha");
}