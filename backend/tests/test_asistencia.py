"""Pruebas de asignaciones, registro de asistencia, alertas, PDF y tareas programadas."""
from datetime import date, timedelta

import pytest
from fastapi import BackgroundTasks
from sqlmodel import select

import jobs_asistencia
import seed
from conftest import LUNES
from models.model import (
    Administrador,
    Aprendiz,
    Asistencia,
    DiaSemana,
    EstadoAsistencia,
    FichaInstructor,
    Fichas,
    Instructor,
    Notificacion,
    ResultadoAprendizaje,
    TipoNotificacion,
)
from routers import asistencia_notificaciones as notif
from routers.asistencia_calculo import calcular_estado


def _registrar(client, datos, fecha=LUNES, estado="Presente", dia="Lunes", **cambios):
    cuerpo = {
        "Fec_Asi": str(fecha), "Es_Asi": estado,
        "Id_Apr": datos["aprendiz"].Id_Apr, "Id_Fic": datos["ficha"].Id_Fic,
        "Id_Ins": datos["instructor"].Id_Ins, "Id_RA": datos["ra"].Id_RA, "Dia": dia,
    }
    cuerpo.update(cambios)
    return client.post("/asistencia", json=cuerpo)


def _lunes(n):
    """n-ésimo lunes a partir de LUNES (0, 1, 2...)."""
    return LUNES + timedelta(weeks=n)


# ----------------------------------------------------------------------
# Asignar instructor a ficha
# ----------------------------------------------------------------------
def _asignar(client, datos, asignaciones, inicio="2026-02-02", fin="2026-06-30", **cambios):
    cuerpo = {
        "Id_Fic": datos["ficha"].Id_Fic, "Id_Ins": datos["instructor"].Id_Ins,
        "Asignaciones": asignaciones, "Fec_Inicio_RA": inicio, "Fec_Fin_RA": fin,
    }
    cuerpo.update(cambios)
    return client.post("/asignaciones/instructor", json=cuerpo)


def _nuevo_ra(session, datos, nombre="RA extra"):
    ra = ResultadoAprendizaje(Nom_RA=nombre, Id_Comp=datos["competencia"].Id_Comp)
    session.add(ra)
    session.commit()
    return ra.Id_RA


def test_asignar_instructor(client, session, datos):
    id_ra = _nuevo_ra(session, datos)
    r = _asignar(client, datos, [{"Id_RA": id_ra, "Dia": "Martes"}])
    assert r.status_code == 201
    assert r.json()["asignaciones"] == [{"Id_RA": id_ra, "Dia": "Martes"}]


@pytest.mark.parametrize("cambios, asignaciones, codigo", [
    ({"Id_Fic": 99}, [{"Id_RA": 1, "Dia": "Martes"}], 404),
    ({"Id_Ins": 99}, [{"Id_RA": 1, "Dia": "Martes"}], 404),
    ({}, [], 400),
    ({}, [{"Id_RA": 99, "Dia": "Martes"}], 404),
    ({"Fec_Inicio_RA": "2026-07-01", "Fec_Fin_RA": "2026-06-01"}, None, 400),
    ({"Fec_Inicio_RA": "2025-12-01"}, None, 400),
    ({"Fec_Fin_RA": "2027-12-01"}, None, 400),
    ({}, [{"Id_RA": 1, "Dia": "Martes"}], 409),  # RA 1 ya asignado
])
def test_asignar_instructor_errores(client, session, datos, cambios, asignaciones, codigo):
    if asignaciones is None:
        asignaciones = [{"Id_RA": _nuevo_ra(session, datos), "Dia": "Martes"}]
    r = _asignar(client, datos, asignaciones, **cambios)
    assert r.status_code == codigo


def test_asignar_instructor_limite_por_dia(client, session, datos):
    nuevos = [{"Id_RA": _nuevo_ra(session, datos, f"RA {i}"), "Dia": "Lunes"} for i in range(3)]
    r = _asignar(client, datos, nuevos)
    assert r.status_code == 400
    assert "cupos disponibles: 2" in r.json()["detail"]


def test_asignar_instructor_error_integridad(client, session, datos, monkeypatch):
    from sqlalchemy.exc import IntegrityError
    from sqlmodel import Session
    id_ra = _nuevo_ra(session, datos)

    def commit_roto(self):
        raise IntegrityError("stmt", {}, Exception("dup"))

    monkeypatch.setattr(Session, "commit", commit_roto)
    assert _asignar(client, datos, [{"Id_RA": id_ra, "Dia": "Martes"}]).status_code == 409


