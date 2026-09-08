from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session

from models.model import (
    Asistencia,
    Aprendiz,
    Fichas,
    FichaInstructor,
    EstadoAsistencia,
    DiaSemana
)


Router_asistencia = APIRouter(
    prefix="/asistencia",
    tags=["Asistencia"]
)


# =========================================================
# SCHEMAS
# =========================================================

class RegistrarAsistenciaRequest(BaseModel):
    Fec_Asi: date
    Es_Asi: EstadoAsistencia

    Id_Apr: int

    Id_Fic: int
    Id_Ins: int
    Id_Comp: int
    Dia: DiaSemana


# =========================================================
# OBTENER APRENDICES DE UNA FICHA
# =========================================================

@Router_asistencia.get(
    "/ficha/{Id_Fic}/aprendices"
)
def obtener_aprendices(
    Id_Fic: int,
    session: Session = Depends(get_session)
):

    ficha = session.get(Fichas, Id_Fic)

    if not ficha:
        raise HTTPException(
            status_code=404,
            detail="Ficha no encontrada"
        )

    aprendices = session.exec(
        select(Aprendiz)
        .where(Aprendiz.Id_Fic == Id_Fic)
        .order_by(
            Aprendiz.Ape_Apr,
            Aprendiz.Nom_Apr
        )
    ).all()

    return [
        {
            "Id_Apr": aprendiz.Id_Apr,
            "Nom_Apr": aprendiz.Nom_Apr,
            "Ape_Apr": aprendiz.Ape_Apr,
            "Num_ide_Apr": aprendiz.Num_ide_Apr
        }
        for aprendiz in aprendices
    ]


# =========================================================
# OBTENER ASIGNACIONES DEL INSTRUCTOR
# =========================================================

@Router_asistencia.get(
    "/instructor/{Id_Ins}/asignaciones"
)
def obtener_asignaciones_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session)
):

    relaciones = session.exec(
        select(FichaInstructor)
        .where(
            FichaInstructor.Id_Ins == Id_Ins
        )
    ).all()

    resultado = []

    for relacion in relaciones:

        ficha = session.get(
            Fichas,
            relacion.Id_Fic
        )

        competencia = session.get(
            __import__(
                "models.model",
                fromlist=["Competencia"]
            ).Competencia,
            relacion.Id_Comp
        )

        if not ficha:
            continue

        resultado.append({

            "Id_Fic": relacion.Id_Fic,
            "Id_Ins": relacion.Id_Ins,
            "Id_Comp": relacion.Id_Comp,

            "Dia": (
                relacion.Dia.value
                if relacion.Dia
                else None
            ),

            "Num_Fic": ficha.Num_Fic,
            "Jor_Fic": (
                ficha.Jor_Fic.value
                if ficha.Jor_Fic
                else None
            ),

            "Fec_inicio_Fic": ficha.Fec_inicio_Fic,
            "Fec_Fin_Fic": ficha.Fec_Fin_Fic,

            "Competencia": (
                competencia.Nom_Comp
                if competencia
                else None
            )
        })

    return resultado


# =========================================================
# OBTENER ASISTENCIA DE UNA CLASE
# =========================================================

@Router_asistencia.get(
    "/clase/{Id_Fic}/{Id_Ins}/{Id_Comp}/{Dia}/{Fec_Asi}"
)
def obtener_asistencia_clase(
    Id_Fic: int,
    Id_Ins: int,
    Id_Comp: int,
    Dia: DiaSemana,
    Fec_Asi: date,
    session: Session = Depends(get_session)
):

    # -----------------------------------------------------
    # Verificar que la asignación exista
    # -----------------------------------------------------

    asignacion = session.get(
        FichaInstructor,
        (
            Id_Fic,
            Id_Ins,
            Id_Comp,
            Dia
        )
    )

    if not asignacion:
        raise HTTPException(
            status_code=404,
            detail="La asignación de esta clase no existe"
        )

    # -----------------------------------------------------
    # Verificar ficha
    # -----------------------------------------------------

    ficha = session.get(
        Fichas,
        Id_Fic
    )

    if not ficha:
        raise HTTPException(
            status_code=404,
            detail="Ficha no encontrada"
        )

    # -----------------------------------------------------
    # Verificar fecha
    # -----------------------------------------------------

    if Fec_Asi < ficha.Fec_inicio_Fic:

        raise HTTPException(
            status_code=400,
            detail="La fecha es anterior al inicio de la ficha"
        )

    if Fec_Asi > ficha.Fec_Fin_Fic:

        raise HTTPException(
            status_code=400,
            detail="La fecha es posterior al fin de la ficha"
        )

    # -----------------------------------------------------
    # Aprendices
    # -----------------------------------------------------

    aprendices = session.exec(
        select(Aprendiz)
        .where(
            Aprendiz.Id_Fic == Id_Fic
        )
        .order_by(
            Aprendiz.Ape_Apr,
            Aprendiz.Nom_Apr
        )
    ).all()

    # -----------------------------------------------------
    # Asistencias existentes
    # -----------------------------------------------------

    asistencias = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Fec_Asi == Fec_Asi,
            Asistencia.Id_Fic == Id_Fic,
            Asistencia.Id_Ins == Id_Ins,
            Asistencia.Id_Comp == Id_Comp,
            Asistencia.Dia == Dia
        )
    ).all()

    asistencias_map = {
        asistencia.Id_Apr: asistencia
        for asistencia in asistencias
    }

    resultado = []

    for aprendiz in aprendices:

        asistencia = asistencias_map.get(
            aprendiz.Id_Apr
        )

        resultado.append({

            "Id_Apr": aprendiz.Id_Apr,

            "Nom_Apr": aprendiz.Nom_Apr,

            "Ape_Apr": aprendiz.Ape_Apr,

            "Num_ide_Apr": aprendiz.Num_ide_Apr,

            "Id_Asi": (
                asistencia.Id_Asi
                if asistencia
                else None
            ),

            "Es_Asi": (
                asistencia.Es_Asi.value
                if asistencia
                else None
            )
        })

    return resultado


