# Prueba Técina - Analizador de Patrones de Llamadas

> Documento guía para el evaluador y para mi mismo durante la entrevista.
> Incluye: cómo instalar y configurar el proyecto, decisiones en el diseño del proyecto (estructura de carpetas y archivos, lógica del código y base de datos)

### Objetivo
+ Construir un dashboard web que permita analizar interacciones de cobro (llamadas, promesas, pagos) y extraer insights operativos.
	+ Efectividad por agente.
	+ Mejores horarios para contactar.
	+ Promesas incumplidas.
	+ Timeline por cliente

## 1. Descripción de la solución
- **Validación/normalización de datos**: definimos esquemas Pydantic (cliente, llamada, pago, mensaje, plan de renegociación) con union discriminada y validadores para estandarizar campos (resultado, sentimiento, timestamps). Así detectamos datos faltantes/inválidos antes de cargar.
    
- **Modelo de grafo**: usamos `Cliente`, `Agente`, `Deuda`, `Interaccion` (llamada/email/sms/pago), `Promesa` y `PlanRenegociacion`; relaciones `POSEE`, `TUVO`, `ATENDIDA_POR`, `RESULTA_EN`, `CUMPLIDA_POR`, `APLICADO_A` y opcional `SIGUE_A` para temporalidad.
    
- **Ingesta elegida (para avanzar ya)**: hicimos **fallback directo a Neo4j** con el driver Python (`scripts/ingest_from_json.py`), creando constraints y usando `MERGE` para idempotencia. Esto nos desbloquea mientras la capa LLM/Graphiti queda pendiente.
+ **Backend (FastAPI)**: expusimos 4 endpoints con Cypher:
	- `/clientes/{id}/timeline` (historial ordenado),
	- `/agentes/{id}/efectividad` (KPIs + breakdown por día/hora),
	- `/analytics/promesas-incumplidas` (vencidas sin cumplir, modo estricto acumulado),
	- `/analytics/mejores-horarios` (ranking por score α·éxito + (1−α)·contacto).  
	    Ajustamos tipos/alias para que Neo4j y FastAPI convivan ( `CypherQuery` vs `FQuery` ) y corregimos la query de `LIMIT` usando `$top_k`.
## 2. Instalación y configuración del proyecto

### Requisitos
+ Node 20+
+ PNPM/NPM
+ Python 3.11+
+ Neo4j 5.x
+ Docker
+ Git
### Clonar el repositorio
```bash
git clone https://github.com/ramxv/prueba-tecnica.git
cd prueba-tecnica
```
#### Configuración del backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```
#### Carga de datos a neo4j
```bash
# desde la carpeta /backend
python -m scripts.ingest_from_json "./interacciones_clientes_2.json"
```
#### Configuración del frontend
```bash
cd frontend
pnpm install 
pnpm run build
```
### Ejecutando la aplicación
```bash
# Asegurese de estar en la carpeta root (/prueba-tecnica)
docker compose up -d --build
```
## 3. Estructura del proyecto
```bash
./prueba-tecnica
├── backend
│   ├── data
│   ├── Dockerfile
│   ├── graphiti
│   ├── main.py
│   ├── requirements.txt
│   ├── router
│   │   ├── analytics.py
│   ├── schemas
│   │   └── interacciones
│   └── scripts
├── frontend
│   ├── components.json
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── public
│   │   └── vite.svg
│   ├── README.md
│   ├── src
│   │   ├── api
│   │   ├── app
│   │   │   └── dashboard
│   │   ├── components
│   │   ├── hooks
│   │   ├── index.css
│   │   ├── lib
│   │   ├── main.tsx
├── docker-compose.yml
└── README.md
```

### ¿Por qué grafo y no relacional para este caso?

Porque en grafo las relaciones (llamada → promesa → pago) se consultan directo sin tantos JOINs, el esquema es flexible para agregar nuevos eventos, y podemos usar algoritmos de grafos para encontrar patrones.

### ¿Cómo escalaría a 1 millón de clientes?

Usaría más recursos y dividiría el trabajo: poner varios servidores de base de datos para leer/escribir más rápido, crear buenos índices para encontrar datos sin demoras, y cargar la info por partes (lotes) para no saturar.

### ¿Qué otras fuentes de datos ayudarían?

Eventos de canales (teléfono/SMS/WhatsApp/email), pasarelas de pago, CRM (tickets, preferencias, zona horaria), transcripciones para sentimiento/motivos.

## Video
![Prueba Técnica](https://youtu.be/nmbKDGE1xyE)
