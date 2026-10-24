from datetime import datetime
from io import BytesIO, StringIO
import csv
import re
import unicodedata


import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select


from database import get_session
from models.model import Aprendiz, Fichas, TipoIdentificacion
from security import hash_contraseña




Router_carga_aprendices = APIRouter(
    prefix="/usuarios/aprendices",
    tags=["Carga de Aprendices"]
)




# =========================================================
# CARGAR APRENDICES DESDE CSV / EXCEL
# =========================================================


@Router_carga_aprendices.post("/upload")
async def cargar_aprendices(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):


    # -----------------------------------------------------
    # VALIDAR EXTENSIÓN
    # -----------------------------------------------------


    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No se recibió ningún archivo"
        )


    nombre_archivo = file.filename.lower()


    extensiones_permitidas = (
        ".csv",
        ".xlsx",
        ".xls"
    )


    if not nombre_archivo.endswith(extensiones_permitidas):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos CSV, XLSX o XLS"
        )


    # -----------------------------------------------------
    # LEER ARCHIVO
    # -----------------------------------------------------


    contenido = await file.read()


    try:


        if nombre_archivo.endswith(".csv"):


            # Intentamos UTF-8 primero
            try:
                texto = contenido.decode("utf-8-sig")
            except UnicodeDecodeError:
                texto = contenido.decode("latin-1")


            datos = pd.read_csv(
                BytesIO(texto.encode("utf-8"))
            )


        else:


            datos = pd.read_excel(
                BytesIO(contenido)
            )


    except Exception as e:


        raise HTTPException(
            status_code=400,
            detail=f"No se pudo leer el archivo: {str(e)}"
        )


    # -----------------------------------------------------
    # LIMPIAR NOMBRES DE COLUMNAS
    # -----------------------------------------------------


    datos.columns = [
        str(columna).strip()
        for columna in datos.columns
    ]


    columnas_requeridas = {
        "Tipo_Identificacion",
        "Numero_Identificacion",
        "Nombre",
        "Apellido",
        "Correo",
        "Ficha"
    }


    columnas_archivo = set(datos.columns)


    faltantes = columnas_requeridas - columnas_archivo


    if faltantes:


        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": "El archivo no tiene todas las columnas requeridas",
                "columnas_faltantes": sorted(faltantes)
            }
        )


    # -----------------------------------------------------
    # CONTADORES
    # -----------------------------------------------------


    creadas = 0
    actualizadas = 0
    errores = []


    # -----------------------------------------------------
    # PROCESAR FILAS
    # -----------------------------------------------------


    for numero_fila, fila in datos.iterrows():


        fila_excel = numero_fila + 2


        try:


            tipo_identificacion = str(
                fila["Tipo_Identificacion"]
            ).strip().upper()


            numero_identificacion = str(
                fila["Numero_Identificacion"]
            ).strip()


            nombre = str(
                fila["Nombre"]
            ).strip()


            apellido = str(
                fila["Apellido"]
            ).strip()


            correo = str(
                fila["Correo"]
            ).strip().lower()


            numero_ficha = str(
                fila["Ficha"]
            ).strip()


            # -------------------------------------------------
            # VALIDACIONES BÁSICAS
            # -------------------------------------------------


            if not numero_identificacion:
                raise ValueError(
                    "El número de identificación está vacío"
                )


            if not nombre:
                raise ValueError(
                    "El nombre está vacío"
                )


            if not apellido:
                raise ValueError(
                    "El apellido está vacío"
                )


            if not correo:
                raise ValueError(
                    "El correo está vacío"
                )


            if not numero_ficha:
                raise ValueError(
                    "La ficha está vacía"
                )


            # -------------------------------------------------
            # CONVERTIR DOCUMENTO
            # -------------------------------------------------


            try:
                numero_identificacion = int(
                    float(numero_identificacion)
                )
            except ValueError:
                raise ValueError(
                    "El número de identificación debe ser numérico"
                )


            # -------------------------------------------------
            # CONVERTIR FICHA
            # -------------------------------------------------


            try:
                numero_ficha = int(
                    float(numero_ficha)
                )
            except ValueError:
                raise ValueError(
                    "El número de ficha debe ser numérico"
                )


            # -------------------------------------------------
            # VALIDAR TIPO DE IDENTIFICACIÓN
            # -------------------------------------------------


            tipos_validos = [
                tipo.value
                for tipo in TipoIdentificacion
            ]


            if tipo_identificacion not in tipos_validos:


                raise ValueError(
                    f"Tipo de identificación inválido. "
                    f"Valores permitidos: {', '.join(tipos_validos)}"
                )


            tipo_identificacion_enum = TipoIdentificacion(
                tipo_identificacion
            )


            # -------------------------------------------------
            # BUSCAR FICHA
            # -------------------------------------------------


            ficha = session.exec(
                select(Fichas).where(
                    Fichas.Num_Fic == numero_ficha
                )
            ).first()


            if not ficha:


                raise ValueError(
                    f"La ficha {numero_ficha} no existe"
                )


            # -------------------------------------------------
            # BUSCAR APRENDIZ EXISTENTE
            # -------------------------------------------------


            aprendiz = session.exec(
                select(Aprendiz).where(
                    (Aprendiz.Num_ide_Apr == numero_identificacion)
                    |
                    (Aprendiz.Cor_Apr == correo)
                )
            ).first()


            # -------------------------------------------------
            # ACTUALIZAR APRENDIZ
            # -------------------------------------------------


            if aprendiz:


                aprendiz.Nom_Apr = nombre
                aprendiz.Ape_Apr = apellido
                aprendiz.Tip_ide_Apr = tipo_identificacion_enum
                aprendiz.Num_ide_Apr = numero_identificacion
                aprendiz.Cor_Apr = correo
                aprendiz.Id_Fic = ficha.Id_Fic
                aprendiz.Es_Apr = True


                session.add(aprendiz)


                actualizadas += 1


            # -------------------------------------------------
            # CREAR APRENDIZ
            # -------------------------------------------------


            else:


                aprendiz = Aprendiz(
                    Nom_Apr=nombre,
                    Ape_Apr=apellido,
                    Tip_ide_Apr=tipo_identificacion_enum,
                    Num_ide_Apr=numero_identificacion,
                    Cor_Apr=correo,


                    # Contraseña inicial:
                    # número de identificación
                    Con_Apr=hash_contraseña(
                        str(numero_identificacion)
                    ),


                    Es_Apr=True,
                    Id_Fic=ficha.Id_Fic
                )


                session.add(aprendiz)


                creadas += 1


        except Exception as e:


            errores.append({
                "fila": fila_excel,
                "error": str(e)
            })


    # -----------------------------------------------------
    # GUARDAR CAMBIOS
    # -----------------------------------------------------


    try:


        session.commit()


    except Exception as e:


        session.rollback()


        raise HTTPException(
            status_code=500,
            detail=f"Error guardando los aprendices: {str(e)}"
        )


    # -----------------------------------------------------
    # RESPUESTA
    # -----------------------------------------------------


    return {
        "mensaje": "Archivo procesado correctamente",
        "archivo": file.filename,
        "procesadas": len(datos),
        "creadas": creadas,
        "actualizadas": actualizadas,
        "errores": errores,
        "total_errores": len(errores)
    }


