from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Literal, Optional
from pydantic import BaseModel
import io
import pandas as pd
from fastapi import UploadFile, File

from database import get_session
from models.model import Fichas, Aprendiz


Router_ficha = APIRouter(
    prefix="/fichas",
    tags=["Fichas SENAattendance"]
)


class FichaCreateRequest(BaseModel):
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date


class FichaUpdateRequest(BaseModel):
    Id_Car: int
    Num_Fic: int
    Fec_inicio_Fic: date
    Fec_Fin_Fic: date


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
        Fec_Fin_Fic=data.Fec_Fin_Fic
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

    requeridas = {"Id_Car", "Num_Fic", "Fec_inicio_Fic", "Fec_Fin_Fic"}
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
                Fec_Fin_Fic=pd.to_datetime(fila["Fec_Fin_Fic"]).date()
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
    estado: Optional[Literal["activas", "desactivadas", "todas"]] = "todas",
    session: Session = Depends(get_session)
):
    consulta = select(Fichas)

    if estado == "activas":
        consulta = consulta.where(Fichas.Es_Fic == True)  # noqa: E712
    elif estado == "desactivadas":
        consulta = consulta.where(Fichas.Es_Fic == False)  # noqa: E712

    fichas = session.exec(
        consulta.order_by(Fichas.Num_Fic)
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

    session.add(ficha)
    session.commit()
    session.refresh(ficha)

    return ficha


# =========================================================
# DESACTIVAR / ACTIVAR FICHA
# =========================================================
# Una ficha desactivada conserva todo su historial (asistencias,
# asignaciones y aprendices), pero ya no permite tomar asistencia,
# asignar instructores o aprendices, ni genera avisos de lista no llamada.

def _cambiar_estado_ficha(
    session: Session,
    ficha_id: int,
    activa: bool,
    incluir_aprendices: bool,
):
    ficha = session.get(Fichas, ficha_id)

    if not ficha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ficha no encontrada"
        )

    if ficha.Es_Fic == activa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "La ficha ya está activa"
                if activa
                else "La ficha ya está desactivada"
            )
        )

    ficha.Es_Fic = activa
    ficha.Fec_Mod = datetime.utcnow()
    session.add(ficha)

    aprendices_afectados = 0

    if incluir_aprendices:
        aprendices = session.exec(
            select(Aprendiz).where(Aprendiz.Id_Fic == ficha_id)
        ).all()

        for aprendiz in aprendices:
            if aprendiz.Es_Apr != activa:
                aprendiz.Es_Apr = activa
                session.add(aprendiz)
                aprendices_afectados += 1

    session.commit()

    accion = "activada" if activa else "desactivada"
    mensaje = f"Ficha {ficha.Num_Fic} {accion} correctamente"
    if incluir_aprendices:
        mensaje += f" ({aprendices_afectados} aprendiz(es) {accion[:-1]}os)"

    return {
        "mensaje": mensaje,
        "Id_Fic": ficha.Id_Fic,
        "Es_Fic": ficha.Es_Fic,
        "aprendices_afectados": aprendices_afectados,
    }


@Router_ficha.patch("/{ficha_id}/desactivar")
def desactivar_ficha(
    ficha_id: int,
    incluir_aprendices: bool = False,
    session: Session = Depends(get_session)
):
    return _cambiar_estado_ficha(session, ficha_id, False, incluir_aprendices)


@Router_ficha.patch("/{ficha_id}/activar")
def activar_ficha(
    ficha_id: int,
    incluir_aprendices: bool = False,
    session: Session = Depends(get_session)
):
    return _cambiar_estado_ficha(session, ficha_id, True, incluir_aprendices)


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