def test_fichas_del_instructor(client, session, datos):
    # Una asignación con RA borrado debe ignorarse
    session.add(FichaInstructor(
        Id_Fic=datos["ficha"].Id_Fic, Id_Ins=1, Id_RA=99, Dia=DiaSemana.martes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 3, 2),
    ))
    session.commit()
    r = client.get("/asignaciones/instructor/1/fichas")
    assert len(r.json()) == 1
    assert r.json()[0]["Competencia"] == "Programación"
    assert client.get("/asignaciones/instructor/99/fichas").status_code == 404


def test_asignaciones_de_ficha(client, session, datos):
    session.add(FichaInstructor(
        Id_Fic=datos["ficha"].Id_Fic, Id_Ins=1, Id_RA=99, Dia=DiaSemana.martes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 3, 2),
    ))
    session.commit()
    r = client.get(f"/asignaciones/instructor/1/ficha/{datos['ficha'].Id_Fic}")
    assert len(r.json()) == 1


def test_asignaciones_de_ficha_errores(client, session, datos):
    id_fic = datos["ficha"].Id_Fic
    assert client.get("/asignaciones/instructor/1/ficha/99").status_code == 404
    assert client.get(f"/asignaciones/instructor/99/ficha/{id_fic}").status_code == 404
    session.add(Instructor(
        Nom_Ins="Sin", Ape_Ins="Clases", Tip_ide_Ins="CC", Num_ide_Ins=2002,
        Cor_Ins="sin@sena.edu.co", Con_Ins="x",
    ))
    session.commit()
    assert client.get(f"/asignaciones/instructor/2/ficha/{id_fic}").status_code == 404


# ----------------------------------------------------------------------
# Registro de asistencia
# ----------------------------------------------------------------------
def test_registrar_y_actualizar_asistencia(client, datos):
    r = _registrar(client, datos)
    assert r.status_code == 201
    assert r.json()["mensaje"] == "Asistencia registrada correctamente"

    r = _registrar(client, datos, estado="Excusa")
    assert r.json()["mensaje"] == "Asistencia actualizada correctamente"
    assert r.json()["estado"]["excusas"] == 1


@pytest.mark.parametrize("kwargs, codigo, texto", [
    ({"Id_Fic": 99}, 404, "Ficha no encontrada"),
    ({"Id_Apr": 99}, 404, "Aprendiz no encontrado"),
    ({"fecha": LUNES - timedelta(days=1), "dia": "Lunes"}, 400, "domingos"),
    ({"dia": "Martes"}, 400, "es Lunes"),
    ({"fecha": date(2026, 12, 21)}, 400, "posterior al fin"),
    ({"fecha": date(2025, 12, 29)}, 400, "anterior al inicio"),
    ({"Id_RA": 99}, 404, "no existe"),
    ({"fecha": date(2026, 1, 12)}, 400, "fuera del período"),
])
def test_registrar_asistencia_validaciones(client, datos, kwargs, codigo, texto):
    r = _registrar(client, datos, **kwargs)
    assert r.status_code == codigo
    assert texto in r.json()["detail"]


def test_registrar_asistencia_aprendiz_de_otra_ficha(client, session, datos):
    session.add(Fichas(Id_Car=1, Num_Fic=1, Fec_inicio_Fic=date(2026, 1, 1),
                       Fec_Fin_Fic=date(2026, 12, 31)))
    session.commit()
    r = _registrar(client, datos, Id_Fic=2)
    assert r.status_code == 400
    assert "no pertenece" in r.json()["detail"]


def test_alertas_por_racha_y_acumulado(client, session, datos, correo_falso):
    for semana in range(5):
        r = _registrar(client, datos, fecha=_lunes(semana), estado="Falla")
        assert r.status_code == 201

    tipos = {n.Tip_Not for n in session.exec(select(Notificacion)).all()}
    assert tipos == {TipoNotificacion.desercion, TipoNotificacion.advertencia}
    assert correo_falso.enviados.count("aprendiz@sena.edu.co") == 2

    # Repetir la misma falla hoy no debe duplicar la alerta
    _registrar(client, datos, fecha=_lunes(4), estado="Falla")
    assert correo_falso.enviados.count("aprendiz@sena.edu.co") == 2


