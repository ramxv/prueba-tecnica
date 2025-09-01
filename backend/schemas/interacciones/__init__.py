from .llamada import Llamada

from .pago import Pago
from .mensaje import Mensaje
from .renegociacion import Renegociacion

from typing import Union, Annotated
from pydantic import Field

Interaccion = Annotated[Union[Llamada, Pago, Mensaje], Field(discriminator="tipo")]

__all__ = ["Llamada", "Pago", "Mensaje", "Renegociacion", "Interaccion"]
