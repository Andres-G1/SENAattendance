# backend/app/seed.py
from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session, select
from database import engine, crear_tablas
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from security import hash_contraseña


def seed():
    crear_tablas()

    with Session(engine) as session:

        aprendiz = session.exec(
            select(Aprendiz).where(Aprendiz.Num_ide_Apr == 1001)
        ).first()

        if not aprendiz:
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
            print("Aprendiz creado.")
        else:
            print("Aprendiz ya existe.")

        instructor = session.exec(
            select(Instructor).where(Instructor.Num_ide_Ins == 2001)
        ).first()

        if not instructor:
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
            print("Instructor creado.")
        else:
            print("Instructor ya existe.")

        administrador = session.exec(
            select(Administrador).where(
                Administrador.Num_ide_Adm == 3001
            )
        ).first()

        if not administrador:
            administrador = Administrador(
                Nom_Adm="Laura",
                Ape_Adm="Martinez",
                Tip_ide_Adm=TipoIdentificacion.CC,
                Num_ide_Adm=3001,
                Cor_Adm="admin.prueba@sena.edu.co",
                Con_Adm=hash_contraseña("admin123"),
                Es_Adm=False,
            )

            session.add(administrador)
            print("Administrador Laura creado.")
        else:
            print("Administrador Laura ya existe.")

        administrador1 = session.exec(
            select(Administrador).where(
                Administrador.Num_ide_Adm == 4001
            )
        ).first()

        if not administrador1:
            administrador1 = Administrador(
                Nom_Adm="alejandro",
                Ape_Adm="matoma",
                Tip_ide_Adm=TipoIdentificacion.CC,
                Num_ide_Adm=4001,
                Cor_Adm="matoma.@sena.edu.co",
                Con_Adm=hash_contraseña("admin123"),
                Es_Adm=True,
            )

            session.add(administrador1)
            print("Administrador Alejandro creado.")
        else:
            print("Administrador Alejandro ya existe.")


        session.commit()

        print("Datos de prueba procesados correctamente.")


if __name__ == "__main__":
    seed()