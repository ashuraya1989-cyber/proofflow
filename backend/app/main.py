from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import db
from app.routers import albums, images, shares

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.connect()
    yield
    # Shutdown
    db.close()

app = FastAPI(
    title="Photo Gallery API",
    lifespan=lifespan
)

# CORS
origins = settings.ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(albums.router, prefix="/albums", tags=["albums"])
app.include_router(images.router, prefix="/images", tags=["images"])
app.include_router(shares.router, prefix="/shares", tags=["shares"])

@app.get("/")
async def root():
    return {"message": "Photo Gallery API is running"}
