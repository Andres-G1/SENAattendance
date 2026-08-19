from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models.model import Fichas  

Router_ficha = APIRouter(prefix="/fichas", tags=["Fichas SENAattendance"])

@Router_ficha.post("/", status_code=status.HTTP_201_CREATED)
def create_ficha(ficha_data: Fichas, session: Session = Depends(get_session)):
    session.add(ficha_data)
    session.commit()
    session.refresh(ficha_data)
    return {"mensaje": "Ficha creada correctamente"}

@Router_ficha.get("/")
def obtener_fichas(session: Session = Depends(get_session)):
    fichas = session.exec(select(Fichas)).all() 
    return {
        "Mensaje": "Lista de Fichas",
        "Fichas": fichas
    }

@Router_ficha.get("/{ficha_id}")
def obtener_ficha(ficha_id: int, session: Session = Depends(get_session)):
    ficha = session.get(Fichas, ficha_id) 
    if not ficha: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha no encontrada")
    return {
        "Ficha": ficha,
        "Mensaje": f"Ficha con ID {ficha_id}"
    }

@Router_ficha.put("/{ficha_id}")
def update_ficha(ficha_id: int, datos_nuevos: Fichas, session: Session = Depends(get_session)):
    db_ficha = session.get(Fichas, ficha_id) 
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    

    ficha_dict = datos_nuevos.model_dump(exclude_unset=True)
    for key, value in ficha_dict.items():
        setattr(db_ficha, key, value)
    
    session.add(db_ficha)
    session.commit()
    session.refresh(db_ficha)
    return {"Mensaje": f"Ficha {ficha_id} actualizada con exito"} 

@Router_ficha.delete("/{ficha_id}")
def delete_ficha(ficha_id: int, session: Session = Depends(get_session)):
    db_ficha = session.get(Fichas, ficha_id)
    if not db_ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    session.delete(db_ficha)
    session.commit()
    return {"Mensaje": f"Ficha {ficha_id} eliminada con exito"}