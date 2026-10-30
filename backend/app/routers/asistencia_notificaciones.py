import os
import smtplib
import time  # <-- Añadido para el control de tiempo
from datetime import date, datetime
from email.mime.text import MIMEText
from fastapi import BackgroundTasks
from sqlmodel import Session, select

# Importaciones basadas en tus modelos expuestos
from models.model import (
    Notificacion,
    Aprendiz,
    Fichas,
    Administrador,
    Asistencia,
    EstadoAsistencia,
    TipoNotificacion,
)

# Configuración del servidor de correo desde variables de entorno
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def enviar_correo(destinatario: str, asunto: str, cuerpo: str):
    """Envía un correo con un retraso prudente para evitar bloqueos por ráfaga en Gmail."""
    if not SMTP_HOST or not destinatario:
        return
    try:
        # CAMBIO CLAVE: Esperamos 2 segundos antes de conectar. 
        # Como corre en BackgroundTasks, el usuario no sentirá lentitud en la app.
        time.sleep(2) 
        
        mensaje = MIMEText(cuerpo)
        mensaje["Subject"] = asunto
        mensaje["From"] = SMTP_USER
        mensaje["To"] = destinatario
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, [destinatario], mensaje.as_string())
    except Exception as e:
        print(f"Error crítico en pasarela SMTP hacia {destinatario}: {e}")


def _ultima_notificacion_hoy(
    session: Session, 
    id_apr: int, 
    id_fic: int, 
    tipo: TipoNotificacion
) -> bool:
    """Verifica de forma estricta si ya se generó una alerta idéntica HOY."""
    hoy = date.today()
    alerta_hoy = session.exec(
        select(Notificacion)
        .where(
            Notificacion.Id_Apr == id_apr,
            Notificacion.Id_Fic == id_fic,
            Notificacion.Tip_Not == tipo,
            Notificacion.Fec_Not == hoy, 
        )
    ).first()
    return alerta_hoy is not None


def evaluar_y_notificar(
    session: Session,
    background: BackgroundTasks,
    aprendiz: Aprendiz,
    ficha: Fichas,
    estado: dict,
):
    """
    Evalúa el estado del aprendiz y dispara alertas incluyendo las fechas de las fallas.
    """
    # =========================================================================
    # 1. ALERTA POR RACHA SEGUIDA (Exactamente 3 Fallas Consecutivas)
    # =========================================================================
    if estado["racha_dias"] == 3:
        tipo = TipoNotificacion.desercion
        
        if not _ultima_notificacion_hoy(session, aprendiz.Id_Apr, ficha.Id_Fic, tipo):
            registros_racha = session.exec(
                select(Asistencia.Fec_Asi)
                .where(
                    Asistencia.Id_Apr == aprendiz.Id_Apr,
                    Asistencia.Id_Fic == ficha.Id_Fic,
                    Asistencia.Es_Asi == EstadoAsistencia.falla
                )
                .order_by(Asistencia.Fec_Asi.desc())
                .limit(3)
            ).all()
            
            fechas_texto = ", ".join([str(fec) for fec in sorted(registros_racha)])
            
            asunto = "Alerta: posible deserción por inasistencia consecutiva"
            cuerpo = (
                f"El aprendiz {aprendiz.Nom_Apr} {aprendiz.Ape_Apr} "
                f"(documento {aprendiz.Num_ide_Apr}, ficha {ficha.Num_Fic}) "
                f"lleva exactamente {estado['racha_dias']} días seguidos sin asistir (Fallas).\n\n"
                f"Fechas de las fallas consecutivas: {fechas_texto}."
            )
            
            session.add(Notificacion(
                Asu_Not=asunto, Men_Not=cuerpo, Fec_Not=date.today(),
                Id_Apr=aprendiz.Id_Apr, Id_Fic=ficha.Id_Fic, Tip_Not=tipo,
            ))
            session.commit()
            background.add_task(enviar_correo, aprendiz.Cor_Apr, asunto, cuerpo)

    # =========================================================================
    # 2. ALERTA POR ACUMULADO INTERCALADO (Exactamente 5 Fallas Totales Activas)
    # =========================================================================
    if estado["acumulado"] == 5:
        tipo = TipoNotificacion.advertencia
        
        if not _ultima_notificacion_hoy(session, aprendiz.Id_Apr, ficha.Id_Fic, tipo):
            registros_acumulado = session.exec(
                select(Asistencia.Fec_Asi)
                .where(
                    Asistencia.Id_Apr == aprendiz.Id_Apr,
                    Asistencia.Id_Fic == ficha.Id_Fic,
                    Asistencia.Es_Asi == EstadoAsistencia.falla
                )
                .order_by(Asistencia.Fec_Asi.asc())
            ).all()
            
            fechas_texto = ", ".join([str(fec) for fec in registros_acumulado])
            
            asunto = "Alerta: posible deserción por fallas acumuladas"
            cuerpo = (
                f"El aprendiz {aprendiz.Nom_Apr} {aprendiz.Ape_Apr} "
                f"(documento {aprendiz.Num_ide_Apr}, ficha {ficha.Num_Fic}) "
                f"presenta un acumulado actual de {estado['acumulado']} fallas en el semestre.\n\n"
                f"Fechas de las fallas registradas: {fechas_texto}."
            )
            
            session.add(Notificacion(
                Asu_Not=asunto, Men_Not=cuerpo, Fec_Not=date.today(),
                Id_Apr=aprendiz.Id_Apr, Id_Fic=ficha.Id_Fic, Tip_Not=tipo,
            ))
            session.commit()
            background.add_task(enviar_correo, aprendiz.Cor_Apr, asunto, cuerpo)


def notificar_lista_no_llamada(
    session: Session,
    background: BackgroundTasks,
    ficha: Fichas,
    id_ins: int,
    id_ra: int,
    dia,
    fecha: date,
):
    """Notifica individualmente a los coordinadores espaciando los correos."""
    coordinadores = session.exec(
        select(Administrador).where(Administrador.Es_Adm == True)
    ).all()

    asunto = f"Instructor no registró asistencia — Ficha {ficha.Num_Fic}"
    cuerpo = (
        f"El instructor (id {id_ins}) no registró asistencia para el "
        f"resultado de aprendizaje (id {id_ra}) de la ficha {ficha.Num_Fic} "
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
    session.commit()

    # Al usar la función con delay, FastAPI los enviará uno por uno dejando respirar al SMTP
    for coordinador in coordinadores:
        background.add_task(enviar_correo, coordinador.Cor_Adm, asunto, cuerpo)
