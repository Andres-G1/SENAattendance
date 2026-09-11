import AprendizNavbar from "./navbars/AprendizNavbar";
import InstructorNavbar from "./navbars/InstructorNavbar";
import CoordinadorNavbar from "./navbars/CoordinadorNavbar";

export default function CuentaNavbar({ role, name }) {
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "aprendiz") {
    return <AprendizNavbar user={{ Nom_Apr: name }} />;
  }

  if (normalizedRole === "instructor") {
    return <InstructorNavbar user={{ Nom_Ins: name }} />;
  }

  return <CoordinadorNavbar user={{ Nom_Adm: name }} />;
}
