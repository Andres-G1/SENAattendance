from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session


from database import get_session
from security import verificar_token
from models.model import (
    Aprendiz,
    Instructor,
    Administrador
)




security = HTTPBearer()




def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    token = credentials.credentials


    try:
        datos = verificar_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


    user_id = datos.get("sub")
    role = datos.get("role")


    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


    user_id = int(user_id)


    # -----------------------------
    # APRENDIZ
    # -----------------------------
    if role == "Aprendiz":


        usuario = session.get(Aprendiz, user_id)


        if not usuario or not usuario.Es_Apr:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta inactiva o inexistente"
            )


        return usuario, role


    # -----------------------------
    # INSTRUCTOR
    # -----------------------------
    if role == "Instructor":


        usuario = session.get(Instructor, user_id)


        if not usuario or not usuario.Es_Ins:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta inactiva o inexistente"
            )


        return usuario, role


    # -----------------------------
    # ADMINISTRADOR
    # -----------------------------
    if role == "Coordinador":


        usuario = session.get(Administrador, user_id)


        if not usuario or not usuario.Es_Adm:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta inactiva o inexistente"
            )


        return usuario, role


    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Rol no válido"
    )




def verificar_administrador(
    usuario_actual=Depends(obtener_usuario_actual)
):
    usuario, role = usuario_actual


    if role != "Coordinador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden realizar esta acción"
        )


    return usuario

