export type DeudaMini = { id: string; tipo: string } | null;

export type PromesaMini = {
  id: string;
  monto_prometido: number | null;
  fecha_promesa: string | null; // ISO
} | null;

export type PlanMini = {
  id: string;
  cuotas: number | null;
  monto_mensual: number | null;
} | null;

export type PagoCumplimiento = {
  id: string;
  timestamp: string; // ISO
  monto: number | null;
};

export type ClienteTimelineItem = {
  interaccion_id: string;
  tipo: string;
  timestamp: string; // ISO (del grafo)
  resultado?: string | null;
  sentimiento?: string | null;
  duracion_segundos?: number | null;

  agente_id?: string | null;

  // Solo si tipo === 'pago_recibido'
  monto_pago?: number | null;
  metodo_pago?: string | null;
  pago_completo?: boolean | null;

  deuda: DeudaMini;
  promesa: PromesaMini;
  plan: PlanMini;
  pagos_que_cumplen: PagoCumplimiento[];
};

export type AgenteEfectividadResumen = {
  total_llamadas: number;
  tasa_contacto: number;
  promesas: number;
  tasa_promesa_sobre_llamadas: number;
  promesas_cumplidas: number;
  tasa_cumplimiento_sobre_promesas: number;
  pagos_inmediatos: number;
  tasa_pago_inmediato: number;
  renegociaciones: number;
  duracion_media_seg: number;
};

export type AgenteEfectividadPorHorario = {
  dia_semana: number;   // 0..6, asumiendo (ajusta según tus datos)
  hora_del_dia: number; // 0..23
  llamadas: number;
  tasa_contacto: number;
  tasa_exito: number;
};

export type AgenteEfectividadResponse = {
  resumen: AgenteEfectividadResumen;
  por_horario: AgenteEfectividadPorHorario[];
};

export type PromesaIncumplida = {
  cliente_id: string;
  promesa_id: string;
  fecha_promesa: string; // ISO
  monto_prometido: number | null;
  monto_pagado_en_ventana: number;
  dias_vencida: number;
};

export type MejorHorario = {
  dia: number;
  hora: number;
  llamadas: number;
  tasa_contacto: number;
  tasa_exito: number;
  score: number;
};
