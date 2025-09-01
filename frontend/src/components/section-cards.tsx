import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

type Delta = { pct: number | null; trend: "up" | "down" | "flat" };

export type DashboardKPIs = {
  recoveryRate: { value: number; delta: Delta; helperTitle: string; helperSubtitle: string; currency?: string };
  keptPromises: { value: number; delta: Delta; helperTitle: string; helperSubtitle: string };
  ticketsByDebtType: { value: number; delta: Delta; helperTitle: string; helperSubtitle: string };
  paymentActivity: { value: number; delta: Delta; helperTitle: string; helperSubtitle: string; asPercent?: boolean };
};

function formatNumber(n: number, currency?: string, asPercent?: boolean) {
  if (asPercent) return new Intl.NumberFormat("es-PA", { style: "percent", maximumFractionDigits: 1 }).format(n);
  if (currency) return new Intl.NumberFormat("es-PA", { style: "currency", currency }).format(n);
  return new Intl.NumberFormat("es-PA").format(n);
}

function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta.pct == null) return null;
  const Icon = delta.trend === "down" ? IconTrendingDown : IconTrendingUp;
  const sign = delta.trend === "down" ? "" : "+";
  return (
    <Badge variant="outline">
      <Icon className="me-1" />
      {sign}
      {Math.abs(delta.pct).toFixed(1)}%
    </Badge>
  );
}

export function SectionCards({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Tasa de Recuperación */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Tasa de Recuperación</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(kpis.recoveryRate.value, kpis.recoveryRate.currency)}
          </CardTitle>
          <CardAction><DeltaBadge delta={kpis.recoveryRate.delta} /></CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpis.recoveryRate.helperTitle} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{kpis.recoveryRate.helperSubtitle}</div>
        </CardFooter>
      </Card>

      {/* Promesas Cumplidas */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Promesas Cumplidas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(kpis.keptPromises.value)}
          </CardTitle>
          <CardAction><DeltaBadge delta={kpis.keptPromises.delta} /></CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpis.keptPromises.helperTitle} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{kpis.keptPromises.helperSubtitle}</div>
        </CardFooter>
      </Card>

      {/* Tickets por Tipo de Deuda */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Tickets por Tipo de Deuda</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(kpis.ticketsByDebtType.value)}
          </CardTitle>
          <CardAction><DeltaBadge delta={kpis.ticketsByDebtType.delta} /></CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpis.ticketsByDebtType.helperTitle} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{kpis.ticketsByDebtType.helperSubtitle}</div>
        </CardFooter>
      </Card>

      {/* Actividad Pagos */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Actividad Pagos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(kpis.paymentActivity.value, undefined, kpis.paymentActivity.asPercent)}
          </CardTitle>
          <CardAction><DeltaBadge delta={kpis.paymentActivity.delta} /></CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpis.paymentActivity.helperTitle} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{kpis.paymentActivity.helperSubtitle}</div>
        </CardFooter>
      </Card>
    </div>
  );
}

