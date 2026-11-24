"""Pruebas de gestión de usuarios, asignación de aprendices y cargas masivas."""
import io

import pandas as pd
import pytest

from models.model import Aprendiz, Instructor


def _archivo(nombre, contenido):
    return {"file": (nombre, contenido, "application/octet-stream")}


def _excel(filas, **kwargs):
    buffer = io.BytesIO()
    pd.DataFrame(filas).to_excel(buffer, index=False, **kwargs)
    return buffer.getvalue()


# ----------------------------------------------------------------------
# Crear usuarios
# ----------------------------------------------------------------------
@pytest.mark.parametrize("rol", ["Aprendiz", "Instructor", "Administrador"])
def test_crear_usuario(client, rol):
    r = client.post("/usuarios/crear", json={
        "rol": rol, "nombre": "Ana", "apellido": "Pérez",
        "tipo_identificacion": "CC", "numero_identificacion": 5555,
        "correo": "ana@sena.edu.co",
    })
    assert r.status_code == 200
    assert r.json()["rol"] == rol
    assert r.json()["id"] == 1


@pytest.mark.parametrize("rol, documento", [
    ("Aprendiz", 1001), ("Instructor", 2001), ("Administrador", 3001),
])
def test_crear_usuario_duplicado(client, datos, rol, documento):
    r = client.post("/usuarios/crear", json={
        "rol": rol, "nombre": "X", "apellido": "Y", "tipo_identificacion": "CC",
        "numero_identificacion": documento, "correo": "otro@sena.edu.co",
        "contraseña": "Clave",
    })
    assert r.status_code == 400


# ----------------------------------------------------------------------
# Aprendices
# ----------------------------------------------------------------------
def test_listar_aprendices(client, session, datos):
    session.add(Aprendiz(
        Nom_Apr="Sin", Ape_Apr="Ficha", Tip_ide_Apr="TI", Num_ide_Apr=1002,
        Cor_Apr="sin@sena.edu.co", Con_Apr="x",
    ))
    session.commit()
    lista = client.get("/usuarios/aprendices").json()
    assert lista[0]["Num_Fic"] == 3407184
    assert lista[0]["Nom_Car"] == "ADSO"
    assert lista[1]["Num_Fic"] is None


def test_obtener_aprendiz(client, datos):
    assert client.get("/usuarios/aprendiz/1").json()["Nom_Car"] == "ADSO"
    assert client.get("/usuarios/aprendiz/99").status_code == 404


def test_actualizar_aprendiz(client, datos):
    r = client.put("/usuarios/aprendiz/1", json={
        "nombre": "Seba", "apellido": "R", "tipo_identificacion": "TI",
        "numero_identificacion": 1010, "correo": "seba@sena.edu.co",
        "contraseña": "nueva", "Id_Fic": datos["ficha"].Id_Fic,
    })
    assert r.status_code == 200
    assert client.get("/usuarios/aprendiz/1").json()["Nom_Apr"] == "Seba"


def test_activar_desactivar_aprendiz(client, datos):
    client.patch("/usuarios/aprendiz/1/desactivar")
    assert client.get("/usuarios/aprendiz/1").json()["Es_Apr"] is False
    client.patch("/usuarios/aprendiz/1/activar")
    assert client.get("/usuarios/aprendiz/1").json()["Es_Apr"] is True


def test_listar_carreras_y_fichas(client, datos):
    assert client.get("/usuarios/carreras").json()[0]["Nom_Car"] == "ADSO"
    assert len(client.get("/usuarios/fichas").json()) == 1
    assert len(client.get(f"/usuarios/fichas?Id_Car={datos['carrera'].Id_Car}").json()) == 1
    assert client.get("/usuarios/fichas?Id_Car=999").json() == []


