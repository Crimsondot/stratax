"""Strata-X live telemetry pipeline: ESP32 -> MQTT -> FastAPI -> WebSocket.

Run with: uvicorn main:app --host 0.0.0.0 --port 8000
Environment: MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC,
OLLAMA_URL, OLLAMA_MODEL, PROMETHEUS_URL, PROMETHEUS_BEARER_TOKEN and
PROMETHEUS_TELEMETRY_QUERY. Credentials are only ever used by this server.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from jose import jwt as jose_jwt

try:
    import paho.mqtt.client as mqtt
except ImportError:  # Allows HTTP/WebSocket development without a broker installed.
    mqtt = None

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("stratax.pipeline")

# Local deployment settings live beside this service and are intentionally ignored
# by git. Environment variables supplied by a service manager still take priority.
load_dotenv(Path(__file__).with_name(".env"), override=False)

MQTT_HOST = os.getenv("MQTT_HOST", "172.24.180.140")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "mineguard/site01/+/#")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
OLLAMA_MIN_INTERVAL_SECONDS = max(0, int(os.getenv("OLLAMA_MIN_INTERVAL_SECONDS", "300")))
OLLAMA_ENABLED = os.getenv("OLLAMA_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "").rstrip("/")
PROMETHEUS_BEARER_TOKEN = os.getenv("PROMETHEUS_BEARER_TOKEN")
PROMETHEUS_TELEMETRY_QUERY = os.getenv("PROMETHEUS_TELEMETRY_QUERY", "mine_sensor_reading")
PROMETHEUS_TIMEOUT_SECONDS = float(os.getenv("PROMETHEUS_TIMEOUT_SECONDS", "10"))
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
 ).split(",") if origin.strip()]
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")


async def verify_clerk_token(authorization: str = Header(None)) -> dict[str, Any]:
    """Verify Clerk JWT token from Authorization header."""
    if not CLERK_SECRET_KEY:
        return {"sub": "dev", "role": "operator"}
    token = authorization.replace("Bearer ", "") if authorization and authorization.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(401, "Missing authorization token")
    try:
        payload = jose_jwt.decode(token, CLERK_SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(401, "Invalid Clerk token")


class TelemetryReading(BaseModel):
    sensor_id: str | None = None
    type: str
    value: float
    unit: str = ""


class TelemetryPacket(BaseModel):
    gateway_id: str = "JETSON-ORIN-NANO-01"
    node_id: str = "NODE-01"
    zone_id: str = "ZONE-P4B"
    timestamp: int = Field(default_factory=lambda: int(time.time() * 1000))
    battery_v: float | None = None
    rssi_dbm: int | None = None
    firmware: str | None = None
    readings: list[TelemetryReading] = Field(default_factory=list)


SENSOR_ALIASES = {
    "ch4": "methane", "methane_percent": "methane", "gas_ch4": "methane",
    "co": "carbon_monoxide", "carbonmonoxide": "carbon_monoxide", "gas_co": "carbon_monoxide",
    "temp": "temperature", "temperature_c": "temperature", "vibration_rms": "vibration",
    "disp": "displacement", "displacement_mm": "displacement",
    "disp_rate": "displacement_rate", "displacement_rate_mm_h": "displacement_rate",
}
DEFAULT_UNITS = {
    "methane": "% Vol", "carbon_monoxide": "ppm", "temperature": "°C",
    "vibration": "mm/s", "displacement": "mm", "displacement_rate": "mm/hr",
}


def canonical_sensor_type(value: str) -> str:
    """Map common MineGuard/ESP field names to the dashboard safety vocabulary."""
    key = value.lower().strip().replace("-", "_").replace(" ", "_")
    return SENSOR_ALIASES.get(key, key)


def milliseconds(value: Any) -> int:
    """Accept milliseconds, seconds, or ISO timestamps without accepting invalid dates."""
    if isinstance(value, (int, float)):
        return int(value * 1000) if value < 10_000_000_000 else int(value)
    if isinstance(value, str):
        try:
            return milliseconds(float(value))
        except ValueError:
            pass
    return int(time.time() * 1000)


def packet_from_mineguard(raw: Any, topic: str) -> TelemetryPacket:
    """Normalize both MineGuard aggregate payloads and per-sensor topic payloads.

    Supported payloads include the documented ``readings``/``sensors`` shape and
    a compact message such as ``{"value": 0.42, "unit": "% Vol"}`` on
    ``mineguard/site01/NODE-01/ch4``.  Topic segments provide safe fallbacks
    when an ESP32 sends only a measurement.
    """
    if not isinstance(raw, dict):
        raise ValueError("MQTT payload must be a JSON object")
    raw = raw.get("data", raw.get("payload", raw))
    if not isinstance(raw, dict):
        raise ValueError("nested MQTT data must be a JSON object")

    parts = [part for part in topic.split("/") if part]
    site_id = parts[1] if len(parts) > 1 else "site01"
    topic_node = parts[2] if len(parts) > 2 else "NODE-01"
    topic_sensor = parts[-1] if len(parts) > 3 else ""
    readings: list[dict[str, Any]] = []

    raw_readings = raw.get("readings")
    if isinstance(raw_readings, list):
        for item in raw_readings:
            if isinstance(item, dict) and item.get("value") is not None:
                sensor_type = canonical_sensor_type(str(item.get("type") or item.get("sensor") or item.get("name") or topic_sensor))
                readings.append({**item, "type": sensor_type, "unit": item.get("unit") or DEFAULT_UNITS.get(sensor_type, "")})
    else:
        raw_sensors = raw.get("sensors") or raw.get("measurements")
        if isinstance(raw_sensors, dict):
            for key, value in raw_sensors.items():
                if isinstance(value, dict):
                    value = value.get("value")
                if value is not None:
                    sensor_type = canonical_sensor_type(key)
                    readings.append({"type": sensor_type, "value": value, "unit": DEFAULT_UNITS.get(sensor_type, "")})
        elif raw.get("value") is not None or raw.get("reading") is not None:
            sensor_type = canonical_sensor_type(str(raw.get("type") or raw.get("sensor") or raw.get("metric") or topic_sensor))
            readings.append({"sensor_id": raw.get("sensor_id"), "type": sensor_type, "value": raw.get("value", raw.get("reading")), "unit": raw.get("unit") or DEFAULT_UNITS.get(sensor_type, "")})
        else:
            # Some devices publish flat payloads: {"ch4": 0.4, "temp": 28.1}.
            for key, value in raw.items():
                if isinstance(value, (int, float)) and key not in {"timestamp", "battery_v", "rssi_dbm"}:
                    sensor_type = canonical_sensor_type(key)
                    readings.append({"type": sensor_type, "value": value, "unit": DEFAULT_UNITS.get(sensor_type, "")})

    if not readings:
        raise ValueError("no numeric sensor readings found")
    return TelemetryPacket.model_validate({
        "gateway_id": raw.get("gateway_id", "MINEGUARD-MQTT"),
        "node_id": raw.get("node_id") or raw.get("device_id") or raw.get("device") or topic_node,
        "zone_id": raw.get("zone_id") or raw.get("zone") or site_id.upper(),
        "timestamp": milliseconds(raw.get("timestamp", raw.get("ts", raw.get("time")))),
        "battery_v": raw.get("battery_v", raw.get("battery")),
        "rssi_dbm": raw.get("rssi_dbm", raw.get("rssi")),
        "firmware": raw.get("firmware"),
        "readings": readings,
    })


def severity(score: int) -> str:
    return "CRITICAL" if score >= 80 else "HIGH_RISK" if score >= 60 else "WARNING" if score >= 40 else "NORMAL"


def safety_floor(packet: TelemetryPacket) -> int:
    """A deterministic lower bound: LLM output must never suppress a threshold breach."""
    limits = {
        "displacement": (12, 20, 28), "displacement_rate": (1.2, 2.5, 4.5),
        "vibration": (4, 8.5, 14), "methane": (.8, 1.25, 1.75),
        "carbon_monoxide": (25, 50, 100), "temperature": (35, 45, 55),
    }
    score = 10
    for reading in packet.readings:
        thresholds = limits.get(reading.type.lower())
        if not thresholds:
            continue
        warn, high, critical = thresholds
        score = max(score, 45 if reading.value >= warn else 10)
        score = max(score, 65 if reading.value >= high else 10)
        score = max(score, 90 if reading.value >= critical else 10)
    return score


def deterministic_analysis(packet: TelemetryPacket) -> dict[str, Any]:
    """Immediate safety status for every packet, independent of model availability."""
    score = safety_floor(packet)
    return {
        "score": score,
        "risk_level": severity(score),
        "trend": "STABLE" if score < 40 else "DETERIORATING",
        "confidence": 100,
        "message": "Live deterministic safety rules evaluated this telemetry packet.",
        "model": OLLAMA_MODEL,
        "model_available": False,
    }


async def assess_with_stratax(packet: TelemetryPacket) -> dict[str, Any]:
    floor = safety_floor(packet)
    readings = [{"type": r.type, "value": r.value, "unit": r.unit} for r in packet.readings]
    prompt = f"""You are Strata-X, an underground mine safety analyst. Evaluate this live ESP32 telemetry.
