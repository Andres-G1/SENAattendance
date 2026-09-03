from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from database import get_session
from models.model import Fichas, Aprendiz, FichaInstructor  # Ajusta si el nombre del modelo varía

Router_asignaciones = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones SENAattendance"]
)

class AsignarInstructorRequest(BaseModel):
    Id_Fic: int
    Id_Ins: int

class AsignarAprendizRequest(BaseModel):
    Id_Fic: int
    Id_Apr: int

@Router_asignaciones.post("/instructor", status_code=status.HTTP_201_CREATED)
def asignar_instructor(
    data: AsignarInstructorRequest,
    session: Session = Depends(get_session)
):
    ficha = session.get(Fichas, data.Id_Fic)
    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    nueva_relacion = FichaInstructor(
        Id_Fic=data.Id_Fic,
        Id_Ins=data.Id_Ins
    )
    session.add(nueva_relacion)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta ficha ya está asignada a ese instructor"
        )

    return {"mensaje": "Instructor asignado a la ficha exitosamente"}

@Router_asignaciones.post("/aprendiz", status_code=status.HTTP_200_OK)
def asignar_aprendiz(
    data: AsignarAprendizRequest,
    session: Session = Depends(get_session)
):
    aprendiz = session.get(Aprendiz, data.Id_Apr)
    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )

    aprendiz.Id_Fic = data.Id_Fic
    session.add(aprendiz)
    session.commit()

    return {"mensaje": "Aprendiz asignado a la ficha exitosamente"}


@Router_asignaciones.get("/instructor/{Id_Ins}/fichas")
def obtener_fichas_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session)
):
    relaciones = session.exec(
        select(FichaInstructor).where(FichaInstructor.Id_Ins == Id_Ins)
    ).all()

    if not relaciones:
        return []

    fichas = []
    for rel in relaciones:
        ficha = session.get(Fichas, rel.Id_Fic)
        if ficha:
            fichas.append(ficha)

    return fichas