const API_URL = "http://localhost:8000";
 
export async function iniciarSesion(tipoIdentificacion, numIdentificacion, contrasena) {
  const res = await fetch(`${API_URL}/inicio_sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo_identificacion: tipoIdentificacion,
      num_identificacion: Number(numIdentificacion),
      contraseña: contrasena,
    }),
  });
 
  const data = await res.json();
 
  if (!res.ok) {
    throw new Error(data.detail || "Error al iniciar sesión");
  }
 
  return data; // { id, nombre, apellido, rol }
}