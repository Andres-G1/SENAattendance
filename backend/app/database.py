from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "mysql+pymysql://root:212202@localhost:3306/SENAattendance"

engine = create_engine(DATABASE_URL, echo=True)

def crear_tablas():
    SQLModel.metadata.create_all(engine)
    
def get_session():
    with Session(engine) as session:
        yield session

"uv add sqlmodel pymysql"