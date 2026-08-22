import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, ensure_columns
from .routers import activities, admin, auth, cities, share, stops, trips, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_columns()
    yield


app = FastAPI(title="GlobeTrotter API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(activities.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(cities.router)
app.include_router(share.router)
app.include_router(stops.router)
app.include_router(trips.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
