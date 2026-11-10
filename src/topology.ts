// Single source of truth for the physical layout of the RainSync village.
// Units: world units (1 unit ≈ 1 m in the model). Y is up, ground surface is y = 0.
// Everything 3D, the 2D diagram and the dashboard derive from these constants.

export type V3 = [number, number, number];

export const HOUSES = [1, 2, 3] as const;
export type HouseId = 1 | 2 | 3;

export const HOUSE_X: Record<number, number> = { 1: -7, 2: 0, 3: 7 };
export const HOUSE_Z = -4;

/** Storage capacities in litres (used to convert % levels into litres). */
export const CAP = { main: 20000, house: 2000, roof: 1000 };

export const MAIN_TANK = { x: 0, y: -2.1, z: 7, r: 2.2, h: 3.2 };
export const FILTER = { x: 0, z: 2.5, r: 0.9, y0: -0.9, y1: 1.6 };
export const PUMP_MAIN: V3 = [-3.4, -2.0, 7];
export const MANIFOLD: V3 = [-3.4, -2.2, 2.0];

export type PathKind = 'rain' | 'dist' | 'lift' | 'filter';

export interface PathDef {
  id: string;
  kind: PathKind;
  pts: V3[];
  house?: HouseId;
}

/**
 * All pipeline centrelines. Each path is animated when its driving device is active:
 *  rain-N    -> rainfall on
 *  filter-out-> rainfall on
 *  main-line -> main distribution pump on
 *  branch-N  -> main pump on AND valve N open
 *  lift-N    -> household pump N on
 */
export function buildPaths(): PathDef[] {
  const out: PathDef[] = [];
  for (const i of HOUSES) {
    const x = HOUSE_X[i];
    out.push({
      id: `rain-${i}`,
      kind: 'rain',
      house: i,
      pts: [
        [x, 3.1, -2.9],
        [x, 2.45, -2.4],
        [x + 1.6, 2.45, -2.4],
        [x + 1.6, -0.5, -2.4],
        [x + 1.6, -0.9, -2.4],
        [x + 1.6, -0.9, -1.0],
        [0, -0.9, -1.0],
        [0, -0.9, 1.6],
      ],
    });
    out.push({
      id: `branch-${i}`,
      kind: 'dist',
      house: i,
      pts: [MANIFOLD, [x, -2.2, 2.0], [x, -2.0, -3.0]],
    });
    out.push({
      id: `lift-${i}`,
      kind: 'lift',
      house: i,
      pts: [
        [x + 1.0, -2.0, -4],
        [x + 1.6, -2.0, -4],
        [x + 1.9, 0.2, -4],
        [x + 1.9, 3.0, -4],
        [x + 1.4, 4.0, -4],
      ],
    });
  }
  out.push({
    id: 'filter-out',
    kind: 'filter',
    pts: [
      [0, -0.9, 3.4],
      [0, -1.3, 3.6],
      [0, -1.3, 4.8],
      [0, -1.3, 5.2],
    ],
  });
  out.push({
    id: 'main-line',
    kind: 'dist',
    pts: [[-2.2, -2.0, 7], PUMP_MAIN, MANIFOLD],
  });
  return out;
}

export const PATHS = buildPaths();
export const pathOf = (id: string) => PATHS.find((p) => p.id === id)!;
