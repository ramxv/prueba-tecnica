from typing import Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .renegociacion import Renegociacion


class Llamada(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo: Literal["llamada_saliente", "llamada_entrante"]
    id: str
    cliente_id: str
    timestamp: datetime
    duracion_segundos: int = Field(ge=0)
    agente_id: str
    resultado: str
    sentimiento: Literal["cooperativo", "neutral", "frustrado", "hostil", "n/a"]
    monto_prometido: float | None
    fecha_promesa: datetime | None
    nuevo_plan_pago: Renegociacion
