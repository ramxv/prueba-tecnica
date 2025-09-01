from pydantic import BaseModel, ConfigDict


class Renegociacion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cuotas: int
    monto_mensual: float
