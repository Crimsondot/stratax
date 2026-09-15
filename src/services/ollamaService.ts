import { TelemetryPacket } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname || '127.0.0.1'}:8000`;
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b';

export interface OllamaAssessment {
  score: number;
  risk_level: string;
  trend: string;
  confidence: number;
  message: string;
  model: string;
  model_available: boolean;
}

export interface OllamaChatResponse {
  model: string;
  response: Record<string, any>;
  model_available: boolean;
}

export class OllamaService {
  static async assessTelemetry(packet: TelemetryPacket): Promise<OllamaAssessment> {
    const response = await fetch(`${API_BASE}/api/v1/ollama/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    });
    if (!response.ok) {
      throw new Error(`Ollama assessment failed: ${response.status}`);
    }
    return response.json();
  }

  static async chat(prompt: string): Promise<OllamaChatResponse> {
    const response = await fetch(`${API_BASE}/api/v1/ollama/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      throw new Error(`Ollama chat failed: ${response.status}`);
    }
    return response.json();
  }
}