# =========================================================
# CARGA POR FICHA (REPORTE DE APRENDICES DE SOFIA PLUS)
# =========================================================
# - Acepta el reporte oficial (.xls/.xlsx) o la plantilla simple (.csv/.xlsx)
# - Es idempotente: subir el mismo archivo varias veces NO duplica aprendices.
#     * Aprendiz nuevo (documento no existe)  -> se crea
#     * Aprendiz existente con datos cambiados -> se actualiza
#     * Aprendiz existente sin cambios         -> se deja intacto
# - No toca contraseñas, asistencias ni notificaciones de aprendices existentes.
# =========================================================

ESTADO_ACTIVO = "EN FORMACION"

ALIAS_COLUMNAS = {
    "tipo": {"tipo_de_documento", "tipo_identificacion", "tipo_documento"},
    "numero": {"numero_de_documento", "numero_identificacion", "numero_documento"},
    "nombre": {"nombre", "nombres"},
    "apellido": {"apellidos", "apellido"},
    "correo": {"correo_electronico", "correo"},
    "estado": {"estado"},
}


def _normalizar(texto) -> str:
    texto = unicodedata.normalize("NFKD", str(texto))
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "_", texto.lower()).strip("_")


def _txt(valor) -> str:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return ""
    texto = str(valor).strip()
    return "" if texto.lower() in ("nan", "none") else re.sub(r"\s+", " ", texto)


