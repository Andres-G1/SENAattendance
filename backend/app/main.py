import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import DATABASE_URL, crear_tablas
from seed import seed_demo_users
from routers.login import Router_login
from routers.recuperarcontraseña import router_recovery
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
from jobs_asistencia import scheduler
from routers.asignacionaprendiz import Router_asignacionesAprendiz
from routers.resultados_aprendizaje import Router_resultados_aprendizaje

app = FastAPI()

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

app.include_router(Router_login)
app.include_router(router_recovery)
app.include_router(Router_asignacionesAprendiz)
app.include_router(Router_asistencia)
app.include_router(Router_ficha)
app.include_router(Router_carrera)
app.include_router(Router_competencia)
app.include_router(Router_usuarios)
app.include_router(Router_asignaciones)
app.include_router(Router_carga_instructores)
app.include_router(Router_carga_administradores)
app.include_router(Router_carga_aprendices)
app.include_router(Router_configuracion)
app.include_router(Router_resultados_aprendizaje)


@app.on_event("startup")
def on_startup():
    crear_tablas()
    if DATABASE_URL.startswith("sqlite") and os.getenv("FASTAPI_ENV") == "development":
        seed_demo_users()
    scheduler.start()