from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from database import crear_tablas  # noqa: E402
from jobs_asistencia import scheduler  # noqa: E402

# Importaciones de Slowapi para el manejo de excepciones de Rate Limit
from slowapi.errors import RateLimitExceeded  # noqa: E402

# 1. INICIALIZAMOS LA APP PRIMERO
app = FastAPI()

# 2. IMPORTAMOS LOS ROUTERS (Evita que el limiter bloquee las BackgroundTasks)
from routers.login import Router_login  # noqa: E402
from routers.recuperarcontraseña import router_recovery, limiter  # noqa: E402
from routers.asistencia import Router_asistencia  # noqa: E402
from routers.asistencia_pdf import Router_asistencia_pdf  # noqa: E402
from routers.ficha import Router_ficha  # noqa: E402
from routers.carrera import Router_carrera  # noqa: E402
from routers.competencias import Router_competencia  # noqa: E402
from routers.Usuarios import Router_usuarios  # noqa: E402
from routers.asignaciones import Router_asignaciones  # noqa: E402
from routers.carga_instructores import Router_carga_instructores  # noqa: E402
from routers.carga_administradores import Router_carga_administradores  # noqa: E402
from routers.carga_aprendices import Router_carga_aprendices  # noqa: E402
from routers.configuracion import Router_configuracion  # noqa: E402
from routers.asignacionaprendiz import Router_asignacionesAprendiz  # noqa: E402
from routers.resultados_aprendizaje import Router_resultados_aprendizaje  # noqa: E402
from routers.resultado_aprendizaje import Router_resultado  # noqa: E402

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
        except Exception:
            pass

    minutos = segundos_totales // 60
    segundos = segundos_totales % 60

    if minutos > 0:
        tiempo_texto = f"{minutos} minutos"
    else:
        tiempo_texto = f"{segundos} segundos"

    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Demasiados intentos fallidos. Por favor, espere "
                f"{tiempo_texto} antes de intentar ingresar nuevamente."
            )
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
app.include_router(Router_asistencia_pdf)
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
