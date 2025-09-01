import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { Skeleton } from "../ui/skeleton"
import { Alert, AlertDescription } from "../ui/alert"
import { Button } from "../ui/button"

export default function Page() {
  const [hastaISO] = useState(() => new Date().toISOString())
  const summaryParams = useMemo(
    () => ({ hastaISO, ventanaDias: 14 as const, modo: "acumulado" as const, agenteId: "agente_002" }),
    [hastaISO]
  )

  const { data, loading, error, refetch } = useDashboardSummary(summaryParams)

  useEffect(() => {
    if (error) {
      toast.error("Error cargando KPIs", { description: error.message })
    }
  }, [error])

  if (loading) return <Skeleton className="h-64 rounded-xl" />
  if (error || !data)
    return (
      <Alert>
        <AlertDescription>Error cargando KPIs. {error?.message}</AlertDescription>
      </Alert>
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
              <SectionCards kpis={data} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <Button
                onClick={() => {
                  toast.info("Actualizando dashboard…")
                  refetch()
                }}
                variant="outline"
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

