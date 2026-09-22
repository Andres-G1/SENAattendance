export default function PantallaCarga({
  texto = "Cargando...",
  logoSrc = "/logo-sena.png",
}) {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#ffffff",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 96,
          height: 96,
        }}
      >
        {/* Círculo giratorio */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "6px solid #E6F4D7",
            borderTopColor: "#00851d",
            animation: "girar-sena 0.8s linear infinite",
          }}
        />

        {/* Logo centrado, quieto */}
        <img
          src={logoSrc}
          alt="SENA"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 52,
            height: 52,
            objectFit: "contain",
          }}
        />
      </div>

      {texto && (
        <p className="text-muted fw-medium mt-4 mb-0">{texto}</p>
      )}

      <style>{`
        @keyframes girar-sena {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}