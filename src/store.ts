import { create } from 'zustand';
import { CAP, type V3 } from './topology';

export type ViewId =
  | 'village'
  | 'underground'
  | 'collection'
  | 'community'
  | 'house-1'
  | 'house-2'
  | 'house-3'
  | 'iot';
export type Angle = 'front' | 'side' | 'top' | 'iso';
export type Mode = '3d' | '2d';

export const VIEW_META: Record<ViewId, { label: string; target: V3; dist: number }> = {
  village: { label: 'Complete village', target: [0, 0.5, 1], dist: 34 },
  underground: { label: 'Underground', target: [0, -2, 2], dist: 24 },
  collection: { label: 'Rainwater collection', target: [0, 1.2, -2.5], dist: 20 },
  community: { label: 'Main community tank', target: [-1, -2, 7], dist: 16 },
  'house-1': { label: 'House 1', target: [-7, 1.5, -4], dist: 14 },
  'house-2': { label: 'House 2', target: [0, 1.5, -4], dist: 14 },
  'house-3': { label: 'House 3', target: [7, 1.5, -4], dist: 14 },
  iot: { label: 'IoT monitoring', target: [2.6, 1.0, 3.2], dist: 6 },
};

const ANGLE_DIR: Record<Angle, V3> = {
  front: [0, 0.35, 1],
  side: [1, 0.35, 0],
  top: [0, 1, 0.02],
  iso: [0.8, 0.7, 0.9],
};

export function cameraGoal(view: ViewId, angle: Angle): { pos: V3; target: V3 } {
  const m = VIEW_META[view];
  const d = ANGLE_DIR[angle];
  const len = Math.hypot(d[0], d[1], d[2]);
  const pos: V3 = [
    m.target[0] + (d[0] / len) * m.dist,
    m.target[1] + (d[1] / len) * m.dist,
    m.target[2] + (d[2] / len) * m.dist,
  ];
  return { pos, target: m.target };
}

/** Non-reactive animation clock for pipe particles (advanced in the render loop). */
export const flowClock = { phase: 0 };

/** Simulated seconds per real second at flowSpeed = 1. Keeps the demo readable. */
const COMPRESSION = 20;

const INITIAL = {
  main: 40,
  ug: [30, 22, 45],
  roof: [60, 35, 80],
};

