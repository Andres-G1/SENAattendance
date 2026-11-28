# SENA Attendance

Sistema web para la **gestión de asistencia de aprendices del SENA**. El instructor toma la asistencia en línea, y el sistema calcula el riesgo de deserción de cada aprendiz con un semáforo y envía alertas automáticas por correo. El coordinador administra usuarios, fichas, asignaciones y reportes desde un solo lugar.

Proyecto formativo del programa **Análisis y Desarrollo de Software (ADSO)** — SENA, Ficha 3407184.

---

## Tabla de contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Pruebas](#pruebas)
- [Reglas de negocio](#reglas-de-negocio)
- [Endpoints principales](#endpoints-principales)
- [Equipo](#equipo)

---

## Funcionalidades

### Acceso
- Inicio de sesión con **rol** (Aprendiz, Instructor o Coordinador), tipo y número de documento y contraseña.
- Token **JWT** válido por 8 horas y contraseñas cifradas con **bcrypt**.
- Límite de intentos: 8 inicios de sesión cada 10 minutos por IP.
- Recuperación de contraseña: se envía una contraseña temporal al correo registrado.
- Cambio de contraseña y actualización del perfil.

### Coordinador
- Gestión de **aprendices, instructores y coordinadores**: crear, editar, activar e inactivar.
- Gestión de **programas (carreras), competencias y resultados de aprendizaje**.
- Gestión de **fichas**: crear, editar, eliminar y **activar o desactivar**, con filtro por estado (Activas, Desactivadas, Todas).
- Asociación de aprendices a fichas.
- Asignación de instructores y resultados de aprendizaje por **día de la semana** y periodo (máximo 3 resultados por día).
- **Carga masiva** desde archivos `.csv`, `.xlsx` o `.xls`.
- Consulta de asistencia por ficha con semáforo de riesgo y **exportación a PDF**.
- Recibe un correo cuando un instructor no hace el llamado a lista.

### Instructor
- Consulta de sus fichas asignadas y de los aprendices con alerta.
- **Llamado a lista**: marca a cada aprendiz como Presente, Falla, Retardo o Excusa.
- Revisión de la asistencia de la ficha y exportación a PDF.

### Aprendiz
- Resumen de su asistencia y **semáforo de riesgo**.
- Historial de **fallas y novedades** (fallas, retardos y excusas).
- Consulta de la asistencia de su ficha.
- Recibe alertas por correo cuando está en riesgo de deserción.

### Procesos automáticos
- **Alertas de deserción** por correo al aprendiz cuando acumula **5 fallas** o completa **3 días seguidos** sin asistir.
- **Tarea diaria a las 10:00 p. m.** (APScheduler): revisa las listas que no se llamaron y avisa a los coordinadores.

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Bootstrap 5 |
| Backend | Python 3.12, FastAPI, SQLModel, PyMySQL, PyJWT, bcrypt, SlowAPI, APScheduler, ReportLab, pandas |
| Base de datos | MySQL 8 |
| Correo | Servidor SMTP con TLS (Gmail, Brevo, etc.) |
| Pruebas | Pytest, pytest-cov, Locust (carga) |
| Herramientas | uv (gestor de Python), npm, oxlint |

---

## Arquitectura

Es un **monolito modular por capas**: una SPA en React consume una API REST en FastAPI, que guarda los datos en MySQL y envía correos por SMTP.

```
┌──────────────┐   HTTPS + JWT   ┌────────────────────────────┐   SQLModel   ┌──────────┐
│  React SPA   │ ──────────────► │  API REST (FastAPI)        │ ───────────► │  MySQL   │
│  (Vite)      │ ◄────────────── │  · routers por módulo      │              └──────────┘
└──────────────┘      JSON       │  · tarea 10:00 p. m.       │   SMTP/TLS   ┌──────────┐
                                 │    (APScheduler)           │ ───────────► │  Correo  │
                                 └────────────────────────────┘              └──────────┘
```

---

## Estructura del proyecto

```
SENAattendance/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Punto de entrada FastAPI + CORS + scheduler
│   │   ├── database.py             # Conexión a MySQL
│   │   ├── security.py             # JWT y cifrado de contraseñas
│   │   ├── dependencias.py         # Validación de usuario y rol
│   │   ├── limiter.py              # Límite de peticiones (SlowAPI)
│   │   ├── jobs_asistencia.py      # Tarea diaria de listas no llamadas
│   │   ├── seed.py                 # Usuarios de prueba
│   │   ├── models/model.py         # Tablas (SQLModel)
│   │   └── routers/                # Endpoints por módulo
│   │       ├── login.py, recuperarcontraseña.py, Usuarios.py
│   │       ├── carrera.py, ficha.py, competencia.py, resultado_aprendizaje.py
│   │       ├── asignaciones.py, asignacionaprendiz.py
│   │       ├── asistencia.py, asistencia_calculo.py, asistencia_notificaciones.py
│   │       ├── asistencia_pdf.py
│   │       └── carga_*.py          # Carga masiva de archivos
│   ├── tests/                      # Pruebas con Pytest
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/
│   ├── src/
│   │   ├── components/             # Login, navbars, footer, rutas protegidas
│   │   ├── pages/                  # Aprendiz, Instructor, Coordinador, Ficha, ...
│   │   ├── services/               # Llamadas a la API (axios / fetch)
│   │   └── styles/
│   ├── public/
│   └── package.json
├── locustfile.py                   # Prueba de carga
└── package.json                    # Atajos para ejecutar frontend y backend
```

---

## Requisitos previos

- **Python 3.12** o superior
- **[uv](https://docs.astral.sh/uv/)** para instalar las dependencias de Python
- **Node.js 20** o superior y **npm**
- **MySQL 8** (local con XAMPP/MySQL Server, o en la nube como TiDB Cloud)
- Una cuenta SMTP para enviar correos (opcional en desarrollo)

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Andres-G1/SENAattendance.git
cd SENAattendance
```

### 2. Crear la base de datos

En MySQL:

```sql
CREATE DATABASE SENAattendance;
```

El backend crea las tablas automáticamente al arrancar. Si la base de datos ya existía antes de que se agregara la activación de fichas, ejecuta una vez `MIGRACION_Es_Fic.sql` para añadir la columna `Es_Fic`.

### 3. Backend

```bash
cd backend
uv sync                      # instala las dependencias
# crea el archivo backend/.env (ver "Variables de entorno")
uv run python app/seed.py    # opcional: crea los usuarios de prueba
uv run fastapi dev app/main.py
```

La API queda en `http://localhost:8000` y su documentación interactiva en `http://localhost:8000/docs`.

### 4. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

> También puedes usar los atajos desde la raíz: `npm run dev:backend` y `npm run dev:frontend`.

---

## Variables de entorno

Crea el archivo `backend/.env`. **No lo subas al repositorio**: ya está en `.gitignore`.

```env
# Conexión a MySQL
DATABASE_URL=mysql+pymysql://USUARIO:CONTRASEÑA@localhost:3306/SENAattendance

# Clave para firmar los tokens JWT (usa una cadena larga y aleatoria)
SECRET_KEY=cambia-esta-clave

# Correo (opcional en desarrollo: si no se configura, no se envían correos)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=correo@ejemplo.com
SMTP_PASSWORD=contraseña-de-aplicacion
```

> ⚠️ Nunca compartas el contenido real del `.env` en documentos, capturas ni commits. Si se filtra, cambia la `SECRET_KEY` y la contraseña del correo.

La URL de la API está en `frontend/src/services/api.js` (`http://localhost:8000`). Si despliegas el backend en otro dominio, cámbiala ahí y agrega el dominio del frontend a `allow_origins` en `backend/app/main.py`.

---

## Usuarios de prueba

Los crea `seed.py`. En el login se elige el rol y el tipo de documento **CC**.

| Rol | Documento | Contraseña |
|---|---|---|
| Aprendiz | 1001 | aprendiz123 |
| Instructor | 2001 | instructor123 |
| Coordinador | 3001 | admin123 |

> Solo para desarrollo. No los uses en producción.

---

## Pruebas

```bash
cd backend
uv run pytest                 # ejecuta todas las pruebas
uv run pytest --cov=app       # con reporte de cobertura
```

Las pruebas usan una base de datos SQLite en memoria, así que no necesitan MySQL.

Prueba de carga con Locust (con el backend en ejecución):

```bash
locust -f locustfile.py --host http://localhost:8000
```

Lint del frontend:

```bash
cd frontend
npm run lint
```

---

## Reglas de negocio

| Regla | Detalle |
|---|---|
| Estados de asistencia | Presente, Falla, Retardo, Excusa |
| Semáforo | 🟢 Verde: 0 a 3 fallas · 🟡 Amarillo: 4 fallas · 🔴 Rojo: 5 o más |
| Alerta por acumulado | Al llegar a **5 fallas** se envía un correo al aprendiz |
| Alerta por racha | Al completar **3 días seguidos** con todas las sesiones en Falla |
| Excusas | No suman al acumulado de fallas |
| Registro duplicado | Si ya existe la asistencia de esa sesión, se actualiza en lugar de duplicarse |
| Fechas válidas | Debe coincidir con el día asignado, no puede ser domingo y debe estar dentro del periodo de la ficha y del resultado de aprendizaje |
| Asignaciones | Máximo 3 resultados de aprendizaje por día |
| Ficha desactivada | Conserva su historial, pero no admite asistencia, asignaciones ni avisos |
| Lista no llamada | Se revisa todos los días a las 10:00 p. m. y se avisa a los coordinadores |

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users/login` | Iniciar sesión (con `rol` opcional) |
| POST | `/users/password` | Enviar contraseña temporal al correo |
| GET/POST/PUT | `/usuarios/...` | Gestión de usuarios |
| GET/POST/PUT/DELETE | `/carreras/` | Programas de formación |
| GET/POST/PUT/DELETE | `/fichas/` | Fichas (`?estado=activas\|desactivadas\|todas`) |
| PATCH | `/fichas/{id}/desactivar` · `/fichas/{id}/activar` | Cambiar el estado de una ficha |
| POST | `/asignaciones/instructor` | Asignar instructor y resultados por día |
| POST | `/asistencia` | Registrar o actualizar asistencia |
| GET | `/asistencia/aprendiz/{id}/estado` | Semáforo y conteos del aprendiz |
| GET | `/asistencia/pdf/ficha/{id}` | Reporte de asistencia de la ficha en PDF |

La lista completa está en `http://localhost:8000/docs`.

---

## Equipo

Proyecto desarrollado por aprendices de ADSO — SENA, Ficha 3407184:

- Cristian Camilo Rojas Vesga
- Alejandro Matoma
- Samuel Bravo
- Sebastián González
- Maday Espinosa