from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Field, Session, select 
from database import get_session
from typing import List, Optional 
from models.model import Competencia 
from pydantic import BaseModel

Router_competencia = APIRouter(
    prefix="/competencias",
    tags=["Competencias SENAattendance"]
)


class CompetenciaCreateRequest(BaseModel):
    Id_Comp: Optional[int] = Field(default=None, primary_key=True)
    Nom_Comp: str = Field(..., max_length=150)
    Des_Comp: str

class CompetenciaUpdateRequest(BaseModel):
    Nom_Comp: str
    Des_Comp: str

@Router_competencia.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_competencia(
    data: CompetenciaCreateRequest,
    session: Session = Depends(get_session)
):
    nueva_competencia = Competencia(
        Nom_Comp=data.Nom_Comp,
        Des_Comp=data.Des_Comp
    )

    session.add(nueva_competencia)
    session.commit()
    session.refresh(nueva_competencia)

    return {
        "mensaje": "Competencia creada correctamente",
        "competencia": nueva_competencia
    }

@Router_competencia.get(
    "/",
    response_model=List[Competencia]
)
def obtener_competencias(
    session: Session = Depends(get_session)
):
    competencias = session.exec(
        select(Competencia)
    ).all()

    return competencias

@Router_competencia.put(
    "/{competencia_id}",
    response_model=Competencia
)
def actualizar_competencia(
    competencia_id: int,
    data: CompetenciaUpdateRequest,
    session: Session = Depends(get_session)
):
    competencia = session.get(Competencia, competencia_id)

    if not competencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia no encontrada"
        )

    competencia.Nom_Comp = data.Nom_Comp
    competencia.Des_Comp = data.Des_Comp

    session.add(competencia)
    session.commit()
    session.refresh(competencia)

    return competencia

@Router_competencia.delete(
    "/{competencia_id}",    
status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_competencia(
    competencia_id: int,
    session: Session = Depends(get_session)
):
    competencia = session.get(Competencia, competencia_id)

    if not competencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia no encontrada"
        )

    session.delete(competencia)
    session.commit()

    return {
        "mensaje": "Competencia eliminada correctamente"
    }