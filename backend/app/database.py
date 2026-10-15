import os
from pathlib import Path
from sqlalchemy import inspect
from sqlmodel import SQLModel, create_engine, Session

DEFAULT_DATABASE_URL = f"sqlite:///{(Path(__file__).resolve().parents[1] / 'attendance.db').as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DATABASE_URL

engine_options = {"echo": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_options)

def crear_tablas():
    SQLModel.metadata.create_all(engine)
    migrar_resultados_aprendizaje()


def migrar_resultados_aprendizaje():
    inspector = inspect(engine)
    if "ResultadoAprendizaje" not in inspector.get_table_names():
        return

    columnas = {columna["name"]: columna for columna in inspector.get_columns("ResultadoAprendizaje")}
    requiere_ficha_opcional = "Id_Fic" in columnas and not columnas["Id_Fic"]["nullable"]
    requiere_estado = "Es_RA" not in columnas
    if not requiere_ficha_opcional and not requiere_estado:
        return

    if engine.dialect.name in {"mysql", "mariadb"}:
        with engine.begin() as connection:
            if requiere_ficha_opcional:
                connection.exec_driver_sql(
                    "ALTER TABLE ResultadoAprendizaje MODIFY COLUMN Id_Fic INTEGER NULL"
                )
            if requiere_estado:
                connection.exec_driver_sql(
                    "ALTER TABLE ResultadoAprendizaje "
                    "ADD COLUMN Es_RA BOOLEAN NOT NULL DEFAULT TRUE"
                )
        return

    if engine.dialect.name != "sqlite":
        raise RuntimeError("La migración de resultados solo está configurada para SQLite y MySQL")

    nombre_tabla = "ResultadoAprendizaje"
    nombre_antiguo = "ResultadoAprendizaje_legacy"
    nombre_temporal = "ResultadoAprendizaje_new"
    tabla_modelo = SQLModel.metadata.tables[nombre_tabla]
    tabla_temporal = tabla_modelo.to_metadata(SQLModel.metadata, name=nombre_temporal)
    columnas_copiadas = [
        columna.name for columna in tabla_modelo.columns
        if columna.name in columnas
    ]
    columnas_destino = columnas_copiadas.copy()
    expresiones_origen = [f'"{nombre}"' for nombre in columnas_copiadas]
    if requiere_estado:
        columnas_destino.append("Es_RA")
        expresiones_origen.append("1")

    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
            connection.commit()
            with connection.begin():
                connection.exec_driver_sql(
                    f'ALTER TABLE "{nombre_tabla}" RENAME TO "{nombre_antiguo}"'
                )
                tabla_temporal.create(connection)
                destino = ", ".join(f'"{nombre}"' for nombre in columnas_destino)
                origen = ", ".join(expresiones_origen)
                connection.exec_driver_sql(
                    f'INSERT INTO "{nombre_temporal}" ({destino}) '
                    f'SELECT {origen} FROM "{nombre_antiguo}"'
                )
                connection.exec_driver_sql(f'DROP TABLE "{nombre_antiguo}"')
                connection.exec_driver_sql(
                    f'ALTER TABLE "{nombre_temporal}" RENAME TO "{nombre_tabla}"'
                )
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            connection.commit()
    finally:
        SQLModel.metadata.remove(tabla_temporal)

def get_session():
    with Session(engine) as session:
        yield session