def test_calcular_estado_semaforo(session, datos):
    def agregar(n, estado):
        session.add(Asistencia(
            Fec_Asi=_lunes(n), Es_Asi=estado, Id_Apr=1, Id_Fic=datos["ficha"].Id_Fic,
            Id_Ins=1, Id_RA=datos["ra"].Id_RA, Dia=DiaSemana.lunes,
        ))
        session.commit()

    for n in range(4):
        agregar(n, EstadoAsistencia.falla)
    assert calcular_estado(session, 1, datos["ficha"].Id_Fic)["semaforo"] == "AMARILLO"
    agregar(4, EstadoAsistencia.presente)
    estado = calcular_estado(session, 1, datos["ficha"].Id_Fic)
    assert estado["racha_dias"] == 0
    agregar(5, EstadoAsistencia.falla)
    assert calcular_estado(session, 1, datos["ficha"].Id_Fic)["semaforo"] == "ROJO"


# ----------------------------------------------------------------------
# Consultas de asistencia
# ----------------------------------------------------------------------
def test_aprendices_de_ficha(client, datos):
    assert len(client.get(f"/asistencia/ficha/{datos['ficha'].Id_Fic}/aprendices").json()) == 1
    assert client.get("/asistencia/ficha/99/aprendices").status_code == 404


def test_asignaciones_del_instructor(client, session, datos):
    session.add(FichaInstructor(
        Id_Fic=99, Id_Ins=1, Id_RA=1, Dia=DiaSemana.martes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 3, 2),
    ))
    session.commit()
    r = client.get("/asistencia/instructor/1/asignaciones").json()
    assert len(r) == 1  # la de la ficha 99 (inexistente) se ignora
    assert r[0]["Jor_Fic"] == "Mañana"


def test_asistencia_de_clase(client, datos):
    _registrar(client, datos, estado="Retardo")
    url = f"/asistencia/clase/{datos['ficha'].Id_Fic}/1/{datos['ra'].Id_RA}/Lunes/{LUNES}"
    r = client.get(url).json()
    assert r[0]["Es_Asi"] == "Retardo"
    assert client.get(f"/asistencia/clase/1/1/99/Lunes/{LUNES}").status_code == 404


def test_estado_y_novedades_del_aprendiz(client, datos):
    _registrar(client, datos, estado="Falla")
    assert client.get("/asistencia/aprendiz/1/estado").json()["acumulado"] == 1
    novedades = client.get("/asistencia/aprendiz/1/novedades").json()
    assert novedades[0]["Es_Asi"] == "Falla"
    assert novedades[0]["Instructor"] == "Carlos Gomez"


@pytest.mark.parametrize("ruta", ["estado", "novedades", "ficha"])
def test_aprendiz_sin_ficha(client, session, datos, ruta):
    session.add(Aprendiz(
        Nom_Apr="Sin", Ape_Apr="Ficha", Tip_ide_Apr="CC", Num_ide_Apr=1002,
        Cor_Apr="sf@sena.edu.co", Con_Apr="x",
    ))
    session.commit()
    assert client.get(f"/asistencia/aprendiz/2/{ruta}").status_code == 400
    assert client.get(f"/asistencia/aprendiz/99/{ruta}").status_code == 404


def test_alertas_del_instructor(client, datos):
    assert client.get("/asistencia/instructor/1/alertas").json()["total_alertas"] == 0
    for semana in range(3):
        _registrar(client, datos, fecha=_lunes(semana), estado="Falla")
    assert client.get("/asistencia/instructor/1/alertas").json()["total_alertas"] == 1


def test_alertas_no_cuenta_dos_veces(client, session, datos):
    # El mismo instructor en una segunda ficha con el mismo aprendiz
    session.add(Fichas(Id_Car=1, Num_Fic=2, Fec_inicio_Fic=date(2026, 1, 1),
                       Fec_Fin_Fic=date(2026, 12, 31)))
    session.add(FichaInstructor(
        Id_Fic=2, Id_Ins=1, Id_RA=1, Dia=DiaSemana.martes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 3, 2),
    ))
    session.commit()
    session.add(Aprendiz(
        Nom_Apr="Otro", Ape_Apr="Apr", Tip_ide_Apr="CC", Num_ide_Apr=1002,
        Cor_Apr="o@sena.edu.co", Con_Apr="x", Id_Fic=2,
    ))
    session.commit()
    assert client.get("/asistencia/instructor/1/alertas").json()["total_alertas"] == 0


