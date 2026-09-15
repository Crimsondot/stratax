# Strata-X real-time telemetry implementation

## What was added

The dashboard now has a production-oriented data path for mine telemetry:

```text
ESP32 sensors → Mosquitto MQTT broker → FastAPI pipeline
→ local Ollama `stratax` evaluation → WebSocket → React dashboard
```

The React app still supports its existing simulation mode. When configured for the live gateway, it receives normalized telemetry and risk assessments over a WebSocket connection.

## Backend service

Added `backend/`, which contains the FastAPI service.

| File | Purpose |
| --- | --- |
| `backend/main.py` | MQTT subscriber, packet validation, Ollama assessment, HTTP and WebSocket API |
| `backend/requirements.txt` | Python runtime dependencies |
| `backend/.env.example` | MQTT and Ollama configuration template |
| `backend/README.md` | Short setup and payload reference |

The service subscribes to `stratax/telemetry/#` by default. MQTT messages are validated as telemetry packets, coalesced per node during bursts, assessed, stored as the latest node state, and broadcast to all connected dashboard clients.

## Ollama safety evaluation

For each freshest node update, FastAPI calls Ollama's local API at:

```text
http://127.0.0.1:11434/api/generate
```

with model `stratax` by default (the model supplied by `ollama run stratax`). The model is asked to return JSON containing a risk score, risk level, trend, confidence, and concise recommendation.

Safety is not delegated entirely to the model. A deterministic threshold floor is calculated first for displacement, displacement rate, vibration, methane, carbon monoxide, and temperature. The final score is the greater of the model score and that floor. If Ollama is unavailable, the dashboard still receives the threshold-based result, clearly marked with `model_available: false`.

## Dashboard integration

Updated files:

| File | Change |
| --- | --- |
| `src/data/initialData.ts` | The default WebSocket endpoint is now `ws://<current-host>:8000/ws`; `VITE_WS_URL` still overrides it. |
| `src/services/websocketService.ts` | Uses backend zone, battery, RSSI, firmware, assessment score, confidence, and trend fields. |
| `src/types/index.ts` | Adds optional analysis confidence, trend, model, and model-availability fields. |

The frontend expects a message shaped like this:

```json
{
  "device_id": "NODE-01",
  "timestamp": 1789191000000,
  "gateway_id": "JETSON-ORIN-NANO-01",
  "node_id": "NODE-01",
  "zone_id": "ZONE-P4B",
  "battery_v": 3.96,
  "rssi_dbm": -62,
  "firmware": "1.0.0",
  "sensors": {"displacement": 6.42, "methane": 0.28},
  "analysis": {
    "score": 10,
    "risk_level": "NORMAL",
    "trend": "STABLE",
    "confidence": 82,
    "message": "Readings are within configured thresholds.",
    "model": "stratax",
    "model_available": true
  }
}
```

## Run locally

1. Ensure Mosquitto and Ollama are running, then make the model available:

   ```bash
   ollama run stratax
   ```

2. Configure the backend. Either export the variables below or copy values from `backend/.env.example` into your service environment:

   ```bash
   export MQTT_HOST=127.0.0.1
   export MQTT_PORT=1883
   export MQTT_TOPIC='stratax/telemetry/#'
   export OLLAMA_URL=http://127.0.0.1:11434
   export OLLAMA_MODEL=stratax
   ```

3. Start FastAPI:

   ```bash
   cd backend
   python3 -m pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. Start the React dashboard in a separate terminal:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173/`. For an off-device backend, set `VITE_WS_URL` to its `ws://.../ws` URL before starting Vite.

## ESP32 / MQTT packet format

Publish JSON to a topic matching `stratax/telemetry/#`, for example `stratax/telemetry/node-01`:

```json
{
  "gateway_id": "JETSON-ORIN-NANO-01",
  "node_id": "NODE-01",
  "zone_id": "ZONE-P4B",
  "timestamp": 1789191000000,
  "battery_v": 3.96,
  "rssi_dbm": -62,
  "firmware": "1.0.0",
  "readings": [
    {"type": "displacement", "value": 6.42, "unit": "mm"},
    {"type": "methane", "value": 0.28, "unit": "% Vol"}
  ]
}
```

For bench testing without MQTT, send the exact same object to `POST /ingest`. `GET /health` reports the configured MQTT topic, model name, and nodes seen by the service.

## Visual skill status

The `img2threejs` skill was installed for a later visual pass. It is intended to generate procedural, browser-run Three.js models from reference images. No Three.js visual asset has been added yet: the current change set focuses on making live telemetry and analysis reliable first.

## Current verification status

The backend and frontend integration files were created, but the previous session could not complete runtime verification because the local Ollama service was inaccessible from its sandbox. Before deployment, verify all of the following on the target machine:

- `ollama list` includes `stratax`.
- Mosquitto accepts the configured topic and credentials/network settings.
- `GET /health` returns HTTP 200.
- An ESP32 test message reaches the WebSocket dashboard.
- Ollama response JSON is valid; otherwise the deterministic safety fallback appears.