def _leer_reporte(contenido: bytes, nombre_archivo: str):
    """Devuelve (DataFrame normalizado, número de ficha del reporte o None)."""

    if nombre_archivo.endswith(".csv"):
        try:
            texto = contenido.decode("utf-8-sig")
        except UnicodeDecodeError:
            texto = contenido.decode("latin-1")
        bruto = pd.read_csv(StringIO(texto), header=None, dtype=str)
    else:
        bruto = pd.read_excel(BytesIO(contenido), header=None, dtype=str)

    bruto = bruto.dropna(how="all")

    # Ficha escrita en el encabezado del reporte ("Ficha de Caracterización: 3171690 - ...")
    ficha_reporte = None
    fila_header = None

    for idx, fila in bruto.head(20).iterrows():
        celdas = [_txt(c) for c in fila.tolist()]
        normalizadas = [_normalizar(c) for c in celdas]

        if ficha_reporte is None and any(
            n.startswith("ficha_de_caracterizacion") for n in normalizadas
        ):
            for c in celdas:
                m = re.match(r"^(\d{5,})\b", c)
                if m:
                    ficha_reporte = int(m.group(1))
                    break

        if fila_header is None and any(
            n in ALIAS_COLUMNAS["numero"] for n in normalizadas
        ):
            fila_header = idx

    if fila_header is None:
        raise ValueError(
            "No se encontró la columna del número de documento. "
            "Usa el reporte de aprendices de SOFIA Plus o la plantilla."
        )

    encabezados = [_normalizar(c) for c in bruto.loc[fila_header].tolist()]
    datos = bruto.loc[fila_header + 1:].copy()
    datos.columns = encabezados

    columnas = {}
    for campo, alias in ALIAS_COLUMNAS.items():
        for col in encabezados:
            if col in alias:
                columnas[campo] = col
                break

    faltantes = [
        c for c in ("tipo", "numero", "nombre", "apellido", "correo")
        if c not in columnas
    ]
    if faltantes:
        raise ValueError(
            "Faltan columnas en el archivo: " + ", ".join(faltantes)
        )

    datos = datos.rename(columns={v: k for k, v in columnas.items()})
    return datos.dropna(how="all"), ficha_reporte


