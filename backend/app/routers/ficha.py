from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

try:
    from app.database import get_session
except ImportError:
    from database import get_session

Router_ficha = APIRouter(prefix="/users", tags=["Inicio sesion"])
