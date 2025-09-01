from typing import Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class Mensaje(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo: Literal["email", "sms"]
    id: str
    cliente_id: str
    timestamp: datetime
    asunto: str | None = None
