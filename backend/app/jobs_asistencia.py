from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import select

from database import get_session
from models.model import FichaInstructor, Fichas, Asistencia, DiaSemana
from routers.asistencia_notificaciones import notificar_lista_no_llamada

_DIA_POR_WEEKDAY = {
    0: DiaSemana.lunes, 1: DiaSemana.martes, 2: DiaSemana.miercoles,
    3: DiaSemana.jueves, 4: DiaSemana.viernes, 5: DiaSemana.sabado,
}


def revisar_listas_no_llamadas():

    hoy = date.today()
    dia_hoy = _DIA_POR_WEEKDAY.get(hoy.weekday())

    if dia_hoy is None:
        return  # domingo, no hay clases

    session_gen = get_session()
    session = next(session_gen)

    try:

        asignaciones = session.exec(
            select(FichaInstructor).where(FichaInstructor.Dia == dia_hoy)
        ).all()

        for asignacion in asignaciones:

            ficha = session.get(Fichas, asignacion.Id_Fic)

            if not ficha:
                continue

            if not (ficha.Fec_inicio_Fic <= hoy <= ficha.Fec_Fin_Fic):
                continue

            if not (asignacion.Fec_Inicio_Comp <= hoy <= asignacion.Fec_Fin_Comp):
                continue

            hubo_registro = session.exec(
                select(Asistencia).where(
                    Asistencia.Fec_Asi == hoy,
                    Asistencia.Id_Fic == asignacion.Id_Fic,
                    Asistencia.Id_Ins == asignacion.Id_Ins,
                    Asistencia.Id_Comp == asignacion.Id_Comp,
                    Asistencia.Dia == dia_hoy,
                )
            ).first()

            if not hubo_registro:
                notificar_lista_no_llamada(
                    session, ficha,
                    asignacion.Id_Ins, asignacion.Id_Comp, dia_hoy, hoy
                )

    finally:
        session_gen.close()


scheduler = BackgroundScheduler()
scheduler.add_job(revisar_listas_no_llamadas, "cron", hour=22, minute=0)