const clamp = (v: number, a = 0, b = 100) => Math.min(b, Math.max(a, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export interface Snapshot {
  t: number;
  main: number;
  h1: number;
  h2: number;
  h3: number;
}

export interface Rates {
  rain: number;
  main: number;
  branch: number[];
  lift: number[];
}

const ZERO_RATES: Rates = { rain: 0, main: 0, branch: [0, 0, 0], lift: [0, 0, 0] };

export interface State {
  // simulation
  running: boolean;
  flowSpeed: number;
  autoControl: boolean;
  rainfall: boolean;
  mainPump: boolean;
  housePump: boolean[];
  valve: boolean[];
  demand: boolean[];
  main: number; // % of CAP.main
  ug: number[]; // % of CAP.house
  roof: number[]; // % of CAP.roof
  delivered: number[]; // litres delivered to each house underground tank
  collected: number; // litres collected from rooftops
  rates: Rates; // L/min, last tick
  simTime: number; // simulated seconds
  lastRecord: number;
  history: Snapshot[];

  // view / navigation
  view: ViewId;
  angle: Angle;
  camGoal: { pos: V3; target: V3 } | null;
  isolated: number | null;
  selected: string | null;
  mode: Mode;
  lowPerf: boolean;
  labels: boolean;

  // actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (v: number) => void;
  setAuto: (b: boolean) => void;
  toggleRain: () => void;
  toggleMainPump: () => void;
  toggleHousePump: (i: number) => void;
  toggleValve: (i: number) => void;
  toggleDemand: (i: number) => void;
  setDemandAll: (b: boolean) => void;
  simulateLow: () => void;
  simulateFull: () => void;
  tick: (dt: number) => void;
  goView: (view: ViewId, angle?: Angle) => void;
  setAngle: (angle: Angle) => void;
  clearGoal: () => void;
  isolate: (i: number | null) => void;
  select: (id: string | null) => void;
  setMode: (m: Mode) => void;
  setLowPerf: (b: boolean) => void;
  setLabels: (b: boolean) => void;
}

const freshState = () => ({
  running: false,
  autoControl: true,
  rainfall: false,
  mainPump: false,
  housePump: [false, false, false],
  valve: [false, false, false],
  demand: [false, false, false],
  main: INITIAL.main,
  ug: [...INITIAL.ug],
  roof: [...INITIAL.roof],
  delivered: [0, 0, 0],
  collected: 0,
  rates: { ...ZERO_RATES, branch: [0, 0, 0], lift: [0, 0, 0] },
  simTime: 0,
  lastRecord: 0,
  history: [] as Snapshot[],
});

export const useStore = create<State>()((set, get) => ({
  flowSpeed: 1,
  ...freshState(),
  view: 'village',
  angle: 'iso',
  camGoal: cameraGoal('village', 'iso'),
  isolated: null,
  selected: null,
  mode: '3d',
  lowPerf: false,
  labels: true,

  start: () => set({ running: true }),
  pause: () => set({ running: false }),
  reset: () => set({ ...freshState(), flowSpeed: get().flowSpeed }),
  setSpeed: (v) => set({ flowSpeed: v }),
  setAuto: (b) => set({ autoControl: b }),
  toggleRain: () => set((s) => ({ rainfall: !s.rainfall })),
  toggleMainPump: () => set((s) => ({ mainPump: !s.mainPump, autoControl: false })),
  toggleHousePump: (i) =>
    set((s) => {
      const hp = [...s.housePump];
      hp[i] = !hp[i];
      return { housePump: hp, autoControl: false };
    }),
  toggleValve: (i) =>
    set((s) => {
      const v = [...s.valve];
      v[i] = !v[i];
      return { valve: v, autoControl: false };
    }),
  toggleDemand: (i) =>
    set((s) => {
      const d = [...s.demand];
      d[i] = !d[i];
      return { demand: d };
    }),
  setDemandAll: (b) => set({ demand: [b, b, b] }),
  simulateLow: () => set({ main: 18, ug: [12, 15, 10], roof: [20, 25, 15] }),
  simulateFull: () => set({ main: 96, ug: [98, 97, 99], roof: [98, 96, 99] }),

  tick: (dt) => {
    const s = get();
    if (!s.running) return;

    const k = dt * s.flowSpeed * COMPRESSION; // simulated seconds this step
    const perMin = (litres: number) => (litres / k) * 60;

    let main = s.main;
    const ug = [...s.ug];
    const roof = [...s.roof];
    const delivered = [...s.delivered];
    const valve = [...s.valve];
    const hp = [...s.housePump];
    let mp = s.mainPump;
    let collected = s.collected;

    // Automatic control logic (sensor-driven). Disabled while manual override is on.
    if (s.autoControl) {
      for (let i = 0; i < 3; i++) {
        if (ug[i] < 35 && main > 2) valve[i] = true;
        else if (ug[i] >= 98 || main <= 1) valve[i] = false;

        if (roof[i] < 60 && ug[i] > 8) hp[i] = true;
        else if (roof[i] >= 98 || ug[i] <= 2) hp[i] = false;
      }
      mp = valve.some(Boolean) && main > 1;
    }

    const rates: Rates = { rain: 0, main: 0, branch: [0, 0, 0], lift: [0, 0, 0] };

    // Rainfall on the three rooftops feeds the filter and the community tank.
    if (s.rainfall && main < 100) {
      const L = 60 * k;
      main = clamp(main + (L / CAP.main) * 100);
      collected += L;
      rates.rain = perMin(L);
    }

    for (let i = 0; i < 3; i++) {
      // Main pump -> open valve -> household underground tank
      if (mp && valve[i] && main > 0 && ug[i] < 100) {
        const L = Math.min(12 * k, ((100 - ug[i]) / 100) * CAP.house, (main / 100) * CAP.main);
        ug[i] = clamp(ug[i] + (L / CAP.house) * 100);
        main = clamp(main - (L / CAP.main) * 100);
        delivered[i] += L;
        rates.branch[i] = perMin(L);
        rates.main += perMin(L);
      }
      // Household pump: underground tank -> rooftop tank
      if (hp[i] && ug[i] > 0 && roof[i] < 100) {
        const L = Math.min(6 * k, (ug[i] / 100) * CAP.house, ((100 - roof[i]) / 100) * CAP.roof);
        ug[i] = clamp(ug[i] - (L / CAP.house) * 100);
        roof[i] = clamp(roof[i] + (L / CAP.roof) * 100);
        rates.lift[i] = perMin(L);
      }
      // Household demand drawn from the rooftop tank
      if (s.demand[i] && roof[i] > 0) {
        const L = Math.min(4 * k, (roof[i] / 100) * CAP.roof);
        roof[i] = clamp(roof[i] - (L / CAP.roof) * 100);
      }
    }

    const simTime = s.simTime + k;
    let lastRecord = s.lastRecord;
    const history = s.history.slice();
    if (simTime - lastRecord >= 10) {
      lastRecord = simTime;
      history.push({
        t: Math.round(simTime),
        main: round1(main),
        h1: round1(ug[0]),
        h2: round1(ug[1]),
        h3: round1(ug[2]),
      });
      if (history.length > 240) history.shift();
    }

    set({
      main,
      ug,
      roof,
      valve,
      housePump: hp,
      mainPump: mp,
      delivered,
      collected,
      rates,
      simTime,
      lastRecord,
      history,
    });
  },

  goView: (view, angle) =>
    set((s) => {
      const a = angle ?? s.angle;
      return {
        view,
        angle: a,
        camGoal: cameraGoal(view, a),
        isolated: view.startsWith('house-') ? Number(view.slice(-1)) : null,
      };
    }),
  setAngle: (angle) => set((s) => ({ angle, camGoal: cameraGoal(s.view, angle) })),
  clearGoal: () => set({ camGoal: null }),
  isolate: (i) => set({ isolated: i }),
  select: (id) => set({ selected: id }),
  setMode: (m) => set({ mode: m }),
  setLowPerf: (b) => set({ lowPerf: b }),
  setLabels: (b) => set({ labels: b }),
}));
