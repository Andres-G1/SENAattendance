"""Pruebas de seguridad, login, recuperación de contraseña y configuración de perfil."""
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from werkzeug.security import generate_password_hash

import dependencias
import limiter as limiter_login
import main
import security
from conftest import PASSWORD
from models.model import Aprendiz, Instructor, Administrador
from routers import recuperarcontraseña
from security import verificar_contraseña


# ----------------------------------------------------------------------
# security.py
# ----------------------------------------------------------------------
def test_hash_y_verificacion_bcrypt():
    hash_ = security.hash_contraseña("secreta")
    assert hash_ != "secreta"
    assert verificar_contraseña("secreta", hash_)
    assert not verificar_contraseña("otra", hash_)


def test_verificacion_scrypt_de_werkzeug():
    hash_ = generate_password_hash("legacy", method="scrypt")
    assert verificar_contraseña("legacy", hash_)
    assert not verificar_contraseña("mala", hash_)


def test_verificacion_texto_plano_legacy():
    assert verificar_contraseña("1234", "1234")
    assert not verificar_contraseña("1234", "9999")
    assert not verificar_contraseña("1234", None)


def test_token_valido():
    token = security.crear_token({"sub": "5", "role": "Aprendiz"})
    datos = security.verificar_token(token)
    assert datos["sub"] == "5"
    assert datos["role"] == "Aprendiz"


def test_token_expirado():
    vencido = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        security.SECRET_KEY, algorithm=security.ALGORITHM,
    )
    with pytest.raises(ValueError, match="expirado"):
        security.verificar_token(vencido)


def test_token_invalido():
    with pytest.raises(ValueError, match="inválido"):
        security.verificar_token("esto-no-es-un-token")


# ----------------------------------------------------------------------
# dependencias.py
# ----------------------------------------------------------------------
def _cred(datos):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=security.crear_token(datos))


@pytest.mark.parametrize("role, clave", [
    ("Aprendiz", "aprendiz"),
    ("Instructor", "instructor"),
    ("Coordinador", "admin"),
])
def test_usuario_actual_por_rol(session, datos, role, clave):
    usuario = datos[clave]
    user_id = usuario.Id_Apr if role == "Aprendiz" else (
        usuario.Id_Ins if role == "Instructor" else usuario.Id_Adm
    )
    resultado, rol = dependencias.obtener_usuario_actual(
        _cred({"sub": str(user_id), "role": role}), session
    )
    assert rol == role


@pytest.mark.parametrize("role, modelo, campo", [
    ("Aprendiz", Aprendiz, "Es_Apr"),
    ("Instructor", Instructor, "Es_Ins"),
    ("Coordinador", Administrador, "Es_Adm"),
])
def test_usuario_actual_inactivo(session, datos, role, modelo, campo):
    usuario = session.get(modelo, 1)
    setattr(usuario, campo, False)
    session.commit()
    with pytest.raises(HTTPException) as exc:
        dependencias.obtener_usuario_actual(_cred({"sub": "1", "role": role}), session)
    assert exc.value.status_code == 401


def test_usuario_actual_token_malo(session):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="basura")
    with pytest.raises(HTTPException) as exc:
        dependencias.obtener_usuario_actual(cred, session)
    assert exc.value.status_code == 401


def test_usuario_actual_token_sin_rol(session):
    with pytest.raises(HTTPException) as exc:
        dependencias.obtener_usuario_actual(_cred({"sub": "1"}), session)
    assert exc.value.detail == "Token inválido"


def test_usuario_actual_rol_desconocido(session):
    with pytest.raises(HTTPException) as exc:
        dependencias.obtener_usuario_actual(_cred({"sub": "1", "role": "Hacker"}), session)
    assert exc.value.detail == "Rol no válido"


def test_verificar_administrador(datos):
    admin = datos["admin"]
    assert dependencias.verificar_administrador((admin, "Coordinador")) is admin
    with pytest.raises(HTTPException) as exc:
        dependencias.verificar_administrador((datos["aprendiz"], "Aprendiz"))
    assert exc.value.status_code == 403


# ----------------------------------------------------------------------
# login.py
# ----------------------------------------------------------------------
@pytest.mark.parametrize("documento, role, redirect", [
    (1001, "Aprendiz", "/aprendiz"),
    (2001, "Instructor", "/instructor"),
    (3001, "Coordinador", "/administrador"),
])
def test_login_exitoso(client, datos, documento, role, redirect):
    r = client.post("/users/login", json={"typeid": "CC", "id": documento, "password": PASSWORD})
    assert r.status_code == 200
    cuerpo = r.json()
    assert cuerpo["role"] == role
    assert cuerpo["redirect"] == redirect
    assert cuerpo["access_token"]


