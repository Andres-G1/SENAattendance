import os
import smtplib
from datetime import date
from email.mime.text import MIMEText

from fastapi import BackgroundTasks
from sqlmodel import Session, select

from models.model import (
    Notificacion,
    Aprendiz,
    Fichas,
    Administrador,
    TipoNotificacion,
)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def enviar_correo(destinatario: str, asunto: str, cuerpo: str):

    if not SMTP_HOST or not destinatario:
        return

    mensaje = MIMEText(cuerpo)
    mensaje["Subject"] = asunto
    mensaje["From"] = SMTP_USER
    mensaje["To"] = destinatario

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls()
        servidor.login(SMTP_USER, SMTP_PASSWORD)
        servidor.sendmail(SMTP_USER, [destinatario], mensaje.as_string())


def _ya_notificado(
    session: Session,
    id_apr: int,
    id_fic: int,
    tipo: TipoNotificacion,
) -> bool:

    existente = session.exec(
        select(Notificacion).where(
            Notificacion.Id_Apr == id_apr,
            Notificacion.Id_Fic == id_fic,
            Notificacion.Tip_Not == tipo,
        )
    ).first()

    return existente is not None


def evaluar_y_notificar(
    session: Session,
    background: BackgroundTasks,
    aprendiz: Aprendiz,
    ficha: Fichas,
    estado: dict,
):

    if estado["deserta_por_racha"]:
        tipo = TipoNotificacion.desercion
        asunto = "Alerta: posible deserción por inasistencia consecutiva"
    elif estado["deserta_por_acumulado"]:
        tipo = TipoNotificacion.advertencia
        asunto = "Alerta: posible deserción por fallas acumuladas"
    else:
        return

    if _ya_notificado(session, aprendiz.Id_Apr, ficha.Id_Fic, tipo):
        return

    cuerpo = (
        f"El aprendiz {aprendiz.Nom_Apr} {aprendiz.Ape_Apr} "
        f"(documento {aprendiz.Num_ide_Apr}, ficha {ficha.Num_Fic}) "
        f"presenta {estado['acumulado']} fallas acumuladas "
        f"(brutas: {estado['fallas_brutas']}, excusas: {estado['excusas']}) "
        f"y una racha de {estado['racha_dias']} días seguidos sin asistir."
    )

    session.add(Notificacion(
        Asu_Not=asunto,
        Men_Not=cuerpo,
        Fec_Not=date.today(),
        Id_Apr=aprendiz.Id_Apr,
        Id_Fic=ficha.Id_Fic,
        Tip_Not=tipo,
    ))
    session.commit()

    background.add_task(enviar_correo, aprendiz.Cor_Apr, asunto, cuerpo)


def notificar_lista_no_llamada(
    session: Session,
    ficha: Fichas,
    id_ins: int,
    id_comp: int,
    dia,
    fecha: date,
):
    """Se llama desde el job programado (sin BackgroundTasks, corre fuera de un request)."""

    coordinadores = session.exec(
        select(Administrador).where(Administrador.Es_Adm == True)
    ).all()

    asunto = f"Instructor no registró asistencia — Ficha {ficha.Num_Fic}"

    cuerpo = (
        f"El instructor (id {id_ins}) no registró asistencia para la "
        f"competencia {id_comp} de la ficha {ficha.Num_Fic} "
        f"el día {dia.value} ({fecha})."
    )

    for coordinador in coordinadores:

        session.add(Notificacion(
            Asu_Not=asunto,
            Men_Not=cuerpo,
            Fec_Not=fecha,
            Id_Adm=coordinador.Id_Adm,
            Id_Fic=ficha.Id_Fic,
            Tip_Not=TipoNotificacion.sin_lista,
        ))

        enviar_correo(coordinador.Cor_Adm, asunto, cuerpo)

    session.commit()