"""Pruebas de activar / desactivar fichas y del filtro por estado."""
from datetime import date

from conftest import LUNES
from models.model import Aprendiz, Fichas


def _registrar(client, datos):
    return client.post("/asistencia", json={
        "Fec_Asi": str(LUNES), "Es_Asi": "Presente",
        "Id_Apr": datos["aprendiz"].Id_Apr, "Id_Fic": datos["ficha"].Id_Fic,
        "Id_Ins": datos["instructor"].Id_Ins, "Id_RA": datos["ra"].Id_RA, "Dia": "Lunes",
    })


def test_ficha_nueva_queda_activa(client, datos):
    r = client.get(f"/fichas/{datos['ficha'].Id_Fic}")
    assert r.status_code == 200
    assert r.json()["Es_Fic"] is True


def test_desactivar_y_activar_ficha(client, session, datos):
    id_fic = datos["ficha"].Id_Fic

    r = client.patch(f"/fichas/{id_fic}/desactivar")
    assert r.status_code == 200
    assert r.json()["Es_Fic"] is False
    session.expire_all()
    assert session.get(Fichas, id_fic).Es_Fic is False
    # Sin la opción, los aprendices siguen activos
    assert session.get(Aprendiz, datos["aprendiz"].Id_Apr).Es_Apr is True

    # Desactivar dos veces da conflicto
    assert client.patch(f"/fichas/{id_fic}/desactivar").status_code == 409

    r = client.patch(f"/fichas/{id_fic}/activar")
    assert r.status_code == 200
    assert r.json()["Es_Fic"] is True
    assert client.patch(f"/fichas/{id_fic}/activar").status_code == 409


def test_desactivar_ficha_con_aprendices(client, session, datos):
    id_fic = datos["ficha"].Id_Fic
    r = client.patch(f"/fichas/{id_fic}/desactivar?incluir_aprendices=true")
    assert r.status_code == 200
    assert r.json()["aprendices_afectados"] == 1
    session.expire_all()
    assert session.get(Aprendiz, datos["aprendiz"].Id_Apr).Es_Apr is False

    r = client.patch(f"/fichas/{id_fic}/activar?incluir_aprendices=true")
    assert r.json()["aprendices_afectados"] == 1
    session.expire_all()
    assert session.get(Aprendiz, datos["aprendiz"].Id_Apr).Es_Apr is True


def test_desactivar_ficha_inexistente(client, datos):
    assert client.patch("/fichas/999/desactivar").status_code == 404


def test_filtro_por_estado(client, session, datos):
    otra = Fichas(Id_Car=datos["carrera"].Id_Car, Num_Fic=999001,
                  Fec_inicio_Fic=date(2026, 1, 1), Fec_Fin_Fic=date(2026, 12, 1), Es_Fic=False)
    session.add(otra)
    session.commit()

    numeros = lambda estado: [f["Num_Fic"] for f in client.get(f"/fichas/?estado={estado}").json()]
    assert numeros("activas") == [datos["ficha"].Num_Fic]
    assert numeros("desactivadas") == [999001]
    assert sorted(numeros("todas")) == sorted([datos["ficha"].Num_Fic, 999001])
    assert len(client.get("/fichas/").json()) == 2  # por defecto: todas
    assert client.get("/fichas/?estado=otra").status_code == 422


def test_ficha_desactivada_bloquea_asistencia(client, datos):
    client.patch(f"/fichas/{datos['ficha'].Id_Fic}/desactivar")
    r = _registrar(client, datos)
    assert r.status_code == 400
    assert "desactivada" in r.json()["detail"]


def test_ficha_desactivada_se_oculta_al_instructor(client, datos):
    id_ins = datos["instructor"].Id_Ins
    assert len(client.get(f"/asistencia/instructor/{id_ins}/asignaciones").json()) == 1
    assert len(client.get(f"/asignaciones/instructor/{id_ins}/fichas").json()) == 1

    client.patch(f"/fichas/{datos['ficha'].Id_Fic}/desactivar")
    assert client.get(f"/asistencia/instructor/{id_ins}/asignaciones").json() == []
    assert client.get(f"/asignaciones/instructor/{id_ins}/fichas").json() == []


def test_ficha_desactivada_bloquea_asignaciones(client, session, datos):
    id_fic = datos["ficha"].Id_Fic
    client.patch(f"/fichas/{id_fic}/desactivar")

    r = client.post("/asignaciones/instructor", json={
        "Id_Fic": id_fic, "Id_Ins": datos["instructor"].Id_Ins,
        "Asignaciones": [{"Id_RA": datos["ra"].Id_RA, "Dia": "Martes"}],
        "Fec_Inicio_RA": "2026-02-02", "Fec_Fin_RA": "2026-06-30",
    })
    assert r.status_code == 400

    nuevo = Aprendiz(Nom_Apr="Ana", Ape_Apr="Ruiz", Tip_ide_Apr="CC", Num_ide_Apr=1002,
                     Cor_Apr="ana@sena.edu.co", Con_Apr="x")
    session.add(nuevo)
    session.commit()
    r = client.post("/users/aprendiz", json={"Id_Apr": nuevo.Id_Apr, "Id_Fic": id_fic})
    assert r.status_code == 400

    datos_carga = client.get("/users/aprendiz/datos-carga").json()
    assert datos_carga["fichas"] == []


def test_no_crear_aprendiz_en_ficha_desactivada(client, datos):
    client.patch(f"/fichas/{datos['ficha'].Id_Fic}/desactivar")
    r = client.post("/usuarios/crear", json={
        "rol": "Aprendiz", "nombre": "Ana", "apellido": "Ruiz",
        "tipo_identificacion": "CC", "numero_identificacion": 1003,
        "correo": "ana2@sena.edu.co", "Id_Fic": datos["ficha"].Id_Fic,
    })
    assert r.status_code == 400


def test_tarea_programada_ignora_fichas_desactivadas(client, session, datos, monkeypatch):
    import jobs_asistencia
    from models.model import Notificacion
    from sqlmodel import select

    class FechaFija(date):
        @classmethod
        def today(cls):
            return LUNES

    monkeypatch.setattr(jobs_asistencia, "date", FechaFija)
    client.patch(f"/fichas/{datos['ficha'].Id_Fic}/desactivar")
    jobs_asistencia.revisar_listas_no_llamadas()
    session.expire_all()
    assert session.exec(select(Notificacion)).all() == []
