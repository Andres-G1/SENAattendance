
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from database import get_session

from models.model import (
    Fichas,
    Instructor,
    Competencia,
    ResultadoAprendizaje,
    FichaInstructor,
    DiaSemana,
)


Router_asignaciones = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones SENAattendance"],
)


# =========================================================
# REQUEST PARA ASIGNAR RESULTADO DE APRENDIZAJE
# =========================================================

class AsignarInstructorRequest(BaseModel):
    Id_Fic: int
    Id_Ins: int
    Id_RA: int
    Dia: DiaSemana

    Fec_Inicio_RA: date
    Fec_Fin_RA: date


# =========================================================
# REQUEST PARA ASIGNAR APRENDIZ
# =========================================================

class AsignarAprendizRequest(BaseModel):
    Id_Fic: int
    Id_Apr: int


# =========================================================
# ASIGNAR RESULTADO DE APRENDIZAJE A UN INSTRUCTOR
# =========================================================

@Router_asignaciones.post(
    "/instructor",
    status_code=status.HTTP_201_CREATED,
)
def asignar_instructor(
    data: AsignarInstructorRequest,
    session: Session = Depends(get_session),
):
    # 1. Buscar ficha
    ficha = session.get(Fichas, data.Id_Fic)

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada",
        )

    # 2. Buscar instructor
    instructor = session.get(Instructor, data.Id_Ins)

    if not instructor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instructor no encontrado",
        )

    # 3. Buscar resultado de aprendizaje
    resultado = session.get(
        ResultadoAprendizaje,
        data.Id_RA,
    )

    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultado de aprendizaje no encontrado",
        )

    # 4. Validar fechas
    if data.Fec_Inicio_RA > data.Fec_Fin_RA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de inicio del resultado de aprendizaje "
                "no puede ser posterior a la fecha final"
            ),
        )

    # 5. Validar fecha inicial contra la ficha
    if data.Fec_Inicio_RA < ficha.Fec_inicio_Fic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de inicio del resultado de aprendizaje "
                "no puede ser anterior al inicio de la ficha"
            ),
        )

    # 6. Validar fecha final contra la ficha
    if data.Fec_Fin_RA > ficha.Fec_Fin_Fic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha final del resultado de aprendizaje "
                "no puede ser posterior al fin de la ficha"
            ),
        )

    # 7. Crear asignación
    nueva_relacion = FichaInstructor(
        Id_Fic=data.Id_Fic,
        Id_Ins=data.Id_Ins,
        Id_RA=data.Id_RA,
        Dia=data.Dia,
        Fec_Inicio_RA=data.Fec_Inicio_RA,
        Fec_Fin_RA=data.Fec_Fin_RA,
    )

    session.add(nueva_relacion)

    # 8. Guardar
    try:
        session.commit()
        session.refresh(nueva_relacion)

    except IntegrityError:
        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esta combinación de ficha, instructor, "
                "resultado de aprendizaje y día ya existe, "
                "o infringe una restricción de la base de datos"
            ),
        )

    # 9. Respuesta
    return {
        "mensaje": "Resultado de aprendizaje asignado al instructor exitosamente",
        "Id_Fic": data.Id_Fic,
        "Id_Ins": data.Id_Ins,
        "Id_RA": data.Id_RA,
        "Dia": data.Dia.value,
        "Fec_Inicio_RA": data.Fec_Inicio_RA,
        "Fec_Fin_RA": data.Fec_Fin_RA,
        "Id_Comp": resultado.Id_Comp,
        "Nom_RA": resultado.Nom_RA,
    }


# =========================================================
# OBTENER FICHAS Y RESULTADOS DE UN INSTRUCTOR
# =========================================================

@Router_asignaciones.get(
    "/instructor/{Id_Ins}/fichas",
)
def obtener_fichas_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session),
):
    # Verificar instructor
    instructor = session.get(Instructor, Id_Ins)

    if not instructor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instructor no encontrado",
        )

    # Obtener asignaciones
    relaciones = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Ins == Id_Ins
        )
    ).all()

    resultado = []

    for rel in relaciones:
        ficha = session.get(Fichas, rel.Id_Fic)

        resultado_ra = session.get(
            ResultadoAprendizaje,
            rel.Id_RA,
        )

        if not ficha or not resultado_ra:
            continue

        competencia = session.get(
            Competencia,
            resultado_ra.Id_Comp,
        )

        resultado.append({
            # Asignación
            "Id_Fic": rel.Id_Fic,
            "Id_Ins": rel.Id_Ins,
            "Id_RA": rel.Id_RA,
            "Dia": rel.Dia.value if rel.Dia else None,

            # Ficha
            "Num_Fic": ficha.Num_Fic,
            "Jor_Fic": ficha.Jor_Fic.value
            if hasattr(ficha.Jor_Fic, "value")
            else ficha.Jor_Fic,
            "Fec_inicio_Fic": ficha.Fec_inicio_Fic,
            "Fec_Fin_Fic": ficha.Fec_Fin_Fic,

            # Resultado de aprendizaje
            "Nom_RA": resultado_ra.Nom_RA,
            "Des_RA": resultado_ra.Des_RA,

            # Competencia a la que pertenece el resultado
            "Id_Comp": resultado_ra.Id_Comp,
            "Competencia": competencia.Nom_Comp
            if competencia
            else None,

            # Periodo asignado
            "Fec_Inicio_RA": rel.Fec_Inicio_RA,
            "Fec_Fin_RA": rel.Fec_Fin_RA,
        })

    return resultado


# =========================================================
# OBTENER ASIGNACIONES DE UN INSTRUCTOR EN UNA FICHA
# =========================================================

@Router_asignaciones.get(
    "/instructor/{Id_Ins}/ficha/{Id_Fic}",
)
def obtener_asignaciones_ficha(
    Id_Ins: int,
    Id_Fic: int,
    session: Session = Depends(get_session),
):
    # Verificar ficha
    ficha = session.get(Fichas, Id_Fic)

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada",
        )

    # Verificar instructor
    instructor = session.get(Instructor, Id_Ins)

    if not instructor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instructor no encontrado",
        )

    relaciones = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Ins == Id_Ins,
            FichaInstructor.Id_Fic == Id_Fic,
        )
    ).all()

    if not relaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El instructor no tiene resultados asignados en esta ficha",
        )

    resultado = []

    for rel in relaciones:
        resultado_ra = session.get(
            ResultadoAprendizaje,
            rel.Id_RA,
        )

        if not resultado_ra:
            continue

        competencia = session.get(
            Competencia,
            resultado_ra.Id_Comp,
        )

        resultado.append({
            "Id_Fic": rel.Id_Fic,
            "Id_Ins": rel.Id_Ins,
            "Id_RA": rel.Id_RA,
            "Dia": rel.Dia.value if rel.Dia else None,

            "Num_Fic": ficha.Num_Fic,

            "Nom_RA": resultado_ra.Nom_RA,
            "Des_RA": resultado_ra.Des_RA,

            "Id_Comp": resultado_ra.Id_Comp,
            "Competencia": competencia.Nom_Comp
            if competencia
            else None,

            "Fec_Inicio_RA": rel.Fec_Inicio_RA,
            "Fec_Fin_RA": rel.Fec_Fin_RA,
        })

    return resultado
