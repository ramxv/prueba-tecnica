from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router.analytics import router as analytics_router

app = FastAPI()
app.include_router(analytics_router)

origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}
