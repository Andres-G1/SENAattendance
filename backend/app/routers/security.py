import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_contraseña(contraseña: str) -> str:
    return pwd_context.hash(contraseña)


def verificar_contraseña(contraseña_plana: str, contraseña_hash: str) -> bool:
    return pwd_context.verify(contraseña_plana, contraseña_hash)


SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Falta la variable SECRET_KEY en el archivo .env")
ALGORITHM = "HS256"
EXPIRACION_MINUTOS = 60 * 8


def crear_token(datos: dict) -> str:
    datos_copia = datos.copy()
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=EXPIRACION_MINUTOS)
    datos_copia.update({"exp": expiracion})
    return jwt.encode(datos_copia, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido")