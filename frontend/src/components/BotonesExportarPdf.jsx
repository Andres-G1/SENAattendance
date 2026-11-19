import { useState } from "react";

const API_BASE = "http://localhost:8000";

const leerError = async (res) => {
  try {
    const data = await res.json();
    return data.detail || "No se pudo generar el PDF.";
  } catch {
    return "No se pudo generar el PDF.";
  }
};

/**
 * Props:
 *  - idFicha        (obligatorio) ficha seleccionada
 *  - numFicha       número de la ficha (solo para nombrar el archivo)
 *  - idAprendiz     aprendiz que quedó filtrado (si hay uno solo)
 *  - docAprendiz    documento de ese aprendiz (solo para nombrar el archivo)
 *  - idInstructor   solo en la vista del instructor (el backend valida la asignación)
 */
export default function BotonesExportarPdf({
  idFicha,
  numFicha,
  idAprendiz,
  docAprendiz,
  idInstructor,
}) {
  const [cargando, setCargando] = useState(null); // "ficha" | "aprendiz" | null
  const [error, setError] = useState("");

  const exportar = async (tipo) => {
    setCargando(tipo);
    setError("");

    try {
      const params = new URLSearchParams();

      if (tipo === "aprendiz" && idAprendiz) params.set("Id_Apr", idAprendiz);
      if (idInstructor) params.set("Id_Ins", idInstructor);

      const query = params.toString();
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `${API_BASE}/asistencia/pdf/ficha/${idFicha}${query ? `?${query}` : ""}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!res.ok) {
        setError(await leerError(res));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download =
        tipo === "aprendiz"
          ? `asistencia_ficha_${numFicha}_${docAprendiz}.pdf`
          : `asistencia_ficha_${numFicha}.pdf`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("No fue posible generar el PDF.");
    } finally {
      setCargando(null);
    }
  };

  const ocupado = cargando !== null;

  return (
    <div>
      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn text-white fw-semibold"
          style={{ backgroundColor: "#00851d" }}
          onClick={() => exportar("ficha")}
          disabled={!idFicha || ocupado}
        >
          {cargando === "ficha" ? "Generando..." : "Exportar PDF de la ficha"}
        </button>

        <button
          type="button"
          className="btn btn-outline-success fw-semibold"
          onClick={() => exportar("aprendiz")}
          disabled={!idFicha || !idAprendiz || ocupado}
        >
          {cargando === "aprendiz"
            ? "Generando..."
            : "Exportar PDF del aprendiz"}
        </button>
      </div>

      {!idAprendiz && (
        <div className="form-text">
          Filtra hasta que quede un solo aprendiz para exportar solo el suyo.
        </div>
      )}

      {error && <div className="small text-danger mt-1">{error}</div>}
    </div>
  );
}