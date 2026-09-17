from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from database import get_session
from models.model import Aprendiz, Fichas


Router_asignacionesAprendiz = APIRouter(
    prefix="/users",
    tags=["Asignaciones"]
)


# ==================================================
# MODELO PARA ASIGNAR APRENDIZ
# ==================================================
class AsignarAprendizRequest(BaseModel):
    Id_Apr: int
    Id_Fic: int


# ==================================================
# GET - CARGAR DATOS PARA LOS SELECTORES
# ==================================================
@Router_asignacionesAprendiz.get(
    "/aprendiz/datos-carga"
)
def obtener_datos_carga(
    session: Session = Depends(get_session)
):
    """
    Retorna todos los aprendices y todas las fichas
    necesarias para llenar los selectores del frontend.
    """

    aprendices = session.exec(
        select(Aprendiz)
    ).all()

    fichas = session.exec(
        select(Fichas)
    ).all()

    return {
        "aprendices": [
            {
                "Id_Apr": apr.Id_Apr,
                "Nom_Apr": apr.Nom_Apr,
                "Ape_Apr": apr.Ape_Apr,
                "Num_ide_Apr": apr.Num_ide_Apr,
                "Cor_Apr": apr.Cor_Apr,
                "Id_Fic": apr.Id_Fic,
            }
            for apr in aprendices
        ],

        "fichas": [
            {
                "Id_Fic": fic.Id_Fic,
                "Num_Fic": fic.Num_Fic,
                "Jor_Fic": fic.Jor_Fic,
                "Fec_inicio_Fic": fic.Fec_inicio_Fic,
                "Fec_Fin_Fic": fic.Fec_Fin_Fic,
            }
            for fic in fichas
        ],
    }


# ==================================================
# POST - ASIGNAR APRENDIZ A FICHA
# ==================================================
@Router_asignacionesAprendiz.post(
    "/aprendiz",
    status_code=status.HTTP_200_OK
)
def asignar_aprendiz(
    data: AsignarAprendizRequest,
    session: Session = Depends(get_session)
):
    # ----------------------------------------------
    # 1. BUSCAR APRENDIZ
    # ----------------------------------------------
    aprendiz = session.get(
        Aprendiz,
        data.Id_Apr
    )

    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )

    # ----------------------------------------------
    # 2. BUSCAR FICHA
    # ----------------------------------------------
    ficha = session.get(
        Fichas,
        data.Id_Fic
    )

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    # ----------------------------------------------
    # 3. VERIFICAR SI YA TIENE FICHA
    # ----------------------------------------------
    if aprendiz.Id_Fic is not None:

        if aprendiz.Id_Fic == data.Id_Fic:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "El aprendiz ya está asignado "
                    "a esta ficha"
                )
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "El aprendiz ya está asignado "
                f"a la ficha con ID {aprendiz.Id_Fic}"
            )
        )

    # ----------------------------------------------
    # 4. ASIGNAR FICHA
    # ----------------------------------------------
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
            detail=(
                "No fue posible asignar "
                "el aprendiz a la ficha"
            )
        )

    # ----------------------------------------------
    # 5. RESPUESTA
    # ----------------------------------------------
    return {
        "mensaje": (
            "Aprendiz asignado a la ficha "
            "exitosamente"
        ),
        "Id_Apr": aprendiz.Id_Apr,
        "Nombre": (
            f"{aprendiz.Nom_Apr} "
            f"{aprendiz.Ape_Apr}"
        ),
        "Id_Fic": aprendiz.Id_Fic,
        "Num_Fic": ficha.Num_Fic,
    }
