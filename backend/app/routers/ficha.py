from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
import io
import pandas as pd
from fastapi import UploadFile, File

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


@Router_ficha.post(
    "/upload",
    status_code=status.HTTP_201_CREATED
)
async def cargar_fichas_planas(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser .csv, .xlsx o .xls"
        )

    contenido = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(contenido)) if file.filename.endswith(".csv") \
            else pd.read_excel(io.BytesIO(contenido))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo leer el archivo"
        )

    requeridas = {"Id_Car", "Num_Fic", "Fec_inicio_Fic", "Fec_Fin_Fic", "Jor_Fic"}
    if not requeridas.issubset(df.columns):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Faltan columnas. Se requieren: {sorted(requeridas)}"
        )

    creadas, errores = 0, []
    for i, fila in df.iterrows():
        try:
            nueva = Fichas(
                Id_Car=int(fila["Id_Car"]),
                Num_Fic=int(fila["Num_Fic"]),
                Fec_inicio_Fic=pd.to_datetime(fila["Fec_inicio_Fic"]).date(),
                Fec_Fin_Fic=pd.to_datetime(fila["Fec_Fin_Fic"]).date(),
                Jor_Fic=Jornada(fila["Jor_Fic"])
            )
            session.add(nueva)
            session.commit()
            creadas += 1
        except Exception as e:
            session.rollback()
            errores.append({"fila": i + 2, "error": str(e)})

    return {"mensaje": f"{creadas} ficha(s) cargada(s)", "creadas": creadas, "errores": errores}


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