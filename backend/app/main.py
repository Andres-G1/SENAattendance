from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from database import crear_tablas
from routers.login import Router_login
from routers.asistencia import Router_asistencia
from routers.ficha import Router_ficha
 
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
 
@app.on_event("startup")
def on_startup():
    crear_tablas()