import { useCallback, useEffect, useState } from "react";
import { getMejoresHorarios } from "@/api/analytics";
import type { MejorHorario } from "@/api/types";
import type { ApiError } from "@/lib/http";

export function useBestHours(params?: { min_llamadas?: number; top_k?: number; alpha?: number }) {
  const [data, setData] = useState<MejorHorario[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMejoresHorarios(params, signal);
      setData(res);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params?.min_llamadas, params?.top_k, params?.alpha]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData() };
}