Zone: {packet.zone_id}; node: {packet.node_id}; readings: {json.dumps(readings)}.
Return ONLY JSON: {{\"risk_score\":0-100,\"risk_level\":\"NORMAL|WARNING|HIGH_RISK|CRITICAL\",\"trend\":\"STABLE|IMPROVING|DETERIORATING|CRITICAL_RISK\",\"confidence\":0-100,\"summary\":\"brief evidence-based safety recommendation\"}}.
Do not claim statutory compliance. State uncertainty if readings are incomplete."""
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(f"{OLLAMA_URL}/api/generate", json={
                "model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json",
                "options": {"temperature": 0.1},
            })
            response.raise_for_status()
            result = json.loads(response.json().get("response", "{}"))
        llm_score = max(0, min(100, int(float(result.get("risk_score", floor)))))
        score = max(floor, llm_score)
        return {
            "score": score, "risk_level": severity(score),
            "trend": result.get("trend", "STABLE" if score < 40 else "DETERIORATING"),
            "confidence": max(1, min(100, int(float(result.get("confidence", 75))))),
            "message": str(result.get("summary", "Strata-X completed live telemetry evaluation."))[:900],
            "model": OLLAMA_MODEL, "model_available": True,
        }
    except Exception as exc:
        log.warning("Ollama assessment unavailable: %s", exc)
        return {
            "score": floor, "risk_level": severity(floor),
            "trend": "STABLE" if floor < 40 else "DETERIORATING", "confidence": 0,
            "message": "Strata-X is unavailable; displaying the deterministic safety threshold floor.",
            "model": OLLAMA_MODEL, "model_available": False,
        }


class TelemetryHub:
    def __init__(self) -> None:
        self.sockets: set[WebSocket] = set()
        self.latest: dict[str, dict[str, Any]] = {}
        self.queue: asyncio.Queue[TelemetryPacket] = asyncio.Queue(maxsize=200)
        self.loop: asyncio.AbstractEventLoop | None = None
        self.mqtt_client: Any = None
        self.last_model_assessment: dict[str, float] = {}
        self.last_safety_score: dict[str, int] = {}

    async def analyse_packet(self, packet: TelemetryPacket) -> dict[str, Any]:
        """Use the model for an alert transition or periodic context, never every sample."""
        if not OLLAMA_ENABLED:
            return deterministic_analysis(packet)
        now = time.monotonic()
        score = safety_floor(packet)
        previous_score = self.last_safety_score.get(packet.node_id, 0)
        last_assessment = self.last_model_assessment.get(packet.node_id, float("-inf"))
        is_alert_transition = score >= 40 and previous_score < 40
        interval_elapsed = now - last_assessment >= OLLAMA_MIN_INTERVAL_SECONDS
        self.last_safety_score[packet.node_id] = score

        if is_alert_transition or interval_elapsed:
            self.last_model_assessment[packet.node_id] = now
            return await assess_with_stratax(packet)
        return deterministic_analysis(packet)

    async def publish(self, packet: TelemetryPacket) -> dict[str, Any]:
        analysis = await self.analyse_packet(packet)
        payload = {
            "device_id": packet.node_id, "timestamp": packet.timestamp,
            "gateway_id": packet.gateway_id, "node_id": packet.node_id, "zone_id": packet.zone_id,
            "battery_v": packet.battery_v, "rssi_dbm": packet.rssi_dbm, "firmware": packet.firmware,
            "sensors": {r.type: r.value for r in packet.readings},
            "readings": [r.model_dump() for r in packet.readings], "analysis": analysis,
        }
        self.latest[packet.node_id] = payload
        dead: list[WebSocket] = []
        for socket in self.sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                dead.append(socket)
        for socket in dead:
            self.sockets.discard(socket)
        return payload

    async def consume(self) -> None:
        while True:
            packet = await self.queue.get()
            # Coalesce bursts from one ESP node; evaluate its freshest sample only.
            newest = packet
            while not self.queue.empty():
                candidate = self.queue.get_nowait()
                if candidate.node_id == packet.node_id:
                    newest = candidate
                else:
                    await self.queue.put(candidate)
                    break
            await self.publish(newest)

    def start_mqtt(self) -> None:
        if mqtt is None:
            log.warning("paho-mqtt is not installed; MQTT consumer disabled.")
            return
        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="stratax-mineguard-bridge")
            if MQTT_USERNAME:
                client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            def on_connect(c: Any, _u: Any, _f: Any, reason: Any, _p: Any = None) -> None:
                log.info("MQTT connected (%s); subscribing to %s", reason, MQTT_TOPIC)
                c.subscribe(MQTT_TOPIC, qos=1)
            def on_message(_c: Any, _u: Any, message: Any) -> None:
                try:
                    raw = json.loads(message.payload.decode("utf-8"))
                    packet = packet_from_mineguard(raw, message.topic)
                    if self.loop:
                        def enqueue() -> None:
                            try:
                                self.queue.put_nowait(packet)
                            except asyncio.QueueFull:
                                log.warning("Telemetry queue full; dropped message from %s", message.topic)
                        self.loop.call_soon_threadsafe(enqueue)
                except Exception as exc:
                    log.warning("Discarded invalid MQTT message on %s: %s", message.topic, exc)
            client.on_connect, client.on_message = on_connect, on_message
            try:
                client.connect_async(MQTT_HOST, MQTT_PORT, keepalive=45)
                client.loop_start()
                self.mqtt_client = client
                log.info("MQTT bridge started for %s:%s", MQTT_HOST, MQTT_PORT)
            except Exception as exc:
                log.warning("MQTT connection failed: %s; continuing without MQTT.", exc)
        except Exception as exc:
            log.warning("paho-mqtt initialization failed: %s; continuing without MQTT.", exc)

    def stop_mqtt(self) -> None:
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


hub = TelemetryHub()


async def prometheus_request(path: str, params: dict[str, Any]) -> dict[str, Any]:
    """Proxy a Prometheus HTTP API request without exposing its credentials to clients."""
    if not PROMETHEUS_URL:
        raise HTTPException(503, "Prometheus is not configured. Set PROMETHEUS_URL on the backend.")
    headers = {"Authorization": f"Bearer {PROMETHEUS_BEARER_TOKEN}"} if PROMETHEUS_BEARER_TOKEN else {}
    try:
        async with httpx.AsyncClient(timeout=PROMETHEUS_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{PROMETHEUS_URL}{path}", params=params, headers=headers)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        log.warning("Prometheus request failed: %s", exc)
        raise HTTPException(502, "Prometheus could not be reached by the telemetry API.") from exc
    if payload.get("status") != "success":
        raise HTTPException(502, payload.get("error", "Prometheus returned an unsuccessful response."))
    return payload


def prometheus_packets(result: list[dict[str, Any]]) -> list[TelemetryPacket]:
    """Convert an instant-vector result into the dashboard's stable telemetry contract.

    The metric must expose labels named ``node_id`` (or ``instance``), ``sensor_type``
    (or ``sensor``), and optionally ``zone_id``/``unit``. Configure the metric name with
    PROMETHEUS_TELEMETRY_QUERY; labels remain intentionally vendor-neutral.
    """
    grouped: dict[str, dict[str, Any]] = {}
    for series in result:
        labels = series.get("metric", {})
        sample = series.get("value", [])
        if len(sample) < 2:
            continue
        try:
            value = float(sample[1])
            timestamp = int(float(sample[0]) * 1000)
        except (TypeError, ValueError):
            continue
        node_id = str(labels.get("node_id") or labels.get("device_id") or labels.get("instance") or "PROMETHEUS-NODE")
        sensor_type = canonical_sensor_type(str(labels.get("sensor_type") or labels.get("sensor") or labels.get("type") or labels.get("__name__", "reading")))
        packet = grouped.setdefault(node_id, {
            "node_id": node_id, "gateway_id": "PROMETHEUS", "zone_id": str(labels.get("zone_id") or labels.get("zone") or "PROMETHEUS"),
            "timestamp": timestamp, "readings": [],
        })
        packet["timestamp"] = max(packet["timestamp"], timestamp)
        packet["readings"].append({
            "sensor_id": labels.get("sensor_id") or f"{node_id}-{sensor_type}", "type": sensor_type,
            "value": value, "unit": str(labels.get("unit") or DEFAULT_UNITS.get(sensor_type, "")),
        })
    return [TelemetryPacket.model_validate(packet) for packet in grouped.values()]

@asynccontextmanager
async def lifespan(_: FastAPI):
    hub.loop = asyncio.get_running_loop()
    consumer = asyncio.create_task(hub.consume())
    hub.start_mqtt()
    yield
    hub.stop_mqtt()
    consumer.cancel()


app = FastAPI(title="Strata-X Telemetry Pipeline", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "mqtt_topic": MQTT_TOPIC, "ollama_enabled": OLLAMA_ENABLED, "ollama_model": OLLAMA_MODEL, "ollama_min_interval_seconds": OLLAMA_MIN_INTERVAL_SECONDS, "ollama_url": OLLAMA_URL, "prometheus_configured": bool(PROMETHEUS_URL), "nodes": list(hub.latest)}


@app.post("/api/v1/ollama/assess")
async def ollama_assess(packet: TelemetryPacket, payload: dict[str, Any] = Depends(verify_clerk_token)) -> dict[str, Any]:
    """Trigger an on-demand Ollama gemma3:4b assessment for the given telemetry packet."""
    analysis = await assess_with_stratax(packet)
    return analysis


@app.post("/api/v1/ollama/chat")
async def ollama_chat(prompt: dict[str, Any], payload: dict[str, Any] = Depends(verify_clerk_token)) -> dict[str, Any]:
    """Send a custom prompt to the Ollama gemma3:4b model and return the response."""
    user_prompt = prompt.get("prompt", "")
    if not user_prompt.strip():
        raise HTTPException(422, "prompt is required")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{OLLAMA_URL}/api/generate", json={
                "model": OLLAMA_MODEL,
                "prompt": user_prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.1},
            })
            response.raise_for_status()
            result = json.loads(response.json().get("response", "{}"))
        return {"model": OLLAMA_MODEL, "response": result, "model_available": True}
    except Exception as exc:
        log.warning("Ollama chat unavailable: %s", exc)
        raise HTTPException(503, f"Ollama assessment unavailable: {exc}") from exc


@app.get("/api/v1/prometheus/query")
async def prometheus_query(query: str, time: float | None = None) -> dict[str, Any]:
    """PromQL instant query endpoint for the dashboard and Android app."""
    if not query.strip() or len(query) > 8192:
        raise HTTPException(422, "query must be between 1 and 8192 characters")
    params: dict[str, Any] = {"query": query}
    if time is not None:
        params["time"] = time
    return await prometheus_request("/api/v1/query", params)


@app.get("/api/v1/prometheus/query_range")
async def prometheus_query_range(query: str, start: float, end: float, step: str = "30s") -> dict[str, Any]:
    """PromQL range query endpoint. Use this for charts and Android history screens."""
    if not query.strip() or len(query) > 8192 or end <= start:
        raise HTTPException(422, "provide a non-empty query, an end after start, and a query up to 8192 characters")
    return await prometheus_request("/api/v1/query_range", {"query": query, "start": start, "end": end, "step": step})


@app.get("/api/v1/prometheus/telemetry")
async def prometheus_telemetry(query: str | None = None) -> dict[str, Any]:
    """Return Prometheus samples normalized to the existing ESP32 telemetry packet format."""
    payload = await prometheus_request("/api/v1/query", {"query": query or PROMETHEUS_TELEMETRY_QUERY})
    packets = prometheus_packets(payload.get("data", {}).get("result", []))
    return {"packets": [packet.model_dump() for packet in packets], "source": "prometheus"}

@app.post("/ingest")
async def ingest(packet: TelemetryPacket) -> dict[str, Any]:
    return await hub.publish(packet)

@app.websocket("/ws")
async def websocket(socket: WebSocket) -> None:
    await socket.accept()
    hub.sockets.add(socket)
    for payload in hub.latest.values():
        await socket.send_json(payload)
    try:
        while True:
            await socket.receive_text()  # Keeps the browser connection alive.
    except WebSocketDisconnect:
        hub.sockets.discard(socket)