@pytest.mark.parametrize("documento", [1001, 2001, 3001])
def test_login_contraseña_incorrecta(client, datos, documento):
    r = client.post("/users/login", json={"typeid": "CC", "id": documento, "password": "mala"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Credenciales inválidas"


@pytest.mark.parametrize("modelo, campo, documento", [
    (Aprendiz, "Es_Apr", 1001),
    (Instructor, "Es_Ins", 2001),
    (Administrador, "Es_Adm", 3001),
])
def test_login_cuenta_inactiva(client, session, datos, modelo, campo, documento):
    usuario = session.get(modelo, 1)
    setattr(usuario, campo, False)
    session.commit()
    r = client.post("/users/login", json={"typeid": "CC", "id": documento, "password": PASSWORD})
    assert r.status_code == 401


def test_login_usuario_inexistente(client, datos):
    r = client.post("/users/login", json={"typeid": "CC", "id": 999999, "password": PASSWORD})
    assert r.status_code == 401


def test_login_rate_limit_responde_429(client, datos):
    limiter_login.limiter.enabled = True
    for _ in range(8):
        client.post("/users/login", json={"typeid": "CC", "id": 1, "password": "x"})
    r = client.post("/users/login", json={"typeid": "CC", "id": 1, "password": "x"})
    assert r.status_code == 429
    assert "Demasiados intentos" in r.json()["detail"]


def test_manejador_rate_limit_con_segundos():
    class Exc:
        clear_in = 45
        detail = "x"

    r = main.manejador_rate_limit_personalizado(None, Exc())
    assert r.status_code == 429
    assert b"45 segundos" in r.body


def test_manejador_rate_limit_sin_clear_in():
    class Exc:
        detail = "x"

    r = main.manejador_rate_limit_personalizado(None, Exc())
    assert b"10 minutos" in r.body


def test_startup_crea_tablas_y_arranca_scheduler(monkeypatch):
    llamado = {}
    monkeypatch.setattr(main, "crear_tablas", lambda: llamado.setdefault("tablas", True))
    monkeypatch.setattr(main.scheduler, "start", lambda: llamado.setdefault("scheduler", True))
    main.on_startup()
    assert llamado == {"tablas": True, "scheduler": True}


# ----------------------------------------------------------------------
# recuperarcontraseña.py
# ----------------------------------------------------------------------
@pytest.mark.parametrize("correo, modelo, campo", [
    ("aprendiz@sena.edu.co", Aprendiz, "Con_Apr"),
    ("instructor@sena.edu.co", Instructor, "Con_Ins"),
    ("admin@sena.edu.co", Administrador, "Con_Adm"),
])
def test_recuperar_password(client, session, datos, correo_falso, correo, modelo, campo):
    antes = getattr(session.get(modelo, 1), campo)
    r = client.post("/users/password", json={"email": correo})
    assert r.status_code == 200
    session.expire_all()
    assert getattr(session.get(modelo, 1), campo) != antes
    assert correo_falso.enviados == [correo]


@pytest.mark.parametrize("correo, modelo, campo", [
    ("aprendiz@sena.edu.co", Aprendiz, "Es_Apr"),
    ("instructor@sena.edu.co", Instructor, "Es_Ins"),
    ("admin@sena.edu.co", Administrador, "Es_Adm"),
])
def test_recuperar_password_cuenta_inactiva(client, session, datos, correo, modelo, campo):
    setattr(session.get(modelo, 1), campo, False)
    session.commit()
    r = client.post("/users/password", json={"email": correo})
    assert r.status_code == 401


def test_recuperar_password_correo_no_registrado(client, datos):
    r = client.post("/users/password", json={"email": "nadie@sena.edu.co"})
    assert r.status_code == 404


def test_recuperar_password_correo_invalido(client):
    r = client.post("/users/password", json={"email": "no-es-correo"})
    assert r.status_code == 422


def test_generar_password_temporal():
    clave = recuperarcontraseña.generar_password_temporal(12)
    assert len(clave) == 12
    assert clave.isalnum()


def test_correo_recuperacion_falla_sin_romper(correo_falso, capsys):
    correo_falso.fallar = True
    recuperarcontraseña.enviar_correo_recovery_bg("x@sena.edu.co", "abc", "Ana")
    assert "Error crítico" in capsys.readouterr().out


# ----------------------------------------------------------------------
# configuracion.py
# ----------------------------------------------------------------------
@pytest.mark.parametrize("role, id_", [("aprendiz", 1), ("instructor", 1), ("coordinador", 1)])
def test_actualizar_perfil(client, datos, role, id_):
    r = client.put(f"/users/{role}/{id_}/perfil", json={
        "nombre": "Nuevo", "apellido": "Apellido", "correo": f"nuevo.{role}@sena.edu.co",
    })
    assert r.status_code == 200
    usuario = r.json()["usuario"]
    assert "Nuevo" in usuario.values()
    assert f"nuevo.{role}@sena.edu.co" in usuario.values()


def test_actualizar_perfil_busca_por_documento(client, datos):
    r = client.put("/users/admin/3001/perfil", json={"nombre": "Laurita"})
    assert r.status_code == 200
    assert r.json()["usuario"]["Nom_Adm"] == "Laurita"


def test_actualizar_perfil_rol_invalido(client, datos):
    r = client.put("/users/hacker/1/perfil", json={"nombre": "x"})
    assert r.status_code == 400


def test_actualizar_perfil_usuario_no_existe(client, datos):
    r = client.put("/users/aprendiz/777/perfil", json={"nombre": "x"})
    assert r.status_code == 404


@pytest.mark.parametrize("role", ["aprendiz", "instructor", "administrador"])
def test_cambiar_contrasena(client, datos, role):
    r = client.put("/users/cambiar-contrasena", json={
        "role": role, "user_id": 1,
        "contraseña_actual": PASSWORD, "contraseña_nueva": "NuevaClave1",
    })
    assert r.status_code == 200


def test_cambiar_contrasena_actual_incorrecta(client, datos):
    r = client.put("/users/cambiar-contrasena", json={
        "role": "aprendiz", "user_id": 1,
        "contraseña_actual": "mala", "contraseña_nueva": "NuevaClave1",
    })
    assert r.status_code == 401
