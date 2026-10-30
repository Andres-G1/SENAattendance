# limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address

# Una única instancia global para todo tu backend
limiter = Limiter(key_func=get_remote_address)
