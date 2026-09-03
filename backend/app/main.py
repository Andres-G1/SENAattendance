from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import crear_tablas
from routers.login import Router_login
from routers.asistencia import Router_asistencia
from routers.ficha import Router_ficha
from routers.carrera import Router_carrera
from routers.competencias import Router_competencia
from routers.Usuarios import Router_usuarios
from routers.asignaciones import Router_asignaciones
from routers.carga_instructores import Router_carga_instructores

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(Router_login)
app.include_router(Router_asistencia)
app.include_router(Router_ficha)
app.include_router(Router_carrera)
app.include_router(Router_competencia)
app.include_router(Router_usuarios)
app.include_router(Router_asignaciones)
app.include_router(Router_carga_instructores)

@app.on_event("startup")
def on_startup():
    crear_tablas()