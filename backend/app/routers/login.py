from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from pydantic import BaseModel
from security import crear_token, verificar_contraseña


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
    firstName: str


Router_login = APIRouter(prefix="/users", tags=["Inicio sesion"])


@Router_login.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, session: Session = Depends(get_session)):

    aprendiz = session.exec(
        select(Aprendiz).where(
            Aprendiz.Tip_ide_Apr == data.typeid,
            Aprendiz.Num_ide_Apr == data.id,
        )
    ).first()

    if aprendiz and verificar_contraseña(data.password, aprendiz.Con_Apr):
        if aprendiz.Es_Apr:
            token = crear_token({"sub": str(aprendiz.Id_Apr), "role": "Aprendiz"})
            return LoginResponse(
                firstName = aprendiz.Nom_Apr,
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

    if instructor and verificar_contraseña(data.password, instructor.Con_Ins):
        if instructor.Es_Ins:
            token = crear_token({"sub": str(instructor.Id_Ins), "role": "Instructor"})
            return LoginResponse(
                firstName = instructor.Nom_Ins,
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

    if administrador and verificar_contraseña(data.password, administrador.Con_Adm):
        if administrador.Es_Adm:
            token = crear_token({"sub": str(administrador.Id_Adm), "role": "Coordinador"})
            return LoginResponse(
                firstName = administrador.Nom_Adm,
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