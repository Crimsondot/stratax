import { Esp32GatewayTelemetryPacket } from './gatewayService';

/** Talks only to the Strata-X API proxy; never place Prometheus credentials in the browser. */
export class PrometheusService {
  static async getTelemetry(apiUrl: string): Promise<Esp32GatewayTelemetryPacket[]> {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/v1/prometheus/telemetry`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Prometheus API returned ${response.status}`);
    const body = await response.json() as { packets?: Esp32GatewayTelemetryPacket[] };
    return body.packets ?? [];
  }
}
