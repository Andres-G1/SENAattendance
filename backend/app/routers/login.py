from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from database import get_session
from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
from typing import Literal, Optional
from pydantic import BaseModel
from security import crear_token, verificar_contraseña

# Importamos la misma instancia del limiter global
from limiter import limiter


class LoginRequest(BaseModel):
    typeid: TipoIdentificacion
    id: int
    password: str
    # Rol con el que la persona quiere ingresar. Si no se envía, se
    # conserva el comportamiento anterior (busca en los tres roles).
    rol: Optional[Literal["Aprendiz", "Instructor", "Coordinador"]] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    redirect: str
    firstName: str


Router_login = APIRouter(prefix="/users", tags=["Inicio sesion"])


# Configuración de cada rol: tabla, campos y panel al que se redirige
ROLES = {
    "Aprendiz": {
        "modelo": Aprendiz, "tipo": "Tip_ide_Apr", "numero": "Num_ide_Apr",
        "clave": "Con_Apr", "estado": "Es_Apr", "id": "Id_Apr",
        "nombre": "Nom_Apr", "redirect": "/aprendiz",
    },
    "Instructor": {
        "modelo": Instructor, "tipo": "Tip_ide_Ins", "numero": "Num_ide_Ins",
        "clave": "Con_Ins", "estado": "Es_Ins", "id": "Id_Ins",
        "nombre": "Nom_Ins", "redirect": "/instructor",
    },
    "Coordinador": {
        "modelo": Administrador, "tipo": "Tip_ide_Adm", "numero": "Num_ide_Adm",
        "clave": "Con_Adm", "estado": "Es_Adm", "id": "Id_Adm",
        "nombre": "Nom_Adm", "redirect": "/administrador",
    },
}


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

    # Si la persona eligió un rol, solo se busca en esa tabla.
    # Si no, se revisa en el orden de siempre: Aprendiz, Instructor, Coordinador.
    roles_a_revisar = [data.rol] if data.rol else list(ROLES)

    for rol in roles_a_revisar:
        cfg = ROLES[rol]
        modelo = cfg["modelo"]

        usuario = session.exec(
            select(modelo).where(
                getattr(modelo, cfg["tipo"]) == data.typeid,
                getattr(modelo, cfg["numero"]) == data.id,
            )
        ).first()

        if not usuario:
            continue

        # Contraseña incorrecta o cuenta inactiva: mismo mensaje genérico
        # para no revelar si la cuenta existe o está desactivada.
        if not verificar_contraseña(data.password, getattr(usuario, cfg["clave"])):
            raise error_credenciales
        if not getattr(usuario, cfg["estado"]):
            raise error_credenciales

        user_id = getattr(usuario, cfg["id"])
        token = crear_token({"sub": str(user_id), "role": rol})
        return LoginResponse(
            firstName=getattr(usuario, cfg["nombre"]),
            access_token=token,
            role=rol,
            user_id=user_id,
            redirect=cfg["redirect"],
        )

    # Si no se encontró en ninguna tabla, lanzamos exactamente el mismo error
    raise error_credenciales
