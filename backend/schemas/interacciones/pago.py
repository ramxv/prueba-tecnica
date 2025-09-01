from typing import Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class Pago(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo: Literal["pago_recibido"]
    id: str
    cliente_id: str
    timestamp: datetime
    monto: float = Field(gt=0)
    metodo_pago: Literal["transferencia", "tarjeta", "efectivo"]
    pago_completo: bool
