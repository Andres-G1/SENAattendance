from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr

try:
    from app.database import get_session
    from app.models.model import Aprendiz, Instructor, Administrador
    from app.security import hash_contraseña, verificar_contraseña
except ImportError:
    from database import get_session
    from models.model import Aprendiz, Instructor, Administrador
    from security import hash_contraseña, verificar_contraseña

Router_configuracion = APIRouter(prefix="/users", tags=["Configuración"])



# Helper: obtener modelo según el rol

def obtener_modelo(role: str):
    modelos = {
        "aprendiz": Aprendiz,
        "instructor": Instructor,
        "coordinador": Administrador,
    }
    modelo = modelos.get(role.lower())
    if not modelo:
        raise HTTPException(status_code=400, detail="Rol inválido")
    return modelo


def obtener_campo_pk(modelo):
    return list(modelo.__table__.primary_key.columns)[0].name



# Cambiar contraseña

class CambiarContraseñaRequest(BaseModel):
    contraseña_actual: str
    contraseña_nueva: str


class CambiarContraseñaDirectaRequest(BaseModel):
    role: str
    user_id: int
    contraseña_actual: str
    contraseña_nueva: str


def _procesar_cambio_contraseña(
    role: str,
    user_id: int,
    data: CambiarContraseñaRequest,
    session: Session,
):
    modelo = obtener_modelo(role)
    usuario = session.get(modelo, user_id)

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    campo_contraseña = f"Con_{modelo.__name__[:3]}"
    contraseña_actual_hash = getattr(usuario, campo_contraseña)

    if not verificar_contraseña(data.contraseña_actual, contraseña_actual_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    setattr(usuario, campo_contraseña, hash_contraseña(data.contraseña_nueva))
    session.add(usuario)
    session.commit()

    return {"detail": "Contraseña actualizada correctamente"}


@Router_configuracion.put("/{role}/{user_id}/contraseña", include_in_schema=False)
async def cambiar_contraseña(
    role: str,
    user_id: int,
    data: CambiarContraseñaRequest,
    session: Session = Depends(get_session),
):
    return _procesar_cambio_contraseña(role, user_id, data, session)


@Router_configuracion.put("/cambiar-contrasena")
async def cambiar_contraseña_directa(
    data: CambiarContraseñaDirectaRequest,
    session: Session = Depends(get_session),
):
    payload = CambiarContraseñaRequest(
        contraseña_actual=data.contraseña_actual,
        contraseña_nueva=data.contraseña_nueva,
    )
    return _procesar_cambio_contraseña(data.role, data.user_id, payload, session)



# Actualizar perfil

class ActualizarPerfilRequest(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    correo: EmailStr | None = None


class CambiarEstadoDirectoRequest(BaseModel):
    role: str
    user_id: int
    activo: bool


def _procesar_cambio_estado(
    role: str,
    user_id: int,
    activo: bool,
    session: Session,
):
    modelo = obtener_modelo(role)
    usuario = session.get(modelo, user_id)

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    prefijo = modelo.__name__[:3]
    setattr(usuario, f"Es_{prefijo}", activo)

    session.add(usuario)
    session.commit()

    return {"detail": f"Cuenta {'activada' if activo else 'desactivada'} correctamente"}


@Router_configuracion.put("/{role}/{user_id}/perfil")
async def actualizar_perfil(
    role: str,
    user_id: int,
    data: ActualizarPerfilRequest,
    session: Session = Depends(get_session),
):
    modelo = obtener_modelo(role)
    usuario = session.get(modelo, user_id)

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    prefijo = modelo.__name__[:3]

    if data.nombre is not None:
        setattr(usuario, f"Nom_{prefijo}", data.nombre)
    if data.apellido is not None:
        setattr(usuario, f"Ape_{prefijo}", data.apellido)
    if data.correo is not None:
        setattr(usuario, f"Cor_{prefijo}", data.correo)

    session.add(usuario)
    session.commit()
    session.refresh(usuario)

    return usuario



# Activar / desactivar cuenta

@Router_configuracion.patch("/{role}/{user_id}/estado", include_in_schema=False)
async def cambiar_estado_cuenta(
    role: str,
    user_id: int,
    activo: bool,
    session: Session = Depends(get_session),
):
    return _procesar_cambio_estado(role, user_id, activo, session)


@Router_configuracion.patch("/cambiar-estado")
async def cambiar_estado_cuenta_directo(
    data: CambiarEstadoDirectoRequest,
    session: Session = Depends(get_session),
):
    return _procesar_cambio_estado(data.role, data.user_id, data.activo, session)