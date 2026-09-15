import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# IMPORTANTE: Importamos tu función de verificar_token
from security import verificar_token 

from database import crear_tablas
from routers.login import Router_login
from routers.asistencia import Router_asistencia
from routers.ficha import Router_ficha
from routers.carrera import Router_carrera
from routers.competencias import Router_competencia
from routers.Usuarios import Router_usuarios
from routers.asignaciones import Router_asignaciones
from routers.carga_instructores import Router_carga_instructores
from routers.carga_administradores import Router_carga_administradores
from routers.carga_aprendices import Router_carga_aprendices
from routers.configuracion import Router_configuracion

app = FastAPI()

# Configuración del esquema de seguridad Bearer
security = HTTPBearer()

# NUEVO: Función guardiana que verifica el token.
# Si lanza tu ValueError("Token expirado"), responde HTTP 401 de inmediato.
def verificar_sesion_activa(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return verificar_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. El Router de Login se queda libre (sin dependencias) para que puedan iniciar sesión
app.include_router(Router_login)

# 2. A todos los demás routers les inyectamos la verificación global:
app.include_router(Router_asistencia, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_ficha, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_carrera, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_competencia, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_usuarios, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_asignaciones, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_carga_instructores, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_carga_administradores, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_carga_aprendices, dependencies=[Depends(verificar_sesion_activa)])
app.include_router(Router_configuracion, dependencies=[Depends(verificar_sesion_activa)])

@app.on_event("startup")
def on_startup():
    crear_tablas()
