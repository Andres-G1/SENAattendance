from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import get_session
from models.model import Competencia, ResultadoAprendizaje


Router_resultados_aprendizaje = APIRouter(
    prefix="/resultados-aprendizaje",
    tags=["Resultados de aprendizaje"],
)


class ResultadoAprendizajeCreateRequest(BaseModel):
    Nom_RA: str = Field(min_length=1, max_length=150)
    Des_RA: Optional[str] = None
    Id_Comp: int


def _representar_resultado(resultado, nombre_competencia):
    return {
        "Id_RA": resultado.Id_RA,
        "Nom_RA": resultado.Nom_RA,
        "Des_RA": resultado.Des_RA,
        "Id_Comp": resultado.Id_Comp,
        "Nom_Comp": nombre_competencia,
        "Es_RA": resultado.Es_RA,
    }


@Router_resultados_aprendizaje.get("/")
def listar_resultados_aprendizaje(
    Id_Comp: Optional[int] = None,
    session: Session = Depends(get_session),
):
    consulta = (
        select(ResultadoAprendizaje, Competencia.Nom_Comp)
        .join(Competencia, ResultadoAprendizaje.Id_Comp == Competencia.Id_Comp)
        .order_by(ResultadoAprendizaje.Id_RA.desc())
    )
    if Id_Comp is not None:
        consulta = consulta.where(ResultadoAprendizaje.Id_Comp == Id_Comp)

    filas = session.exec(consulta).all()
    return [
        _representar_resultado(resultado, nombre_competencia)
        for resultado, nombre_competencia in filas
    ]


@Router_resultados_aprendizaje.post("/", status_code=status.HTTP_201_CREATED)
def crear_resultado_aprendizaje(
    data: ResultadoAprendizajeCreateRequest,
    session: Session = Depends(get_session),
):
    nombre_competencia = session.get(Competencia, data.Id_Comp)
    if nombre_competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La competencia indicada no existe",
        )

    resultado = ResultadoAprendizaje(
        Nom_RA=data.Nom_RA.strip(),
        Des_RA=data.Des_RA,
        Id_Fic=None,
        Id_Comp=data.Id_Comp,
        Es_RA=True,
    )
    if not resultado.Nom_RA:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre del resultado de aprendizaje es obligatorio",
        )

    session.add(resultado)
    session.commit()
    session.refresh(resultado)

    return _representar_resultado(resultado, nombre_competencia.Nom_Comp)


def _actualizar_estado_resultado(
    Id_RA: int,
    activo: bool,
    session: Session,
):
    resultado = session.get(ResultadoAprendizaje, Id_RA)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultado de aprendizaje no encontrado",
        )

    resultado.Es_RA = activo
    session.add(resultado)
    session.commit()
    session.refresh(resultado)
    competencia = session.get(Competencia, resultado.Id_Comp)
    return _representar_resultado(resultado, competencia.Nom_Comp)


@Router_resultados_aprendizaje.patch("/{Id_RA}/desactivar")
def desactivar_resultado_aprendizaje(
    Id_RA: int,
    session: Session = Depends(get_session),
):
    return _actualizar_estado_resultado(Id_RA, False, session)


@Router_resultados_aprendizaje.patch("/{Id_RA}/activar")
def activar_resultado_aprendizaje(
    Id_RA: int,
    session: Session = Depends(get_session),
):
    return _actualizar_estado_resultado(Id_RA, True, session)
