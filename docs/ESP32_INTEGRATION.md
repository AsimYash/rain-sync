# ESP32 hardware integration plan

The prototype works without hardware. This document describes how to connect the real
ESP32 controller later without rewriting the 3D model or the dashboard.

## 1. Sensors and actuators

| Function | Device | ESP32 pin type | Notes |
| --- | --- | --- | --- |
| Community tank level | Ultrasonic (JSN-SR04T) | GPIO trigger + echo | Mounted at the top, pointing down. |
| House N underground level | Ultrasonic | GPIO trigger + echo | One per household tank. |
| House N rooftop level | Ultrasonic | GPIO trigger + echo | One per rooftop tank. |
| Main line flow | Hall-effect flow sensor | GPIO interrupt | Pulses per litre from datasheet. |
| Trunk flow | Hall-effect flow sensor | GPIO interrupt | Rainwater collection line. |
| Rain | Resistive rain-drop board | ADC | Compare against a wet threshold. |
| Main pump, house pumps | Relay channels | GPIO output | Relays must be opto-isolated. |
| Valves 1–3 | Solenoid relays | GPIO output | Normally-closed solenoids. |

Keep pump and solenoid power on a separate supply from the ESP32. Use flyback protection on coils.

## 2. Control logic to port

The simulation logic in `src/store.ts` (`tick`) is the reference implementation:

- Open valve N when underground N < 35 % and the community tank has water.
- Close valve N at 98 % underground, or when the community tank is empty.
- Run the main pump while any valve is open.
- Run house pump N when rooftop N < 60 % and underground N > 8 %.
- Stop house pump N at 98 % rooftop, or when underground N falls to 2 %.

Add a hysteresis band and a minimum run time on each pump before using these thresholds on real hardware.
Add a dry-run protection interlock: stop a pump if its flow sensor reports zero flow for 10 s while it is commanded on.

## 3. Telemetry over MQTT

Use the broker (Mosquitto) and topics in `src/iot/telemetry.ts`:

```
rainsync/community/main/level          -> {"pct": 62.4, "ts": 1731250000}
rainsync/site/rain                      -> {"wet": true, "ts": ...}
rainsync/community/pump/status          -> {"on": true, "ts": ...}
rainsync/house1/underground/level       -> {"pct": 41.0, "ts": ...}
rainsync/house1/rooftop/level           -> {"pct": 77.5, "ts": ...}
rainsync/house1/pump/status             -> {"on": false, "ts": ...}
rainsync/house1/valve/state             -> {"open": true, "ts": ...}
rainsync/house1/cmd                     <- {"action": "valve", "open": true}
```

Publish retained messages for the latest state. Publish telemetry at 1 Hz at most.
Commands go on `.../cmd`; the ESP32 must check its own safety interlocks before acting on them.

## 4. Connecting the dashboard

1. Implement a `TelemetrySource` (see `src/iot/telemetry.ts`) that subscribes to the broker over WebSocket
   (for example, Mosquitto on port 9001) or to a small Express relay.
2. Write incoming frames into the store with the same fields the simulation uses (`main`, `ug`, `roof`,
   `valve`, `housePump`, `mainPump`, `rates`).
3. Set `simulated: false` on the frame and change the dashboard notice. The 3D model needs no changes.

## 5. Security and safety

- Do not expose the broker to the internet without TLS and authentication.
- Use per-device credentials. Rate-limit command topics.
- Keep the controller's local control loop running when Wi-Fi drops.
- Fail safe: relays off, valves closed, when the controller resets.
- Real sensors have failure modes (stuck, out of range, disconnected). Treat out-of-range readings as faults, not as empty tanks.
