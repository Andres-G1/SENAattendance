from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel

from database import get_session
from models.model import Fichas, Jornada


Router_ficha = APIRouter(
    prefix="/fichas",
    tags=["Fichas SENAattendance"]
)

class FichaCreateRequest(BaseModel):
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date
    Jor_Fic: Jornada


class FichaUpdateRequest(BaseModel):
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date
    Jor_Fic: Jornada


@Router_ficha.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_ficha(
    data: FichaCreateRequest,
    session: Session = Depends(get_session)
):
    nueva_ficha = Fichas(
        Id_Car=data.Id_Car,
        Num_Fic=data.Num_Fic,
        Fec_inicio_Fic=data.Fec_inicio_Fic,
        Fec_Fin_Fic=data.Fec_Fin_Fic,
        Jor_Fic=data.Jor_Fic
    )

    session.add(nueva_ficha)
    session.commit()
    session.refresh(nueva_ficha)

    return {
        "mensaje": "Ficha creada correctamente",
        "ficha": nueva_ficha
    }


@Router_ficha.get(
    "/",
    response_model=List[Fichas]
)
def obtener_fichas(
    session: Session = Depends(get_session)
):
    fichas = session.exec(
        select(Fichas)
    ).all()

    return fichas

@Router_ficha.get(
    "/{ficha_id}",
    response_model=Fichas
)
def obtener_ficha(
    ficha_id: int,
    session: Session = Depends(get_session)
):
    ficha = session.get(
        Fichas,
        ficha_id
    )

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    return ficha


@Router_ficha.put(
    "/{ficha_id}",
    response_model=Fichas
)
def actualizar_ficha(
    ficha_id: int,
    data: FichaUpdateRequest,
    session: Session = Depends(get_session)
):
    ficha = session.get(
        Fichas,
        ficha_id
    )

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    ficha.Id_Car = data.Id_Car
    ficha.Num_Fic = data.Num_Fic
    ficha.Fec_inicio_Fic = data.Fec_inicio_Fic
    ficha.Fec_Fin_Fic = data.Fec_Fin_Fic
    ficha.Jor_Fic = data.Jor_Fic

    session.add(ficha)
    session.commit()
    session.refresh(ficha)

    return ficha


@Router_ficha.delete(
    "/{ficha_id}"
)
def eliminar_ficha(
    ficha_id: int,
    session: Session = Depends(get_session)
):
    ficha = session.get(
        Fichas,
        ficha_id
    )

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    session.delete(ficha)
    session.commit()

    return {
        "mensaje": f"Ficha {ficha_id} eliminada con éxito"
    }