@Router_carga_aprendices.post("/upload/ficha/{id_ficha}")
async def cargar_aprendices_por_ficha(
    id_ficha: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):

    ficha = session.get(Fichas, id_ficha)

    if not ficha:
        raise HTTPException(status_code=404, detail="La ficha no existe")

    if not file.filename:
        raise HTTPException(
            status_code=400, detail="No se recibió ningún archivo"
        )

    nombre_archivo = file.filename.lower()

    if not nombre_archivo.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos CSV, XLSX o XLS"
        )

    contenido = await file.read()

    try:
        datos, ficha_reporte = _leer_reporte(contenido, nombre_archivo)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Falta instalar xlrd en el backend para leer archivos .xls"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo leer el archivo: {str(e)}"
        )

    # Evita cargar el reporte de una ficha dentro de otra
    if ficha_reporte is not None and ficha_reporte != ficha.Num_Fic:
        raise HTTPException(
            status_code=400,
            detail=(
                f"El archivo es de la ficha {ficha_reporte}, pero estás "
                f"subiendo a la ficha {ficha.Num_Fic}."
            )
        )

    tipos_validos = [t.value for t in TipoIdentificacion]

    creadas = 0
    actualizadas = 0
    sin_cambios = 0
    errores = []

    for posicion, (_, fila) in enumerate(datos.iterrows()):

        # Fila aproximada dentro del archivo (para mostrar en errores)
        fila_excel = int(fila.name) + 1

        try:
            tipo = _txt(fila["tipo"]).upper()
            nombre = _txt(fila["nombre"])
            apellido = _txt(fila["apellido"])
            correo = _txt(fila["correo"]).lower()
            estado = _txt(fila["estado"]).upper() if "estado" in datos.columns else ""

            digitos = re.sub(r"\D", "", _txt(fila["numero"]).split(".")[0])

            if not digitos:
                raise ValueError("El número de documento está vacío o no es numérico")
            if not nombre:
                raise ValueError("El nombre está vacío")
            if not apellido:
                raise ValueError("El apellido está vacío")
            if not correo:
                raise ValueError("El correo está vacío")
            if tipo not in tipos_validos:
                raise ValueError(
                    f"Tipo de documento inválido '{tipo}'. "
                    f"Permitidos: {', '.join(tipos_validos)}"
                )

            numero = int(digitos)
            tipo_enum = TipoIdentificacion(tipo)

            # Sin columna Estado (plantilla simple) => se asume activo
            en_formacion = (estado == ESTADO_ACTIVO) if estado else True

            with session.begin_nested():

                aprendiz = session.exec(
                    select(Aprendiz).where(Aprendiz.Num_ide_Apr == numero)
                ).first()

                otro_con_correo = session.exec(
                    select(Aprendiz).where(Aprendiz.Cor_Apr == correo)
                ).first()

                # ---------------- CREAR ----------------
                if not aprendiz:

                    if otro_con_correo:
                        raise ValueError(
                            f"El correo {correo} ya pertenece a otro aprendiz "
                            f"(documento {otro_con_correo.Num_ide_Apr})"
                        )

                    session.add(Aprendiz(
                        Nom_Apr=nombre,
                        Ape_Apr=apellido,
                        Tip_ide_Apr=tipo_enum,
                        Num_ide_Apr=numero,
                        Cor_Apr=correo,
                        # Contraseña inicial: número de identificación
                        Con_Apr=hash_contraseña(str(numero)),
                        Es_Apr=en_formacion,
                        Id_Fic=ficha.Id_Fic
                    ))
                    resultado = "creada"

                # ---------------- ACTUALIZAR (solo si cambió algo) ----------------
                else:

                    if otro_con_correo and otro_con_correo.Id_Apr != aprendiz.Id_Apr:
                        raise ValueError(
                            f"El correo {correo} ya pertenece a otro aprendiz "
                            f"(documento {otro_con_correo.Num_ide_Apr})"
                        )

                    cambios = False

                    # Nombre/apellido: se ignoran diferencias solo de mayúsculas
                    if aprendiz.Nom_Apr.strip().lower() != nombre.lower():
                        aprendiz.Nom_Apr = nombre
                        cambios = True

                    if aprendiz.Ape_Apr.strip().lower() != apellido.lower():
                        aprendiz.Ape_Apr = apellido
                        cambios = True

                    if aprendiz.Tip_ide_Apr != tipo_enum:
                        aprendiz.Tip_ide_Apr = tipo_enum
                        cambios = True

                    if (aprendiz.Cor_Apr or "").lower() != correo:
                        aprendiz.Cor_Apr = correo
                        cambios = True

                    # Solo mover de ficha si sigue EN FORMACION (un TRASLADADO
                    # o CANCELADO no debe devolverse a esta ficha)
                    if en_formacion and aprendiz.Id_Fic != ficha.Id_Fic:
                        aprendiz.Id_Fic = ficha.Id_Fic
                        cambios = True

                    # Solo se desactiva si el reporte dice que ya no está en
                    # formación. Nunca se reactiva (respeta desactivaciones manuales).
                    if not en_formacion and aprendiz.Es_Apr:
                        aprendiz.Es_Apr = False
                        cambios = True

                    if cambios:
                        aprendiz.Fec_Mod = datetime.utcnow()
                        session.add(aprendiz)
                        resultado = "actualizada"
                    else:
                        resultado = "sin_cambios"

                session.flush()

            if resultado == "creada":
                creadas += 1
            elif resultado == "actualizada":
                actualizadas += 1
            else:
                sin_cambios += 1

        except Exception as e:
            errores.append({"fila": fila_excel, "error": str(e)})

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error guardando los aprendices: {str(e)}"
        )

    return {
        "mensaje": "Archivo procesado correctamente",
        "archivo": file.filename,
        "ficha": ficha.Num_Fic,
        "procesadas": len(datos),
        "creadas": creadas,
        "actualizadas": actualizadas,
        "sin_cambios": sin_cambios,
        "errores": errores,
        "total_errores": len(errores)
    }