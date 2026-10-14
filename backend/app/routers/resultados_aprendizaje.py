from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import get_session
from models.model import Competencia, Fichas, ResultadoAprendizaje


Router_resultados_aprendizaje = APIRouter(
    prefix="/resultados-aprendizaje",
    tags=["Resultados de aprendizaje"],
)


class ResultadoAprendizajeCreateRequest(BaseModel):
    Nom_RA: str = Field(min_length=1, max_length=150)
    Des_RA: Optional[str] = None
    Id_Fic: int
    Id_Comp: int


def _representar_resultado(resultado, nombre_competencia, numero_ficha):
    return {
        "Id_RA": resultado.Id_RA,
        "Nom_RA": resultado.Nom_RA,
        "Des_RA": resultado.Des_RA,
        "Id_Fic": resultado.Id_Fic,
        "Num_Fic": numero_ficha,
        "Id_Comp": resultado.Id_Comp,
        "Nom_Comp": nombre_competencia,
    }


@Router_resultados_aprendizaje.get("/")
def listar_resultados_aprendizaje(
    Id_Comp: Optional[int] = None,
    session: Session = Depends(get_session),
):
    consulta = (
        select(ResultadoAprendizaje, Competencia.Nom_Comp, Fichas.Num_Fic)
        .join(Competencia, ResultadoAprendizaje.Id_Comp == Competencia.Id_Comp)
        .join(Fichas, ResultadoAprendizaje.Id_Fic == Fichas.Id_Fic)
        .order_by(ResultadoAprendizaje.Id_RA.desc())
    )
    if Id_Comp is not None:
        consulta = consulta.where(ResultadoAprendizaje.Id_Comp == Id_Comp)

    filas = session.exec(consulta).all()
    return [
        _representar_resultado(resultado, nombre_competencia, numero_ficha)
        for resultado, nombre_competencia, numero_ficha in filas
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

    ficha = session.get(Fichas, data.Id_Fic)
    if ficha is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La ficha indicada no existe",
        )

    resultado = ResultadoAprendizaje(
        Nom_RA=data.Nom_RA.strip(),
        Des_RA=data.Des_RA,
        Id_Fic=data.Id_Fic,
        Id_Comp=data.Id_Comp,
    )
    if not resultado.Nom_RA:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre del resultado de aprendizaje es obligatorio",
        )

    session.add(resultado)
    session.commit()
    session.refresh(resultado)

    return _representar_resultado(
        resultado,
        nombre_competencia.Nom_Comp,
        ficha.Num_Fic,
    )
