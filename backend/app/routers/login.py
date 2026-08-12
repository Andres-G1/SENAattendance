from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select, Session
from pydantic import BaseModel

from security import verificar_contraseña
from database import get_session
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion

login = APIRouter()

class LoginRequest(BaseModel):
    tipo_identificacion: TipoIdentificacion
    num_identificacion: int
    contraseña: str


class LoginResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    rol: str

@login.post("/inicio_sesion", response_model=LoginResponse)
async def iniciar_sesion(datos: LoginRequest, session: Session = Depends(get_session)):

    aprendiz = session.exec(
        select(Aprendiz).where(
            Aprendiz.Tip_ide_Apr == datos.tipo_identificacion,
            Aprendiz.Num_ide_Apr == datos.num_identificacion,
        )
    ).first()
    if aprendiz and verificar_contraseña(datos.contraseña, aprendiz.Con_Apr):
        if not aprendiz.Es_Apr:    
            raise HTTPException(status_code=401, detail="Cuenta inactiva")
        return LoginResponse(id=aprendiz.Id_Apr, nombre=aprendiz.Nom_Apr, apellido=aprendiz.Ape_Apr, rol="aprendiz")
        
    instructor = session.exec(
        select(Instructor).where(
            Instructor.Tip_ide_Ins == datos.tipo_identificacion,
            Instructor.Num_ide_Ins == datos.num_identificacion,
        )
    ).first()
    if instructor and verificar_contraseña(datos.contraseña, instructor.Con_Ins):
        if not instructor.Es_Ins:    
            raise HTTPException(status_code=401, detail="Cuenta inactiva")
        return LoginResponse(id=instructor.Id_Ins, nombre=instructor.Nom_Ins, apellido=instructor.Ape_Ins, rol="instructor")
    
    administrador = session.exec(
        select(Administrador).where(
            Administrador.Tip_ide_Adm == datos.tipo_identificacion,
            Administrador.Num_ide_Adm == datos.num_identificacion,
        )
    ).first()
    if administrador and verificar_contraseña(datos.contraseña, administrador.Con_Adm):
        if not administrador.Es_Adm:    
            raise HTTPException(status_code=401, detail="Cuenta inactiva")
        return LoginResponse(id=administrador.Id_Adm, nombre=administrador.Nom_Adm, apellido=administrador.Ape_Adm, rol="administrador")
    
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")