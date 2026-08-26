# backend/app/seed.py
from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session, select

try:
    from app.database import engine, crear_tablas
    from app.models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
    from app.security import hash_contraseña
except ImportError:
    from database import engine, crear_tablas
    from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
    from security import hash_contraseña


def seed():
    crear_tablas()

    with Session(engine) as session:
        aprendiz = session.exec(
            select(Aprendiz).where(Aprendiz.Num_ide_Apr == 1001)
        ).first()
        if aprendiz is None:
            aprendiz = Aprendiz(
                Nom_Apr="Sebastian",
                Ape_Apr="Ramirez",
                Tip_ide_Apr=TipoIdentificacion.CC,
                Num_ide_Apr=1001,
                Cor_Apr="aprendiz.prueba@sena.edu.co",
                Con_Apr=hash_contraseña("aprendiz123"),
                Es_Apr=True,
                Id_Fic=None,
            )
            session.add(aprendiz)
        else:
            aprendiz.Nom_Apr = "Sebastian"
            aprendiz.Ape_Apr = "Ramirez"
            aprendiz.Tip_ide_Apr = TipoIdentificacion.CC
            aprendiz.Cor_Apr = "aprendiz.prueba@sena.edu.co"
            aprendiz.Con_Apr = hash_contraseña("aprendiz123")
            aprendiz.Es_Apr = True

        instructor = session.exec(
            select(Instructor).where(Instructor.Num_ide_Ins == 2001)
        ).first()
        if instructor is None:
            instructor = Instructor(
                Nom_Ins="Carlos",
                Ape_Ins="Gomez",
                Tip_ide_Ins=TipoIdentificacion.CC,
                Num_ide_Ins=2001,
                Cor_Ins="instructor.prueba@sena.edu.co",
                Con_Ins=hash_contraseña("instructor123"),
                Es_Ins=True,
            )
            session.add(instructor)
        else:
            instructor.Nom_Ins = "Carlos"
            instructor.Ape_Ins = "Gomez"
            instructor.Tip_ide_Ins = TipoIdentificacion.CC
            instructor.Cor_Ins = "instructor.prueba@sena.edu.co"
            instructor.Con_Ins = hash_contraseña("instructor123")
            instructor.Es_Ins = True

        administrador = session.exec(
            select(Administrador).where(Administrador.Num_ide_Adm == 3001)
        ).first()
        if administrador is None:
            administrador = Administrador(
                Nom_Adm="Laura",
                Ape_Adm="Martinez",
                Tip_ide_Adm=TipoIdentificacion.CC,
                Num_ide_Adm=3001,
                Cor_Adm="admin.prueba@sena.edu.co",
                Con_Adm=hash_contraseña("admin123"),
                Es_Adm=True,
            )
            session.add(administrador)
        else:
            administrador.Nom_Adm = "Laura"
            administrador.Ape_Adm = "Martinez"
            administrador.Tip_ide_Adm = TipoIdentificacion.CC
            administrador.Cor_Adm = "admin.prueba@sena.edu.co"
            administrador.Con_Adm = hash_contraseña("admin123")
            administrador.Es_Adm = True

        session.commit()

        print("Datos de prueba insertados correctamente.")


if __name__ == "__main__":
    seed()

'''
uv run python app/seed.py
'''