# ----------------------------------------------------------------------
# Instructores y administradores
# ----------------------------------------------------------------------
@pytest.mark.parametrize("ruta, campo_nombre, campo_estado", [
    ("instructor", "Nom_Ins", "Es_Ins"),
    ("administrador", "Nom_Adm", "Es_Adm"),
])
def test_ciclo_instructor_y_administrador(client, datos, ruta, campo_nombre, campo_estado):
    plural = "instructores" if ruta == "instructor" else "administradores"
    assert len(client.get(f"/usuarios/{plural}").json()) == 1

    r = client.put(f"/usuarios/{ruta}/1", json={
        "nombre": "Nuevo", "apellido": "Ap", "tipo_identificacion": "CE",
        "numero_identificacion": 777, "correo": f"n.{ruta}@sena.edu.co",
        "contraseña": "otra",
    })
    assert r.status_code == 200
    assert client.get(f"/usuarios/{ruta}/1").json()[campo_nombre] == "Nuevo"

    client.patch(f"/usuarios/{ruta}/1/desactivar")
    assert client.get(f"/usuarios/{ruta}/1").json()[campo_estado] is False
    client.patch(f"/usuarios/{ruta}/1/activar")
    assert client.get(f"/usuarios/{ruta}/1").json()[campo_estado] is True


@pytest.mark.parametrize("ruta", ["aprendiz", "instructor", "administrador"])
def test_usuario_no_encontrado(client, ruta):
    assert client.get(f"/usuarios/{ruta}/99").status_code in (404,)
    assert client.put(f"/usuarios/{ruta}/99", json={}).status_code == 404
    assert client.patch(f"/usuarios/{ruta}/99/desactivar").status_code == 404
    assert client.patch(f"/usuarios/{ruta}/99/activar").status_code == 404


# ----------------------------------------------------------------------
# Asignar aprendiz a ficha
# ----------------------------------------------------------------------
def test_datos_carga(client, datos):
    r = client.get("/users/aprendiz/datos-carga").json()
    assert len(r["aprendices"]) == 1
    assert len(r["fichas"]) == 1


def test_asignar_aprendiz(client, session, datos):
    session.add(Aprendiz(
        Nom_Apr="Nuevo", Ape_Apr="Apr", Tip_ide_Apr="CC", Num_ide_Apr=1003,
        Cor_Apr="nuevo@sena.edu.co", Con_Apr="x",
    ))
    session.commit()
    r = client.post("/users/aprendiz", json={"Id_Apr": 2, "Id_Fic": datos["ficha"].Id_Fic})
    assert r.status_code == 200
    assert r.json()["Num_Fic"] == 3407184


def test_asignar_aprendiz_errores(client, session, datos):
    id_fic = datos["ficha"].Id_Fic
    assert client.post("/users/aprendiz", json={"Id_Apr": 99, "Id_Fic": id_fic}).status_code == 404
    assert client.post("/users/aprendiz", json={"Id_Apr": 1, "Id_Fic": 99}).status_code == 404
    r = client.post("/users/aprendiz", json={"Id_Apr": 1, "Id_Fic": id_fic})
    assert r.status_code == 409
    assert "esta ficha" in r.json()["detail"]


def test_asignar_aprendiz_ya_en_otra_ficha(client, session, datos):
    from models.model import Fichas
    from datetime import date
    otra = Fichas(
        Id_Car=1, Num_Fic=1, Fec_inicio_Fic=date(2026, 1, 1), Fec_Fin_Fic=date(2026, 6, 1)
    )
    session.add(otra)
    session.commit()
    r = client.post("/users/aprendiz", json={"Id_Apr": 1, "Id_Fic": otra.Id_Fic})
    assert r.status_code == 409
    assert "ficha con ID" in r.json()["detail"]


def test_asignar_aprendiz_error_integridad(client, session, datos, monkeypatch):
    from sqlalchemy.exc import IntegrityError
    from sqlmodel import Session
    session.add(Aprendiz(
        Nom_Apr="N", Ape_Apr="A", Tip_ide_Apr="CC", Num_ide_Apr=1004,
        Cor_Apr="n@sena.edu.co", Con_Apr="x",
    ))
    session.commit()

    def commit_roto(self):
        raise IntegrityError("stmt", {}, Exception("fk"))

    monkeypatch.setattr(Session, "commit", commit_roto)
    r = client.post("/users/aprendiz", json={"Id_Apr": 2, "Id_Fic": datos["ficha"].Id_Fic})
    assert r.status_code == 400


