from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from database import get_session

from models.model import (
    Fichas,
    Aprendiz,
    Instructor,
    Competencia,
    FichaInstructor,
    DiaSemana
)


Router_asignaciones = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones SENAattendance"]
)


# =========================================================
# REQUEST PARA ASIGNAR INSTRUCTOR
# =========================================================

class AsignarInstructorRequest(BaseModel):
    Id_Fic: int
    Id_Ins: int
    Id_Comp: int
    Dia: DiaSemana

    Fec_Inicio_Comp: date
    Fec_Fin_Comp: date


# =========================================================
# REQUEST PARA ASIGNAR APRENDIZ
# =========================================================

class AsignarAprendizRequest(BaseModel):
    Id_Fic: int
    Id_Apr: int


# =========================================================
# ASIGNAR INSTRUCTOR A UNA FICHA
# =========================================================

@Router_asignaciones.post(
    "/instructor",
    status_code=status.HTTP_201_CREATED
)
def asignar_instructor(
    data: AsignarInstructorRequest,
    session: Session = Depends(get_session)
):

    # -----------------------------------------------------
    # 1. Buscar ficha
    # -----------------------------------------------------

    ficha = session.get(
        Fichas,
        data.Id_Fic
    )

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    # -----------------------------------------------------
    # 2. Buscar instructor
    # -----------------------------------------------------

    instructor = session.get(
        Instructor,
        data.Id_Ins
    )

    if not instructor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instructor no encontrado"
        )

    # -----------------------------------------------------
    # 3. Buscar competencia
    # -----------------------------------------------------

    competencia = session.get(
        Competencia,
        data.Id_Comp
    )

    if not competencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia no encontrada"
        )

    # -----------------------------------------------------
    # 4. Validar fechas
    # -----------------------------------------------------

    if data.Fec_Inicio_Comp > data.Fec_Fin_Comp:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de inicio de la competencia "
                "no puede ser posterior a la fecha final"
            )
        )

    # -----------------------------------------------------
    # 5. Validar inicio contra la ficha
    # -----------------------------------------------------

    if data.Fec_Inicio_Comp < ficha.Fec_inicio_Fic:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de inicio de la competencia "
                "no puede ser anterior al inicio de la ficha"
            )
        )

    # -----------------------------------------------------
    # 6. Validar final contra la ficha
    # -----------------------------------------------------

    if data.Fec_Fin_Comp > ficha.Fec_Fin_Fic:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha final de la competencia "
                "no puede ser posterior al fin de la ficha"
            )
        )

    # -----------------------------------------------------
    # 7. Crear relación
    # -----------------------------------------------------

    nueva_relacion = FichaInstructor(

        Id_Fic=data.Id_Fic,

        Id_Ins=data.Id_Ins,

        Id_Comp=data.Id_Comp,

        Dia=data.Dia,

        Fec_Inicio_Comp=data.Fec_Inicio_Comp,

        Fec_Fin_Comp=data.Fec_Fin_Comp
    )

    session.add(nueva_relacion)

    # -----------------------------------------------------
    # 8. Guardar
    # -----------------------------------------------------

    try:

        session.commit()

        session.refresh(
            nueva_relacion
        )

    except IntegrityError:

        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esta combinación de ficha, instructor, "
                "competencia y día ya existe"
            )
        )

    # -----------------------------------------------------
    # 9. Respuesta
    # -----------------------------------------------------

    return {
        "mensaje": "Instructor asignado a la ficha exitosamente",

        "Id_Fic": data.Id_Fic,

        "Id_Ins": data.Id_Ins,

        "Id_Comp": data.Id_Comp,

        "Dia": data.Dia.value,

        "Fec_Inicio_Comp": data.Fec_Inicio_Comp,

        "Fec_Fin_Comp": data.Fec_Fin_Comp
    }


# =========================================================
# OBTENER FICHAS DEL INSTRUCTOR
# =========================================================

@Router_asignaciones.get(
    "/instructor/{Id_Ins}/fichas"
)
def obtener_fichas_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session)
):

    # -----------------------------------------------------
    # 1. Obtener asignaciones del instructor
    # -----------------------------------------------------

    relaciones = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Ins == Id_Ins
        )
    ).all()

    # -----------------------------------------------------
    # 2. Si no tiene asignaciones
    # -----------------------------------------------------

    if not relaciones:
        return []

    resultado = []

    # -----------------------------------------------------
    # 3. Recorrer asignaciones
    # -----------------------------------------------------

    for rel in relaciones:

        # Obtener ficha
        ficha = session.get(
            Fichas,
            rel.Id_Fic
        )

        # Obtener competencia
        competencia = session.get(
            Competencia,
            rel.Id_Comp
        )

        # Si la ficha no existe, ignorar
        if not ficha:
            continue

        # -------------------------------------------------
        # Datos que enviamos al frontend
        # -------------------------------------------------

        resultado.append({

            # -----------------------------
            # ASIGNACIÓN
            # -----------------------------

            "Id_Fic": rel.Id_Fic,

            "Id_Ins": rel.Id_Ins,

            "Id_Comp": rel.Id_Comp,

            "Dia": (
                rel.Dia.value
                if rel.Dia
                else None
            ),

            # -----------------------------
            # FICHA
            # -----------------------------

            "Num_Fic": ficha.Num_Fic,

            "Jor_Fic": ficha.Jor_Fic,

            # Fechas generales de la ficha
            "Fec_inicio_Fic": ficha.Fec_inicio_Fic,

            "Fec_Fin_Fic": ficha.Fec_Fin_Fic,

            # -----------------------------
            # COMPETENCIA
            # -----------------------------

            "Competencia": (
                competencia.Nom_Comp
                if competencia
                else None
            ),

            # -----------------------------
            # FECHAS DE LA COMPETENCIA
            # -----------------------------

            "Fec_Inicio_Comp": rel.Fec_Inicio_Comp,

            "Fec_Fin_Comp": rel.Fec_Fin_Comp
        })

    return resultado


# =========================================================
# OBTENER UNA ASIGNACIÓN ESPECÍFICA
# =========================================================

@Router_asignaciones.get(
    "/instructor/{Id_Ins}/ficha/{Id_Fic}"
)
def obtener_asignaciones_ficha(
    Id_Ins: int,
    Id_Fic: int,
    session: Session = Depends(get_session)
):

    relaciones = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Ins == Id_Ins,
            FichaInstructor.Id_Fic == Id_Fic
        )
    ).all()

    if not relaciones:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El instructor no tiene asignaciones en esta ficha"
        )

    resultado = []

    for rel in relaciones:

        competencia = session.get(
            Competencia,
            rel.Id_Comp
        )

        resultado.append({

            "Id_Fic": rel.Id_Fic,

            "Id_Ins": rel.Id_Ins,

            "Id_Comp": rel.Id_Comp,

            "Dia": (
                rel.Dia.value
                if rel.Dia
                else None
            ),

            "Competencia": (
                competencia.Nom_Comp
                if competencia
                else None
            ),

            "Fec_Inicio_Comp": rel.Fec_Inicio_Comp,

            "Fec_Fin_Comp": rel.Fec_Fin_Comp
        })

    return resultado
