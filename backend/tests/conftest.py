"""
Configuración compartida de las pruebas.

- Usa una base de datos SQLite en memoria (no toca tu MySQL).
- Reemplaza el envío de correos (SMTP) por uno falso.
- Desactiva el rate limit para que no bloquee las pruebas.
"""
import os
import sys
import time
import smtplib
from datetime import date
from pathlib import Path

# Variables de entorno ANTES de importar la app
os.environ["SECRET_KEY"] = "clave-secreta-de-pruebas-con-32-caracteres"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SMTP_HOST"] = "smtp.prueba.local"
os.environ["SMTP_PORT"] = "587"
os.environ["SMTP_USER"] = "bot@prueba.local"
os.environ["SMTP_PASSWORD"] = "clave"

# La app importa sus módulos como "database", "models.model", etc.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app"))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlmodel import SQLModel, Session, create_engine  # noqa: E402

import database  # noqa: E402
import main  # noqa: E402
import limiter as limiter_login  # noqa: E402
from routers import recuperarcontraseña  # noqa: E402
from security import hash_contraseña, crear_token  # noqa: E402
from models.model import (  # noqa: E402
    Administrador,
    Aprendiz,
    Carrera,
    Competencia,
    DiaSemana,
    FichaInstructor,
    Fichas,
    Instructor,
    Jornada,
    ResultadoAprendizaje,
    TipoIdentificacion,
)

# Un solo hash para todos los usuarios de prueba (bcrypt es lento)
PASSWORD = "Clave123"
PASSWORD_HASH = hash_contraseña(PASSWORD)


class FakeSMTP:
    """Servidor SMTP falso: guarda los correos en vez de enviarlos."""

    enviados = []
    fallar = False

    def __init__(self, host, port):
        if FakeSMTP.fallar:
            raise ConnectionError("SMTP caído")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def starttls(self):
        pass

    def login(self, user, password):
        pass

    def send_message(self, mensaje):
        FakeSMTP.enviados.append(mensaje["To"])

    def sendmail(self, remitente, destinatarios, mensaje):
        FakeSMTP.enviados.extend(destinatarios)


@pytest.fixture(autouse=True)
def engine(monkeypatch):
    # SQLite en memoria compartido entre todas las sesiones de la prueba
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    monkeypatch.setattr(database, "engine", engine)
    yield engine
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(autouse=True)
def correo_falso(monkeypatch):
    FakeSMTP.enviados = []
    FakeSMTP.fallar = False
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(time, "sleep", lambda *_: None)
    return FakeSMTP


@pytest.fixture(autouse=True)
def sin_rate_limit():
    limitadores = (limiter_login.limiter, recuperarcontraseña.limiter)
    for lim in limitadores:
        lim.reset()
        lim.enabled = False
    yield
    for lim in limitadores:
        lim.reset()
        lim.enabled = True


@pytest.fixture
def session(engine):
    with Session(engine, expire_on_commit=False) as s:
        yield s


@pytest.fixture
def client():
    # Sin "with" para no arrancar el scheduler real del startup
    return TestClient(main.app)


# ----------------------------------------------------------------------
# Datos de ejemplo
# ----------------------------------------------------------------------
# Lunes 2 de marzo de 2026
LUNES = date(2026, 3, 2)


@pytest.fixture
def datos(session):
    """Escenario base: carrera, ficha, competencia, RA, usuarios y una asignación los lunes."""
    carrera = Carrera(Nom_Car="ADSO", Des_Car="Análisis y Desarrollo de Software")
    session.add(carrera)
    session.commit()

    ficha = Fichas(
        Id_Car=carrera.Id_Car,
        Num_Fic=3407184,
        Fec_inicio_Fic=date(2026, 1, 5),
        Fec_Fin_Fic=date(2026, 12, 18),
        Jor_Fic=Jornada.Mañana,
    )
    competencia = Competencia(Nom_Comp="Programación", Des_Comp="Construir software")
    session.add_all([ficha, competencia])
    session.commit()

    ra = ResultadoAprendizaje(Nom_RA="Codificar módulos", Id_Comp=competencia.Id_Comp)
    instructor = Instructor(
        Nom_Ins="Carlos", Ape_Ins="Gomez", Tip_ide_Ins=TipoIdentificacion.CC,
        Num_ide_Ins=2001, Cor_Ins="instructor@sena.edu.co", Con_Ins=PASSWORD_HASH,
    )
    aprendiz = Aprendiz(
        Nom_Apr="Sebastian", Ape_Apr="Ramirez", Tip_ide_Apr=TipoIdentificacion.CC,
        Num_ide_Apr=1001, Cor_Apr="aprendiz@sena.edu.co", Con_Apr=PASSWORD_HASH,
        Id_Fic=ficha.Id_Fic,
    )
    admin = Administrador(
        Nom_Adm="Laura", Ape_Adm="Martinez", Tip_ide_Adm=TipoIdentificacion.CC,
        Num_ide_Adm=3001, Cor_Adm="admin@sena.edu.co", Con_Adm=PASSWORD_HASH,
    )
    session.add_all([ra, instructor, aprendiz, admin])
    session.commit()

    asignacion = FichaInstructor(
        Id_Fic=ficha.Id_Fic, Id_Ins=instructor.Id_Ins, Id_RA=ra.Id_RA,
        Dia=DiaSemana.lunes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 6, 30),
    )
    session.add(asignacion)
    session.commit()

    for obj in (carrera, ficha, competencia, ra, instructor, aprendiz, admin, asignacion):
        session.refresh(obj)

    return {
        "carrera": carrera,
        "ficha": ficha,
        "competencia": competencia,
        "ra": ra,
        "instructor": instructor,
        "aprendiz": aprendiz,
        "admin": admin,
        "asignacion": asignacion,
    }


def token_para(user_id, role):
    return {"Authorization": f"Bearer {crear_token({'sub': str(user_id), 'role': role})}"}
