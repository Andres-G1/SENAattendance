from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session

from models.model import (
    Asistencia,
    Aprendiz,
    Fichas,
    FichaInstructor,
    Competencia,
    EstadoAsistencia,
    DiaSemana,
)

from .asistencia_calculo import calcular_estado
from .asistencia_notificaciones import evaluar_y_notificar


Router_asistencia = APIRouter(
    prefix="/asistencia",
    tags=["Asistencia"]
)


# =========================================================
# SCHEMAS
# =========================================================

class RegistrarAsistenciaRequest(BaseModel):
    Fec_Asi: date
    Es_Asi: EstadoAsistencia

    Id_Apr: int

    Id_Fic: int
    Id_Ins: int
    Id_Comp: int
    Dia: DiaSemana


# =========================================================
# VALIDACIONES REUTILIZABLES
# =========================================================

_DIA_POR_WEEKDAY = {
    0: DiaSemana.lunes,
    1: DiaSemana.martes,
    2: DiaSemana.miercoles,
    3: DiaSemana.jueves,
    4: DiaSemana.viernes,
    5: DiaSemana.sabado,
}


def _verificar_ficha(session: Session, id_fic: int) -> Fichas:

    ficha = session.get(Fichas, id_fic)

    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    return ficha


def _verificar_aprendiz(session: Session, id_apr: int) -> Aprendiz:

    aprendiz = session.get(Aprendiz, id_apr)

    if not aprendiz:
        raise HTTPException(status_code=404, detail="Aprendiz no encontrado")

    return aprendiz


def _verificar_pertenencia(aprendiz: Aprendiz, id_fic: int):

    if aprendiz.Id_Fic != id_fic:
        raise HTTPException(
            status_code=400,
            detail="El aprendiz no pertenece a esta ficha"
        )


def _verificar_periodo_ficha(ficha: Fichas, fecha: date):

    if fecha < ficha.Fec_inicio_Fic:
        raise HTTPException(
            status_code=400,
            detail="La fecha es anterior al inicio de la ficha"
        )

    if fecha > ficha.Fec_Fin_Fic:
        raise HTTPException(
            status_code=400,
            detail="La fecha es posterior al fin de la ficha"
        )


def _verificar_periodo_competencia(asignacion: FichaInstructor, fecha: date):

    if not (asignacion.Fec_Inicio_Comp <= fecha <= asignacion.Fec_Fin_Comp):
        raise HTTPException(
            status_code=400,
            detail="La fecha está fuera del período de esta competencia"
        )


def _verificar_dia_coincide(fecha: date, dia: DiaSemana):

    esperado = _DIA_POR_WEEKDAY.get(fecha.weekday())

    if esperado is None:
        raise HTTPException(
            status_code=400,
            detail="No se registra asistencia los domingos"
        )

    if esperado != dia:
        raise HTTPException(
            status_code=400,
            detail=f"La fecha {fecha} es {esperado.value}, no {dia.value}"
        )


# =========================================================
# OBTENER APRENDICES DE UNA FICHA
# =========================================================

@Router_asistencia.get("/ficha/{Id_Fic}/aprendices")
def obtener_aprendices(
    Id_Fic: int,
    session: Session = Depends(get_session)
):

    _verificar_ficha(session, Id_Fic)

    aprendices = session.exec(
        select(Aprendiz)
        .where(Aprendiz.Id_Fic == Id_Fic)
        .order_by(Aprendiz.Ape_Apr, Aprendiz.Nom_Apr)
    ).all()

    return [
        {
            "Id_Apr": aprendiz.Id_Apr,
            "Nom_Apr": aprendiz.Nom_Apr,
            "Ape_Apr": aprendiz.Ape_Apr,
            "Num_ide_Apr": aprendiz.Num_ide_Apr
        }
        for aprendiz in aprendices
    ]


# =========================================================
# OBTENER ASIGNACIONES DEL INSTRUCTOR
# =========================================================

