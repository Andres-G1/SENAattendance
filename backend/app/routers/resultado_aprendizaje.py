import io
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from database import get_session
from models.model import Competencia, ResultadoAprendizaje

Router_resultado = APIRouter(
    prefix="/carga-resultados",
    tags=["Carga de Resultados de Aprendizaje SENAattendance"]
)


# =========================================================
# UTILIDADES
# =========================================================

async def _leer_archivo(file: UploadFile) -> pd.DataFrame:
    """Lee un .csv/.xlsx/.xls y devuelve un DataFrame con encabezados limpios."""
    nombre = (file.filename or "").lower()
    if not nombre.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser .csv, .xlsx o .xls"
        )

    contenido = await file.read()

    try:
        if nombre.endswith(".csv"):
            try:
                # sep=None detecta si el CSV usa coma o punto y coma
                df = pd.read_csv(io.BytesIO(contenido), sep=None,
                                 engine="python", encoding="utf-8-sig")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contenido), sep=None,
                                 engine="python", encoding="latin-1")
        else:
            df = pd.read_excel(io.BytesIO(contenido))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo leer el archivo"
        )

    df.columns = [str(c).strip() for c in df.columns]
    return df


def _limpiar(valor) -> Optional[str]:
    """Devuelve el texto sin espacios, o None si está vacío."""
    if pd.isna(valor) or not str(valor).strip():
        return None
    return str(valor).strip()


# =========================================================
# CARGA DE RESULTADOS DE APRENDIZAJE (y competencias)
#
# Columnas:
#   Nom_RA                       (obligatoria)
#   Id_Comp  o  Nom_Comp         (al menos una de las dos)
#   Des_RA, Des_Comp             (opcionales)
#
# - Con Id_Comp: usa una competencia que ya existe.
# - Con Nom_Comp: busca la competencia por nombre o la crea.
# - Si Nom_Comp viene vacío, hereda el de la fila anterior.
# - Nunca borra ni modifica registros existentes.
# =========================================================

@Router_resultado.post("/upload", status_code=status.HTTP_201_CREATED)
async def cargar_resultados_planos(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    df = await _leer_archivo(file)

    tiene_id = "Id_Comp" in df.columns
    tiene_nombre = "Nom_Comp" in df.columns

    if "Nom_RA" not in df.columns or not (tiene_id or tiene_nombre):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan columnas. Se requiere Nom_RA y además Id_Comp o Nom_Comp "
                   "(opcionales: Des_RA, Des_Comp)"
        )

    if tiene_nombre:
        df["Nom_Comp"] = df["Nom_Comp"].ffill()

    # Se consultan una sola vez para no hacer una query por fila
    competencias = session.exec(select(Competencia)).all()
    ids_validos = {c.Id_Comp for c in competencias}
    comp_por_nombre = {c.Nom_Comp.strip().lower(): c.Id_Comp for c in competencias}

    existentes = {
        (nom.strip().lower(), id_c)
        for nom, id_c in session.exec(
            select(ResultadoAprendizaje.Nom_RA, ResultadoAprendizaje.Id_Comp)
        ).all()
    }

    comps_creadas, creadas, omitidos, errores = 0, 0, 0, []

    for i, fila in df.iterrows():
        num_fila = i + 2  # +2: encabezado y base 1, para que coincida con el Excel
        try:
            nom_ra = _limpiar(fila["Nom_RA"])
            if nom_ra and len(nom_ra) > 150:
                raise ValueError("Nom_RA supera los 150 caracteres")

            # 1) Resolver la competencia (por Id_Comp o por Nom_Comp)
            id_comp = None
            por_nombre = False

            valor_id = _limpiar(fila["Id_Comp"]) if tiene_id else None

            if valor_id:
                id_comp = int(float(valor_id))
                if id_comp not in ids_validos:
                    raise ValueError(f"La competencia {id_comp} no existe")

            elif tiene_nombre:
                nom_comp = _limpiar(fila["Nom_Comp"])
                if not nom_comp:
                    raise ValueError("No se indica la competencia (Id_Comp o Nom_Comp)")
                if len(nom_comp) > 150:
                    raise ValueError("Nom_Comp supera los 150 caracteres")

                por_nombre = True
                clave = nom_comp.lower()

                if clave not in comp_por_nombre:
                    des_comp = _limpiar(fila["Des_Comp"]) if "Des_Comp" in df.columns else None
                    nueva = Competencia(Nom_Comp=nom_comp, Des_Comp=des_comp)
                    session.add(nueva)
                    session.flush()  # obtiene el Id_Comp sin cerrar la transacción
                    comp_por_nombre[clave] = nueva.Id_Comp
                    ids_validos.add(nueva.Id_Comp)
                    comps_creadas += 1

                id_comp = comp_por_nombre[clave]

            else:
                raise ValueError("Falta Id_Comp en esta fila")

            # 2) Fila que solo define la competencia (sin resultado)
            if not nom_ra:
                if por_nombre:
                    continue
                raise ValueError("Nom_RA está vacío")

            # 3) Crear el resultado enlazado a esa competencia
            if (nom_ra.lower(), id_comp) in existentes:
                omitidos += 1
                continue

            des_ra = _limpiar(fila["Des_RA"]) if "Des_RA" in df.columns else None

            session.add(ResultadoAprendizaje(
                Nom_RA=nom_ra,
                Des_RA=des_ra,
                Id_Comp=id_comp
            ))
            existentes.add((nom_ra.lower(), id_comp))
            creadas += 1

        except Exception as e:
            errores.append({"fila": num_fila, "error": str(e)})

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar en la base de datos: {e}"
        )

    return {
        "mensaje": f"{comps_creadas} competencia(s) y {creadas} resultado(s) cargado(s)",
        "creadas": creadas,
        "competencias_creadas": comps_creadas,
        "omitidos": omitidos,
        "errores": errores
    }


# =========================================================
# CONSULTA (con filtro opcional por competencia)
# GET /carga-resultados/            -> todos
# GET /carga-resultados/?id_comp=3  -> solo los de la competencia 3
# =========================================================

@Router_resultado.get("/", response_model=List[ResultadoAprendizaje])
def obtener_resultados(
    id_comp: Optional[int] = None,
    session: Session = Depends(get_session)
):
    consulta = select(ResultadoAprendizaje)
    if id_comp is not None:
        consulta = consulta.where(ResultadoAprendizaje.Id_Comp == id_comp)
    return session.exec(consulta).all()