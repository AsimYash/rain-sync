// Boundary between the UI and any data source.
//
// The prototype reads everything from the local simulation store (src/store.ts).
// When real ESP32 hardware is added, a telemetry adapter publishes the same shape
// of data into the store (or into a separate store) and the UI does not change.
// See docs/ESP32_INTEGRATION.md for the full MQTT topic and payload plan.

export interface TelemetryFrame {
  deviceId: string;
  ts: number; // unix ms
  simulated: boolean; // true for the demo source
  mainLevelPct: number;
  houses: {
    id: 1 | 2 | 3;
    undergroundLevelPct: number;
    rooftopLevelPct: number;
    valveOpen: boolean;
    housePumpOn: boolean;
    branchFlowLpm: number;
    liftFlowLpm: number;
  }[];
  mainPumpOn: boolean;
  rainDetected: boolean;
}

export interface TelemetrySource {
  name: string;
  subscribe(onFrame: (f: TelemetryFrame) => void): () => void;
}

/** Topic plan for the MQTT broker (Mosquitto). Not connected in the prototype. */
export const MQTT_TOPICS = {
  mainLevel: 'rainsync/community/main/level',
  rain: 'rainsync/site/rain',
  mainPump: 'rainsync/community/pump/status',
  houseLevel: (id: 1 | 2 | 3, where: 'underground' | 'rooftop') => `rainsync/house${id}/${where}/level`,
  housePump: (id: 1 | 2 | 3) => `rainsync/house${id}/pump/status`,
  valve: (id: 1 | 2 | 3) => `rainsync/house${id}/valve/state`,
  command: (id: 1 | 2 | 3) => `rainsync/house${id}/cmd`,
} as const;