# ----------------------------------------------------------------------
# Carga de administradores
# ----------------------------------------------------------------------
def test_carga_administradores(client, datos):
    csv = (
        "Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo\n"
        "CC,4001,Pedro,Lopez,pedro@sena.edu.co\n"
        "CC,3001,Laura,Martinez,admin@sena.edu.co\n"  # existe -> actualiza
        "XX,4002,Mal,Tipo,mal@sena.edu.co\n"
        "CC,abc,Mal,Numero,mal2@sena.edu.co\n"
    ).encode()
    r = client.post("/usuarios/administradores/upload", files=_archivo("a.csv", csv))
    cuerpo = r.json()
    assert cuerpo["creadas"] == 1
    assert cuerpo["actualizadas"] == 1
    assert cuerpo["total_errores"] == 2


def test_carga_administradores_excel_y_latin1(client):
    contenido = _excel([{
        "Tipo_Identificacion": "CC", "Numero_Identificacion": 4001,
        "Nombre": "Pedro", "Apellido": "Lopez", "Correo": "p@sena.edu.co",
    }])
    r = client.post("/usuarios/administradores/upload", files=_archivo("a.xlsx", contenido))
    assert r.json()["creadas"] == 1

    csv = (
        "Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo\n"
        "CC,4002,Muñoz,Peña,m@sena.edu.co\n"
    ).encode("latin-1")
    r = client.post("/usuarios/administradores/upload", files=_archivo("a.csv", csv))
    assert r.json()["creadas"] == 1


@pytest.mark.parametrize("campo", ["Numero_Identificacion", "Nombre", "Apellido", "Correo"])
def test_carga_administradores_campo_vacio(client, campo):
    fila = {"Tipo_Identificacion": "CC", "Numero_Identificacion": "4001",
            "Nombre": "P", "Apellido": "L", "Correo": "p@sena.edu.co"}
    fila[campo] = " "
    csv = ("Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo\n"
           + ",".join(fila.values()) + "\n").encode()
    r = client.post("/usuarios/administradores/upload", files=_archivo("a.csv", csv))
    assert r.json()["total_errores"] == 1


def test_carga_administradores_errores_archivo(client):
    url = "/usuarios/administradores/upload"
    assert client.post(url, files=_archivo("a.txt", b"x")).status_code == 400
    assert client.post(url, files=_archivo("a.xlsx", b"x")).status_code == 400
    r = client.post(url, files=_archivo("a.csv", b"Nombre\nX\n"))
    assert r.status_code == 400


def test_carga_administradores_error_al_guardar(client, monkeypatch):
    from sqlmodel import Session
    monkeypatch.setattr(Session, "commit", lambda self: (_ for _ in ()).throw(RuntimeError("x")))
    csv = (b"Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo\n"
           b"CC,1,A,B,c@d.co\n")
    r = client.post("/usuarios/administradores/upload", files=_archivo("a.csv", csv))
    assert r.status_code == 500


# ----------------------------------------------------------------------
# Carga simple de aprendices
# ----------------------------------------------------------------------
def test_carga_aprendices(client, datos):
    csv = (
        "Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo,Ficha\n"
        "CC,1100,Ana,Diaz,ana@sena.edu.co,3407184\n"
        "CC,1001,Sebastian,Ramirez,aprendiz@sena.edu.co,3407184\n"  # actualiza
        "CC,1101,Sin,Ficha,sf@sena.edu.co,999\n"
        "ZZ,1102,Mal,Tipo,mt@sena.edu.co,3407184\n"
        "CC,abc,Mal,Num,mn@sena.edu.co,3407184\n"
        "CC,1103,Mal,Ficha,mf@sena.edu.co,abc\n"
    ).encode()
    r = client.post("/usuarios/aprendices/upload", files=_archivo("a.csv", csv))
    cuerpo = r.json()
    assert cuerpo["creadas"] == 1
    assert cuerpo["actualizadas"] == 1
    assert cuerpo["total_errores"] == 4


