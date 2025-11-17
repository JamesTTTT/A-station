import type { JobStreamEvent } from "@/types";

export type WebSocketCallback = (event: JobStreamEvent) => void;

export class JobWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private callbacks: Set<WebSocketCallback> = new Set();
  private jobId: string;
  private token: string;
  private wsUrl: string;

  constructor(jobId: string, token: string) {
    this.jobId = jobId;
    this.token = token;

    // Convert HTTP(S) URL to WS(S) URL
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8000";
    this.wsUrl = baseUrl.replace(/^http/, "ws");
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // WebSocket URL: ws://host/ws/jobs/{job_id}?token={token}
      const url = `${this.wsUrl}/ws/jobs/${this.jobId}?token=${this.token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for job ${this.jobId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: JobStreamEvent = JSON.parse(event.data);
          this.callbacks.forEach((callback) => callback(data));
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed for job ${this.jobId}`, event.code, event.reason);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
    }
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribe(callback: WebSocketCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.callbacks.clear();
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}
