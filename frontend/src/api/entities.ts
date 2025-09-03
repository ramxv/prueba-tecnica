// src/api/entities.ts
import { http } from "@/lib/http";
import type { ClienteTimelineItem, AgenteEfectividadResponse } from "./types";

export function getClienteTimeline(id: string, signal?: AbortSignal): Promise<ClienteTimelineItem[]> {
  return http.get(`/clientes/${encodeURIComponent(id)}/timeline`, { signal });
}

export function getAgenteEfectividad(id: string, signal?: AbortSignal): Promise<AgenteEfectividadResponse> {
  return http.get(`/agentes/${encodeURIComponent(id)}/efectividad`, { signal });
}

