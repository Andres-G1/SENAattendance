from datetime import datetime, date
from typing import Optional, List
from enum import Enum

from sqlmodel import SQLModel, Field, Relationship


# ---------------------------
# ENUMS
# ---------------------------
class TipoIdentificacion(str, Enum):
    CC = "CC"
    TI = "TI"
    CE = "CE"
    PEP = "PEP"
    PPT = "PPT"


class Jornada(str, Enum):
    manana = "Mañana"
    tarde = "Tarde"
    noche = "Noche"


class EstadoAsistencia(str, Enum):
    retardo = "Retardo"
    excusa = "Excusa"
    falla = "Falla"
    presente = "Presente"


class AccionLog(str, Enum):
    insert = "INSERT"
    update = "UPDATE"
    delete = "DELETE"


# ---------------------------
# CARRERA
# ---------------------------
class Carrera(SQLModel, table=True):
    __tablename__ = "Carrera"

    Id_Car: Optional[int] = Field(default=None, primary_key=True)
    Nom_Car: str = Field(max_length=150, nullable=False)
    Des_Car: Optional[str] = None
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    fichas: List["Fichas"] = Relationship(back_populates="carrera")


# ---------------------------
# FICHAS
# ---------------------------
class Fichas(SQLModel, table=True):
    __tablename__ = "Fichas"

    Id_Fic: Optional[int] = Field(default=None, primary_key=True)
    Id_Car: int = Field(foreign_key="Carrera.Id_Car", nullable=False)
    Fec_inicio_Fic: date = Field(nullable=False)
    Fec_Fin_Fic: date = Field(nullable=False)
    Num_Fic: int = Field(nullable=False, unique=True)
    Jor_Fic: Jornada = Field(nullable=False)
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    carrera: Optional[Carrera] = Relationship(back_populates="fichas")
    aprendices: List["Aprendiz"] = Relationship(back_populates="ficha")
    resultados_aprendizaje: List["ResultadoAprendizaje"] = Relationship(back_populates="ficha")
    asistencias: List["Asistencia"] = Relationship(back_populates="ficha")


# ---------------------------
# COMPETENCIA
# ---------------------------
class Competencia(SQLModel, table=True):
    __tablename__ = "competencia"

    Id_Comp: Optional[int] = Field(default=None, primary_key=True)
    Nom_Comp: str = Field(max_length=150, nullable=False)
    Des_Comp: Optional[str] = None
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    resultados_aprendizaje: List["ResultadoAprendizaje"] = Relationship(back_populates="competencia")


# ---------------------------
# INSTRUCTOR
# ---------------------------
class Instructor(SQLModel, table=True):
    __tablename__ = "Instructor"

    Id_Ins: Optional[int] = Field(default=None, primary_key=True)
    Nom_Ins: str = Field(max_length=100, nullable=False)
    Ape_Ins: str = Field(max_length=100, nullable=False)
    Tip_ide_Ins: TipoIdentificacion = Field(nullable=False)
    Num_ide_Ins: int = Field(nullable=False, unique=True)
    Cor_Ins: str = Field(max_length=100, nullable=False, unique=True)
    Con_Ins: str = Field(max_length=255, nullable=False)
    Es_Ins: bool = Field(default=True, nullable=False)
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    notificaciones: List["Notificacion"] = Relationship(back_populates="instructor")
    fichas_asignadas: List["FichaInstructor"] = Relationship(back_populates="instructor")


# ---------------------------
# ADMINISTRADOR
# ---------------------------
class Administrador(SQLModel, table=True):
    __tablename__ = "Administrador"

    Id_Adm: Optional[int] = Field(default=None, primary_key=True)
    Nom_Adm: str = Field(max_length=100, nullable=False)
    Ape_Adm: str = Field(max_length=100, nullable=False)
    Tip_ide_Adm: TipoIdentificacion = Field(nullable=False)
    Num_ide_Adm: int = Field(nullable=False, unique=True)
    Cor_Adm: str = Field(max_length=100, nullable=False, unique=True)
    Con_Adm: str = Field(max_length=255, nullable=False)
    Es_Adm: bool = Field(default=True, nullable=False)
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    notificaciones: List["Notificacion"] = Relationship(back_populates="administrador")