@Router_asistencia.get("/instructor/{Id_Ins}/asignaciones")
def obtener_asignaciones_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session)
):

    relaciones = session.exec(
        select(FichaInstructor)
        .where(FichaInstructor.Id_Ins == Id_Ins)
    ).all()

    resultado = []

    for relacion in relaciones:

        ficha = session.get(Fichas, relacion.Id_Fic)
        competencia = session.get(Competencia, relacion.Id_Comp)

        if not ficha:
            continue

        resultado.append({
            "Id_Fic": relacion.Id_Fic,
            "Id_Ins": relacion.Id_Ins,
            "Id_Comp": relacion.Id_Comp,
            "Dia": relacion.Dia.value if relacion.Dia else None,
            "Num_Fic": ficha.Num_Fic,
            "Jor_Fic": ficha.Jor_Fic.value if ficha.Jor_Fic else None,
            "Fec_inicio_Fic": ficha.Fec_inicio_Fic,
            "Fec_Fin_Fic": ficha.Fec_Fin_Fic,
            "Competencia": competencia.Nom_Comp if competencia else None,
        })

    return resultado


# =========================================================
# OBTENER ASISTENCIA DE UNA CLASE
# =========================================================

@Router_asistencia.get("/clase/{Id_Fic}/{Id_Ins}/{Id_Comp}/{Dia}/{Fec_Asi}")
def obtener_asistencia_clase(
    Id_Fic: int,
    Id_Ins: int,
    Id_Comp: int,
    Dia: DiaSemana,
    Fec_Asi: date,
    session: Session = Depends(get_session)
):

    asignacion = session.get(
        FichaInstructor, (Id_Fic, Id_Ins, Id_Comp, Dia)
    )

    if not asignacion:
        raise HTTPException(
            status_code=404,
            detail="La asignación de esta clase no existe"
        )

    ficha = _verificar_ficha(session, Id_Fic)
    _verificar_periodo_ficha(ficha, Fec_Asi)

    aprendices = session.exec(
        select(Aprendiz)
        .where(Aprendiz.Id_Fic == Id_Fic)
        .order_by(Aprendiz.Ape_Apr, Aprendiz.Nom_Apr)
    ).all()

    asistencias = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Fec_Asi == Fec_Asi,
            Asistencia.Id_Fic == Id_Fic,
            Asistencia.Id_Ins == Id_Ins,
            Asistencia.Id_Comp == Id_Comp,
            Asistencia.Dia == Dia
        )
    ).all()

    asistencias_map = {a.Id_Apr: a for a in asistencias}

    resultado = []

    for aprendiz in aprendices:

        asistencia = asistencias_map.get(aprendiz.Id_Apr)

        resultado.append({
            "Id_Apr": aprendiz.Id_Apr,
            "Nom_Apr": aprendiz.Nom_Apr,
            "Ape_Apr": aprendiz.Ape_Apr,
            "Num_ide_Apr": aprendiz.Num_ide_Apr,
            "Id_Asi": asistencia.Id_Asi if asistencia else None,
            "Es_Asi": asistencia.Es_Asi.value if asistencia else None,
        })

    return resultado


# =========================================================
# OBTENER ESTADO / SEMÁFORO DE UN APRENDIZ
# =========================================================

@Router_asistencia.get("/aprendiz/{Id_Apr}/estado")
def obtener_estado_aprendiz(
    Id_Apr: int,
    session: Session = Depends(get_session)
):

    aprendiz = _verificar_aprendiz(session, Id_Apr)

    if not aprendiz.Id_Fic:
        raise HTTPException(
            status_code=400,
            detail="El aprendiz no pertenece a ninguna ficha"
        )

    return calcular_estado(session, Id_Apr, aprendiz.Id_Fic)


# =========================================================
# LISTAR FALLAS / NOVEDADES DE UN APRENDIZ
# =========================================================

