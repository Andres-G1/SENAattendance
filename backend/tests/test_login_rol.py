"""Pruebas del login con selección de rol."""
import pytest

from conftest import PASSWORD
from models.model import Administrador, TipoIdentificacion


@pytest.mark.parametrize("documento, rol, redirect", [
    (1001, "Aprendiz", "/aprendiz"),
    (2001, "Instructor", "/instructor"),
    (3001, "Coordinador", "/administrador"),
])
def test_login_con_rol_correcto(client, datos, documento, rol, redirect):
    r = client.post("/users/login", json={"typeid": "CC", "id": documento, "password": PASSWORD, "rol": rol})
    assert r.status_code == 200
    assert r.json()["role"] == rol
    assert r.json()["redirect"] == redirect


@pytest.mark.parametrize("documento, rol", [
    (1001, "Instructor"),   # un aprendiz intentando entrar como instructor
    (2001, "Coordinador"),  # un instructor intentando entrar como coordinador
    (3001, "Aprendiz"),     # un coordinador intentando entrar como aprendiz
])
def test_login_con_rol_equivocado(client, datos, documento, rol):
    r = client.post("/users/login", json={"typeid": "CC", "id": documento, "password": PASSWORD, "rol": rol})
    assert r.status_code == 401
    assert r.json()["detail"] == "Credenciales inválidas"


def test_login_rol_invalido(client, datos):
    r = client.post("/users/login", json={"typeid": "CC", "id": 1001, "password": PASSWORD, "rol": "Admin"})
    assert r.status_code == 422


def test_mismo_documento_en_dos_roles(client, session, datos):
    """Si una persona es instructor y coordinador con el mismo documento, el rol decide."""
    session.add(Administrador(
        Nom_Adm="Carlos", Ape_Adm="Gomez", Tip_ide_Adm=TipoIdentificacion.CC,
        Num_ide_Adm=2001, Cor_Adm="carlos.coord@sena.edu.co",
        Con_Adm=datos["instructor"].Con_Ins,
    ))
    session.commit()

    base = {"typeid": "CC", "id": 2001, "password": PASSWORD}
    assert client.post("/users/login", json={**base, "rol": "Instructor"}).json()["role"] == "Instructor"
    assert client.post("/users/login", json={**base, "rol": "Coordinador"}).json()["role"] == "Coordinador"
    # Sin rol se conserva el orden anterior (primero instructor)
    assert client.post("/users/login", json=base).json()["role"] == "Instructor"
