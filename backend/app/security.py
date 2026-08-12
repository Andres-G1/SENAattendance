from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashear_contraseña(contraseña: str) -> str:
    return pwd_context.hash(contraseña)


def verificar_contraseña(contraseña_plano: str, contraseña_hash: str) -> bool:
    return pwd_context.verify(contraseña_plano, contraseña_hash)