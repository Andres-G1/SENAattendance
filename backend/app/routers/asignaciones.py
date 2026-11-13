
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

class AsignacionItem(BaseModel):
    Id_RA: int
    Dia: DiaSemana           # tu enum actual


class AsignarInstructorRequest(BaseModel):
    Id_Fic: int
    Id_Ins: int
    Asignaciones: list[AsignacionItem]   # reemplaza Id_RA / Id_RAs / Dias
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
    # 1. Ficha
    ficha = session.get(Fichas, data.Id_Fic)
    if not ficha:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ficha no encontrada")

    # 2. Instructor
    instructor = session.get(Instructor, data.Id_Ins)
    if not instructor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Instructor no encontrado")

    # 3. Pares (resultado, día) sin repetidos
    pares = list(dict.fromkeys((a.Id_RA, a.Dia) for a in data.Asignaciones))
    if not pares:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Debes enviar al menos una asignación",
        )

    # 4. Verificar que los resultados existan
    ids_ra = list(dict.fromkeys(id_ra for id_ra, _ in pares))

    resultados = session.exec(
        select(ResultadoAprendizaje).where(ResultadoAprendizaje.Id_RA.in_(ids_ra))
    ).all()

    encontrados = {r.Id_RA for r in resultados}
    faltantes = [i for i in ids_ra if i not in encontrados]
    if faltantes:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"Resultados de aprendizaje no encontrados: {faltantes}",
        )

    # 5. Validar fechas
    if data.Fec_Inicio_RA > data.Fec_Fin_RA:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "La fecha de inicio no puede ser posterior a la fecha final",
        )

    if data.Fec_Inicio_RA < ficha.Fec_inicio_Fic:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "La fecha de inicio no puede ser anterior al inicio de la ficha",
        )

    if data.Fec_Fin_RA > ficha.Fec_Fin_Fic:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "La fecha final no puede ser posterior al fin de la ficha",
        )

    # 6. Crear asignaciones
    nuevas = [
        FichaInstructor(
            Id_Fic=data.Id_Fic,
            Id_Ins=data.Id_Ins,
            Id_RA=id_ra,
            Dia=dia,
            Fec_Inicio_RA=data.Fec_Inicio_RA,
            Fec_Fin_RA=data.Fec_Fin_RA,
        )
        for id_ra, dia in pares
    ]
    session.add_all(nuevas)

    # 7. Un solo commit: si una falla, no se guarda ninguna
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Alguna combinación de ficha, instructor, resultado de "
            "aprendizaje y día ya existe, o infringe una restricción "
            "de la base de datos",
        )

    # 8. Respuesta
    return {
        "mensaje": f"{len(nuevas)} asignación(es) creada(s) exitosamente",
        "Id_Fic": data.Id_Fic,
        "Id_Ins": data.Id_Ins,
        "Fec_Inicio_RA": data.Fec_Inicio_RA,
        "Fec_Fin_RA": data.Fec_Fin_RA,
        "asignaciones": [
            {"Id_RA": id_ra, "Dia": dia.value} for id_ra, dia in pares
        ],
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
