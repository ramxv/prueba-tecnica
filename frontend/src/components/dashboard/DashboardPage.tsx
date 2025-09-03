// src/components/dashboard/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  // Congela el corte temporal para evitar refetch infinito
  const [hastaISO, setHastaISO] = useState(() => new Date().toISOString())
  const params = useMemo(
    () => ({
      hastaISO,
      ventanaDias: 14 as const,
      modo: "acumulado" as const,
      agenteId: "agente_002",
    }),
    [hastaISO]
  )

  const { data, loading, error, refetch } = useDashboardSummary(params)

  // Notificación de error (sin spamear cancelaciones)
  useEffect(() => {
    if (error && error.code !== "ERR_CANCELED") {
      toast.error("Error cargando KPIs", { description: error.message })
    }
  }, [error])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  if (error || !data)
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription>Error cargando KPIs. {error?.message}</AlertDescription>
        </Alert>
        <div className="mt-3">
          <Button
            onClick={() => {
              setHastaISO(new Date().toISOString()) // actualiza el corte
              refetch()
            }}
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* KPIs */}
              <SectionCards kpis={data} />

              {/* Gráfica (si tu componente ya trae su propio hook, no pases props) */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>

              <div className="px-4 lg:px-6">
                <Button
                  onClick={() => {
                    setHastaISO(new Date().toISOString())
                    toast.info("Actualizando…")
                    refetch()
                  }}
                  variant="outline"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

