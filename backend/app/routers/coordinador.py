from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

try:
    from app.database import get_session
    from app.models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
    from app.security import hash_contraseña
except ImportError:
    from database import get_session
    from models.model import Aprendiz, Instructor, Administrador, TipoIdentificacion
    from security import hash_contraseña

Router_coordinador = APIRouter(prefix="/users/coordinador", tags=["Coordinador"])


class UsuarioRequest(BaseModel):
    nombre: str
    apellido: str
    tipo_documento: TipoIdentificacion
    numero_documento: int
    correo: EmailStr
    contraseña: str = "1234"
    activo: bool = True


def _usuario_publico(usuario, role: str):
    prefijo = {"aprendiz": "Apr", "instructor": "Ins", "coordinador": "Adm"}[role]
    return {
        "id": getattr(usuario, f"Id_{prefijo}"),
        "nombre": getattr(usuario, f"Nom_{prefijo}"),
        "apellido": getattr(usuario, f"Ape_{prefijo}"),
        "tipo_documento": getattr(usuario, f"Tip_ide_{prefijo}"),
        "numero_documento": getattr(usuario, f"Num_ide_{prefijo}"),
        "correo": getattr(usuario, f"Cor_{prefijo}"),
        "activo": getattr(usuario, f"Es_{prefijo}"),
        "rol": role,
    }


def _buscar_usuario(role: str, user_id: int, session: Session):
    modelos = {
        "aprendiz": Aprendiz,
        "instructor": Instructor,
        "coordinador": Administrador,
    }
    modelo = modelos.get(role)
    if not modelo:
        raise HTTPException(status_code=400, detail="Rol inválido")
    usuario = session.get(modelo, user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return modelo, usuario


@Router_coordinador.get("/{role}")
async def listar_usuarios(role: str, session: Session = Depends(get_session)):
    modelos = {"aprendiz": Aprendiz, "instructor": Instructor, "coordinador": Administrador}
    modelo = modelos.get(role.lower())
    if not modelo:
        raise HTTPException(status_code=400, detail="Rol inválido")
    return [_usuario_publico(usuario, role.lower()) for usuario in session.exec(select(modelo)).all()]


@Router_coordinador.post("/{role}")
async def crear_usuario(role: str, data: UsuarioRequest, session: Session = Depends(get_session)):
    role = role.lower()
    campos = {
        "aprendiz": (Aprendiz, "Apr"),
        "instructor": (Instructor, "Ins"),
        "coordinador": (Administrador, "Adm"),
    }
    modelo_info = campos.get(role)
    if not modelo_info:
        raise HTTPException(status_code=400, detail="Rol inválido")
    modelo, prefijo = modelo_info
    if session.exec(select(modelo).where(
        (getattr(modelo, f"Num_ide_{prefijo}") == data.numero_documento)
        | (getattr(modelo, f"Cor_{prefijo}") == str(data.correo))
    )).first():
        raise HTTPException(status_code=409, detail="El documento o correo ya existe")

    usuario = modelo(
        **{
            f"Nom_{prefijo}": data.nombre,
            f"Ape_{prefijo}": data.apellido,
            f"Tip_ide_{prefijo}": data.tipo_documento,
            f"Num_ide_{prefijo}": data.numero_documento,
            f"Cor_{prefijo}": str(data.correo),
            f"Con_{prefijo}": hash_contraseña(data.contraseña),
            f"Es_{prefijo}": data.activo,
        }
    )
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return _usuario_publico(usuario, role)


@Router_coordinador.put("/{role}/{user_id}")
async def actualizar_usuario(role: str, user_id: int, data: UsuarioRequest, session: Session = Depends(get_session)):
    modelo, usuario = _buscar_usuario(role.lower(), user_id, session)
    prefijo = {"aprendiz": "Apr", "instructor": "Ins", "coordinador": "Adm"}[role.lower()]
    setattr(usuario, f"Nom_{prefijo}", data.nombre)
    setattr(usuario, f"Ape_{prefijo}", data.apellido)
    setattr(usuario, f"Tip_ide_{prefijo}", data.tipo_documento)
    setattr(usuario, f"Num_ide_{prefijo}", data.numero_documento)
    setattr(usuario, f"Cor_{prefijo}", str(data.correo))
    setattr(usuario, f"Es_{prefijo}", data.activo)
    if data.contraseña != "1234":
        setattr(usuario, f"Con_{prefijo}", hash_contraseña(data.contraseña))
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return _usuario_publico(usuario, role.lower())


@Router_coordinador.delete("/{role}/{user_id}")
async def eliminar_usuario(role: str, user_id: int, session: Session = Depends(get_session)):
    _, usuario = _buscar_usuario(role.lower(), user_id, session)
    session.delete(usuario)
    session.commit()
    return {"detail": "Usuario eliminado correctamente"}
