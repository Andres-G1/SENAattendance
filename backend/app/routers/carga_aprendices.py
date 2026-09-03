from io import BytesIO
import csv


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