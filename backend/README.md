# Strata-X live pipeline

This service is the real-time path: `ESP32 → Mosquitto MQTT → FastAPI → Strata-X Ollama → WebSocket dashboard`.

Install and run from this folder:

```bash
python3 -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Copy `.env.example` to `.env`, add the broker password there, and load it before
starting the service (for example, `set -a; . ./.env; set +a`). The default
subscription is `mineguard/site01/+/#` and the local insight model is
`gemma3:4b`. The MQTT connection is made by the backend, so credentials never
reach the dashboard browser.

Each ESP32 message must be JSON, e.g.:

```json
{
  "gateway_id": "JETSON-ORIN-NANO-01",
  "node_id": "NODE-01",
  "zone_id": "ZONE-P4B",
  "timestamp": 1789191000000,
  "battery_v": 3.96,
  "rssi_dbm": -62,
  "readings": [
    {"type":"displacement", "value":6.42, "unit":"mm"},
    {"type":"methane", "value":0.28, "unit":"% Vol"}
  ]
}
```

`POST /ingest` accepts the same payload for testing. `GET /health` reports pipeline health. The dashboard connects to `ws://<host>:8000/ws` by default.

The service calls the local Ollama API for `gemma3:4b` for every coalesced node
update. It accepts aggregate sensor payloads and compact per-sensor messages
such as `{"value": 0.28, "unit": "% Vol"}` on
`mineguard/site01/NODE-01/ch4`. Independent safety thresholds are retained as a
lower risk bound, so a model failure or a low model score cannot hide a sensor
threshold breach.
