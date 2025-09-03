// src/api/analytics.ts
import { http } from "@/lib/http";
import type { PromesaIncumplida, MejorHorario } from "./types";

export function getPromesasIncumplidas(
  params: { hasta: string; ventanaDias?: number; modo?: "acumulado" | "estricto" },
  signal?: AbortSignal
): Promise<PromesaIncumplida[]> {
  return http.get(`/analytics/promesas-incumplidas`, { params, signal });
}

export function getMejoresHorarios(
  params?: { min_llamadas?: number; top_k?: number; alpha?: number },
  signal?: AbortSignal
): Promise<MejorHorario[]> {
  return http.get(`/analytics/mejores-horarios`, { params, signal });
}

