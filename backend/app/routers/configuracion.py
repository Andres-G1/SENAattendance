from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session

Router_configuracion = APIRouter(prefix="/users", tags=["Inicio sesion"])