@pytest.mark.parametrize(
    "campo", ["Numero_Identificacion", "Nombre", "Apellido", "Correo", "Ficha"]
)
def test_carga_aprendices_campo_vacio(client, datos, campo):
    fila = {"Tipo_Identificacion": "CC", "Numero_Identificacion": "1100", "Nombre": "A",
            "Apellido": "B", "Correo": "a@sena.edu.co", "Ficha": "3407184"}
    fila[campo] = " "
    csv = (",".join(fila.keys()) + "\n" + ",".join(fila.values()) + "\n").encode()
    r = client.post("/usuarios/aprendices/upload", files=_archivo("a.csv", csv))
    assert r.json()["total_errores"] == 1


def test_carga_aprendices_excel_y_latin1(client, datos):
    contenido = _excel([{
        "Tipo_Identificacion": "CC", "Numero_Identificacion": 1100, "Nombre": "Ana",
        "Apellido": "Diaz", "Correo": "ana@sena.edu.co", "Ficha": 3407184,
    }])
    r = client.post("/usuarios/aprendices/upload", files=_archivo("a.xlsx", contenido))
    assert r.json()["creadas"] == 1
    csv = ("Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo,Ficha\n"
           "CC,1104,Íñigo,Peña,i@sena.edu.co,3407184\n").encode("latin-1")
    r = client.post("/usuarios/aprendices/upload", files=_archivo("a.csv", csv))
    assert r.json()["creadas"] == 1


def test_carga_aprendices_errores_archivo(client, monkeypatch):
    url = "/usuarios/aprendices/upload"
    assert client.post(url, files=_archivo("a.txt", b"x")).status_code == 400
    assert client.post(url, files=_archivo("a.xls", b"x")).status_code == 400
    assert client.post(url, files=_archivo("a.csv", b"Nombre\nX\n")).status_code == 400

    from sqlmodel import Session
    monkeypatch.setattr(Session, "commit", lambda self: (_ for _ in ()).throw(RuntimeError("x")))
    csv = b"Tipo_Identificacion,Numero_Identificacion,Nombre,Apellido,Correo,Ficha\n"
    assert client.post(url, files=_archivo("a.csv", csv)).status_code == 500


# ----------------------------------------------------------------------
# Carga de aprendices por ficha (reporte SOFIA Plus)
# ----------------------------------------------------------------------
REPORTE_SOFIA = (
    "Reporte de Aprendices,,,,,\n"
    "Ficha de Caracterización:,3407184 - ANALISIS Y DESARROLLO DE SOFTWARE,,,,\n"
    ",,,,,\n"
    "Tipo de Documento,Número de Documento,Nombre,Apellidos,Correo Electrónico,Estado\n"
    "CC,1.200,Juan,Perez,juan@sena.edu.co,EN FORMACION\n"
    "CC,1201,Maria,Lopez,maria@sena.edu.co,RETIRO VOLUNTARIO\n"
    "CC,1001,Sebastian,Ramirez,aprendiz@sena.edu.co,EN FORMACION\n"
    "CC,1001,Sebas,Ramirez Ruiz,aprendiz@sena.edu.co,CANCELADO\n"
    "XX,1202,Mal,Tipo,mt@sena.edu.co,EN FORMACION\n"
    "CC,,Sin,Documento,sd@sena.edu.co,EN FORMACION\n"
    "CC,1203,,Sin nombre,sn@sena.edu.co,EN FORMACION\n"
    "CC,1204,Sin,,sa@sena.edu.co,EN FORMACION\n"
    "CC,1205,Sin,Correo,,EN FORMACION\n"
    "CC,1206,Correo,Repetido,juan@sena.edu.co,EN FORMACION\n"
)


def test_carga_por_ficha_reporte_sofia(client, datos):
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    r = client.post(url, files=_archivo("reporte.csv", REPORTE_SOFIA.encode()))
    cuerpo = r.json()
    assert r.status_code == 200, cuerpo
    assert cuerpo["creadas"] == 2
    assert cuerpo["sin_cambios"] == 1
    assert cuerpo["actualizadas"] == 1
    assert cuerpo["total_errores"] == 6


