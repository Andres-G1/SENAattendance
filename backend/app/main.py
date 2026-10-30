from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import crear_tablas
from jobs_asistencia import scheduler

# Importaciones de Slowapi para el manejo de excepciones de Rate Limit
from slowapi.errors import RateLimitExceeded

# 1. INICIALIZAMOS LA APP PRIMERO
app = FastAPI()

# 2. IMPORTAMOS LOS ROUTERS (Evita que el limiter bloquee las BackgroundTasks)
from routers.login import Router_login
from routers.recuperarcontraseña import router_recovery, limiter  # <-- Importación segura aquí
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
from routers.asignacionaprendiz import Router_asignacionesAprendiz
from routers.resultados_aprendizaje import Router_resultados_aprendizaje
from routers.resultado_aprendizaje import Router_resultado

# =========================================================================
# CONFIGURACIÓN GLOBAL Y PERSONALIZADA DE RATE LIMITING
# =========================================================================
app.state.limiter = limiter

# Interceptamos el error 429 para calcular dinámicamente el tiempo restante
@app.exception_handler(RateLimitExceeded)
def manejador_rate_limit_personalizado(request: Request, exc: RateLimitExceeded):
    """Calcula los minutos y segundos restantes del bloqueo por IP de forma exacta."""
    # Slowapi almacena los segundos que faltan en la propiedad dinámica de la excepción
    segundos_totales = int(exc.clear_in) if hasattr(exc, "clear_in") else 600
    
    # Si por alguna razón no lo lee directamente, intentamos extraerlo del contexto del rate limit
    if segundos_totales == 600 and hasattr(exc, "detail") and exc.detail:
        try:
            # Fallback secundario seguro
            segundos_totales = int(exc.clear_in)
        except:
            pass

    minutos = segundos_totales // 60
    segundos = segundos_totales % 60

    if minutos > 0:
        tiempo_texto = f"{minutos} minutos y {segundos} segundos"
    else:
        tiempo_texto = f"{segundos} segundos"

    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Demasiados intentos fallidos. Por favor, espere {tiempo_texto} antes de intentar ingresar nuevamente."
        }
    )


# Configuración de CORS para permitir la conexión desde React (Vite)
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

# Inclusión de todos tus routers
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
app.include_router(Router_resultado)


@app.on_event("startup")
def on_startup():
    crear_tablas()
    scheduler.start()
