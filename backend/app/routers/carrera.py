from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session

Router_carrera = APIRouter(prefix="/user", tags=["Inicio de sesion"])

