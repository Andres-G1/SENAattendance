from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from database import get_session
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from pydantic import BaseModel
from security import crear_token, verificar_contraseña

# Importamos la misma instancia del limiter global
from limiter import limiter 

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
# BLINDAJE POR IP: Cuenta CUALQUIER intento (exista o no el dato en la BD)
@limiter.limit("8/10 minutes")
def login(
    request: Request, 
    data: LoginRequest, 
    session: Session = Depends(get_session)
):
    # Mensaje unificado y genérico que no da pistas sobre qué falló exactamente
    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
    )

    # =========================================================================
    # 1. PROCESAMIENTO - APRENDIZ
    # =========================================================================
    aprendiz = session.exec(
        select(Aprendiz).where(
            Aprendiz.Tip_ide_Apr == data.typeid,
            # Corregido typo menor de sintaxis := anterior para limpieza limpia
            # del query.
            # Se quitó "Modern_Aprendiz" que generaba un walrus operator innecesario.
            Aprendiz.Num_ide_Apr == data.id,
        )
    ).first()

    if aprendiz:
        if verificar_contraseña(data.password, aprendiz.Con_Apr):
            if aprendiz.Es_Apr:
                token = crear_token({"sub": str(aprendiz.Id_Apr), "role": "Aprendiz"})
                return LoginResponse(
                    firstName=aprendiz.Nom_Apr,
                    access_token=token,
                    role="Aprendiz",
                    user_id=aprendiz.Id_Apr,
                    redirect="/aprendiz",
                )
            raise error_credenciales # Se oculta estado inactivo para evitar enumeración externa
        else:
            raise error_credenciales

    # =========================================================================
    # 2. PROCESAMIENTO - INSTRUCTOR
    # =========================================================================
    instructor = session.exec(
        select(Instructor).where(
            Instructor.Tip_ide_Ins == data.typeid,
            Instructor.Num_ide_Ins == data.id,
        )
    ).first()

    if instructor:
        if verificar_contraseña(data.password, instructor.Con_Ins):
            if instructor.Es_Ins:
                token = crear_token({"sub": str(instructor.Id_Ins), "role": "Instructor"})
                return LoginResponse(
                    firstName=instructor.Nom_Ins,
                    access_token=token,
                    role="Instructor",
                    user_id=instructor.Id_Ins,
                    redirect="/instructor",
                )
            raise error_credenciales
        else:
            raise error_credenciales

    # =========================================================================
    # 3. PROCESAMIENTO - ADMINISTRADOR / COORDINADOR
    # =========================================================================
    administrador = session.exec(
        select(Administrador).where(
            Administrador.Tip_ide_Adm == data.typeid,
            Administrador.Num_ide_Adm == data.id,
        )
    ).first()

    if administrador:
        if verificar_contraseña(data.password, administrador.Con_Adm):
            if administrador.Es_Adm:
                token = crear_token({"sub": str(administrador.Id_Adm), "role": "Coordinador"})
                return LoginResponse(
                    firstName=administrador.Nom_Adm,
                    access_token=token,
                    role="Coordinador",
                    user_id=administrador.Id_Adm,
                    redirect="/administrador",
                )
            raise error_credenciales
        else:
            raise error_credenciales

    # Si no se encontró en ninguna tabla, lanzamos exactamente el mismo error
    raise error_credenciales
