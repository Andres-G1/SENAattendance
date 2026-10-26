import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

# Fuerza a Python a leer el archivo .env actualizado del disco
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Control de seguridad: Si no encuentra la variable o sigue con la plantilla de ejemplo
if not DATABASE_URL or "TU_CONTRASEÑA" in DATABASE_URL:
    # Usamos tus credenciales reales como respaldo directo
    DATABASE_URL = "mysql+pymysql://root:212202@127.0.0.1:3306/SENAattendance"

engine = create_engine(DATABASE_URL, echo=True)

def crear_tablas():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
