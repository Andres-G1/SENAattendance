from collections import Counter, defaultdict
from datetime import datetime
from io import BytesIO
from typing import Optional
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlmodel import Session, select

from database import get_session
from models.model import (
    Aprendiz,
    Asistencia,
    Carrera,
    Competencia,
    FichaInstructor,
    Fichas,
    Instructor,
    ResultadoAprendizaje,
)

Router_asistencia_pdf = APIRouter(
    prefix="/asistencia/pdf",
    tags=["Asistencia PDF"],
)

COLOR_ESTADO = {
    "Presente": colors.HexColor("#d1fae5"),
    "Falla": colors.HexColor("#fee2e2"),
    "Retardo": colors.HexColor("#fef3c7"),
    "Excusa": colors.HexColor("#dbeafe"),
}
VERDE_SENA = colors.HexColor("#39A900")


def _fmt(fecha) -> str:
    return fecha.strftime("%d/%m/%Y")


def _pie_de_pagina(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(2 * cm, 1.2 * cm, "SENAattendance - Reporte de asistencia")
    canvas.drawRightString(letter[0] - 2 * cm, 1.2 * cm, f"Página {doc.page}")
    canvas.restoreState()


def _generar_pdf(
    session: Session,
    ficha: Fichas,
    carrera: Optional[Carrera],
    aprendices: list[Aprendiz],
) -> bytes:
    estilos = getSampleStyleSheet()
    titulo = ParagraphStyle("titulo", parent=estilos["Title"], fontSize=16, textColor=VERDE_SENA)
    h_comp = ParagraphStyle(
        "comp", parent=estilos["Heading3"], fontSize=10.5, spaceBefore=10, spaceAfter=2
    )
    h_ra = ParagraphStyle(
        "ra", parent=estilos["Normal"], fontSize=9,
        textColor=colors.HexColor("#444444"), spaceAfter=4,
    )
    normal = ParagraphStyle("normal", parent=estilos["Normal"], fontSize=9)
    chica = ParagraphStyle("chica", parent=estilos["Normal"], fontSize=8, textColor=colors.grey)

    # ---- Asignaciones de la ficha (aquí vive el rango de fechas de cada RA) ----
    asignaciones = session.exec(
        select(FichaInstructor).where(FichaInstructor.Id_Fic == ficha.Id_Fic)
    ).all()

    # (Id_Ins, Id_RA, Dia) -> (inicio, fin)
    rango_por_clase = {
        (a.Id_Ins, a.Id_RA, a.Dia): (a.Fec_Inicio_RA, a.Fec_Fin_RA) for a in asignaciones
    }

    # Id_RA -> periodo general (mínimo inicio / máximo fin entre sus asignaciones)
    periodo_ra: dict[int, list] = {}
    for a in asignaciones:
        if a.Id_RA not in periodo_ra:
            periodo_ra[a.Id_RA] = [a.Fec_Inicio_RA, a.Fec_Fin_RA]
        else:
            periodo_ra[a.Id_RA][0] = min(periodo_ra[a.Id_RA][0], a.Fec_Inicio_RA)
            periodo_ra[a.Id_RA][1] = max(periodo_ra[a.Id_RA][1], a.Fec_Fin_RA)

    ras = {}
    competencias = {}
    for id_ra in periodo_ra:
        ra = session.get(ResultadoAprendizaje, id_ra)
        ras[id_ra] = ra
        if ra and ra.Id_Comp not in competencias:
            competencias[ra.Id_Comp] = session.get(Competencia, ra.Id_Comp)

    # Orden: por competencia y luego por fecha de inicio del RA
    ras_ordenados = sorted(
        periodo_ra.keys(),
        key=lambda i: (
            (
                competencias.get(ras[i].Id_Comp).Nom_Comp
                if ras[i] and competencias.get(ras[i].Id_Comp)
                else ""
            ),
            periodo_ra[i][0],
        ),
    )

    # ---- Asistencias (solo las que caen dentro del rango de su RA) ----
    ids_apr = [a.Id_Apr for a in aprendices]
    registros = session.exec(
        select(Asistencia)
        .where(Asistencia.Id_Fic == ficha.Id_Fic, Asistencia.Id_Apr.in_(ids_apr))
        .order_by(Asistencia.Fec_Asi)
    ).all()

    instructores = {}
    por_apr_ra = defaultdict(lambda: defaultdict(list))
    for r in registros:
        rango = rango_por_clase.get((r.Id_Ins, r.Id_RA, r.Dia))
        if rango and not (rango[0] <= r.Fec_Asi <= rango[1]):
            continue
        if r.Id_Ins not in instructores:
            instructores[r.Id_Ins] = session.get(Instructor, r.Id_Ins)
        por_apr_ra[r.Id_Apr][r.Id_RA].append(r)

    # ---- Construcción del documento ----
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.8 * cm,
        bottomMargin=2 * cm,
        title=f"Asistencia ficha {ficha.Num_Fic}",
    )
    story = []
    programa = carrera.Nom_Car if carrera else "Programa no encontrado"

    for n, apr in enumerate(aprendices):
        if n > 0:
            story.append(PageBreak())

        story.append(Paragraph("Reporte de asistencia", titulo))

        info = Table(
            [
                ["Ficha:", str(ficha.Num_Fic), "Documento:", str(apr.Num_ide_Apr)],
                [
                    "Programa de formación:", Paragraph(escape(programa), normal),
                    "Nombres:", Paragraph(escape(apr.Nom_Apr), normal),
                ],
                [
                    "Periodo de la ficha:",
                    f"{_fmt(ficha.Fec_inicio_Fic)} - {_fmt(ficha.Fec_Fin_Fic)}",
                    "Apellidos:", Paragraph(escape(apr.Ape_Apr), normal),
                ],
            ],
            colWidths=[3.6 * cm, 5.4 * cm, 2.4 * cm, 5.6 * cm],
        )
        info.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LINEBELOW", (0, -1), (-1, -1), 0.8, VERDE_SENA),
        ]))
        story.append(info)

        # Resumen general del aprendiz
        conteo = Counter(
            r.Es_Asi.value for lista in por_apr_ra[apr.Id_Apr].values() for r in lista
        )
        resumen = "   |   ".join(
            f"{e}: {conteo.get(e, 0)}" for e in ("Presente", "Falla", "Retardo", "Excusa")
        )
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Resumen:</b> {resumen}", normal))

        if not ras_ordenados:
            story.append(Spacer(1, 10))
            story.append(Paragraph(
                "Esta ficha no tiene resultados de aprendizaje asignados.", normal
            ))
            continue

        ultima_comp = None
        for id_ra in ras_ordenados:
            ra = ras[id_ra]
            comp = competencias.get(ra.Id_Comp) if ra else None

            if comp and comp.Id_Comp != ultima_comp:
                story.append(Paragraph(f"Competencia: {escape(comp.Nom_Comp)}", h_comp))
                ultima_comp = comp.Id_Comp

            ini, fin = periodo_ra[id_ra]
            story.append(Paragraph(
                f"<b>Resultado de aprendizaje:</b> {escape(ra.Nom_RA if ra else 'No encontrado')} "
                f"<font color='#777777'>({_fmt(ini)} a {_fmt(fin)})</font>",
                h_ra,
            ))

            lista = por_apr_ra[apr.Id_Apr].get(id_ra, [])
            if not lista:
                story.append(Paragraph("Sin registros de asistencia en este periodo.", chica))
                continue

            filas = [["Fecha", "Día", "Estado", "Instructor"]]
            for r in lista:
                ins = instructores.get(r.Id_Ins)
                filas.append([
                    _fmt(r.Fec_Asi),
                    r.Dia.value,
                    r.Es_Asi.value,
                    Paragraph(escape(f"{ins.Nom_Ins} {ins.Ape_Ins}") if ins else "-", normal),
                ])

            tabla = Table(filas, colWidths=[2.6 * cm, 2.6 * cm, 2.6 * cm, 9.2 * cm], repeatRows=1)
            estilo = [
                ("BACKGROUND", (0, 0), (-1, 0), VERDE_SENA),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for i, r in enumerate(lista, start=1):
                estilo.append(("BACKGROUND", (2, i), (2, i), COLOR_ESTADO[r.Es_Asi.value]))
            tabla.setStyle(TableStyle(estilo))
            story.append(tabla)

    story.append(Spacer(1, 14))
    story.append(Paragraph(f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}", chica))

    doc.build(story, onFirstPage=_pie_de_pagina, onLaterPages=_pie_de_pagina)
    return buffer.getvalue()


# =========================================================
# EXPORTAR PDF
#   /asistencia/pdf/ficha/{Id_Fic}                  -> toda la ficha
#   /asistencia/pdf/ficha/{Id_Fic}?Id_Apr=5         -> un solo aprendiz
#   /asistencia/pdf/ficha/{Id_Fic}?Id_Ins=3         -> valida que el instructor esté en la ficha
# =========================================================

@Router_asistencia_pdf.get("/ficha/{Id_Fic}")
def exportar_pdf_asistencia(
    Id_Fic: int,
    Id_Apr: Optional[int] = None,
    Id_Ins: Optional[int] = None,
    session: Session = Depends(get_session),
):
    ficha = session.get(Fichas, Id_Fic)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    # Igual que "revisar": el instructor solo exporta fichas donde está asignado
    if Id_Ins is not None:
        asignado = session.exec(
            select(FichaInstructor).where(
                FichaInstructor.Id_Ins == Id_Ins,
                FichaInstructor.Id_Fic == Id_Fic,
            )
        ).first()
        if not asignado:
            raise HTTPException(status_code=403, detail="No tienes asignación en esta ficha")

    consulta = select(Aprendiz).where(Aprendiz.Id_Fic == Id_Fic)
    if Id_Apr is not None:
        consulta = consulta.where(Aprendiz.Id_Apr == Id_Apr)
    aprendices = session.exec(consulta.order_by(Aprendiz.Ape_Apr, Aprendiz.Nom_Apr)).all()

    if not aprendices:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron aprendices para exportar en esta ficha",
        )

    carrera = session.get(Carrera, ficha.Id_Car)
    pdf = _generar_pdf(session, ficha, carrera, aprendices)

    nombre = f"asistencia_ficha_{ficha.Num_Fic}"
    if Id_Apr is not None:
        nombre += f"_{aprendices[0].Num_ide_Apr}"

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre}.pdf"'},
    )