def test_revisar_asistencia_instructor(client, session, datos):
    _registrar(client, datos)
    # Registro huérfano (aprendiz, instructor y RA inexistentes)
    session.add(Asistencia(
        Fec_Asi=LUNES, Es_Asi=EstadoAsistencia.falla, Id_Apr=99, Id_Fic=1,
        Id_Ins=99, Id_RA=99, Dia=DiaSemana.lunes,
    ))
    session.commit()
    r = client.get(f"/asistencia/instructor/1/revisar/{datos['ficha'].Id_Fic}").json()
    assert len(r) == 2
    assert {"Aprendiz no encontrado", "Sebastian Ramirez"} == {x["Aprendiz"] for x in r}


def test_revisar_asistencia_sin_asignacion(client, datos):
    url = f"/asistencia/instructor/99/revisar/{datos['ficha'].Id_Fic}"
    assert client.get(url).status_code == 403


def test_asistencia_vista_aprendiz(client, session, datos):
    _registrar(client, datos)
    session.add(Asistencia(
        Fec_Asi=LUNES, Es_Asi=EstadoAsistencia.falla, Id_Apr=99, Id_Fic=1,
        Id_Ins=99, Id_RA=99, Dia=DiaSemana.lunes,
    ))
    session.commit()
    r = client.get("/asistencia/aprendiz/1/ficha").json()
    assert r["ficha"]["Num_Fic"] == 3407184
    assert "Num_ide_Apr" not in r["registros"][0]


def test_vistas_del_coordinador(client, datos):
    _registrar(client, datos)
    assert client.get("/asistencia/coordinador/fichas").json()[0]["Jor_Fic"] == "Mañana"
    r = client.get(f"/asistencia/coordinador/ficha/{datos['ficha'].Id_Fic}").json()
    assert r[0]["Estado"] == "Presente"
    assert client.get("/asistencia/coordinador/ficha/99").status_code == 404


# ----------------------------------------------------------------------
# Notificaciones
# ----------------------------------------------------------------------
def test_enviar_correo(correo_falso):
    notif.enviar_correo("a@sena.edu.co", "Asunto", "Cuerpo")
    assert correo_falso.enviados == ["a@sena.edu.co"]


def test_enviar_correo_sin_destinatario(correo_falso):
    notif.enviar_correo("", "Asunto", "Cuerpo")
    assert correo_falso.enviados == []


def test_enviar_correo_falla_sin_romper(correo_falso, capsys):
    correo_falso.fallar = True
    notif.enviar_correo("a@sena.edu.co", "Asunto", "Cuerpo")
    assert "Error crítico" in capsys.readouterr().out


def test_notificar_lista_no_llamada(session, datos):
    tareas = BackgroundTasks()
    notif.notificar_lista_no_llamada(session, tareas, datos["ficha"], 1, 1, DiaSemana.lunes, LUNES)
    assert len(tareas.tasks) == 1
    assert session.get(Notificacion, 1).Tip_Not == TipoNotificacion.sin_lista


# ----------------------------------------------------------------------
# Tarea programada (jobs_asistencia)
# ----------------------------------------------------------------------
def _fijar_hoy(monkeypatch, dia):
    class FechaFija(date):
        @classmethod
        def today(cls):
            return dia

    monkeypatch.setattr(jobs_asistencia, "date", FechaFija)


def test_job_notifica_si_no_llamaron_lista(monkeypatch, session, datos, correo_falso):
    _fijar_hoy(monkeypatch, LUNES)
    jobs_asistencia.revisar_listas_no_llamadas()
    assert correo_falso.enviados == ["admin@sena.edu.co"]


def test_job_no_notifica_si_hubo_registro(monkeypatch, client, datos, correo_falso):
    _registrar(client, datos)
    _fijar_hoy(monkeypatch, LUNES)
    jobs_asistencia.revisar_listas_no_llamadas()
    assert correo_falso.enviados == []


def test_job_domingo_no_hace_nada(monkeypatch, datos, correo_falso):
    _fijar_hoy(monkeypatch, LUNES - timedelta(days=1))
    jobs_asistencia.revisar_listas_no_llamadas()
    assert correo_falso.enviados == []


@pytest.mark.parametrize("dia", [
    date(2027, 1, 4),   # lunes fuera del periodo de la ficha
    date(2026, 1, 12),  # lunes dentro de la ficha pero antes del RA
])
def test_job_fuera_de_periodo(monkeypatch, datos, correo_falso, dia):
    _fijar_hoy(monkeypatch, dia)
    jobs_asistencia.revisar_listas_no_llamadas()
    assert correo_falso.enviados == []


