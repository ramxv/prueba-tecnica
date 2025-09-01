from pydantic import BaseModel, Field, ConfigDict


class Cliente(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    nombre: str
    monto_deuda_inicial: int = Field(ge=0)
