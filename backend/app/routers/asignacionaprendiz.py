from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from sqlalchemy.exc import IntegrityError

from database import get_session
from models.model import Aprendiz, Fichas


Router_asignacionesAprendiz = APIRouter(
    prefix="/users",
    tags=["Asignaciones"]
)


class AsignarAprendizRequest(BaseModel):
    Id_Apr: int
    Id_Fic: int


@Router_asignacionesAprendiz.post(
    "/aprendiz",
    status_code=status.HTTP_200_OK
)
def asignar_aprendiz(
    data: AsignarAprendizRequest,
    session: Session = Depends(get_session)
):
    # ==========================================
    # 1. Buscar aprendiz
    # ==========================================
    aprendiz = session.get(Aprendiz, data.Id_Apr)

    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )

    # ==========================================
    # 2. Buscar ficha
    # ==========================================
    ficha = session.get(Fichas, data.Id_Fic)

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    # ==========================================
    # 3. Verificar si ya pertenece a una ficha
    # ==========================================
    if aprendiz.Id_Fic is not None:
        if aprendiz.Id_Fic == data.Id_Fic:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El aprendiz ya está asignado a esta ficha"
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El aprendiz ya está asignado a la ficha {aprendiz.Id_Fic}"
        )

    # ==========================================
    # 4. Asignar ficha
    # ==========================================
    aprendiz.Id_Fic = data.Id_Fic
    aprendiz.Fec_Mod = datetime.utcnow()

    try:
        session.add(aprendiz)
        session.commit()
        session.refresh(aprendiz)

    except IntegrityError:
        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fue posible asignar el aprendiz a la ficha"
        )

    # ==========================================
    # 5. Respuesta
    # ==========================================
    return {
        "mensaje": "Aprendiz asignado a la ficha exitosamente",
        "Id_Apr": aprendiz.Id_Apr,
        "Nombre": f"{aprendiz.Nom_Apr} {aprendiz.Ape_Apr}",
        "Id_Fic": aprendiz.Id_Fic,
        "Num_Fic": ficha.Num_Fic
    }
