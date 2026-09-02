from typing import Optional, Literal


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select


from database import get_session
from models.model import  Aprendiz, Instructor, Administrador, TipoIdentificacion, Fichas, Carrera

from security import hash_contraseña
from dependencias import verificar_administrador


Router_usuarios = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

# =========================================================
# CREAR USUARIO
# =========================================================

class UsuarioCrear(BaseModel):
    rol: Literal["Aprendiz", "Instructor", "Administrador"]

    nombre: str
    apellido: str
    tipo_identificacion: TipoIdentificacion
    numero_identificacion: int
    correo: str
    contraseña: str

    Id_Fic: Optional[int] = None

# =========================================================
# ACTUALIZAR USUARIO
# =========================================================

class UsuarioActualizar(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    tipo_identificacion: Optional[TipoIdentificacion] = None
    numero_identificacion: Optional[int] = None
    correo: Optional[str] = None
    contraseña: Optional[str] = None
    Id_Fic: Optional[int] = None

# =========================================================
# CREAR USUARIO
# =========================================================

@Router_usuarios.post("/crear")
def crear_usuario(
    datos: UsuarioCrear,
    session: Session = Depends(get_session)
):
    # -----------------------------------------------------
    # APRENDIZ
    # -----------------------------------------------------
    if datos.rol == "Aprendiz":

        existente = session.exec(
            select(Aprendiz).where(
                (Aprendiz.Num_ide_Apr == datos.numero_identificacion)
                |
                (Aprendiz.Cor_Apr == datos.correo)
            )
        ).first()

        if existente:
            raise HTTPException(
                status_code=400,
                detail="El documento o correo ya está registrado"
            )

        usuario = Aprendiz(
            Nom_Apr=datos.nombre,
            Ape_Apr=datos.apellido,
            Tip_ide_Apr=datos.tipo_identificacion,
            Num_ide_Apr=datos.numero_identificacion,
            Cor_Apr=datos.correo,
            Con_Apr=hash_contraseña(datos.contraseña),
            Es_Apr=True,
            Id_Fic=datos.Id_Fic
        )

    # -----------------------------------------------------
    # INSTRUCTOR
    # -----------------------------------------------------

    elif datos.rol == "Instructor":

        existente = session.exec(
            select(Instructor).where(
                (Instructor.Num_ide_Ins == datos.numero_identificacion)
                |
                (Instructor.Cor_Ins == datos.correo)
            )
        ).first()
        if existente:
            raise HTTPException(
                status_code=400,
                detail="El documento o correo ya está registrado"
            )
        usuario = Instructor(
            Nom_Ins=datos.nombre,
            Ape_Ins=datos.apellido,
            Tip_ide_Ins=datos.tipo_identificacion,
            Num_ide_Ins=datos.numero_identificacion,
            Cor_Ins=datos.correo,
            Con_Ins=hash_contraseña(datos.contraseña),
            Es_Ins=True
        )
    # -----------------------------------------------------
    # ADMINISTRADOR
    # -----------------------------------------------------

    else:

        existente = session.exec(
            select(Administrador).where(
                (Administrador.Num_ide_Adm == datos.numero_identificacion)
                |
                (Administrador.Cor_Adm == datos.correo)
            )
        ).first()

        if existente:
            raise HTTPException(
                status_code=400,
                detail="El documento o correo ya está registrado"
            )

        usuario = Administrador(
            Nom_Adm=datos.nombre,
            Ape_Adm=datos.apellido,
            Tip_ide_Adm=datos.tipo_identificacion,
            Num_ide_Adm=datos.numero_identificacion,
            Cor_Adm=datos.correo,
            Con_Adm=hash_contraseña(datos.contraseña),
            Es_Adm=True
        )

    session.add(usuario)
    session.commit()
    session.refresh(usuario)

    return {
        "mensaje": "Usuario creado correctamente",
        "rol": datos.rol,
        "id": usuario.Id_Apr
        if datos.rol == "Aprendiz"
        else usuario.Id_Ins
        if datos.rol == "Instructor"
        else usuario.Id_Adm
    }

# =========================================================
# LISTAR APRENDICES
# =========================================================

@Router_usuarios.get("/aprendices")
def listar_aprendices(
    session: Session = Depends(get_session)
):
    aprendices = session.exec(
        select(Aprendiz)
    ).all()

    resultado = []

    for aprendiz in aprendices:
        resultado.append({
            "Id_Apr": aprendiz.Id_Apr,
            "Nom_Apr": aprendiz.Nom_Apr,
            "Ape_Apr": aprendiz.Ape_Apr,
            "Tip_ide_Apr": aprendiz.Tip_ide_Apr,
            "Num_ide_Apr": aprendiz.Num_ide_Apr,
            "Cor_Apr": aprendiz.Cor_Apr,
            "Es_Apr": aprendiz.Es_Apr,
            "Id_Fic": aprendiz.Id_Fic,
            "Num_Fic": (
                aprendiz.ficha.Num_Fic
                if aprendiz.ficha
                else None
            ),
            "Nom_Car": (
                aprendiz.ficha.carrera.Nom_Car
                if aprendiz.ficha and aprendiz.ficha.carrera
                else None
            )
        })


    return resultado

# =========================================================
# OBTENER APRENDIZ
# =========================================================

@Router_usuarios.get("/aprendiz/{id_aprendiz}")
def obtener_aprendiz(
    id_aprendiz: int,
    session: Session = Depends(get_session)
):
    aprendiz = session.get(Aprendiz, id_aprendiz)


    if not aprendiz:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )

    return {
        "Id_Apr": aprendiz.Id_Apr,
        "Nom_Apr": aprendiz.Nom_Apr,
        "Ape_Apr": aprendiz.Ape_Apr,
        "Tip_ide_Apr": aprendiz.Tip_ide_Apr,
        "Num_ide_Apr": aprendiz.Num_ide_Apr,
        "Cor_Apr": aprendiz.Cor_Apr,
        "Es_Apr": aprendiz.Es_Apr,
        "Id_Fic": aprendiz.Id_Fic,
        "Num_Fic": (
            aprendiz.ficha.Num_Fic
            if aprendiz.ficha
            else None
        ),
        "Nom_Car": (
            aprendiz.ficha.carrera.Nom_Car
            if aprendiz.ficha and aprendiz.ficha.carrera
            else None
        )
    }

