# RainSync – Smart Community Rainwater Harvesting & Distribution

An interactive 3D digital twin of a community rainwater system: three houses, each with its own
underground tank, rooftop tank and pump, all supplied from one large shared underground community tank.

## Run it

Requirements: Node.js 18+ (tested on Node 22) and a WebGL-capable browser.

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

No hardware or internet connection is needed. All values are simulated.

## Using the site

- **3D Explorer**: drag to rotate, scroll to zoom, right-drag to pan (touch: one finger rotates, two pinch).
- **Views**: Complete village, Underground, Rainwater collection, Main community tank, House 1/2/3, IoT monitoring.
  House views also isolate that house's network. Use *Show all houses* to reset.
- **Angles**: Front, Side, Top, Isometric.
- **Inspect**: click any pipe, tank, pump, valve, sensor or the ESP32 unit. The panel shows purpose, operation,
  connections, I/O, hardware, sensors, principle and failure modes. Connected pipelines glow.
- **2D diagram**: the *Show 2D flow diagram* button swaps the 3D model for a flow diagram that reads the same state.
- **Simulation bar**: start/pause/reset, rain on/off, simulate low or full tanks, auto control, manual pump and valve
  control, household demand, and flow speed. Manual device changes switch auto control off.
- **IoT dashboard**: levels for all seven tanks, pump and valve status, flow rates, total stored water, water delivered
  per house, and a level history chart. All values are labelled as demonstration data.
- **Low-performance mode**: reduces pixel ratio and rain particles. It turns on automatically on small screens.

## Architecture in code

| File | Role |
| --- | --- |
| `src/topology.ts` | Single source of truth for positions, capacities and every pipeline path. |
| `src/store.ts` | Zustand store: simulation state, auto control logic, camera goals, selection. |
| `src/data/components.ts` | Inspection text for each component, and pipeline connections for highlighting. |
| `src/scene/Village.tsx` | All 3D geometry: houses, tanks, filter, pumps, valves, sensors, pipes and particles. |
| `src/scene/CameraRig.tsx` | Smooth camera transitions between views. |
| `src/components/*` | Explorer toolbar, inspection panel, simulation bar, 2D diagram, dashboard. |
| `src/iot/telemetry.ts` | Adapter boundary and MQTT topic plan for real ESP32 data. |
| `docs/ESP32_INTEGRATION.md` | How to connect real hardware later. |

### Simulation model

Levels are stored as percentages of each tank's capacity (community 20,000 L, household underground 2,000 L,
rooftop 1,000 L). A 10 Hz tick moves water between tanks:

1. Rain feeds the community tank.
2. Main pump runs when a valve is open. Each open branch fills its household underground tank.
3. A household pump lifts water from its underground tank to its rooftop tank.
4. Demand drains the rooftop tank.

Auto control opens a valve below 35 %, closes it at 98 %, and runs each house pump between 8 % and 60 %
on the underground and rooftop levels. Time is compressed (20 simulated seconds per real second at 1×).

## Known limits of this prototype

- The 3D models are procedural Three.js geometry, not GLB assets. The `GLTF/GLB` pipeline is ready to use once
  detailed models are supplied.
- Styling is plain CSS (`src/index.css`) rather than Tailwind, to keep the build dependency-free.
- The site runs a single-page layout with section anchors rather than separate routes.
- The first view loads several hundred KB of 3D code; use a modern desktop or a recent phone for smooth motion.
