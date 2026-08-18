# backend/app/seed.py
from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session
from database import engine, crear_tablas
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from security import hash_contraseña


def seed():
    crear_tablas()

    with Session(engine) as session:
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

        instructor = Instructor(
            Nom_Ins="Carlos",
            Ape_Ins="Gomez",
            Tip_ide_Ins=TipoIdentificacion.CC,
            Num_ide_Ins=2001,
            Cor_Ins="instructor.prueba@sena.edu.co",
            Con_Ins=hash_contraseña("instructor123"),
            Es_Ins=True,
        )

        administrador = Administrador(
            Nom_Adm="Laura",
            Ape_Adm="Martinez",
            Tip_ide_Adm=TipoIdentificacion.CC,
            Num_ide_Adm=3001,
            Cor_Adm="admin.prueba@sena.edu.co",
            Con_Adm=hash_contraseña("admin123"),
            Es_Adm=False,
        )

        session.add(aprendiz)
        session.add(instructor)
        session.add(administrador)
        session.commit()

        print("Datos de prueba insertados correctamente.")


if __name__ == "__main__":
    seed()
    
'''
uv run python app/seed.py
'''