# =========================================================
# LISTAR CARRERAS
# =========================================================

@Router_usuarios.get("/carreras")
def listar_carreras(
    session: Session = Depends(get_session)
):
    carreras = session.exec(
        select(Carrera).order_by(Carrera.Nom_Car)
    ).all()

    return [
        {
            "Id_Car": carrera.Id_Car,
            "Nom_Car": carrera.Nom_Car,
            "Des_Car": carrera.Des_Car
        }
        for carrera in carreras
    ]

# =========================================================
# LISTAR FICHAS
# =========================================================

@Router_usuarios.get("/fichas")
def listar_fichas(
    Id_Car: Optional[int] = None,
    session: Session = Depends(get_session)
):
    consulta = select(Fichas)

    if Id_Car is not None:
        consulta = consulta.where(
            Fichas.Id_Car == Id_Car
        )

    fichas = session.exec(
        consulta.order_by(Fichas.Num_Fic)
    ).all()

    return [
        {
            "Id_Fic": ficha.Id_Fic,
            "Id_Car": ficha.Id_Car,
            "Num_Fic": ficha.Num_Fic,
            "Jor_Fic": ficha.Jor_Fic,
            "Fec_inicio_Fic": ficha.Fec_inicio_Fic,
            "Fec_Fin_Fic": ficha.Fec_Fin_Fic
        }
        for ficha in fichas
    ]

# =========================================================
# ACTUALIZAR APRENDIZ
# =========================================================

@Router_usuarios.put("/aprendiz/{id_aprendiz}")
def actualizar_aprendiz(
    id_aprendiz: int,
    datos: UsuarioActualizar,
    session: Session = Depends(get_session)
):

    usuario = session.get(Aprendiz, id_aprendiz)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )

    if datos.nombre is not None:
        usuario.Nom_Apr = datos.nombre

    if datos.apellido is not None:
        usuario.Ape_Apr = datos.apellido

    if datos.tipo_identificacion is not None:
        usuario.Tip_ide_Apr = datos.tipo_identificacion

    if datos.numero_identificacion is not None:
        usuario.Num_ide_Apr = datos.numero_identificacion

    if datos.correo is not None:
        usuario.Cor_Apr = datos.correo

    if datos.contraseña is not None:
        usuario.Con_Apr = hash_contraseña(datos.contraseña)

    if datos.Id_Fic is not None:
        usuario.Id_Fic = datos.Id_Fic

    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Aprendiz actualizado correctamente"
    }

