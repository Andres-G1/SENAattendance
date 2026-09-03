from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

try:
	from app.database import get_session
	from app.models.model import Carrera
except ImportError:
	from database import get_session
	from models.model import Carrera

Router_carrera = APIRouter(prefix="/users/carreras", tags=["Carreras"])


class CarreraRequest(BaseModel):
	nombre: str
	descripcion: Optional[str] = None


def _publica(carrera: Carrera):
	return {"id": carrera.Id_Car, "nombre": carrera.Nom_Car, "descripcion": carrera.Des_Car}


@Router_carrera.get("")
async def listar_carreras(session: Session = Depends(get_session)):
	return [_publica(carrera) for carrera in session.exec(select(Carrera)).all()]


@Router_carrera.post("")
async def crear_carrera(data: CarreraRequest, session: Session = Depends(get_session)):
	if session.exec(select(Carrera).where(Carrera.Nom_Car == data.nombre)).first():
		raise HTTPException(status_code=409, detail="La carrera ya existe")
	carrera = Carrera(Nom_Car=data.nombre, Des_Car=data.descripcion)
	session.add(carrera)
	session.commit()
	session.refresh(carrera)
	return _publica(carrera)


@Router_carrera.put("/{carrera_id}")
async def actualizar_carrera(carrera_id: int, data: CarreraRequest, session: Session = Depends(get_session)):
	carrera = session.get(Carrera, carrera_id)
	if not carrera:
		raise HTTPException(status_code=404, detail="Carrera no encontrada")
	carrera.Nom_Car = data.nombre
	carrera.Des_Car = data.descripcion
	session.add(carrera)
	session.commit()
	session.refresh(carrera)
	return _publica(carrera)


@Router_carrera.delete("/{carrera_id}")
async def eliminar_carrera(carrera_id: int, session: Session = Depends(get_session)):
	carrera = session.get(Carrera, carrera_id)
	if not carrera:
		raise HTTPException(status_code=404, detail="Carrera no encontrada")
	session.delete(carrera)
	session.commit()
	return {"detail": "Carrera eliminada correctamente"}
