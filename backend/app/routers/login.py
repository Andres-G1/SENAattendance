from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from pydantic import BaseModel
from security import create_access_token
from security import check_password_hash

class LoginRequest(BaseModel):
    typeid: TipoIdentificacion
    id: int
    password: str
 
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    redirect: str
    
login = APIRouter(prefix="/users", tags=["Inicio sesion"])

@login.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, session: Session = Depends(get_session)):
        
    aprendiz = session.exec(
        select(Aprendiz).where(
            Aprendiz.Tip_ide_Apr == data.typeid,
            Aprendiz.Num_ide_Apr == data.id,
        )
    ).first()
    
    if aprendiz and check_password_hash(aprendiz.Con_Apr, data.password):
        
        if aprendiz.Es_Apr == True:
            token = create_access_token({"sub": str(aprendiz.Id_Apr), "role": "Aprendiz"})
            return LoginResponse(
                access_token=token,
                role="Aprendiz",
                user_id=aprendiz.Id_Apr,
                redirect="/aprendiz",
            )
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta inactiva",
        )   
    
    instructor = session.exec(
        select(Instructor).where(
            Instructor.Tip_ide_Ins == data.typeid,
            Instructor.Num_ide_Ins == data.id,
        )
    ).first()
    
    if aprendiz and check_password_hash(instructor.Con_Ins, data.password):

        if instructor.Es_Ins == True:
            token = create_access_token({"sub": str(instructor.Id_Ins), "role": "Instructor"})
            return LoginResponse(
                access_token=token,
                role="Instructor",
                user_id=instructor.Id_Ins,
                redirect="/instructor",
            )
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta inactiva",
        )   
    
    administrador = session.exec(
        select(Administrador).where(
            Administrador.Tip_ide_Adm == data.typeid,
            Administrador.Num_ide_Adm == data.id,
        )
    ).first()
    
    if aprendiz and check_password_hash(administrador.Con_Adm, data.password):
        
        if administrador.Es_Adm == True:
            token = create_access_token({"sub": str(administrador.Id_Adm), "role": "Coordinador"})
            return LoginResponse(
                access_token=token,
                role="Coordinador",
                user_id=administrador.Id_Adm,
                redirect="/administrador",
            )
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta inactiva",
        )   
        
    raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciales inválidas",
    )   
    