"""Pruebas CRUD de carreras, fichas, competencias y resultados de aprendizaje."""
import io

import pandas as pd
import pytest


def _archivo(nombre, contenido, tipo="text/csv"):
    return {"file": (nombre, contenido, tipo)}


def _excel(filas):
    buffer = io.BytesIO()
    pd.DataFrame(filas).to_excel(buffer, index=False)
    return buffer.getvalue()


# ----------------------------------------------------------------------
# Carreras
# ----------------------------------------------------------------------
def test_carreras_crud(client):
    r = client.post("/carreras/", json={"Nom_Car": "ADSO", "Des_Car": "Software"})
    assert r.status_code == 201
    id_car = r.json()["carrera"]["Id_Car"]

    assert len(client.get("/carreras/").json()) == 1
    assert client.get(f"/carreras/{id_car}").json()["Nom_Car"] == "ADSO"

    r = client.put(f"/carreras/{id_car}", json={"Nom_Car": "Multimedia", "Des_Car": "Diseño"})
    assert r.json()["Nom_Car"] == "Multimedia"

    assert client.delete(f"/carreras/{id_car}").status_code == 200
    assert client.get("/carreras/").json() == []


@pytest.mark.parametrize("metodo", ["get", "put", "delete"])
def test_carrera_no_encontrada(client, metodo):
    kwargs = {"json": {"Nom_Car": "x", "Des_Car": "y"}} if metodo == "put" else {}
    r = getattr(client, metodo)("/carreras/99", **kwargs)
    assert r.status_code == 404


def test_carreras_upload_csv(client):
    csv = b"Nom_Car,Des_Car\nADSO,Software\nRedes,\n"
    r = client.post("/carreras/upload", files=_archivo("carreras.csv", csv))
    assert r.status_code == 201
    assert r.json()["creadas"] == 2


def test_carreras_upload_excel(client):
    contenido = _excel([{"Nom_Car": "ADSO", "Des_Car": "Software"}])
    r = client.post("/carreras/upload", files=_archivo("carreras.xlsx", contenido))
    assert r.json()["creadas"] == 1


def test_carreras_upload_errores(client):
    assert client.post(
        "/carreras/upload", files=_archivo("a.txt", b"x")
    ).status_code == 400
    assert client.post(
        "/carreras/upload", files=_archivo("a.xlsx", b"no es excel")
    ).status_code == 400
    r = client.post("/carreras/upload", files=_archivo("a.csv", b"Otra\n1\n"))
    assert "Faltan columnas" in r.json()["detail"]


# ----------------------------------------------------------------------
# Fichas
# ----------------------------------------------------------------------
def test_fichas_crud(client, datos):
    cuerpo = {
        "Id_Car": datos["carrera"].Id_Car, "Num_Fic": 2900000,
        "Fec_inicio_Fic": "2026-01-10", "Fec_Fin_Fic": "2027-01-10",
    }
    r = client.post("/fichas/", json=cuerpo)
    assert r.status_code == 201
    id_fic = r.json()["ficha"]["Id_Fic"]

    assert len(client.get("/fichas/").json()) == 2
    assert client.get(f"/fichas/{id_fic}").json()["Num_Fic"] == 2900000

    cuerpo["Num_Fic"] = 2900001
    assert client.put(f"/fichas/{id_fic}", json=cuerpo).json()["Num_Fic"] == 2900001
    assert client.delete(f"/fichas/{id_fic}").status_code == 200


@pytest.mark.parametrize("metodo", ["get", "put", "delete"])
def test_ficha_no_encontrada(client, metodo):
    kwargs = {}
    if metodo == "put":
        kwargs["json"] = {
            "Id_Car": 1, "Num_Fic": 1,
            "Fec_inicio_Fic": "2026-01-01", "Fec_Fin_Fic": "2026-02-01",
        }
    assert getattr(client, metodo)("/fichas/99", **kwargs).status_code == 404


def test_fichas_upload(client, datos):
    csv = (
        "Id_Car,Num_Fic,Fec_inicio_Fic,Fec_Fin_Fic\n"
        f"{datos['carrera'].Id_Car},111,2026-01-01,2026-12-01\n"
        f"{datos['carrera'].Id_Car},111,2026-01-01,2026-12-01\n"  # duplicada -> error
    ).encode()
    r = client.post("/fichas/upload", files=_archivo("fichas.csv", csv))
    assert r.json()["creadas"] == 1
    assert len(r.json()["errores"]) == 1


