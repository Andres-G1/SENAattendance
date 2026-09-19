from collections import defaultdict
from sqlmodel import Session, select

from models.model import Asistencia, EstadoAsistencia

def calcular_estado(session: Session, id_apr: int, id_fic: int) -> dict:

    registros = session.exec(
        select(Asistencia)
        .where(
            Asistencia.Id_Apr == id_apr,
            Asistencia.Id_Fic == id_fic
        )
        .order_by(Asistencia.Fec_Asi)
    ).all()

    fallas = sum(
        1 for r in registros
        if r.Es_Asi == EstadoAsistencia.falla
    )

    excusas = sum(
        1 for r in registros
        if r.Es_Asi == EstadoAsistencia.excusa
    )

    # El acumulado es directamente el conteo de fallas: una excusa
    # ya excluye ese día de "fallas" por definición (es el mismo
    # registro, solo con otro estado), así que no se resta aparte.
    acumulado = fallas

    dias = defaultdict(list)

    for r in registros:
        dias[r.Fec_Asi].append(r.Es_Asi)

    racha = 0

    for fecha in sorted(dias):

        estados_del_dia = dias[fecha]

        dia_perdido = all(
            estado == EstadoAsistencia.falla
            for estado in estados_del_dia
        )

        racha = racha + 1 if dia_perdido else 0

    if acumulado >= 5:
        semaforo = "ROJO"
    elif acumulado == 4:
        semaforo = "AMARILLO"
    else:
        semaforo = "VERDE"

    return {
        "acumulado": acumulado,
        "fallas_brutas": fallas,
        "excusas": excusas,  
        "racha_dias": racha,
        "semaforo": semaforo,
        "deserta_por_acumulado": acumulado >= 5,
        "deserta_por_racha": racha >= 3,
    }