from io import BytesIO


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




@Router_carga_instructores.post("/upload")
async def cargar_instructores(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # -------------------------------------------------
    # 1. VALIDAR QUE SE HAYA RECIBIDO UN ARCHIVO
    # -------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No se recibió ningún archivo"
        )


    # -------------------------------------------------
    # 2. VALIDAR EXTENSIÓN
    # -------------------------------------------------
    nombre_archivo = file.filename.lower()


    extensiones_permitidas = (".csv", ".xlsx", ".xls")


    if not nombre_archivo.endswith(extensiones_permitidas):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos CSV, XLSX o XLS"
        )


    # -------------------------------------------------
    # 3. LEER ARCHIVO
    # -------------------------------------------------
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


    # -------------------------------------------------
    # 4. LIMPIAR NOMBRES DE COLUMNAS
    # -------------------------------------------------
    datos.columns = [
        str(columna).strip()
        for columna in datos.columns
    ]


    # -------------------------------------------------
    # 5. VALIDAR COLUMNAS REQUERIDAS
    # -------------------------------------------------
    columnas_requeridas = {
        "Tipo_Identificacion",
        "Numero_Identificacion",
        "Nombre",
        "Apellido",
        "Correo"
    }


    faltantes = columnas_requeridas - set(datos.columns)


    if faltantes:
        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": "El archivo no tiene todas las columnas requeridas",
                "columnas_faltantes": sorted(faltantes)
            }
        )


    # -------------------------------------------------
    # 6. CONTADORES
    # -------------------------------------------------
    creadas = 0
    actualizadas = 0
    errores = []


    # -------------------------------------------------
    # 7. PROCESAR CADA FILA
    # -------------------------------------------------
    for numero_fila, fila in datos.iterrows():


        # Excel normalmente comienza en la fila 2
        # porque la fila 1 contiene los encabezados.
        fila_excel = numero_fila + 2


        try:


            # -----------------------------------------
            # OBTENER DATOS
            # -----------------------------------------
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


            # -----------------------------------------
            # VALIDAR CAMPOS VACÍOS
            # -----------------------------------------
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


            # -----------------------------------------
            # CONVERTIR IDENTIFICACIÓN A NÚMERO
            # -----------------------------------------
            try:
                numero_identificacion = int(
                    float(numero_identificacion)
                )
            except ValueError:
                raise ValueError(
                    "El número de identificación debe ser numérico"
                )


            # -----------------------------------------
            # VALIDAR TIPO DE IDENTIFICACIÓN
            # -----------------------------------------
            tipos_validos = [
                tipo.value
                for tipo in TipoIdentificacion
            ]


            if tipo_identificacion not in tipos_validos:
                raise ValueError(
                    "Tipo de identificación inválido. "
                    f"Valores permitidos: "
                    f"{', '.join(tipos_validos)}"
                )


            tipo_identificacion_enum = TipoIdentificacion(
                tipo_identificacion
            )


            # -----------------------------------------
            # BUSCAR POR DOCUMENTO
            # -----------------------------------------
            instructor_por_documento = session.exec(
                select(Instructor).where(
                    Instructor.Num_ide_Ins
                    == numero_identificacion
                )
            ).first()


            # -----------------------------------------
            # BUSCAR POR CORREO
            # -----------------------------------------
            instructor_por_correo = session.exec(
                select(Instructor).where(
                    Instructor.Cor_Ins
                    == correo
                )
            ).first()


            # -----------------------------------------
            # EVITAR MEZCLAR DOS INSTRUCTORES
            # -----------------------------------------
            if (
                instructor_por_documento
                and instructor_por_correo
                and instructor_por_documento.Id_Ins
                != instructor_por_correo.Id_Ins
            ):
                raise ValueError(
                    "El número de identificación pertenece "
                    "a un instructor y el correo pertenece "
                    "a otro instructor"
                )


            # -----------------------------------------
            # DETERMINAR SI EXISTE
            # -----------------------------------------
            instructor = (
                instructor_por_documento
                or instructor_por_correo
            )


            # -----------------------------------------
            # ACTUALIZAR INSTRUCTOR
            # -----------------------------------------
            if instructor:


                instructor.Nom_Ins = nombre
                instructor.Ape_Ins = apellido
                instructor.Tip_ide_Ins = tipo_identificacion_enum
                instructor.Num_ide_Ins = numero_identificacion
                instructor.Cor_Ins = correo


                # Reactivar instructor
                instructor.Es_Ins = True


                session.add(instructor)


                actualizadas += 1


            # -----------------------------------------
            # CREAR INSTRUCTOR
            # -----------------------------------------
            else:


                instructor = Instructor(
                    Nom_Ins=nombre,
                    Ape_Ins=apellido,
                    Tip_ide_Ins=tipo_identificacion_enum,
                    Num_ide_Ins=numero_identificacion,
                    Cor_Ins=correo,


                    # Contraseña inicial:
                    # número de identificación
                    Con_Ins=hash_contraseña(
                        str(numero_identificacion)
                    ),


                    Es_Ins=True
                )


                session.add(instructor)


                creadas += 1


        # ---------------------------------------------
        # ERROR EN UNA FILA
        # ---------------------------------------------
        except Exception as e:


            errores.append({
                "fila": fila_excel,
                "error": str(e)
            })


    # -------------------------------------------------
    # 8. GUARDAR CAMBIOS
    # -------------------------------------------------
    try:


        session.commit()


    except Exception as e:


        session.rollback()


        raise HTTPException(
            status_code=500,
            detail=f"Error guardando los instructores: {str(e)}"
        )


    # -------------------------------------------------
    # 9. RESPUESTA
    # -------------------------------------------------
    return {
        "mensaje": "Archivo procesado correctamente",
        "archivo": file.filename,
        "procesadas": len(datos),
        "creadas": creadas,
        "actualizadas": actualizadas,
        "errores": errores,
        "total_errores": len(errores)
    }