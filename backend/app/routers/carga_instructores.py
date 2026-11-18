from io import BytesIO
import unicodedata

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from database import get_session
from models.model import Instructor, TipoIdentificacion
from security import hash_contraseña


Router_carga_instructores = APIRouter(
    prefix="/usuarios/instructores",
    tags=["Carga de Instructores"]
)


# =========================================================
# UTILIDADES
# =========================================================
def _normalizar(texto) -> str:
    """'CORREO ELECTRÓNICO @SENA.EDU.CO' -> 'CORREO ELECTRONICO @SENA.EDU.CO'
    (sin tildes, mayúsculas, espacios simples) para comparar encabezados."""
    texto = unicodedata.normalize("NFKD", str(texto))
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return " ".join(texto.upper().replace("_", " ").split())


def _texto(valor) -> str:
    """Convierte una celda a texto limpio; las celdas vacías (NaN) quedan ''."""
    if pd.isna(valor):
        return ""
    return str(valor).strip()


# Alias aceptados por cada campo (ya normalizados).
# Sirve tanto para el formato "limpio" (Tipo_Identificacion, Nombre...)
# como para el Excel que entrega el coordinador.
ALIAS = {
    "nombre_completo": ["NOMBRES Y APELLIDOS COMPLETOS", "NOMBRE COMPLETO"],
    "nombre": ["NOMBRE", "NOMBRES"],
    "apellido": ["APELLIDO", "APELLIDOS"],
    "tipo": ["TIPO IDENTIFICACION", "TIPO DOCUMENTO"],
    "documento": ["NUMERO IDENTIFICACION", "NUMERO DOCUMENTO", "DOCUMENTO"],
    # Se prefiere el correo institucional; el personal es solo respaldo.
    "correo": [
        "CORREO ELECTRONICO @SENA.EDU.CO",
        "CORREO INSTITUCIONAL",
        "CORREO",
    ],
    "correo_respaldo": ["CORREO ELECTRONICO PERSONAL"],
}


def _mapear_columnas(columnas) -> dict:
    """Devuelve {campo: nombre_real_de_columna} según los alias."""
    por_normalizado = {_normalizar(c): c for c in columnas}
    mapa = {}
    for campo, alias in ALIAS.items():
        for a in alias:
            if a in por_normalizado:
                mapa[campo] = por_normalizado[a]
                break
    return mapa


def _separar_nombre(nombre_completo: str):
    """Separa 'Laura Camila Torres Ríos' en ('Laura Camila', 'Torres Ríos').
    Regla: 4+ palabras -> 2 nombres + resto apellidos; 3 -> 1 nombre + 2
    apellidos; 2 -> 1 nombre + 1 apellido."""
    partes = nombre_completo.split()
    if len(partes) < 2:
        raise ValueError(
            "El nombre completo debe tener al menos nombre y apellido"
        )
    if len(partes) == 2:
        corte = 1
    elif len(partes) == 3:
        corte = 1
    else:
        corte = 2
    return " ".join(partes[:corte]), " ".join(partes[corte:])