def test_carga_por_ficha_actualiza_y_correo_de_otro(client, session, datos):
    session.add(Aprendiz(
        Nom_Apr="Otro", Ape_Apr="Apr", Tip_ide_Apr="CC", Num_ide_Apr=1300,
        Cor_Apr="otro@sena.edu.co", Con_Apr="x",
    ))
    session.commit()
    csv = (
        "Tipo de documento,Numero de documento,Nombres,Apellidos,Correo\n"
        "TI,1001,Sebastián,Ramírez,nuevo@sena.edu.co\n"  # cambia tipo y correo
        "CC,1300,Otro,Apr,nuevo@sena.edu.co\n"  # correo ya es de otro
    ).encode()
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    cuerpo = client.post(url, files=_archivo("plantilla.csv", csv)).json()
    assert cuerpo["actualizadas"] == 1
    assert cuerpo["total_errores"] == 1


def test_carga_por_ficha_excel(client, datos):
    contenido = _excel([{
        "Tipo_Documento": "CC", "Numero_Documento": "1400", "Nombre": "Luis",
        "Apellido": "Gil", "Correo": "luis@sena.edu.co",
    }])
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    assert client.post(url, files=_archivo("a.xlsx", contenido)).json()["creadas"] == 1


def test_carga_por_ficha_latin1(client, datos):
    csv = ("Tipo_Documento,Numero_Documento,Nombre,Apellido,Correo\n"
           "CC,1401,Peña,Muñoz,pm@sena.edu.co\n").encode("latin-1")
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    assert client.post(url, files=_archivo("a.csv", csv)).json()["creadas"] == 1


def test_carga_por_ficha_errores(client, datos):
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    assert client.post(
        "/usuarios/aprendices/upload/ficha/99", files=_archivo("a.csv", b"x")
    ).status_code == 404
    assert client.post(url, files=_archivo("a.txt", b"x")).status_code == 400

    r = client.post(url, files=_archivo("a.csv", b"Nombre,Apellido\nA,B\n"))
    assert "número de documento" in r.json()["detail"]

    r = client.post(url, files=_archivo("a.csv", b"Numero_Documento,Nombre\n1,A\n"))
    assert "Faltan columnas" in r.json()["detail"]

    otra_ficha = REPORTE_SOFIA.replace("3407184 -", "1111111 -")
    r = client.post(url, files=_archivo("a.csv", otra_ficha.encode()))
    assert "1111111" in r.json()["detail"]


def test_carga_por_ficha_sin_xlrd(client, datos, monkeypatch):
    from routers import carga_aprendices

    def sin_xlrd(*args, **kwargs):
        raise ImportError("xlrd")

    monkeypatch.setattr(carga_aprendices, "_leer_reporte", sin_xlrd)
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    assert client.post(url, files=_archivo("a.xls", b"x")).status_code == 500


def test_carga_por_ficha_error_al_guardar(client, datos, monkeypatch):
    from sqlmodel import Session
    monkeypatch.setattr(Session, "commit", lambda self: (_ for _ in ()).throw(RuntimeError("x")))
    csv = b"Tipo_Documento,Numero_Documento,Nombre,Apellido,Correo\n"
    url = f"/usuarios/aprendices/upload/ficha/{datos['ficha'].Id_Fic}"
    assert client.post(url, files=_archivo("a.csv", csv)).status_code == 500


def test_txt_y_normalizar():
    from routers.carga_aprendices import _txt, _normalizar
    assert _txt(None) == ""
    assert _txt(float("nan")) == ""
    assert _txt("  nan ") == ""
    assert _txt("  Ana   María ") == "Ana María"
    assert _normalizar("Número de Documento") == "numero_de_documento"