def test_job_ignora_ficha_inexistente(monkeypatch, session, datos, correo_falso):
    session.add(FichaInstructor(
        Id_Fic=99, Id_Ins=1, Id_RA=1, Dia=DiaSemana.lunes,
        Fec_Inicio_RA=date(2026, 2, 2), Fec_Fin_RA=date(2026, 6, 30),
    ))
    session.commit()
    _fijar_hoy(monkeypatch, LUNES)
    jobs_asistencia.revisar_listas_no_llamadas()
    assert correo_falso.enviados == ["admin@sena.edu.co"]


# ----------------------------------------------------------------------
# Reporte PDF
# ----------------------------------------------------------------------
def test_pdf_de_ficha(client, session, datos):
    # Segundo RA (otra competencia) sin registros y otra asignación del mismo RA
    from models.model import Competencia
    comp = Competencia(Nom_Comp="Inglés")
    session.add(comp)
    session.commit()
    ra2 = ResultadoAprendizaje(Nom_RA="Leer <textos>", Id_Comp=comp.Id_Comp)
    session.add(ra2)
    session.commit()
    session.add_all([
        FichaInstructor(Id_Fic=1, Id_Ins=1, Id_RA=ra2.Id_RA, Dia=DiaSemana.martes,
                        Fec_Inicio_RA=date(2026, 2, 3), Fec_Fin_RA=date(2026, 3, 3)),
        FichaInstructor(Id_Fic=1, Id_Ins=1, Id_RA=1, Dia=DiaSemana.martes,
                        Fec_Inicio_RA=date(2026, 1, 6), Fec_Fin_RA=date(2026, 7, 7)),
        FichaInstructor(Id_Fic=1, Id_Ins=1, Id_RA=99, Dia=DiaSemana.miercoles,
                        Fec_Inicio_RA=date(2026, 2, 4), Fec_Fin_RA=date(2026, 3, 4)),
        Aprendiz(Nom_Apr="Ana", Ape_Apr="Zapata", Tip_ide_Apr="CC", Num_ide_Apr=1002,
                 Cor_Apr="ana@sena.edu.co", Con_Apr="x", Id_Fic=1),
    ])
    session.commit()
    for estado, semana in (("Presente", 0), ("Falla", 1), ("Retardo", 2), ("Excusa", 3)):
        _registrar(client, datos, fecha=_lunes(semana), estado=estado)
    # Registro fuera del rango de su asignación (se excluye del PDF)
    session.add(Asistencia(
        Fec_Asi=date(2026, 8, 3), Es_Asi=EstadoAsistencia.falla, Id_Apr=1, Id_Fic=1,
        Id_Ins=1, Id_RA=1, Dia=DiaSemana.lunes,
    ))
    session.commit()

    r = client.get("/asistencia/pdf/ficha/1")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content.startswith(b"%PDF")
    assert 'asistencia_ficha_3407184.pdf' in r.headers["content-disposition"]


def test_pdf_de_un_aprendiz_y_por_instructor(client, datos):
    _registrar(client, datos)
    r = client.get("/asistencia/pdf/ficha/1?Id_Apr=1&Id_Ins=1")
    assert r.status_code == 200
    assert "asistencia_ficha_3407184_1001.pdf" in r.headers["content-disposition"]


def test_pdf_ficha_sin_resultados(client, session, datos):
    session.add(Fichas(Id_Car=99, Num_Fic=2, Fec_inicio_Fic=date(2026, 1, 1),
                       Fec_Fin_Fic=date(2026, 12, 31)))
    session.commit()
    session.add(Aprendiz(Nom_Apr="Ana", Ape_Apr="Diaz", Tip_ide_Apr="CC", Num_ide_Apr=1002,
                         Cor_Apr="ana@sena.edu.co", Con_Apr="x", Id_Fic=2))
    session.commit()
    assert client.get("/asistencia/pdf/ficha/2").status_code == 200


@pytest.mark.parametrize("url, codigo", [
    ("/asistencia/pdf/ficha/99", 404),
    ("/asistencia/pdf/ficha/1?Id_Ins=99", 403),
    ("/asistencia/pdf/ficha/1?Id_Apr=99", 404),
])
def test_pdf_errores(client, datos, url, codigo):
    assert client.get(url).status_code == codigo


# ----------------------------------------------------------------------
# seed.py
# ----------------------------------------------------------------------
def test_seed_crea_usuarios_de_prueba(monkeypatch, engine, session):
    monkeypatch.setattr(seed, "engine", engine)
    seed.seed()
    assert session.get(Aprendiz, 1).Num_ide_Apr == 1001
    assert session.get(Instructor, 1).Num_ide_Ins == 2001
    assert session.get(Administrador, 1).Num_ide_Adm == 3001
