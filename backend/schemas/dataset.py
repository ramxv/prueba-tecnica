from typing import List
from pydantic import BaseModel, ConfigDict

from schemas.cliente import Cliente
from schemas.interacciones import Interaccion


class Metadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_clientes: int
    total_interacciones: int
    periodo: str


class Dataset(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metadata: Metadata
    clientes: List[Cliente]
    interacciones: List[Interaccion]
