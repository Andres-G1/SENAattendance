from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

# --- Contraseñas ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_contraseña(contraseña: str) -> str:
    return pwd_context.hash(contraseña)


def verificar_contraseña(contraseña_plana: str, contraseña_hash: str) -> bool:
    return pwd_context.verify(contraseña_plana, contraseña_hash)


# --- Tokens (reemplazan las sesiones de Flask) ---
SECRET_KEY = "cambia-esto-por-una-clave-larga-y-secreta"  # ideal: cargarla desde variable de entorno
ALGORITHM = "HS256"
EXPIRACION_MINUTOS = 60 * 8  # 8 horas


def crear_token(datos: dict) -> str:
    datos_copia = datos.copy()
    expiracion = datetime.utcnow() + timedelta(minutes=EXPIRACION_MINUTOS)
    datos_copia.update({"exp": expiracion})
    return jwt.encode(datos_copia, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido")