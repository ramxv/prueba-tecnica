# scripts/ingest_from_json.py
import json, sys, os
from datetime import datetime
from neo4j import GraphDatabase, basic_auth

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")
NEO4J_DB = os.getenv("NEO4J_DATABASE", "neo4j")

driver = GraphDatabase.driver(NEO4J_URI, auth=basic_auth(NEO4J_USER, NEO4J_PASSWORD))


def iso(dt):
    if isinstance(dt, str):
        return dt
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def main(path):
    data = json.load(open(path, "r", encoding="utf-8"))
    clientes = data.get("clientes", [])
    interacciones = data.get("interacciones", [])

    # Derivar agentes únicos
    agentes = sorted(
        {
            i["agente_id"]
            for i in interacciones
            if str(i.get("tipo", "")).startswith("llamada")
        }
    )
    # Mapear deuda por cliente (simple: una por cliente con tipo_deuda del cliente)
    deudas = [
        {
            "cliente_id": c["id"],
            "tipo": c.get("tipo_deuda") or "desconocida",
            "monto_inicial": c.get("monto_deuda_inicial", 0),
        }
        for c in clientes
    ]

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    with driver.session(database="neo4j") as s:
        # Constraints (idempotentes)
        s.run(
            "CREATE CONSTRAINT cliente_id IF NOT EXISTS FOR (c:Cliente) REQUIRE c.id IS UNIQUE;"
        )
        s.run(
            "CREATE CONSTRAINT agente_id  IF NOT EXISTS FOR (a:Agente)  REQUIRE a.id IS UNIQUE;"
        )
        s.run(
            "CREATE CONSTRAINT deuda_id   IF NOT EXISTS FOR (d:Deuda)   REQUIRE d.id IS UNIQUE;"
        )
        s.run(
            "CREATE CONSTRAINT inter_id   IF NOT EXISTS FOR (i:Interaccion) REQUIRE i.id IS UNIQUE;"
        )
        # Clientes
        for c in clientes:
            s.run(
                """
                MERGE (x:Cliente {id:$id})
                SET x.nombre=$nombre, x.telefono=$telefono, x.tipo_deuda=$tipo_deuda,
                    x.monto_deuda_inicial=$monto, x.fecha_prestamo=$fecha
            """,
                id=c["id"],
                nombre=c.get("nombre"),
                telefono=c.get("telefono"),
                tipo_deuda=c.get("tipo_deuda"),
                monto=c.get("monto_deuda_inicial"),
                fecha=c.get("fecha_prestamo"),
            )
        # Agentes
        for aid in agentes:
            s.run("MERGE (a:Agente {id:$id})", id=aid)
        # Deudas
        for d in deudas:
            deuda_id = f"{d['cliente_id']}:{d['tipo']}"
            s.run(
                """
                MERGE (dd:Deuda {id:$id})
                SET dd.tipo=$tipo, dd.monto_inicial=$monto
                WITH dd
                MATCH (c:Cliente {id:$cid})
                MERGE (c)-[:POSEE]->(dd)
            """,
                id=deuda_id,
                tipo=d["tipo"],
                monto=d.get("monto_inicial", 0),
                cid=d["cliente_id"],
            )

        # Interacciones + aristas
        for i in interacciones:
            iid = i["id"]
            tipo = i.get("tipo", "")
            ts = iso(i.get("timestamp"))
            dia = i.get("dia_semana")
            hora = i.get("hora_del_dia")
            s.run(
                """
                MERGE (ev:Interaccion {id:$id})
                SET ev.tipo=$tipo, ev.timestamp=$ts, ev.dia_semana=$dia, ev.hora_del_dia=$hora
            """,
                id=iid,
                tipo=tipo,
                ts=ts,
                dia=dia,
                hora=hora,
            )
            # Cliente -[:TUVO]-> Interaccion
            s.run(
                """
                MATCH (c:Cliente {id:$cid}), (ev:Interaccion {id:$iid})
                MERGE (c)-[:TUVO]->(ev)
            """,
                cid=i["cliente_id"],
                iid=iid,
            )

            if tipo.startswith("llamada"):
                # Props específicas
                s.run(
                    """
                    MATCH (ev:Interaccion {id:$id})
                    SET ev.duracion_segundos=$dur, ev.resultado=$res, ev.sentimiento=$sent
                """,
                    id=iid,
                    dur=i.get("duracion_segundos", 0),
                    res=i.get("resultado"),
                    sent=i.get("sentimiento"),
                )
                # LLAMADA -[:ATENDIDA_POR]-> AGENTE
                aid = i.get("agente_id")
                if aid:
                    s.run(
                        """
                        MATCH (ev:Interaccion {id:$iid}), (a:Agente {id:$aid})
                        MERGE (ev)-[:ATENDIDA_POR]->(a)
                    """,
                        iid=iid,
                        aid=aid,
                    )
                # Derivados: Promesa / Plan
                if i.get("resultado") == "promesa_pago":
                    prom_id = f"promesa:{iid}"
                    s.run(
                        """
                        MERGE (p:Promesa {id:$pid})
                        SET p.monto_prometido=$monto, p.fecha_promesa=$fprom
                        WITH p
                        MATCH (ev:Interaccion {id:$iid})
                        MERGE (ev)-[:RESULTA_EN]->(p)
                    """,
                        pid=prom_id,
                        monto=i.get("monto_prometido"),
                        fprom=iso(i.get("fecha_promesa")),
                        iid=iid,
                    )
                if i.get("resultado") == "renegociacion":
                    plan_id = f"plan:{iid}"
                    s.run(
                        """
                        MERGE (pl:PlanRenegociacion {id:$plid})
                        SET pl.cuotas=$cuotas, pl.monto_mensual=$monto
                        WITH pl
                        MATCH (ev:Interaccion {id:$iid})
                        MERGE (ev)-[:RESULTA_EN]->(pl)
                    """,
                        plid=plan_id,
                        cuotas=i.get("cuotas"),
                        monto=i.get("monto_mensual"),
                        iid=iid,
                    )

            if tipo == "pago_recibido":
                # Props específicas
                s.run(
                    """
                    MATCH (ev:Interaccion {id:$id})
                    SET ev.monto=$monto, ev.metodo_pago=$metodo, ev.pago_completo=$full
                """,
                    id=iid,
                    monto=i.get("monto"),
                    metodo=i.get("metodo_pago"),
                    full=i.get("pago_completo"),
                )
                # PAGO -[:APLICADO_A]-> DEUDA
                # usamos tipo_deuda del cliente
                rec = s.run(
                    "MATCH (c:Cliente {id:$cid}) RETURN c.tipo_deuda AS tipo",
                    cid=i["cliente_id"],
                ).single()
                tipo_deuda = rec["tipo"] if rec else "desconocida"
                deuda_id = f"{i['cliente_id']}:{tipo_deuda}"
                s.run(
                    """
                    MATCH (ev:Interaccion {id:$iid}), (d:Deuda {id:$did})
                    MERGE (ev)-[:APLICADO_A]->(d)
                """,
                    iid=iid,
                    did=deuda_id,
                )

        # Temporalidad (opcional simple: SIGUE_A por cliente)
        for c in clientes:
            res = s.run(
                """
                MATCH (:Cliente {id:$cid})-[:TUVO]->(i:Interaccion)
                RETURN i.id AS id, i.timestamp AS ts
                ORDER BY ts ASC
            """,
                cid=c["id"],
            ).data()
            for prev, nxt in zip(res, res[1:]):
                s.run(
                    """
                    MATCH (a:Interaccion {id:$aid}), (b:Interaccion {id:$bid})
                    MERGE (a)-[:SIGUE_A]->(b)
                """,
                    aid=prev["id"],
                    bid=nxt["id"],
                )

    driver.close()
    print("Ingesta directa completada.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.ingest_direct_neo4j <ruta_json>")
        sys.exit(1)
    main(sys.argv[1])
