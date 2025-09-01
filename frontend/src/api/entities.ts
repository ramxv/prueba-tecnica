import { http } from "@/lib/http";
import type { ClienteTimelineItem, AgenteEfectividadResponse } from "./types";

// GET /clientes/{id}/timeline
export function getClienteTimeline(
  id: string,
  signal?: AbortSignal
): Promise<ClienteTimelineItem[]> {
  return http.get(`/clientes/${id}/timeline`, { signal });
}

// GET /agentes/{id}/efectividad
export function getAgenteEfectividad(
  id: string,
  signal?: AbortSignal
): Promise<AgenteEfectividadResponse> {
  return http.get(`/agentes/${id}/efectividad`, { signal });
}
