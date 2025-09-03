// src/hooks/useDashboardSummary.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardKPIs } from "@/components/section-cards";
import type { ApiError } from "@/lib/http";
import { getMejoresHorarios, getPromesasIncumplidas } from "@/api/analytics";
import { getAgenteEfectividad } from "@/api/entities";

export function useDashboardSummary(params: {
  hastaISO: string; ventanaDias?: number; modo?: "acumulado" | "estricto"; agenteId?: string;
}) {
  const { hastaISO, ventanaDias = 14, modo = "acumulado", agenteId } = params;

  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const inFlight = useRef(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const [mejores, incumplidas, agente] = await Promise.all([
        getMejoresHorarios({ min_llamadas: 10, top_k: 20, alpha: 0.5 }, signal),
        getPromesasIncumplidas({ hasta: hastaISO, ventanaDias, modo }, signal),
        agenteId ? getAgenteEfectividad(agenteId, signal) : Promise.resolve(null),
      ]);

      const kpis: DashboardKPIs = {
        recoveryRate: { value: 0, delta: { pct: null, trend: "flat" }, helperTitle: "Define insight", helperSubtitle: "Base del cálculo", currency: "USD" },
        keptPromises: { value: agente?.resumen?.promesas_cumplidas ?? 0, delta: { pct: null, trend: "flat" }, helperTitle: "Compleción de promesas", helperSubtitle: "Fuente: /agentes/{id}/efectividad" },
        ticketsByDebtType: { value: mejores.length, delta: { pct: null, trend: "flat" }, helperTitle: "Placeholder", helperSubtitle: "Sugerencia: /analytics/kpis" },
        paymentActivity: { value: agente?.resumen?.tasa_pago_inmediato ?? 0, delta: { pct: null, trend: "flat" }, helperTitle: "Pagos inmediatos por llamadas", helperSubtitle: "Último período", asPercent: true },
      };

      setData(kpis);
    } catch (err) {
      const e = err as ApiError;
      // ✅ Ignora aborts/cancel
      if (e?.code === "ERR_CANCELED" || e?.message === "canceled") {
        // no setees error ni muestres toast
      } else {
        setError(e);
      }
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [hastaISO, ventanaDias, modo, agenteId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort(); // esto dispara "canceled" en la request anterior (ahora ignorado)
  }, [fetchData]);

  const refetch = useCallback(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch };
}