# ---------------------------
# APRENDIZ
# ---------------------------
class Aprendiz(SQLModel, table=True):
    __tablename__ = "Aprendiz"

    Id_Apr: Optional[int] = Field(default=None, primary_key=True)
    Nom_Apr: str = Field(max_length=100, nullable=False)
    Ape_Apr: str = Field(max_length=100, nullable=False)
    Tip_ide_Apr: TipoIdentificacion = Field(nullable=False)
    Num_ide_Apr: int = Field(nullable=False, unique=True)
    Cor_Apr: str = Field(max_length=100, nullable=False, unique=True)
    Con_Apr: str = Field(max_length=255, nullable=False)
    Es_Apr: bool = Field(default=True, nullable=False)
    Id_Fic: Optional[int] = Field(default=None, foreign_key="Fichas.Id_Fic")
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    ficha: Optional[Fichas] = Relationship(back_populates="aprendices")
    asistencias: List["Asistencia"] = Relationship(back_populates="aprendiz")
    notificaciones: List["Notificacion"] = Relationship(back_populates="aprendiz")


# ---------------------------
# FICHA_INSTRUCTOR (tabla intermedia, PK compuesta)
# ---------------------------
class FichaInstructor(SQLModel, table=True):
    __tablename__ = "Ficha_Instructor"

    Id_Fic: int = Field(foreign_key="Fichas.Id_Fic", primary_key=True)
    Id_Ins: int = Field(foreign_key="Instructor.Id_Ins", primary_key=True)

    ficha: Optional[Fichas] = Relationship()
    instructor: Optional[Instructor] = Relationship(back_populates="fichas_asignadas")


# ---------------------------
# RESULTADO DE APRENDIZAJE
# ---------------------------
class ResultadoAprendizaje(SQLModel, table=True):
    __tablename__ = "ResultadoAprendizaje"

    Id_RA: Optional[int] = Field(default=None, primary_key=True)
    Nom_RA: str = Field(max_length=150, nullable=False)
    Des_RA: Optional[str] = None
    Id_Fic: int = Field(foreign_key="Fichas.Id_Fic", nullable=False)
    Id_Comp: int = Field(foreign_key="competencia.Id_Comp", nullable=False)
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)
    Fec_Mod: datetime = Field(default_factory=datetime.utcnow)

    ficha: Optional[Fichas] = Relationship(back_populates="resultados_aprendizaje")
    competencia: Optional[Competencia] = Relationship(back_populates="resultados_aprendizaje")


# ---------------------------
# ASISTENCIA
# ---------------------------
class Asistencia(SQLModel, table=True):
    __tablename__ = "Asistencia"

    Id_Asi: Optional[int] = Field(default=None, primary_key=True)
    Fec_Asi: date = Field(nullable=False)
    Es_Asi: EstadoAsistencia = Field(nullable=False)
    Id_Apr: int = Field(foreign_key="Aprendiz.Id_Apr", nullable=False)
    Id_Fic: int = Field(foreign_key="Fichas.Id_Fic", nullable=False)
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)

    aprendiz: Optional[Aprendiz] = Relationship(back_populates="asistencias")
    ficha: Optional[Fichas] = Relationship(back_populates="asistencias")


# ---------------------------
# NOTIFICACION
# ---------------------------
class Notificacion(SQLModel, table=True):
    __tablename__ = "Notificacion"

    Id_Not: Optional[int] = Field(default=None, primary_key=True)
    Asu_Not: str = Field(nullable=False)
    Men_Not: str = Field(nullable=False)
    Fec_Not: date = Field(nullable=False)
    Id_Apr: Optional[int] = Field(default=None, foreign_key="Aprendiz.Id_Apr")
    Id_Ins: Optional[int] = Field(default=None, foreign_key="Instructor.Id_Ins")
    Id_Adm: Optional[int] = Field(default=None, foreign_key="Administrador.Id_Adm")
    Fec_Cre: datetime = Field(default_factory=datetime.utcnow)

    aprendiz: Optional[Aprendiz] = Relationship(back_populates="notificaciones")
    instructor: Optional[Instructor] = Relationship(back_populates="notificaciones")
    administrador: Optional[Administrador] = Relationship(back_populates="notificaciones")


# ---------------------------
# LOG (auditoría)
# ---------------------------
class Log(SQLModel, table=True):
    __tablename__ = "Log"

    Id_Log: Optional[int] = Field(default=None, primary_key=True)
    Tabla_Afectada: str = Field(max_length=50, nullable=False)
    Id_Registro: int = Field(nullable=False)
    Accion: AccionLog = Field(nullable=False)
    Usu_Log: str = Field(max_length=100, nullable=False)
    Fec_Log: datetime = Field(default_factory=datetime.utcnow)
    Det_Log: Optional[str] = None