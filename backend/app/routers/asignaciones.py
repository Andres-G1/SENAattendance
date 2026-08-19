# app/routers/asignaciones.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from database import get_session
from models.model import Aprendiz, Instructor, FichaInstructor, Fichas

# Schema local para la petición POST
class AsignarFichaInstructorSchema(SQLModel):
    Id_Fic: int
    Id_Ins: int

Router_asignaciones = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])


# 1. ASIGNAR FICHA A UN APRENDIZ
@Router_asignaciones.put("/aprendiz/{id_apr}/ficha/{id_fic}")
def asignar_ficha_aprendiz(
    id_apr: int,
    id_fic: int,
    session: Session = Depends(get_session)
):
    # Verificar si el aprendiz existe (Clase Aprendiz)
    aprendiz = session.get(Aprendiz, id_apr)
    if not aprendiz:
        raise HTTPException(status_code=404, detail="Aprendiz no encontrado")

    # Verificar que exista la ficha (Clase Fichas)
    ficha = session.get(Fichas, id_fic)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    # Asignar la ficha y guardar los cambios
    aprendiz.Id_Fic = id_fic
    session.add(aprendiz)
    session.commit()
    session.refresh(aprendiz)

    return {"mensaje": f"Aprendiz {aprendiz.Nom_Apr} asignado exitosamente a la ficha {ficha.Num_Fic}"}


# 2. ASIGNAR FICHA A UN INSTRUCTOR
@Router_asignaciones.post("/instructor")
def asignar_ficha_instructor(
    datos: AsignarFichaInstructorSchema,
    session: Session = Depends(get_session)
):
    # Verificar existencia del instructor (Clase Instructor)
    instructor = session.get(Instructor, datos.Id_Ins)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")

    # Verificar si la ficha existe
    ficha = session.get(Fichas, datos.Id_Fic)
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    # Verificar si la asignación ya existe
    existe = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Fic == datos.Id_Fic,
            FichaInstructor.Id_Ins == datos.Id_Ins
        )
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400, 
            detail="El instructor ya tiene asignada esta ficha"
        )
    
    # Creación del registro relacional
    nueva_asignacion = FichaInstructor(Id_Fic=datos.Id_Fic, Id_Ins=datos.Id_Ins)
    session.add(nueva_asignacion)
    session.commit()
    
    return {"mensaje": f"Ficha {ficha.Num_Fic} asignada correctamente al instructor {instructor.Nom_Ins}"}


# 3. DESASIGNAR FICHA DE UN INSTRUCTOR
@Router_asignaciones.delete("/instructor/{id_ins}/ficha/{id_fic}")
def desasignar_ficha_instructor(
    id_ins: int, 
    id_fic: int, 
    session: Session = Depends(get_session)
):
    asignacion = session.exec(
        select(FichaInstructor).where(
            FichaInstructor.Id_Fic == id_fic,
            FichaInstructor.Id_Ins == id_ins
        )
    ).first()
    
    if not asignacion:
        raise HTTPException(status_code=404, detail="La relación ficha-instructor no existe")
        
    session.delete(asignacion)
    session.commit()
    
    return {"mensaje": "Asignación eliminada correctamente"}