# =========================================================
# REGISTRAR / ACTUALIZAR ASISTENCIA
# =========================================================

@Router_asistencia.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def registrar_asistencia(
    data: RegistrarAsistenciaRequest,
    session: Session = Depends(get_session)
):

    # -----------------------------------------------------
    # Verificar ficha
    # -----------------------------------------------------

    ficha = session.get(
        Fichas,
        data.Id_Fic
    )

    if not ficha:

        raise HTTPException(
            status_code=404,
            detail="Ficha no encontrada"
        )

    # -----------------------------------------------------
    # Verificar aprendiz
    # -----------------------------------------------------

    aprendiz = session.get(
        Aprendiz,
        data.Id_Apr
    )

    if not aprendiz:

        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )

    # -----------------------------------------------------
    # El aprendiz debe pertenecer a la ficha
    # -----------------------------------------------------

    if aprendiz.Id_Fic != data.Id_Fic:

        raise HTTPException(
            status_code=400,
            detail="El aprendiz no pertenece a esta ficha"
        )

    # -----------------------------------------------------
    # Verificar período
    # -----------------------------------------------------

    if data.Fec_Asi < ficha.Fec_inicio_Fic:

        raise HTTPException(
            status_code=400,
            detail="La fecha es anterior al inicio de la ficha"
        )

    if data.Fec_Asi > ficha.Fec_Fin_Fic:

        raise HTTPException(
            status_code=400,
            detail="La fecha es posterior al fin de la ficha"
        )

    # -----------------------------------------------------
    # Verificar asignación
    # -----------------------------------------------------

    asignacion = session.get(
        FichaInstructor,
        (
            data.Id_Fic,
            data.Id_Ins,
            data.Id_Comp,
            data.Dia
        )
    )

    if not asignacion:

        raise HTTPException(
            status_code=404,
            detail="La asignación de esta competencia no existe"
        )

    # -----------------------------------------------------
    # Buscar asistencia existente
    # -----------------------------------------------------

    asistencia = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Fec_Asi == data.Fec_Asi,
            Asistencia.Id_Apr == data.Id_Apr,
            Asistencia.Id_Fic == data.Id_Fic,
            Asistencia.Id_Ins == data.Id_Ins,
            Asistencia.Id_Comp == data.Id_Comp,
            Asistencia.Dia == data.Dia
        )
    ).first()

    # -----------------------------------------------------
    # ACTUALIZAR
    # -----------------------------------------------------

    if asistencia:

        asistencia.Es_Asi = data.Es_Asi

        session.add(asistencia)
        session.commit()
        session.refresh(asistencia)

        return {
            "mensaje": "Asistencia actualizada correctamente",
            "asistencia": asistencia
        }

    # -----------------------------------------------------
    # CREAR
    # -----------------------------------------------------

    nueva_asistencia = Asistencia(

        Fec_Asi=data.Fec_Asi,

        Es_Asi=data.Es_Asi,

        Id_Apr=data.Id_Apr,

        Id_Fic=data.Id_Fic,

        Id_Ins=data.Id_Ins,

        Id_Comp=data.Id_Comp,

        Dia=data.Dia
    )

    session.add(nueva_asistencia)

    session.commit()

    session.refresh(nueva_asistencia)

    return {
        "mensaje": "Asistencia registrada correctamente",
        "asistencia": nueva_asistencia
    }
