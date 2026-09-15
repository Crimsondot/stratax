# Strata-X: Render, Android, and Prometheus Runbook

This runbook deploys the Strata-X dashboard and FastAPI telemetry bridge, connects an Android app to the same API, and establishes production guardrails.

## Architecture

```text
ESP32 sensors -> MQTT / Prometheus -> Strata-X FastAPI API -> Dashboard + Android app
```

The dashboard and Android app must call the Strata-X API only. They must never receive a Prometheus URL, token, MQTT password, or other infrastructure credential.

> **Network prerequisite:** Render cannot reach a private on-site address such as `192.168.x.x` directly. Prometheus must either be securely reachable from Render (HTTPS + authentication), connected through an approved VPN/tunnel, or the FastAPI bridge must remain on the mine/Jetson network.

---

## Part 1: Configure Prometheus for Strata-X

1. In the repository, copy the example environment configuration:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Set the production values in `backend/.env` locally, or set these as secrets in Render:

   ```env
   PROMETHEUS_URL=https://your-prometheus-host
   PROMETHEUS_BEARER_TOKEN=replace-with-a-secret-token
   PROMETHEUS_TELEMETRY_QUERY=mine_sensor_reading
   PROMETHEUS_TIMEOUT_SECONDS=10
   ```

3. Ensure the Prometheus metric supplies at least `node_id` and `sensor_type` labels:

   ```text
   mine_sensor_reading{node_id="NODE-01",sensor_type="methane",zone_id="ZONE-P4B",unit="% Vol"} 0.42
   ```

   Optional labels are `sensor_id`, `zone_id`, and `unit`.

4. Do not commit `.env`, tokens, keystores, or password files.

---

## Part 2: Deploy the FastAPI API on Render

1. Push the project to a private GitHub repository:

   ```bash
   cd /path/to/strata-x
   git init
   git add .
   git commit -m "Deploy Strata-X"
   git branch -M main
   git remote add origin https://github.com/YOUR_ORG/strata-x.git
   git push -u origin main
   ```

2. In Render, select **New > Web Service** and connect the repository.

3. Configure the service:

   ```text
   Name: stratax-api
   Root Directory: backend
   Runtime: Python
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   Health Check Path: /health
   ```

4. Add these environment variables in Render. Use Render secrets/environment groups for secrets, never the repository:

   ```env
   PROMETHEUS_URL=https://your-prometheus-host
   PROMETHEUS_BEARER_TOKEN=secret
   PROMETHEUS_TELEMETRY_QUERY=mine_sensor_reading
   PROMETHEUS_TIMEOUT_SECONDS=10
   MQTT_HOST=your-mqtt-host-if-used
   MQTT_PORT=1883
   MQTT_USERNAME=secret-if-used
   MQTT_PASSWORD=secret-if-used
   MQTT_TOPIC=mineguard/site01/+/#
   ALLOWED_ORIGINS=https://your-dashboard.onrender.com
   ```

5. Deploy and copy the API URL, for example:

   ```text
   https://stratax-api.onrender.com
   ```

6. Verify:

   ```text
   GET https://stratax-api.onrender.com/health
   GET https://stratax-api.onrender.com/api/v1/prometheus/telemetry
   ```

The health endpoint must return a successful HTTP status for Render to consider the instance ready.

---

## Part 3: Deploy the React dashboard on Render

1. In Render, select **New > Static Site** and choose the same repository.

2. Configure:

   ```text
   Name: stratax-dashboard
   Root Directory: .
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. Add build environment variables:

   ```env
   VITE_API_URL=https://stratax-api.onrender.com
   VITE_WS_URL=wss://stratax-api.onrender.com/ws
   ```

4. Deploy and copy the dashboard URL.

5. Update the API service's `ALLOWED_ORIGINS` to the final dashboard URL, then redeploy the API.

6. Open the dashboard and go to **Settings**:

   - Select **Prometheus (via Strata-X API)**.
   - Enter `https://stratax-api.onrender.com` as the Prometheus API URL.
   - Save configuration.

---

## Part 4: Connect and build the Android APK

### 1. Configure the API URL

In the Android app's `app/build.gradle.kts`:

```kotlin
android {
    buildFeatures { buildConfig = true }

    defaultConfig {
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"https://stratax-api.onrender.com/\""
        )
    }
}
```

Use the actual Render/custom-domain API URL. Do not use `localhost` or a Prometheus URL in a physical Android device build.

