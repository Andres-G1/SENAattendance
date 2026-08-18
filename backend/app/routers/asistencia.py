from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models.model import Asistencia, FichaInstructor, Aprendiz

Router_asistencia = APIRouter(prefix="/users", tags=["Asistencia"])

@Router_asistencia.post("/Asistencia")
async def login(session: Session = Depends(get_session)):
    return ("hello")