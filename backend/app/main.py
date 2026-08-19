import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import crear_tablas, get_session

# Importaciones corregidas usando la ruta completa del paquete app
from app.routers.login import Router_login
from app.routers.asistencia import Router_asistencia
from app.routers.usuarios import Router_usuarios


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
app.include_router(Router_usuarios)


@app.on_event("startup")
def on_startup():
    crear_tablas()