### 2. Enable internet access

In `app/src/main/AndroidManifest.xml`, before `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. Add Retrofit

In `app/build.gradle.kts`:

```kotlin
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-gson:2.11.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
```

### 4. Declare API calls

```kotlin
interface StrataXApi {
    @GET("api/v1/prometheus/telemetry")
    suspend fun getLiveTelemetry(): PrometheusTelemetryResponse

    @GET("api/v1/prometheus/query")
    suspend fun queryPrometheus(@Query("query") query: String): PrometheusResponse

    @GET("api/v1/prometheus/query_range")
    suspend fun queryRange(
        @Query("query") query: String,
        @Query("start") start: Long,
        @Query("end") end: Long,
        @Query("step") step: String = "30s"
    ): PrometheusResponse
}
```

Live data endpoint:

```text
GET /api/v1/prometheus/telemetry
```

Historical chart endpoint:

```text
GET /api/v1/prometheus/query_range?query=mine_sensor_reading{node_id="NODE-01"}&start=...&end=...&step=30s
```

### 5. Build and install debug APK

```bash
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 6. Build release artifact

Create and protect a signing keystore, configure release signing, then run:

```bash
./gradlew assembleRelease
./gradlew bundleRelease
```

Outputs:

```text
app/build/outputs/apk/release/app-release.apk
app/build/outputs/bundle/release/app-release.aab
```

Use the signed `.aab` for Google Play distribution.

---

## Part 5: Production guardrails for Render and the API

1. **Secrets**: Store `PROMETHEUS_BEARER_TOKEN`, MQTT credentials, and JWT secrets only in Render environment variables or environment groups.
2. **Authentication**: Add JWT/OAuth authentication before production use; anonymous access to operational telemetry is not acceptable.
3. **Authorization**: Enforce `viewer`, `operator`, and `admin` roles server-side. Validate mine/site ownership for every node, zone, report, and alert action.
4. **PromQL allowlisting**: Replace general-purpose production PromQL routes with server-built, validated endpoints such as:

   ```text
   GET /telemetry/live?node_id=NODE-01
   GET /telemetry/history?node_id=NODE-01&sensor_type=methane
   GET /telemetry/summary?zone_id=ZONE-P4B
   ```

5. **Resource controls**: Enforce maximum query duration, minimum range-query step, maximum samples/series, request timeout, concurrency limit, and rate limiting.
6. **CORS**: Set `ALLOWED_ORIGINS` to the exact dashboard domain. Do not use `*` for authenticated production browser traffic.
7. **Network controls**: Use a custom HTTPS domain. If the Render plan permits it, restrict admin/API access with inbound IP allowlists. Keep Prometheus private behind authentication and a tunnel/VPN where possible.
8. **Health and data freshness**: Show `data delayed` or `unavailable` when Prometheus is stale/down. Never imply that missing data means normal/safe conditions.
9. **Auditability**: Record authentication, query, acknowledgement, escalation, and configuration events with user, time, device, target, and result.
10. **Operations**: Rotate secrets, review deployment logs, test rollback, and use separate staging and production environments.

---

## Part 6: Production guardrails for Android

1. The Android app calls only the Strata-X API. Do not embed Prometheus/MQTT credentials or infrastructure hostnames.
2. Use HTTPS only and disable cleartext HTTP in release builds.
3. Use short-lived access tokens. Store refresh tokens using Android Keystore-backed encrypted storage.
4. Enforce all authorization on the API; hidden UI controls are not security controls.
5. Use separate debug and release API URLs. Do not ship a development URL in a release APK.
6. Disable verbose network logs in release, enable R8/ProGuard, and keep the signing keystore outside Git.
7. Add retries with exponential backoff, response-size limits, and request timeouts.
8. Display the latest source timestamp and label cached values. Do not display a safe/normal state when data is unavailable.
9. Require explicit confirmation for critical actions such as acknowledgements or escalations, and audit them server-side.
10. Test expired tokens, `401`, `403`, `429`, server errors, offline mode, stale Prometheus readings, and unauthorized node/site access before release.

## Reference links

- [Render FastAPI deployment](https://render.com/docs/deploy-fastapi)
- [Render health checks](https://render.com/docs/health-checks)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Render inbound IP rules](https://render.com/docs/inbound-ip-rules)
- [OWASP API Security](https://owasp.org/blog/2023/07/03/owasp-api-top10-2023)
