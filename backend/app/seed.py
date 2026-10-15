# backend/app/seed.py
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from sqlalchemy import or_
from sqlmodel import Session, select
from database import engine, crear_tablas
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion


def seed_demo_users():
    from security import hash_contraseña

    with Session(engine) as session:
        usuarios = (
            (
                Aprendiz,
                Aprendiz.Num_ide_Apr,
                Aprendiz.Cor_Apr,
                1001,
                "aprendiz.prueba@sena.edu.co",
                Aprendiz(
                    Nom_Apr="Sebastian",
                    Ape_Apr="Ramirez",
                    Tip_ide_Apr=TipoIdentificacion.CC,
                    Num_ide_Apr=1001,
                    Cor_Apr="aprendiz.prueba@sena.edu.co",
                    Con_Apr=hash_contraseña("aprendiz123"),
                    Es_Apr=True,
                    Id_Fic=None,
                ),
            ),
            (
                Instructor,
                Instructor.Num_ide_Ins,
                Instructor.Cor_Ins,
                2001,
                "instructor.prueba@sena.edu.co",
                Instructor(
                    Nom_Ins="Carlos",
                    Ape_Ins="Gomez",
                    Tip_ide_Ins=TipoIdentificacion.CC,
                    Num_ide_Ins=2001,
                    Cor_Ins="instructor.prueba@sena.edu.co",
                    Con_Ins=hash_contraseña("instructor123"),
                    Es_Ins=True,
                ),
            ),
            (
                Administrador,
                Administrador.Num_ide_Adm,
                Administrador.Cor_Adm,
                3001,
                "admin.prueba@sena.edu.co",
                Administrador(
                    Nom_Adm="Laura",
                    Ape_Adm="Martinez",
                    Tip_ide_Adm=TipoIdentificacion.CC,
                    Num_ide_Adm=3001,
                    Cor_Adm="admin.prueba@sena.edu.co",
                    Con_Adm=hash_contraseña("admin123"),
                    Es_Adm=True,
                ),
            ),
        )

        for model, document_field, email_field, document, email, user in usuarios:
            existing_user = session.exec(
                select(model).where(
                    or_(document_field == document, email_field == email)
                )
            ).first()
            if existing_user is None:
                session.add(user)

        session.commit()


def seed():
    crear_tablas()
    seed_demo_users()


if __name__ == "__main__":
    import os

    os.environ.setdefault("FASTAPI_ENV", "development")
    seed()
    
'''
uv run python app/seed.py
'''
