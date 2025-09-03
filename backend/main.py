from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router.analytics import router as analytics_router

app = FastAPI()
app.include_router(analytics_router)

origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # <-- necesario por X-Request-Id
    expose_headers=["*"],
    max_age=3600,
)


@app.get("/")
def read_root():
    return {"Hello": "World"}
