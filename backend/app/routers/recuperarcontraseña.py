import os
import secrets
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from database import get_session
from models.model import Aprendiz, Instructor, Administrador

# Importamos tu función corregida
from security import hash_contraseña 

router_recovery = APIRouter(
    prefix="/users",
    tags=["Recuperar contraseña"]
)

class RecuperarPasswordRequest(BaseModel):
    email: EmailStr


def generar_password_temporal(longitud=10) -> str:
    caracteres = string.ascii_letters + string.digits
    return "".join(secrets.choice(caracteres) for _ in range(longitud))


def enviar_correo(email_destino: str, nueva_password: str, nombre_usuario: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    mensaje = MIMEMultipart()
    mensaje["From"] = smtp_user
    mensaje["To"] = email_destino
    mensaje["Subject"] = "Recuperación de contraseña - SENA Attendance"

    cuerpo = f"""
Hola {nombre_usuario},

Se ha solicitado la recuperación de tu contraseña de SENA Attendance.

Tu nueva contraseña temporal es:

{nueva_password}

Te recomendamos cambiarla inmediatamente después de iniciar sesión desde tu perfil.

Si no solicitaste este cambio, por favor ponte en contacto con el administrador.

Saludos,
Equipo de SENA Attendance
"""
    mensaje.attach(MIMEText(cuerpo, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port) as servidor:
        servidor.starttls()
        servidor.login(smtp_user, smtp_password)
        servidor.send_message(mensaje)


@router_recovery.post("/password")
async def recuperar_password(data: RecuperarPasswordRequest, session: Session = Depends(get_session)):
    usuario = None
    nombre_usuario = None
    campo_password = ""
    email_destino = data.email

    # 1. BUSCAR EN APRENDIZ
    aprendiz = session.exec(
        select(Aprendiz).where(Aprendiz.Cor_Apr == data.email)
    ).first()

    if aprendiz:
        if not aprendiz.Es_Apr:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta inactiva")
        usuario = aprendiz
        nombre_usuario = aprendiz.Nom_Apr
        campo_password = "Con_Apr"

    # 2. BUSCAR EN INSTRUCTOR
    if not usuario:
        instructor = session.exec(
            select(Instructor).where(Instructor.Cor_Ins == data.email)
        ).first()
        
        if instructor:
            if not instructor.Es_Ins:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta inactiva")
            usuario = instructor
            nombre_usuario = instructor.Nom_Ins
            campo_password = "Con_Ins"

    # 3. BUSCAR EN ADMINISTRADOR
    if not usuario:
        administrador = session.exec(
            select(Administrador).where(Administrador.Cor_Adm == data.email)
        ).first()
        
        if administrador:
            if not administrador.Es_Adm:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta inactiva")
            usuario = administrador
            nombre_usuario = administrador.Nom_Adm
            campo_password = "Con_Adm"

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El correo electrónico no se encuentra registrado en el sistema."
        )

    # 4. GENERAR NUEVA CONTRASEÑA Y APLICAR HASH
    nueva_password = generar_password_temporal()
    password_hasheada = hash_contraseña(nueva_password) 

    # Asignación explícita para que el ORM detecte el cambio de inmediato
    if campo_password == "Con_Apr":
        usuario.Con_Apr = password_hasheada
    elif campo_password == "Con_Ins":
        usuario.Con_Ins = password_hasheada
    elif campo_password == "Con_Adm":
        usuario.Con_Adm = password_hasheada

    # Añadimos el usuario modificado a la sesión antes de procesar el servicio de correo
    session.add(usuario)

    # 5. ENVIAR EL CORREO ELECTRÓNICO
    try:
        enviar_correo(email_destino, nueva_password, nombre_usuario)
    except Exception as e:
        session.rollback()  # Si el correo falla, cancelamos los cambios en la BD
        print("Error enviando correo:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible enviar el correo de recuperación. Intente más tarde."
        )

    # 6. GUARDAR CAMBIOS EN LA BASE DE DATOS
    session.commit()
    session.refresh(usuario)

    return {
        "message": "Se ha enviado una nueva contraseña temporal al correo registrado."
    }