def test_fichas_upload_errores(client):
    assert client.post("/fichas/upload", files=_archivo("a.pdf", b"x")).status_code == 400
    assert client.post("/fichas/upload", files=_archivo("a.xls", b"x")).status_code == 400
    r = client.post("/fichas/upload", files=_archivo("a.csv", b"Num_Fic\n1\n"))
    assert r.status_code == 400


# ----------------------------------------------------------------------
# Competencias
# ----------------------------------------------------------------------
def test_competencias_crud(client):
    r = client.post("/competencias/", json={"Nom_Comp": "Ética", "Des_Comp": "Valores"})
    assert r.status_code == 201
    id_comp = r.json()["competencia"]["Id_Comp"]
    assert len(client.get("/competencias/").json()) == 1

    r = client.put(f"/competencias/{id_comp}", json={"Nom_Comp": "Inglés", "Des_Comp": "Idioma"})
    assert r.json()["Nom_Comp"] == "Inglés"
    assert client.delete(f"/competencias/{id_comp}").status_code == 204


def test_competencia_no_encontrada(client):
    assert client.put(
        "/competencias/99", json={"Nom_Comp": "x", "Des_Comp": "y"}
    ).status_code == 404
    assert client.delete("/competencias/99").status_code == 404


def test_competencias_upload(client):
    csv = b"Nom_Comp,Des_Comp\nProgramar,Codigo\nBD,\n"
    r = client.post("/competencias/upload", files=_archivo("c.csv", csv))
    assert r.json()["creadas"] == 2


def test_competencias_upload_errores(client):
    assert client.post("/competencias/upload", files=_archivo("a.doc", b"x")).status_code == 400
    assert client.post("/competencias/upload", files=_archivo("a.xlsx", b"x")).status_code == 400
    assert client.post(
        "/competencias/upload", files=_archivo("a.csv", b"X\n1\n")
    ).status_code == 400


# ----------------------------------------------------------------------
# Resultados de aprendizaje (CRUD)
# ----------------------------------------------------------------------
def test_resultados_listar_y_filtrar(client, datos):
    id_comp = datos["competencia"].Id_Comp
    assert len(client.get("/resultados-aprendizaje/").json()) == 1
    assert len(client.get(f"/resultados-aprendizaje/?Id_Comp={id_comp}").json()) == 1
    assert client.get("/resultados-aprendizaje/?Id_Comp=999").json() == []


def test_resultado_obtener(client, datos):
    r = client.get(f"/resultados-aprendizaje/{datos['ra'].Id_RA}")
    assert r.json()["Nom_Comp"] == "Programación"
    assert client.get("/resultados-aprendizaje/999").status_code == 404


def test_resultado_crear(client, datos):
    r = client.post("/resultados-aprendizaje/", json={
        "Nom_RA": "  Probar software  ", "Id_Comp": datos["competencia"].Id_Comp,
    })
    assert r.status_code == 201
    assert r.json()["Nom_RA"] == "Probar software"


def test_resultado_crear_errores(client, datos):
    r = client.post("/resultados-aprendizaje/", json={"Nom_RA": "X", "Id_Comp": 999})
    assert r.status_code == 404
    r = client.post("/resultados-aprendizaje/", json={
        "Nom_RA": "   ", "Id_Comp": datos["competencia"].Id_Comp,
    })
    assert r.status_code == 422


def test_resultado_actualizar(client, session, datos):
    from models.model import Competencia
    otra = Competencia(Nom_Comp="Bases de datos")
    session.add(otra)
    session.commit()

    r = client.put(f"/resultados-aprendizaje/{datos['ra'].Id_RA}", json={
        "Nom_RA": "Nuevo nombre", "Des_RA": "desc", "Id_Comp": otra.Id_Comp,
    })
    assert r.status_code == 200
    assert r.json()["Nom_Comp"] == "Bases de datos"


