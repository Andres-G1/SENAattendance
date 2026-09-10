from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from database import get_session
from models.model import Aprendiz, Instructor, Administrador
from security import hash_contraseña, verificar_contraseña

Router_configuracion = APIRouter(prefix="/users", tags=["Configuración"])


class PerfilActualizar(BaseModel):
	nombre: Optional[str] = None
	apellido: Optional[str] = None
	correo: Optional[str] = None


class ContraseñaActualizar(BaseModel):
	role: str
	user_id: int
	contraseña_actual: str
	contraseña_nueva: str


def obtener_usuario(role: str, user_id: int, session: Session):
	modelos = {
		"aprendiz": Aprendiz,
		"instructor": Instructor,
		"coordinador": Administrador,
		"administrador": Administrador,
	}
	modelo = modelos.get(role.lower())
	if modelo is None:
		raise HTTPException(status_code=400, detail="Rol inválido")

	usuario = session.get(modelo, user_id)
	if usuario is None:
		raise HTTPException(status_code=404, detail="Usuario no encontrado")
	return modelo, usuario


@Router_configuracion.put("/{role}/{user_id}/perfil")
def actualizar_perfil(
	role: str,
	user_id: int,
	datos: PerfilActualizar,
	session: Session = Depends(get_session),
):
	modelo, usuario = obtener_usuario(role, user_id, session)

	if datos.nombre is not None:
		if modelo is Aprendiz:
			usuario.Nom_Apr = datos.nombre
		elif modelo is Instructor:
			usuario.Nom_Ins = datos.nombre
		else:
			usuario.Nom_Adm = datos.nombre
	if datos.apellido is not None:
		if modelo is Aprendiz:
			usuario.Ape_Apr = datos.apellido
		elif modelo is Instructor:
			usuario.Ape_Ins = datos.apellido
		else:
			usuario.Ape_Adm = datos.apellido
	if datos.correo is not None:
		if modelo is Aprendiz:
			usuario.Cor_Apr = datos.correo
		elif modelo is Instructor:
			usuario.Cor_Ins = datos.correo
		else:
			usuario.Cor_Adm = datos.correo

	usuario.Fec_Mod = datetime.utcnow()
	session.add(usuario)
	session.commit()
	session.refresh(usuario)
	return {"usuario": usuario}


@Router_configuracion.put("/cambiar-contrasena")
def cambiar_contrasena(
	datos: ContraseñaActualizar,
	session: Session = Depends(get_session),
):
	modelo, usuario = obtener_usuario(datos.role, datos.user_id, session)
	campo = "Con_Apr" if modelo is Aprendiz else "Con_Ins" if modelo is Instructor else "Con_Adm"
	contraseña_actual = getattr(usuario, campo)

	if not verificar_contraseña(datos.contraseña_actual, contraseña_actual):
		raise HTTPException(status_code=401, detail="La contraseña actual no es correcta")

	setattr(usuario, campo, hash_contraseña(datos.contraseña_nueva))
	usuario.Fec_Mod = datetime.utcnow()
	session.add(usuario)
	session.commit()
	return {"detail": "Contraseña actualizada correctamente"}
