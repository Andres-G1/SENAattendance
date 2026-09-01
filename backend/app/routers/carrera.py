from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from typing import List
from models.model import Carrera
from pydantic import BaseModel

Router_carrera = APIRouter(
    prefix="/carreras",
    tags=["Carreras SENAattendance"]
)


class CarreraCreateRequest(BaseModel):
    Nom_Car: str
    Des_Car: str


class CarreraUpdateRequest(BaseModel):
    Nom_Car: str
    Des_Car: str

@Router_carrera.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_carrera(
    data: CarreraCreateRequest,
    session: Session = Depends(get_session)
):
    nueva_carrera = Carrera(
        Nom_Car=data.Nom_Car,
        Des_Car=data.Des_Car
    )

    session.add(nueva_carrera)
    session.commit()
    session.refresh(nueva_carrera)

    return {
        "mensaje": "Carrera creada correctamente",
        "carrera": nueva_carrera
    }


@Router_carrera.get(
    "/",
    response_model=List[Carrera]
)
def obtener_carreras(
    session: Session = Depends(get_session)
):
    carreras = session.exec(
        select(Carrera)
    ).all()

    return carreras

@Router_carrera.get(
    "/{carrera_id}",
    response_model=Carrera
)
def obtener_carrera(
    carrera_id: int,
    session: Session = Depends(get_session)
):
    carrera = session.get(
        Carrera,
        carrera_id
    )

    if not carrera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carrera no encontrada"
        )

    return carrera

@Router_carrera.put(
    "/{carrera_id}",
    response_model=Carrera
)
def actualizar_carrera(
    carrera_id: int,
    data: CarreraUpdateRequest,
    session: Session = Depends(get_session)
):
    carrera = session.get(
        Carrera,
        carrera_id
    )

    if not carrera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carrera no encontrada"
        )

    carrera.Nom_Car = data.Nom_Car
    carrera.Des_Car = data.Des_Car

    session.add(carrera)
    session.commit()
    session.refresh(carrera)

    return carrera


@Router_carrera.delete(
    "/{carrera_id}"
)
def eliminar_carrera(
    carrera_id: int,
    session: Session = Depends(get_session)
):
    carrera = session.get(
        Carrera,
        carrera_id
    )

    if not carrera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carrera no encontrada"
        )

    session.delete(carrera)
    session.commit()

    return {
        "mensaje": f"Carrera {carrera_id} eliminada con éxito"
    }