# =========================================================
# CARGAR INSTRUCTORES DESDE CSV / EXCEL
# =========================================================
@Router_carga_instructores.post("/upload")
async def cargar_instructores(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # -----------------------------------------------------
    # 1. VALIDAR ARCHIVO
    # -----------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No se recibió ningún archivo"
        )

    nombre_archivo = file.filename.lower()

    if not nombre_archivo.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos CSV, XLSX o XLS"
        )

    # -----------------------------------------------------
    # 2. LEER ARCHIVO (todo como texto para no perder datos)
    # -----------------------------------------------------
    contenido = await file.read()

    try:
        if nombre_archivo.endswith(".csv"):
            try:
                texto = contenido.decode("utf-8-sig")
            except UnicodeDecodeError:
                texto = contenido.decode("latin-1")
            datos = pd.read_csv(BytesIO(texto.encode("utf-8")), dtype=str)
        else:
            datos = pd.read_excel(BytesIO(contenido), dtype=str)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo leer el archivo: {str(e)}"
        )

    # -----------------------------------------------------
    # 3. IDENTIFICAR COLUMNAS (acepta ambos formatos)
    # -----------------------------------------------------
    cols = _mapear_columnas(datos.columns)

    tiene_nombre = (
        "nombre_completo" in cols
        or ("nombre" in cols and "apellido" in cols)
    )

    faltantes = []
    if not tiene_nombre:
        faltantes.append("Nombres y apellidos completos (o Nombre y Apellido)")
    if "documento" not in cols:
        faltantes.append("Numero documento")
    if "correo" not in cols and "correo_respaldo" not in cols:
        faltantes.append("Correo electrónico")

    if faltantes:
        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": "El archivo no tiene todas las columnas requeridas",
                "columnas_faltantes": faltantes
            }
        )

    # -----------------------------------------------------
    # 4. PROCESAR FILAS
    # -----------------------------------------------------
    creadas = 0
    actualizadas = 0
    errores = []
    tipos_validos = [t.value for t in TipoIdentificacion]

    for numero_fila, fila in datos.iterrows():
        fila_excel = numero_fila + 2  # la fila 1 son los encabezados

        # Ignorar filas completamente vacías
        if all(_texto(v) == "" for v in fila.values):
            continue

        try:
            # ---- Nombre y apellido ----
            if "nombre_completo" in cols:
                nombre, apellido = _separar_nombre(
                    _texto(fila[cols["nombre_completo"]])
                )
            else:
                nombre = _texto(fila[cols["nombre"]])
                apellido = _texto(fila[cols["apellido"]])

            if not nombre:
                raise ValueError("El nombre está vacío")
            if not apellido:
                raise ValueError("El apellido está vacío")

            # ---- Documento ----
            documento = _texto(fila[cols["documento"]])
            if not documento:
                raise ValueError("El número de identificación está vacío")
            try:
                documento = int(float(documento))
            except ValueError:
                raise ValueError(
                    "El número de identificación debe ser numérico"
                )

            # ---- Tipo de identificación (si no viene, se asume CC) ----
            tipo = "CC"
            if "tipo" in cols:
                valor_tipo = _texto(fila[cols["tipo"]]).upper()
                if valor_tipo:
                    tipo = valor_tipo
            if tipo not in tipos_validos:
                raise ValueError(
                    "Tipo de identificación inválido. "
                    f"Valores permitidos: {', '.join(tipos_validos)}"
                )
            tipo_enum = TipoIdentificacion(tipo)

            # ---- Correo: institucional; si falta, el personal ----
            correo = ""
            if "correo" in cols:
                correo = _texto(fila[cols["correo"]]).lower()
            if not correo and "correo_respaldo" in cols:
                correo = _texto(fila[cols["correo_respaldo"]]).lower()
            if not correo:
                raise ValueError("El correo está vacío")
            if "@" not in correo:
                raise ValueError("El correo no es válido")

            # ---- Buscar existente (documento o correo) ----
            por_documento = session.exec(
                select(Instructor).where(Instructor.Num_ide_Ins == documento)
            ).first()
            por_correo = session.exec(
                select(Instructor).where(Instructor.Cor_Ins == correo)
            ).first()

            if (
                por_documento
                and por_correo
                and por_documento.Id_Ins != por_correo.Id_Ins
            ):
                raise ValueError(
                    "El número de identificación pertenece a un instructor "
                    "y el correo pertenece a otro instructor"
                )

            instructor = por_documento or por_correo

            # Savepoint por fila: si esta fila falla, solo se deshace ella
            # y las anteriores siguen intactas. El flush hace que la
            # siguiente fila vea esta (evita duplicados dentro del archivo).
            with session.begin_nested():
                if instructor:
                    instructor.Nom_Ins = nombre
                    instructor.Ape_Ins = apellido
                    instructor.Tip_ide_Ins = tipo_enum
                    instructor.Num_ide_Ins = documento
                    instructor.Cor_Ins = correo
                    instructor.Es_Ins = True
                    session.add(instructor)
                    es_nuevo = False
                else:
                    session.add(Instructor(
                        Nom_Ins=nombre,
                        Ape_Ins=apellido,
                        Tip_ide_Ins=tipo_enum,
                        Num_ide_Ins=documento,
                        Cor_Ins=correo,
                        # Contraseña inicial: número de identificación
                        Con_Ins=hash_contraseña(str(documento)),
                        Es_Ins=True
                    ))
                    es_nuevo = True
                session.flush()

            if es_nuevo:
                creadas += 1
            else:
                actualizadas += 1

        except Exception as e:
            errores.append({"fila": fila_excel, "error": str(e)})

    # -----------------------------------------------------
    # 5. GUARDAR CAMBIOS
    # -----------------------------------------------------
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error guardando los instructores: {str(e)}"
        )

    return {
        "mensaje": "Archivo procesado correctamente",
        "archivo": file.filename,
        "procesadas": len(datos),
        "creadas": creadas,
        "actualizadas": actualizadas,
        "errores": errores,
        "total_errores": len(errores)
    }