@Router_asistencia.get("/aprendiz/{Id_Apr}/novedades")
def obtener_novedades_aprendiz(
    Id_Apr: int,
    session: Session = Depends(get_session)
):
    # Verificar que el aprendiz exista
    aprendiz = _verificar_aprendiz(session, Id_Apr)

    # Verificar que el aprendiz pertenezca a una ficha
    if not aprendiz.Id_Fic:
        raise HTTPException(
            status_code=400,
            detail="El aprendiz no pertenece a ninguna ficha"
        )

    # Verificar que la ficha exista
    ficha = _verificar_ficha(session, aprendiz.Id_Fic)

    # Obtener únicamente fallas, excusas y retardos
    registros = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Id_Apr == Id_Apr,
            Asistencia.Id_Fic == aprendiz.Id_Fic,
            Asistencia.Es_Asi.in_([
                EstadoAsistencia.falla,
                EstadoAsistencia.excusa,
                EstadoAsistencia.retardo,
            ]),
        )
        .order_by(Asistencia.Fec_Asi.desc())
    ).all()

    resultado = []

    for registro in registros:

        # Buscar la competencia asociada
        competencia = session.get(
            Competencia,
            registro.Id_Comp
        )

        resultado.append({
            "Id_Asi": registro.Id_Asi,
            "Fec_Asi": registro.Fec_Asi,
            "Es_Asi": registro.Es_Asi.value,
            "Num_Fic": ficha.Num_Fic,
            "Competencia": (
                competencia.Nom_Comp
                if competencia
                else None
            ),
        })

    return resultado

# =========================================================
# REGISTRAR / ACTUALIZAR ASISTENCIA
# =========================================================

@Router_asistencia.post("", status_code=status.HTTP_201_CREATED)
def registrar_asistencia(
    data: RegistrarAsistenciaRequest,
    background: BackgroundTasks,
    session: Session = Depends(get_session)
):

    ficha = _verificar_ficha(session, data.Id_Fic)
    aprendiz = _verificar_aprendiz(session, data.Id_Apr)

    _verificar_pertenencia(aprendiz, data.Id_Fic)
    _verificar_dia_coincide(data.Fec_Asi, data.Dia)
    _verificar_periodo_ficha(ficha, data.Fec_Asi)

    asignacion = session.get(
        FichaInstructor,
        (data.Id_Fic, data.Id_Ins, data.Id_Comp, data.Dia)
    )

    if not asignacion:
        raise HTTPException(
            status_code=404,
            detail="La asignación de esta competencia no existe"
        )

    _verificar_periodo_competencia(asignacion, data.Fec_Asi)

    asistencia = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Fec_Asi == data.Fec_Asi,
            Asistencia.Id_Apr == data.Id_Apr,
            Asistencia.Id_Fic == data.Id_Fic,
            Asistencia.Id_Ins == data.Id_Ins,
            Asistencia.Id_Comp == data.Id_Comp,
            Asistencia.Dia == data.Dia
        )
    ).first()

    mensaje = "Asistencia actualizada correctamente"

    if asistencia:
        asistencia.Es_Asi = data.Es_Asi
    else:
        asistencia = Asistencia(**data.model_dump())
        mensaje = "Asistencia registrada correctamente"

    session.add(asistencia)
    session.commit()
    session.refresh(asistencia)

    estado = calcular_estado(session, data.Id_Apr, data.Id_Fic)
    evaluar_y_notificar(session, background, aprendiz, ficha, estado)

    return {
        "mensaje": mensaje,
        "asistencia": asistencia,
        "estado": estado,
    }
    

@Router_asistencia.get("/instructor/{Id_Ins}/alertas")
def obtener_alertas_instructor(
    Id_Ins: int,
    session: Session = Depends(get_session)
):

    fichas_ids = session.exec(
        select(FichaInstructor.Id_Fic)
        .where(FichaInstructor.Id_Ins == Id_Ins)
        .distinct()
    ).all()

    total_alertas = 0
    ya_contados = set()

    for id_fic in fichas_ids:

        aprendices = session.exec(
            select(Aprendiz).where(Aprendiz.Id_Fic == id_fic)
        ).all()

        for aprendiz in aprendices:

            if aprendiz.Id_Apr in ya_contados:
                continue

            estado = calcular_estado(session, aprendiz.Id_Apr, id_fic)

            if estado["deserta_por_racha"] or estado["deserta_por_acumulado"]:
                total_alertas += 1

            ya_contados.add(aprendiz.Id_Apr)

    return {"total_alertas": total_alertas}