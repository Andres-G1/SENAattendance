from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import get_session
from models.model import (
    Competencia,
    Fichas,
    FichaInstructor,
    ResultadoAprendizaje,
)


Router_resultados_aprendizaje = APIRouter(
    prefix="/resultados-aprendizaje",
    tags=["Resultados de aprendizaje"],
)


# =========================================================
# REQUEST PARA CREAR RESULTADO DE APRENDIZAJE
# =========================================================

class ResultadoAprendizajeCreateRequest(BaseModel):
    Nom_RA: str = Field(min_length=1, max_length=150)
    Des_RA: Optional[str] = None
    Id_Comp: int


# =========================================================
# REPRESENTAR RESULTADO
# =========================================================

def _representar_resultado(resultado, nombre_competencia):
    return {
        "Id_RA": resultado.Id_RA,
        "Nom_RA": resultado.Nom_RA,
        "Des_RA": resultado.Des_RA,
        "Id_Comp": resultado.Id_Comp,
        "Nom_Comp": nombre_competencia,
    }


# =========================================================
# LISTAR RESULTADOS DE APRENDIZAJE
# =========================================================

@Router_resultados_aprendizaje.get("/")
def listar_resultados_aprendizaje(
    Id_Comp: Optional[int] = None,
    session: Session = Depends(get_session),
):
    consulta = (
        select(
            ResultadoAprendizaje,
            Competencia.Nom_Comp,
        )
        .join(
            Competencia,
            ResultadoAprendizaje.Id_Comp == Competencia.Id_Comp,
        )
        .order_by(ResultadoAprendizaje.Id_RA.desc())
    )

    if Id_Comp is not None:
        consulta = consulta.where(
            ResultadoAprendizaje.Id_Comp == Id_Comp
        )

    filas = session.exec(consulta).all()

    return [
        _representar_resultado(resultado, nombre_competencia)
        for resultado, nombre_competencia in filas
    ]


# =========================================================
# CREAR RESULTADO DE APRENDIZAJE
# =========================================================

@Router_resultados_aprendizaje.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def crear_resultado_aprendizaje(
    data: ResultadoAprendizajeCreateRequest,
    session: Session = Depends(get_session),
):
    # Validar que la competencia exista
    competencia = session.get(
        Competencia,
        data.Id_Comp,
    )

    if competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La competencia indicada no existe",
        )

    nombre = data.Nom_RA.strip()

    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre del resultado de aprendizaje es obligatorio",
        )

    # Crear resultado asociado únicamente a la competencia
    resultado = ResultadoAprendizaje(
        Nom_RA=nombre,
        Des_RA=data.Des_RA,
        Id_Comp=data.Id_Comp,
    )

    session.add(resultado)

    try:
        session.commit()
        session.refresh(resultado)

    except Exception:
        session.rollback()
        raise

    return _representar_resultado(
        resultado,
        competencia.Nom_Comp,
    )


# =========================================================
# CONSULTAR FICHAS ASIGNADAS A UN RESULTADO
# =========================================================

@Router_resultados_aprendizaje.get("/{Id_RA}/fichas")
def listar_fichas_por_resultado(
    Id_RA: int,
    session: Session = Depends(get_session),
):
    resultado = session.get(
        ResultadoAprendizaje,
        Id_RA,
    )

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El resultado de aprendizaje no existe",
        )

    consulta = (
        select(
            FichaInstructor,
            Fichas.Num_Fic,
            Fichas.Jor_Fic,
        )
        .join(
            Fichas,
            FichaInstructor.Id_Fic == Fichas.Id_Fic,
        )
        .where(
            FichaInstructor.Id_RA == Id_RA,
        )
        .order_by(
            FichaInstructor.Id_Fic,
            FichaInstructor.Dia,
        )
    )

    filas = session.exec(consulta).all()

    return [
        {
            "Id_Fic": asignacion.Id_Fic,
            "Num_Fic": numero_ficha,
            "Jor_Fic": jornada,
            "Id_Ins": asignacion.Id_Ins,
            "Id_RA": asignacion.Id_RA,
            "Dia": (
                asignacion.Dia.value
                if asignacion.Dia
                else None
            ),
            "Fec_Inicio_RA": asignacion.Fec_Inicio_RA,
            "Fec_Fin_RA": asignacion.Fec_Fin_RA,
        }
        for asignacion, numero_ficha, jornada in filas
    ]