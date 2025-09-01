import { useCallback, useEffect, useState } from "react";
import type { DashboardKPIs } from "@/components/section-cards";
import type { ApiError } from "@/lib/http";
import { getMejoresHorarios, getPromesasIncumplidas } from "@/api/analytics";
import { getAgenteEfectividad } from "@/api/entities";

export function useDashboardSummary(params: {
  hastaISO: string;            // new Date().toISOString()
  ventanaDias?: number;        // 14 por defecto
  modo?: "acumulado" | "estricto";
  agenteId?: string;           // opcional
}) {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // Llamadas en paralelo (ajusta según lo que necesites realmente)
      const [mejores, incumplidas, agente] = await Promise.all([
        getMejoresHorarios({ min_llamadas: 10, top_k: 20, alpha: 0.5 }, signal),
        getPromesasIncumplidas({ hasta: params.hastaISO, ventanaDias: params.ventanaDias ?? 14, modo: params.modo ?? "acumulado" }, signal),
        params.agenteId ? getAgenteEfectividad(params.agenteId, signal) : Promise.resolve(null),
      ]);

      const kpis: DashboardKPIs = {
        recoveryRate: {
          value: 0, // TODO: reemplaza por suma de pagos del período
          delta: { pct: null, trend: "flat" }, // TODO: compara contra período previo
          helperTitle: "Define tu insight (p.ej. 'Al alza este mes')",
          helperSubtitle: "Explica la base del cálculo (últimos 30 días, etc.)",
          currency: "USD",
        },
        keptPromises: {
          value: (agente?.resumen?.promesas_cumplidas ?? 0), // EJEMPLO si vas por agente
          delta: { pct: null, trend: "flat" },               // TODO
          helperTitle: "Compleción de promesas",
          helperSubtitle: "Fuente: /agentes/{id}/efectividad",
        },
        ticketsByDebtType: {
          value: mejores.length, // EJEMPLO temporal (solo para que veas el flujo)
          delta: { pct: null, trend: "flat" }, // TODO
          helperTitle: "Placeholder: reemplázalo por tu métrica real",
          helperSubtitle: "Sugerencia: expón /analytics/kpis en backend",
        },
        paymentActivity: {
          value: (agente?.resumen?.tasa_pago_inmediato ?? 0), // como proporción 0..1
          delta: { pct: null, trend: "flat" }, // TODO
          helperTitle: "Pagos inmediatos por llamadas",
          helperSubtitle: "Último período evaluado",
          asPercent: true,
        },
      };

      setData(kpis);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params.hastaISO, params.ventanaDias, params.modo, params.agenteId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData() };
}
