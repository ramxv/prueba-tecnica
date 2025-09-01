import { http } from "@/lib/http";
import type { MejorHorario, PromesaIncumplida } from "./types";

// GET /analytics/mejores-horarios
export function getMejoresHorarios(
  params?: { min_llamadas?: number; top_k?: number; alpha?: number },
  signal?: AbortSignal
): Promise<MejorHorario[]> {
  return http.get("/analytics/mejores-horarios", { params, signal });
}

// GET /analytics/promesas-incumplidas
export function getPromesasIncumplidas(
  params: {
    hasta: string;
    ventanaDias?: number;
    modo?: "acumulado" | "estricto";
  },
  signal?: AbortSignal
): Promise<PromesaIncumplida[]> {
  return http.get("/analytics/promesas-incumplidas", { params, signal });
}

