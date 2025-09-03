# app/routers/analytics.py
from typing import Any, Dict, List
from datetime import datetime
import os
from fastapi import APIRouter, HTTPException, Query as FQuery
from neo4j import GraphDatabase, basic_auth, Query as CypherQuery

# ---- Neo4j driver (variables de entorno) ----
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")
NEO4J_DB = os.getenv("NEO4J_DATABASE", "neo4j")

driver = GraphDatabase.driver(NEO4J_URI, auth=basic_auth(NEO4J_USER, NEO4J_PASSWORD))

router = APIRouter(prefix="", tags=["analytics"])


def run_cypher(query: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    try:
        with driver.session(database=NEO4J_DB) as session:
            result = session.run(CypherQuery(query), **params)
            return [r.data() for r in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Endpoint 1: Timeline del cliente ----
@router.get("/clientes/{id}/timeline")
def cliente_timeline(id: str) -> List[Dict[str, Any]]:
    query = """
    MATCH (c:Cliente {id: $id})-[:TUVO]->(i:Interaccion)
    OPTIONAL MATCH (i)-[:ATENDIDA_POR]->(a:Agente)
    OPTIONAL MATCH (i)-[:RESULTA_EN]->(pr:Promesa)
    OPTIONAL MATCH (i)-[:RESULTA_EN]->(pl:PlanRenegociacion)
    OPTIONAL MATCH (pr)-[:CUMPLIDA_POR]->(pc:Interaccion {tipo:'pago_recibido'})
    OPTIONAL MATCH (i)-[:APLICADO_A]->(d:Deuda)
    WITH i, a, pr, pl, d, collect(pc) AS pagos_que_cumplen
    RETURN
      i.id            AS interaccion_id,
      i.tipo          AS tipo,
      i.timestamp     AS timestamp,
      i.resultado     AS resultado,
      i.sentimiento   AS sentimiento,
      i.duracion_segundos AS duracion_segundos,
      (CASE WHEN a IS NULL THEN NULL ELSE a.id END) AS agente_id,
      (CASE WHEN i.tipo = 'pago_recibido' THEN i.monto END) AS monto_pago,
      (CASE WHEN i.tipo = 'pago_recibido' THEN i.metodo_pago END) AS metodo_pago,
      (CASE WHEN i.tipo = 'pago_recibido' THEN i.pago_completo END) AS pago_completo,
      (CASE WHEN d IS NULL THEN NULL ELSE {id: d.id, tipo: d.tipo} END) AS deuda,
      (CASE WHEN pr IS NULL THEN NULL ELSE {id: coalesce(pr.id, elementId(pr)),
                                           monto_prometido: pr.monto_prometido,
                                           fecha_promesa: pr.fecha_promesa} END) AS promesa,
      (CASE WHEN pl IS NULL THEN NULL ELSE {id: coalesce(pl.id, elementId(pl)),
                                           cuotas: pl.cuotas,
                                           monto_mensual: pl.monto_mensual} END) AS plan,
      [p IN pagos_que_cumplen | {id: p.id, timestamp: p.timestamp, monto: p.monto}] AS pagos_que_cumplen
    ORDER BY timestamp ASC
    """
    return run_cypher(query, {"id": id})


# ---- Endpoint 2: Efectividad del agente ----
@router.get("/agentes/{id}/efectividad")
def agente_efectividad(id: str) -> Dict[str, Any]:
    query = """
    // Llamadas del agente
    MATCH (i:Interaccion)-[:ATENDIDA_POR]->(a:Agente {id: $id})
    WITH collect(i) AS calls, count(i) AS total

    // Agregados base
    WITH calls, total,
         [x IN calls WHERE coalesce(x.es_contacto,false)] AS contactos,
         [x IN calls WHERE x.resultado = 'promesa_pago'] AS promesas,
         [x IN calls WHERE x.resultado = 'pago_inmediato'] AS pagos_inmediatos,
         [x IN calls WHERE x.resultado = 'renegociacion'] AS reneg

    // Cumplimiento de promesas del agente (si existe CUMPLIDA_POR)
    OPTIONAL MATCH (l:Interaccion)-[:ATENDIDA_POR]->(:Agente {id: $id})
           -[:RESULTA_EN]->(p:Promesa)
    OPTIONAL MATCH (p)-[:CUMPLIDA_POR]->(:Interaccion {tipo:'pago_recibido'})
    WITH calls, total,
         size(contactos) AS n_contactos,
         size(promesas)  AS n_promesas,
         size(pagos_inmediatos) AS n_pagos_inmediatos,
         size(reneg)     AS n_reneg,
         count(DISTINCT p) AS promesas_cumplidas

    WITH {
      total_llamadas: total,
      tasa_contacto: CASE WHEN total=0 THEN 0.0 ELSE toFloat(n_contactos)/total END,
      promesas: n_promesas,
      tasa_promesa_sobre_llamadas: CASE WHEN total=0 THEN 0.0 ELSE toFloat(n_promesas)/total END,
      promesas_cumplidas: promesas_cumplidas,
      tasa_cumplimiento_sobre_promesas: CASE WHEN n_promesas=0 THEN 0.0 ELSE toFloat(promesas_cumplidas)/n_promesas END,
      pagos_inmediatos: n_pagos_inmediatos,
      tasa_pago_inmediato: CASE WHEN total=0 THEN 0.0 ELSE toFloat(n_pagos_inmediatos)/total END,
      renegociaciones: n_reneg,
      duracion_media_seg: CASE WHEN total=0 THEN 0.0 ELSE toFloat(reduce(s=0, x IN calls | s + coalesce(x.duracion_segundos,0)))/total END
    } AS resumen, calls

    // Breakdown por día/hora
    UNWIND calls AS ci
    WITH resumen, ci.dia_semana AS dia, ci.hora_del_dia AS hora,
         coalesce(ci.es_contacto,false) AS contacto,
         ci.resultado AS res
    WITH resumen, dia, hora,
         count(*) AS llamadas,
         sum(CASE WHEN contacto THEN 1 ELSE 0 END) AS contactos,
         sum(CASE WHEN res IN ['promesa_pago','pago_inmediato','renegociacion'] THEN 1 ELSE 0 END) AS exitos
    RETURN resumen,
           collect({
             dia_semana: dia,
             hora_del_dia: hora,
             llamadas: llamadas,
             tasa_contacto: CASE WHEN llamadas=0 THEN 0.0 ELSE toFloat(contactos)/llamadas END,
             tasa_exito: CASE WHEN llamadas=0 THEN 0.0 ELSE toFloat(exitos)/llamadas END
           }) AS por_horario
    """
    rows = run_cypher(query, {"id": id})
    return rows[0] if rows else {"resumen": {}, "por_horario": []}


# ---- Endpoint 3: Promesas vencidas e incumplidas ----
@router.get("/analytics/promesas-incumplidas")
def promesas_incumplidas(
    hasta: datetime = FQuery(...),
    ventanaDias: int = FQuery(14, ge=1),
    modo: str = FQuery("acumulado", regex="^(acumulado|estricto)$"),
):
    query = """
    WITH datetime($hasta) AS LIMITE, toInteger($ventanaDias) AS W, coalesce($modo,'acumulado') AS modo
    MATCH (c:Cliente)-[:TUVO]->(l:Interaccion)-[:RESULTA_EN]->(p:Promesa)
    WHERE datetime(p.fecha_promesa) < LIMITE
    OPTIONAL MATCH (c)-[:TUVO]->(pay:Interaccion {tipo:'pago_recibido'})
    WHERE pay.timestamp >= datetime(p.fecha_promesa)
      AND pay.timestamp <= datetime(p.fecha_promesa) + duration({days: W})
    WITH c, p,
         reduce(s=0.0, x IN collect(coalesce(pay.monto,0.0)) | s + x) AS monto_sum,
         reduce(mx=0.0, x IN collect(coalesce(pay.monto,0.0)) | CASE WHEN x>mx THEN x ELSE mx END) AS monto_max,
         LIMITE, modo
    WITH c, p, LIMITE, modo,
         monto_sum, monto_max,
         CASE WHEN modo = 'estricto' THEN monto_max ELSE monto_sum END AS monto_en_ventana,
         CASE
           WHEN modo = 'estricto' THEN (monto_max >= coalesce(p.monto_prometido, 0.0))
           ELSE (monto_sum >= coalesce(p.monto_prometido, 0.0))
         END AS cumplida
    WHERE cumplida = false
    RETURN
      c.id AS cliente_id,
      coalesce(p.id, elementId(p)) AS promesa_id,
      p.fecha_promesa AS fecha_promesa,
      p.monto_prometido AS monto_prometido,
      monto_en_ventana AS monto_pagado_en_ventana,
      duration.between(datetime(p.fecha_promesa), LIMITE).days AS dias_vencida
    ORDER BY dias_vencida DESC, fecha_promesa ASC
    """
    return run_cypher(
        query, {"hasta": hasta.isoformat(), "ventanaDias": ventanaDias, "modo": modo}
    )


# ---- Endpoint 4: Mejores horarios ----
@router.get("/analytics/mejores-horarios")
def mejores_horarios(
    min_llamadas: int = FQuery(10, ge=1),
    top_k: int = FQuery(20, ge=1),
    alpha: float = FQuery(0.5, ge=0.0, le=1.0),
) -> List[Dict[str, Any]]:
    query = """
    WITH toInteger($min_llamadas) AS MINN,
         toFloat(coalesce($alpha,0.5)) AS A
    MATCH (i:Interaccion)
    WHERE i.tipo STARTS WITH 'llamada'
    WITH i.dia_semana AS dia, i.hora_del_dia AS hora,
         count(*) AS llamadas,
         sum(CASE WHEN coalesce(i.es_contacto,false) THEN 1 ELSE 0 END) AS contactos,
         sum(CASE WHEN i.resultado IN ['promesa_pago','pago_inmediato','renegociacion'] THEN 1 ELSE 0 END) AS exitos,
         MINN, A
    WHERE llamadas >= MINN
    WITH dia, hora, llamadas,
         toFloat(contactos)/llamadas AS tasa_contacto,
         toFloat(exitos)/llamadas    AS tasa_exito,
         A, llamadas AS L
    RETURN
      dia, hora, L AS llamadas,
      tasa_contacto, tasa_exito,
      (A * tasa_exito + (1.0 - A) * tasa_contacto) AS score
    ORDER BY score DESC, llamadas DESC
    LIMIT $top_k
    """
    return run_cypher(
        query,
        {
            "min_llamadas": min_llamadas,
            "top_k": int(top_k),
            "alpha": float(alpha),
        },
    )
