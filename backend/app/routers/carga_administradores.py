from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from database import get_session
from models.model import Administrador, TipoIdentificacion
from security import hash_contraseña


Router_carga_administradores = APIRouter(
    prefix="/usuarios/administradores",
    tags=["Carga de Administradores"]
)


@Router_carga_administradores.post("/upload")
async def cargar_administradores(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
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

    contenido = await file.read()

    try:
        if nombre_archivo.endswith(".csv"):
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

    # Limpiar nombres de columnas
    datos.columns = [
        str(columna).strip()
        for columna in datos.columns
    ]

    columnas_requeridas = {
        "Tipo_Identificacion",
        "Numero_Identificacion",
        "Nombre",
        "Apellido",
        "Correo"
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

    creadas = 0
    actualizadas = 0
    errores = []

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

            # ---------------------------
            # VALIDACIONES
            # ---------------------------

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

            # Convertir identificación a entero
            try:
                numero_identificacion = int(
                    float(numero_identificacion)
                )
            except ValueError:
                raise ValueError(
                    "El número de identificación debe ser numérico"
                )

            # Validar tipo de identificación
            tipos_validos = [
                tipo.value
                for tipo in TipoIdentificacion
            ]

            if tipo_identificacion not in tipos_validos:
                raise ValueError(
                    "Tipo de identificación inválido. "
                    f"Valores permitidos: {', '.join(tipos_validos)}"
                )

            tipo_identificacion_enum = TipoIdentificacion(
                tipo_identificacion
            )

            # ---------------------------
            # BUSCAR ADMINISTRADOR
            # ---------------------------

            administrador = session.exec(
                select(Administrador).where(
                    (Administrador.Num_ide_Adm == numero_identificacion)
                    |
                    (Administrador.Cor_Adm == correo)
                )
            ).first()

            # ---------------------------
            # ACTUALIZAR
            # ---------------------------

            if administrador:

                administrador.Nom_Adm = nombre
                administrador.Ape_Adm = apellido
                administrador.Tip_ide_Adm = tipo_identificacion_enum
                administrador.Num_ide_Adm = numero_identificacion
                administrador.Cor_Adm = correo
                administrador.Es_Adm = True

                session.add(administrador)

                actualizadas += 1

            # ---------------------------
            # CREAR
            # ---------------------------

            else:

                administrador = Administrador(
                    Nom_Adm=nombre,
                    Ape_Adm=apellido,
                    Tip_ide_Adm=tipo_identificacion_enum,
                    Num_ide_Adm=numero_identificacion,
                    Cor_Adm=correo,
                    Con_Adm=hash_contraseña(
                        str(numero_identificacion)
                    ),
                    Es_Adm=True
                )

                session.add(administrador)

                creadas += 1

        except Exception as e:

            errores.append({
                "fila": fila_excel,
                "error": str(e)
            })

    # ---------------------------
    # GUARDAR CAMBIOS
    # ---------------------------

    try:

        session.commit()

    except Exception as e:

        session.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Error guardando los administradores: {str(e)}"
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