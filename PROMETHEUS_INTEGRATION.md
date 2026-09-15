# Prometheus integration

The browser and Android client call Strata-X; only the FastAPI backend talks to Prometheus. This prevents a Prometheus token from being shipped in either client.

## 1. Configure the backend

Copy `backend/.env.example` to `backend/.env` and set `PROMETHEUS_URL`. If your Prometheus endpoint is protected, set `PROMETHEUS_BEARER_TOKEN` there too. Start the backend:

```bash
cd backend
python3 -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Your telemetry metric should provide an instant vector with these labels:

```text
mine_sensor_reading{node_id="NODE-01",sensor_type="methane",zone_id="ZONE-P4B",unit="% Vol"} 0.42
```

`node_id` and `sensor_type` are required for dashboard matching. `sensor_id`, `zone_id`, and `unit` are optional. Set `PROMETHEUS_TELEMETRY_QUERY` to a selector or PromQL expression that yields those series.

## 2. Dashboard

In **Settings**, select **Prometheus (via Strata-X API)**, enter the reachable FastAPI URL (for example `http://192.168.1.120:8000`), and save. The dashboard polls `/api/v1/prometheus/telemetry` at its configured polling interval and updates the existing sensor views.

## 3. Android API

Use the same FastAPI base URL—never the Prometheus URL or token.

```text
GET /api/v1/prometheus/query?query=mine_sensor_reading{node_id="NODE-01"}
GET /api/v1/prometheus/query_range?query=mine_sensor_reading{node_id="NODE-01"}&start=...&end=...&step=30s
GET /api/v1/prometheus/telemetry
```

The first two return Prometheus's standard API envelope for custom Android charts. The last returns normalized ESP32-style packets for the dashboard's live telemetry contract.
