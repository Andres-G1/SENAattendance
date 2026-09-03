from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

try:
    from app.database import get_session
    from app.models.model import Carrera, Fichas, Jornada
except ImportError:
    from database import get_session
    from models.model import Carrera, Fichas, Jornada

Router_ficha = APIRouter(prefix="/users/fichas", tags=["Fichas"])


class FichaRequest(BaseModel):
    id_carrera: int
    numero: int
    fecha_inicio: date
    fecha_fin: date
    jornada: Jornada


def _publica(ficha: Fichas):
    return {"id": ficha.Id_Fic, "id_carrera": ficha.Id_Car, "numero": ficha.Num_Fic,
            "fecha_inicio": ficha.Fec_inicio_Fic, "fecha_fin": ficha.Fec_Fin_Fic,
            "jornada": ficha.Jor_Fic}


@Router_ficha.get("")
async def listar_fichas(id_carrera: Optional[int] = None, session: Session = Depends(get_session)):
    consulta = select(Fichas)
    if id_carrera is not None:
        consulta = consulta.where(Fichas.Id_Car == id_carrera)
    return [_publica(ficha) for ficha in session.exec(consulta).all()]


@Router_ficha.post("")
async def crear_ficha(data: FichaRequest, session: Session = Depends(get_session)):
    if not session.get(Carrera, data.id_carrera):
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    if session.exec(select(Fichas).where(Fichas.Num_Fic == data.numero)).first():
        raise HTTPException(status_code=409, detail="El número de ficha ya existe")
    if data.fecha_fin < data.fecha_inicio:
        raise HTTPException(status_code=400, detail="La fecha final debe ser posterior a la inicial")
    ficha = Fichas(Id_Car=data.id_carrera, Num_Fic=data.numero,
                   Fec_inicio_Fic=data.fecha_inicio, Fec_Fin_Fic=data.fecha_fin,
                   Jor_Fic=data.jornada)
    session.add(ficha)
    session.commit()
    session.refresh(ficha)
    return _publica(ficha)


@Router_ficha.put("/{ficha_id}")
async def actualizar_ficha(ficha_id: int, data: FichaRequest, session: Session = Depends(get_session)):
    ficha = session.get(Fichas, ficha_id)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    if not session.get(Carrera, data.id_carrera):
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    ficha.Id_Car = data.id_carrera
    ficha.Num_Fic = data.numero
    ficha.Fec_inicio_Fic = data.fecha_inicio
    ficha.Fec_Fin_Fic = data.fecha_fin
    ficha.Jor_Fic = data.jornada
    session.add(ficha)
    session.commit()
    session.refresh(ficha)
    return _publica(ficha)


@Router_ficha.delete("/{ficha_id}")
async def eliminar_ficha(ficha_id: int, session: Session = Depends(get_session)):
    ficha = session.get(Fichas, ficha_id)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    session.delete(ficha)
    session.commit()
    return {"detail": "Ficha eliminada correctamente"}