# ----------------------------------------------------------------------
# Carga de instructores
# ----------------------------------------------------------------------
def test_carga_instructores_nombre_completo(client, datos):
    csv = (
        "NOMBRES Y APELLIDOS COMPLETOS,TIPO IDENTIFICACION,NUMERO DOCUMENTO,"
        "CORREO ELECTRÓNICO @SENA.EDU.CO,CORREO ELECTRONICO PERSONAL\n"
        "Laura Camila Torres Rios,CC,5001,laura@sena.edu.co,\n"
        "Pedro Gomez Ruiz,,5002,,pedro@gmail.com\n"
        "Ana Diaz,TI,5003,ana@sena.edu.co,\n"
        "Carlos Gomez,CC,2001,instructor@sena.edu.co,\n"  # existe -> actualiza
        ",,,,\n"  # fila vacía -> se ignora
        "Solo,CC,5004,solo@sena.edu.co,\n"
        "Mal Tipo,XX,5005,mt@sena.edu.co,\n"
        "Sin Doc,CC,,sd@sena.edu.co,\n"
        "Doc Malo,CC,abc,dm@sena.edu.co,\n"
        "Sin Correo,CC,5006,,\n"
        "Correo Malo,CC,5007,correo-sin-arroba,\n"
        "Choque Datos,CC,2001,laura@sena.edu.co,\n"
    ).encode()
    r = client.post("/usuarios/instructores/upload", files=_archivo("i.csv", csv))
    cuerpo = r.json()
    assert r.status_code == 200, cuerpo
    assert cuerpo["creadas"] == 3
    assert cuerpo["actualizadas"] == 1
    assert cuerpo["total_errores"] == 7


def test_carga_instructores_nombre_y_apellido_excel(client):
    contenido = _excel([
        {"Nombre": "Ana", "Apellido": "Diaz", "Documento": "6001", "Correo": "a@sena.edu.co"},
        {"Nombre": "", "Apellido": "Diaz", "Documento": "6002", "Correo": "b@sena.edu.co"},
        {"Nombre": "Ana", "Apellido": "", "Documento": "6003", "Correo": "c@sena.edu.co"},
    ])
    r = client.post("/usuarios/instructores/upload", files=_archivo("i.xlsx", contenido))
    assert r.json()["creadas"] == 1
    assert r.json()["total_errores"] == 2


def test_carga_instructores_latin1(client):
    csv = "Nombre,Apellido,Documento,Correo\nÍñigo,Peña,6100,i@sena.edu.co\n".encode("latin-1")
    r = client.post("/usuarios/instructores/upload", files=_archivo("i.csv", csv))
    assert r.json()["creadas"] == 1


def test_carga_instructores_errores_archivo(client, monkeypatch):
    url = "/usuarios/instructores/upload"
    assert client.post(url, files=_archivo("i.txt", b"x")).status_code == 400
    assert client.post(url, files=_archivo("i.xlsx", b"x")).status_code == 400
    r = client.post(url, files=_archivo("i.csv", b"Otra\n1\n"))
    assert len(r.json()["detail"]["columnas_faltantes"]) == 3

    from sqlmodel import Session
    monkeypatch.setattr(Session, "commit", lambda self: (_ for _ in ()).throw(RuntimeError("x")))
    csv = b"Nombre,Apellido,Documento,Correo\n"
    assert client.post(url, files=_archivo("i.csv", csv)).status_code == 500


def test_separar_nombre():
    from routers.carga_instructores import _separar_nombre
    assert _separar_nombre("Ana Diaz") == ("Ana", "Diaz")
    assert _separar_nombre("Ana Diaz Ruiz") == ("Ana", "Diaz Ruiz")
    assert _separar_nombre("Ana Maria Diaz Ruiz") == ("Ana Maria", "Diaz Ruiz")
    with pytest.raises(ValueError):
        _separar_nombre("Ana")


def test_instructor_queda_activo_tras_carga(client, session, datos):
    datos["instructor"].Es_Ins = False
    session.add(datos["instructor"])
    session.commit()
    csv = b"Nombre,Apellido,Documento,Correo\nCarlos,Gomez,2001,instructor@sena.edu.co\n"
    client.post("/usuarios/instructores/upload", files=_archivo("i.csv", csv))
    session.expire_all()
    assert session.get(Instructor, 1).Es_Ins is True
