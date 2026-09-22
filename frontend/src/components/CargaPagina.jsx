import PantallaCarga from "./PantallaCarga.jsx";

export default function CargaPagina({ cargando, texto, children }) {
  if (cargando) {
    return <PantallaCarga texto={texto} />;  // <- aquí es donde se usa
  }
  return children;
}