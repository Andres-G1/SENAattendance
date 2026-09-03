import { useEffect, useState } from "react";
import "./gestion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const emptyUser = { nombre: "", apellido: "", tipo_documento: "CC", numero_documento: "", correo: "", contraseña: "1234" };
const emptyCareer = { nombre: "", descripcion: "" };
const emptyFicha = { id_carrera: "", numero: "", fecha_inicio: "", fecha_fin: "", jornada: "manana" };

export default function GestionCoordinador() {
  const [tab, setTab] = useState("aprendiz");
  const [users, setUsers] = useState([]);
  const [careers, setCareers] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [careerForm, setCareerForm] = useState(emptyCareer);
  const [fichaForm, setFichaForm] = useState(emptyFicha);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = async (path, options) => {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "No fue posible completar la operación");
    return data;
  };

  const loadData = async () => {
    try {
      const [careerData, fichaData] = await Promise.all([
        request("/users/carreras"),
        request("/users/fichas"),
      ]);
      setCareers(careerData);
      setFichas(fichaData);
      if (tab !== "carreras") {
        setUsers(await request(`/users/coordinador/${tab}`));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => { loadData(); }, [tab]);

  const submitUser = async (event) => {
    event.preventDefault();
    try {
      await request(`/users/coordinador/${tab}`, { method: "POST", body: JSON.stringify({ ...userForm, numero_documento: Number(userForm.numero_documento) }) });
      setUserForm(emptyUser);
      setMessage("Usuario creado correctamente");
      loadData();
    } catch (requestError) { setError(requestError.message); }
  };

  const submitCareer = async (event) => {
    event.preventDefault();
    try {
      await request("/users/carreras", { method: "POST", body: JSON.stringify(careerForm) });
      setCareerForm(emptyCareer);
      setMessage("Carrera creada correctamente");
      loadData();
    } catch (requestError) { setError(requestError.message); }
  };

  const submitFicha = async (event) => {
    event.preventDefault();
    try {
      await request("/users/fichas", { method: "POST", body: JSON.stringify({ ...fichaForm, id_carrera: Number(fichaForm.id_carrera), numero: Number(fichaForm.numero) }) });
      setFichaForm(emptyFicha);
      setMessage("Ficha creada correctamente");
      loadData();
    } catch (requestError) { setError(requestError.message); }
  };

  const remove = async (path) => {
    try {
      await request(path, { method: "DELETE" });
      setMessage("Registro eliminado correctamente");
      loadData();
    } catch (requestError) { setError(requestError.message); }
  };

  const change = (setter) => (event) => setter((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  return (
    <main className="management-page">
      <header className="management-header">
        <div><p className="management-eyebrow">Panel de coordinación</p><h1>Administrar proyecto</h1><p>Gestiona los datos del sistema desde un solo lugar.</p></div>
        <a href="/administrador">Volver al panel</a>
      </header>
      <nav className="management-tabs" aria-label="Módulos de administración">
        <button className={tab === "aprendiz" ? "active" : ""} onClick={() => setTab("aprendiz")}>Aprendices</button>
        <button className={tab === "instructor" ? "active" : ""} onClick={() => setTab("instructor")}>Instructores</button>
        <button className={tab === "coordinador" ? "active" : ""} onClick={() => setTab("coordinador")}>Coordinadores</button>
        <button className={tab === "carreras" ? "active" : ""} onClick={() => setTab("carreras")}>Carreras y fichas</button>
      </nav>
      {message && <p className="management-message success">{message}</p>}
      {error && <p className="management-message error">{error}</p>}

      {tab !== "carreras" ? <section className="management-section">
        <div className="section-heading"><div><p className="management-eyebrow">Módulo de usuarios</p><h2>{tab[0].toUpperCase() + tab.slice(1)}s</h2></div></div>
        <form className="management-form user-grid" onSubmit={submitUser}>
          <input name="nombre" value={userForm.nombre} onChange={change(setUserForm)} placeholder="Nombre" required />
          <input name="apellido" value={userForm.apellido} onChange={change(setUserForm)} placeholder="Apellido" required />
          <select name="tipo_documento" value={userForm.tipo_documento} onChange={change(setUserForm)}><option value="CC">CC</option><option value="TI">TI</option><option value="CE">CE</option><option value="PEP">PEP</option><option value="PPT">PPT</option></select>
          <input name="numero_documento" type="number" value={userForm.numero_documento} onChange={change(setUserForm)} placeholder="Número de documento" required />
          <input name="correo" type="email" value={userForm.correo} onChange={change(setUserForm)} placeholder="Correo electrónico" required />
          <input name="contraseña" type="password" value={userForm.contraseña} onChange={change(setUserForm)} placeholder="Contraseña inicial" required />
          <button type="submit">Crear usuario</button>
        </form>
        <div className="records">{users.map((user) => <article className="record" key={user.id}><div><strong>{user.nombre} {user.apellido}</strong><span>{user.correo} · {user.numero_documento}</span></div><button onClick={() => remove(`/users/coordinador/${tab}/${user.id}`)}>Eliminar</button></article>)}</div>
      </section> : <div className="management-columns">
        <section className="management-section"><p className="management-eyebrow">Catálogo</p><h2>Carreras</h2><form className="management-form" onSubmit={submitCareer}><input name="nombre" value={careerForm.nombre} onChange={change(setCareerForm)} placeholder="Nombre de la carrera" required /><textarea name="descripcion" value={careerForm.descripcion} onChange={change(setCareerForm)} placeholder="Descripción" rows="3" /><button type="submit">Crear carrera</button></form><div className="records">{careers.map((career) => <article className="record" key={career.id}><div><strong>{career.nombre}</strong><span>{career.descripcion || "Sin descripción"}</span></div><button onClick={() => remove(`/users/carreras/${career.id}`)}>Eliminar</button></article>)}</div></section>
        <section className="management-section"><p className="management-eyebrow">Fichas</p><h2>Tokens de formación</h2><form className="management-form" onSubmit={submitFicha}><select name="id_carrera" value={fichaForm.id_carrera} onChange={change(setFichaForm)} required><option value="">Selecciona una carrera</option>{careers.map((career) => <option key={career.id} value={career.id}>{career.nombre}</option>)}</select><input name="numero" type="number" value={fichaForm.numero} onChange={change(setFichaForm)} placeholder="Número de ficha" required /><input name="fecha_inicio" type="date" value={fichaForm.fecha_inicio} onChange={change(setFichaForm)} required /><input name="fecha_fin" type="date" value={fichaForm.fecha_fin} onChange={change(setFichaForm)} required /><select name="jornada" value={fichaForm.jornada} onChange={change(setFichaForm)}><option value="manana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option></select><button type="submit">Crear ficha</button></form><div className="records">{fichas.map((ficha) => <article className="record" key={ficha.id}><div><strong>Ficha {ficha.numero}</strong><span>{ficha.fecha_inicio} a {ficha.fecha_fin} · {ficha.jornada}</span></div><button onClick={() => remove(`/users/fichas/${ficha.id}`)}>Eliminar</button></article>)}</div></section>
      </div>}
    </main>
  );
}