@pytest.mark.parametrize("cuerpo, codigo", [
    ({"Nom_RA": None}, 422),
    ({"Id_Comp": None}, 422),
    ({"Id_Comp": 999}, 404),
])
def test_resultado_actualizar_errores(client, datos, cuerpo, codigo):
    r = client.put(f"/resultados-aprendizaje/{datos['ra'].Id_RA}", json=cuerpo)
    assert r.status_code == codigo


def test_resultado_actualizar_no_existe(client):
    assert client.put("/resultados-aprendizaje/999", json={}).status_code == 404


def test_resultado_fichas(client, datos):
    r = client.get(f"/resultados-aprendizaje/{datos['ra'].Id_RA}/fichas")
    assert r.json()[0]["Num_Fic"] == 3407184
    assert r.json()[0]["Dia"] == "Lunes"
    assert client.get("/resultados-aprendizaje/999/fichas").status_code == 404


# ----------------------------------------------------------------------
# Carga masiva de resultados de aprendizaje
# ----------------------------------------------------------------------
def test_carga_resultados_por_id(client, datos):
    id_comp = datos["competencia"].Id_Comp
    csv = (
        "Nom_RA;Id_Comp;Des_RA\n"
        f"RA nuevo;{id_comp};desc\n"
        f"Codificar módulos;{id_comp};\n"  # ya existe -> omitido
        "RA huérfano;999;\n"  # competencia inexistente -> error
        f";{id_comp};\n"  # sin nombre -> error
        f"{'x' * 151};{id_comp};\n"  # demasiado largo -> error
    ).encode()
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", csv))
    cuerpo = r.json()
    assert r.status_code == 201
    assert cuerpo["creadas"] == 1
    assert cuerpo["omitidos"] == 1
    assert len(cuerpo["errores"]) == 3


def test_carga_resultados_por_nombre_crea_competencias(client, datos):
    contenido = _excel([
        {"Nom_Comp": "Inglés", "Des_Comp": "Idioma", "Nom_RA": "Leer textos"},
        {"Nom_Comp": None, "Des_Comp": None, "Nom_RA": "Escribir textos"},
        {"Nom_Comp": "Inglés", "Des_Comp": None, "Nom_RA": None},
        {"Nom_Comp": "y" * 151, "Des_Comp": None, "Nom_RA": "Z"},
    ])
    r = client.post("/carga-resultados/upload", files=_archivo("ra.xlsx", contenido))
    cuerpo = r.json()
    assert cuerpo["competencias_creadas"] == 1
    assert cuerpo["creadas"] == 2
    assert len(cuerpo["errores"]) == 1


def test_carga_resultados_columna_nombre_vacia(client, datos):
    csv = b"Nom_RA,Nom_Comp\nRA,\n"
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", csv))
    assert "No se indica la competencia" in r.json()["errores"][0]["error"]


def test_carga_resultados_falta_id(client, datos):
    csv = b"Nom_RA,Id_Comp\nRA,\n"
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", csv))
    assert "Falta Id_Comp" in r.json()["errores"][0]["error"]


def test_carga_resultados_latin1(client, datos):
    csv = f"Nom_RA,Id_Comp\nDiseño,{datos['competencia'].Id_Comp}\n".encode("latin-1")
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", csv))
    assert r.json()["creadas"] == 1


def test_carga_resultados_errores_archivo(client):
    assert client.post(
        "/carga-resultados/upload", files=_archivo("ra.txt", b"x")
    ).status_code == 400
    assert client.post(
        "/carga-resultados/upload", files=_archivo("ra.xlsx", b"x")
    ).status_code == 400
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", b"Nom_RA\nA\n"))
    assert "Faltan columnas" in r.json()["detail"]


def test_carga_resultados_error_al_guardar(client, datos, monkeypatch):
    from sqlmodel import Session

    def commit_roto(self):
        raise RuntimeError("BD caída")

    monkeypatch.setattr(Session, "commit", commit_roto)
    csv = f"Nom_RA,Id_Comp\nRA,{datos['competencia'].Id_Comp}\n".encode()
    r = client.post("/carga-resultados/upload", files=_archivo("ra.csv", csv))
    assert r.status_code == 500


def test_obtener_resultados_carga(client, datos):
    assert len(client.get("/carga-resultados/").json()) == 1
    assert client.get("/carga-resultados/?id_comp=999").json() == []