# =========================================================
# DESACTIVAR APRENDIZ
# =========================================================

@Router_usuarios.patch("/aprendiz/{id_aprendiz}/desactivar")
def desactivar_aprendiz(
    id_aprendiz: int,
    session: Session = Depends(get_session)
):

    usuario = session.get(Aprendiz, id_aprendiz)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )

    usuario.Es_Apr = False

    session.add(usuario)
    session.commit()


    return {
        "mensaje": "Aprendiz desactivado correctamente"
    }

# =========================================================
# ACTIVAR APRENDIZ
# =========================================================


@Router_usuarios.patch("/aprendiz/{id_aprendiz}/activar")
def activar_aprendiz(
    id_aprendiz: int,
    session: Session = Depends(get_session)
):

    usuario = session.get(Aprendiz, id_aprendiz)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )

    usuario.Es_Apr = True

    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Aprendiz activado correctamente"
    }

# =========================================================
# OBTENER APRENDIZ POR ID
# =========================================================

@Router_usuarios.get("/aprendiz/{id_aprendiz}")
def obtener_aprendiz(
    id_aprendiz: int,
    administrador=Depends(verificar_administrador),
    session: Session = Depends(get_session)
):
    usuario = session.get(Aprendiz, id_aprendiz)


    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )


    return {
        "Id_Apr": usuario.Id_Apr,
        "Nom_Apr": usuario.Nom_Apr,
        "Ape_Apr": usuario.Ape_Apr,
        "Tip_ide_Apr": usuario.Tip_ide_Apr,
        "Num_ide_Apr": usuario.Num_ide_Apr,
        "Cor_Apr": usuario.Cor_Apr,
        "Es_Apr": usuario.Es_Apr,
        "Id_Fic": usuario.Id_Fic
    }
    # =========================================================
# LISTAR INSTRUCTORES
# =========================================================

@Router_usuarios.get("/instructores")
def listar_instructores(
    session: Session = Depends(get_session)
):
    instructores = session.exec(
        select(Instructor)
    ).all()

    return [
        {
            "Id_Ins": instructor.Id_Ins,
            "Nom_Ins": instructor.Nom_Ins,
            "Ape_Ins": instructor.Ape_Ins,
            "Tip_ide_Ins": instructor.Tip_ide_Ins,
            "Num_ide_Ins": instructor.Num_ide_Ins,
            "Cor_Ins": instructor.Cor_Ins,
            "Es_Ins": instructor.Es_Ins,
        }
        for instructor in instructores
    ]

# =========================================================
# OBTENER INSTRUCTOR
# =========================================================

@Router_usuarios.get("/instructor/{id_instructor}")
def obtener_instructor(
    id_instructor: int,
    session: Session = Depends(get_session)
):
    instructor = session.get(Instructor, id_instructor)

    if not instructor:
        raise HTTPException(
            status_code=404,
            detail="Instructor no encontrado"
        )

    return {
        "Id_Ins": instructor.Id_Ins,
        "Nom_Ins": instructor.Nom_Ins,
        "Ape_Ins": instructor.Ape_Ins,
        "Tip_ide_Ins": instructor.Tip_ide_Ins,
        "Num_ide_Ins": instructor.Num_ide_Ins,
        "Cor_Ins": instructor.Cor_Ins,
        "Es_Ins": instructor.Es_Ins,
    }

# =========================================================
# ACTUALIZAR INSTRUCTOR
# =========================================================

@Router_usuarios.put("/instructor/{id_instructor}")
def actualizar_instructor(
    id_instructor: int,
    datos: UsuarioActualizar,
    session: Session = Depends(get_session)
):
    usuario = session.get(Instructor, id_instructor)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Instructor no encontrado"
        )

    if datos.nombre is not None:
        usuario.Nom_Ins = datos.nombre

    if datos.apellido is not None:
        usuario.Ape_Ins = datos.apellido

    if datos.tipo_identificacion is not None:
        usuario.Tip_ide_Ins = datos.tipo_identificacion

    if datos.numero_identificacion is not None:
        usuario.Num_ide_Ins = datos.numero_identificacion

    if datos.correo is not None:
        usuario.Cor_Ins = datos.correo

    if datos.contraseña is not None:
        usuario.Con_Ins = hash_contraseña(datos.contraseña)

    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Instructor actualizado correctamente"
    }

