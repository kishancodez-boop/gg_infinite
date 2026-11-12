export type DatabaseStatusState =
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'disconnected'
  | 'unconfigured';

export interface DatabaseHealth {
  configured: boolean;
  connected: boolean;
  status: DatabaseStatusState;
  readyState: number;
  lastError: string | null;
}

export interface HealthResponse {
  service: string;
  status: 'ok' | 'degraded';
  timestamp: string;
  environment: string;
  uptimeSeconds: number;
  database: DatabaseHealth;
}

export interface SystemStatusResponse {
  service: string;
  version: string;
  apiStatus: 'operational';
  timestamp: string;
  environment: string;
  database: DatabaseHealth;
  features: {
    milestone: string;
    modulesReady: boolean;
    reaIngestionReady: boolean;
    digitalTwinReady: boolean;
  };
}

