from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.database import crear_tablas
    from app.routers.login import Router_login
    from app.routers.asistencia import Router_asistencia
    from app.routers.ficha import Router_ficha
    from app.routers.configuracion import Router_configuracion
except ImportError:
    from database import crear_tablas
    from routers.login import Router_login
    from routers.asistencia import Router_asistencia
    from routers.ficha import Router_ficha
    from routers.configuracion import Router_configuracion
 
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(Router_login)
app.include_router(Router_asistencia)
app.include_router(Router_ficha)
app.include_router(Router_configuracion)
 
@app.on_event("startup")
def on_startup():
    crear_tablas() 