# =========================================================
# DESACTIVAR INSTRUCTOR
# =========================================================

@Router_usuarios.patch("/instructor/{id_instructor}/desactivar")
def desactivar_instructor(
    id_instructor: int,
    session: Session = Depends(get_session)
):
    usuario = session.get(Instructor, id_instructor)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Instructor no encontrado"
        )

    usuario.Es_Ins = False
    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Instructor desactivado correctamente"
    }

# =========================================================
# ACTIVAR INSTRUCTOR
# =========================================================

@Router_usuarios.patch("/instructor/{id_instructor}/activar")
def activar_instructor(
    id_instructor: int,
    session: Session = Depends(get_session)
):
    usuario = session.get(Instructor, id_instructor)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Instructor no encontrado"
        )

    usuario.Es_Ins = True
    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Instructor activado correctamente"
    }
# =========================================================
# LISTAR ADMINISTRADORES
# =========================================================

@Router_usuarios.get("/administradores")
def listar_administradores(
    session: Session = Depends(get_session)
):
    administradores = session.exec(
        select(Administrador)
    ).all()

    return [
        {
            "Id_Adm": administrador.Id_Adm,
            "Nom_Adm": administrador.Nom_Adm,
            "Ape_Adm": administrador.Ape_Adm,
            "Tip_ide_Adm": administrador.Tip_ide_Adm,
            "Num_ide_Adm": administrador.Num_ide_Adm,
            "Cor_Adm": administrador.Cor_Adm,
            "Es_Adm": administrador.Es_Adm,
        }
        for administrador in administradores
    ]

# =========================================================
# OBTENER ADMINISTRADOR
# =========================================================

@Router_usuarios.get("/administrador/{id_administrador}")
def obtener_administrador(
    id_administrador: int,
    session: Session = Depends(get_session)
):
    administrador = session.get(Administrador, id_administrador)

    if not administrador:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )

    return {
        "Id_Adm": administrador.Id_Adm,
        "Nom_Adm": administrador.Nom_Adm,
        "Ape_Adm": administrador.Ape_Adm,
        "Tip_ide_Adm": administrador.Tip_ide_Adm,
        "Num_ide_Adm": administrador.Num_ide_Adm,
        "Cor_Adm": administrador.Cor_Adm,
        "Es_Adm": administrador.Es_Adm,
    }

# =========================================================
# ACTUALIZAR ADMINISTRADOR
# =========================================================

@Router_usuarios.put("/administrador/{id_administrador}")
def actualizar_administrador(
    id_administrador: int,
    datos: UsuarioActualizar,
    session: Session = Depends(get_session)
):
    usuario = session.get(Administrador, id_administrador)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )

    if datos.nombre is not None:
        usuario.Nom_Adm = datos.nombre

    if datos.apellido is not None:
        usuario.Ape_Adm = datos.apellido

    if datos.tipo_identificacion is not None:
        usuario.Tip_ide_Adm = datos.tipo_identificacion

    if datos.numero_identificacion is not None:
        usuario.Num_ide_Adm = datos.numero_identificacion

    if datos.correo is not None:
        usuario.Cor_Adm = datos.correo

    if datos.contraseña is not None:
        usuario.Con_Adm = hash_contraseña(datos.contraseña)

    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Administrador actualizado correctamente"
    }

# =========================================================
# DESACTIVAR ADMINISTRADOR
# =========================================================

@Router_usuarios.patch("/administrador/{id_administrador}/desactivar")
def desactivar_administrador(
    id_administrador: int,
    session: Session = Depends(get_session)
):
    usuario = session.get(Administrador, id_administrador)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )

    usuario.Es_Adm = False
    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Administrador desactivado correctamente"
    }

# =========================================================
# ACTIVAR ADMINISTRADOR
# =========================================================

@Router_usuarios.patch("/administrador/{id_administrador}/activar")
def activar_administrador(
    id_administrador: int,
    session: Session = Depends(get_session)
):
    usuario = session.get(Administrador, id_administrador)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Administrador no encontrado"
        )

    usuario.Es_Adm = True
    session.add(usuario)
    session.commit()

    return {
        "mensaje": "Administrador activado correctamente"
    }