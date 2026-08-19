from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
from database import get_session
from models.model import Carrera, Jornada, Fichas, Jornada

class FichaCreateRequest(BaseModel):
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date
    Jor_Fic: Jornada


class FichaUpdateRequest(BaseModel):
    Id_Car: int | None = None
    Num_Fic: int | None = None
    Fec_inicio_Fic: date | None = None
    Fec_Fin_Fic: date | None = None
    Jor_Fic: Jornada | None = None

class CarreraMiniResponse(BaseModel):
    Id_Car: int
    Nom_Car: str


class FichaResponse(BaseModel):
    Id_Fic: int
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date
    Jor_Fic: Jornada


class FichaConCarreraResponse(FichaResponse):
    carrera: CarreraMiniResponse


class FichasListResponse(BaseModel):
    Mensaje: str
    Fichas: List["FichaResponse"]

# --- Request ---
class CarreraCreateRequest(BaseModel):
    Nom_Car: str
    Des_Car: str | None = None


# --- Response ---
class FichaResponse(BaseModel):
    Id_Fic: int
    Num_Fic: int
    Jor_Fic: Jornada


class CarreraResponse(BaseModel):
    Id_Car: int
    Nom_Car: str


class CarreraConFichasResponse(CarreraResponse):
    fichas: List[FichaResponse] = []

Router_ficha = APIRouter(prefix="/fichas", tags=["Fichas SENAattendance"])


@Router_ficha.post("/", status_code=status.HTTP_201_CREATED)
def create_carrera(data: CarreraCreateRequest, session: Session = Depends(get_session)):
    nueva_carrera = Carrera(Nom_Car=data.Nom_Car, Des_Car=data.Des_Car)
    session.add(nueva_carrera)
    session.commit()
    session.refresh(nueva_carrera)
    return {"mensaje": "Carrera creada correctamente"}


@Router_ficha.get("/", response_model=List[CarreraConFichasResponse])
def obtener_carreras(session: Session = Depends(get_session)):
    return session.exec(select(Carrera)).all()


@Router_ficha.get("/{carrera_id}", response_model=CarreraConFichasResponse)
def obtener_carrera(carrera_id: int, session: Session = Depends(get_session)):
    carrera = session.get(Carrera, carrera_id)
    if not carrera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrera no encontrada")
    return carrera

@Router_ficha.post("/", status_code=status.HTTP_201_CREATED)
def create_ficha(data: FichaCreateRequest, session: Session = Depends(get_session)):
    ficha = Fichas(**data.model_dump())
    session.add(ficha)
    session.commit()
    session.refresh(ficha)
    return {"mensaje": "Ficha creada correctamente"}


@Router_ficha.get("/")
def obtener_fichas(session: Session = Depends(get_session)):
    fichas = session.exec(select(Fichas)).all()
    return {
        "Mensaje": "Lista de Fichas",
        "Fichas": fichas
    }


@Router_ficha.get("/{ficha_id}", response_model=FichaConCarreraResponse)
def obtener_ficha(ficha_id: int, session: Session = Depends(get_session)):
    ficha = session.get(Fichas, ficha_id)
    if not ficha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha no encontrada")
    return ficha


@Router_ficha.put("/{ficha_id}")
def update_ficha(ficha_id: int, datos_nuevos: FichaUpdateRequest, session: Session = Depends(get_session)):
    db_ficha = session.get(Fichas, ficha_id)
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    ficha_dict = datos_nuevos.model_dump(exclude_unset=True)
    for key, value in ficha_dict.items():
        setattr(db_ficha, key, value)

    session.add(db_ficha)
    session.commit()
    session.refresh(db_ficha)
    return {"Mensaje": f"Ficha {ficha_id} actualizada con exito"}


@Router_ficha.delete("/{ficha_id}")
def delete_ficha(ficha_id: int, session: Session = Depends(get_session)):
    db_ficha = session.get(Fichas, ficha_id)
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    session.delete(db_ficha)
    session.commit()
    return {"Mensaje": f"Ficha {ficha_id} eliminada con exito"}