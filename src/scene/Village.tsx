import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useStore, flowClock } from '../store';
import {
  HOUSES,
  HOUSE_X,
  HOUSE_Z,
  MAIN_TANK,
  FILTER,
  PUMP_MAIN,
  MANIFOLD,
  pathOf,
  type V3,
  type PathKind,
} from '../topology';
import { connectedPaths } from '../data/components';

// ---------- highlight plumbing ----------
const HiCtx = createContext(false);

function Mat(props: {
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}) {
  const hi = useContext(HiCtx);
  const { color, opacity = 1, roughness = 0.6, metalness = 0.05 } = props;
  return (
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
      roughness={roughness}
      metalness={metalness}
      emissive={hi ? '#22d3ee' : '#000000'}
      emissiveIntensity={hi ? 0.45 : 0}
    />
  );
}

/** Makes any group clickable for inspection and highlights it when selected. */
function Part({
  id,
  position,
  rotation,
  forceHi = false,
  children,
}: {
  id: string;
  position?: V3;
  rotation?: V3;
  forceHi?: boolean;
  children: ReactNode;
}) {
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selected === id);
  const hi = selected || forceHi;
  return (
    <HiCtx.Provider value={hi}>
      <group
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          select(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {children}
      </group>
    </HiCtx.Provider>
  );
}

// ---------- reusable tanks / water ----------
function WaterColumn({ r, h, level, color = '#0284c7' }: { r: number; h: number; level: number; color?: string }) {
  const hl = Math.max(0.001, (h * Math.min(100, Math.max(0, level))) / 100);
  return (
    <mesh position={[0, -h / 2 + hl / 2, 0]} scale={[r, hl, r]}>
      <cylinderGeometry args={[1, 1, 1, 28]} />
      <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={0.25} roughness={0.2} />
    </mesh>
  );
}

function Tank({
  id,
  position,
  r,
  h,
  level,
  color,
}: {
  id: string;
  position: V3;
  r: number;
  h: number;
  level: number;
  color?: string;
}) {
  return (
    <Part id={id} position={position}>
      <mesh>
        <cylinderGeometry args={[r, r, h, 36, 1, true]} />
        <Mat color="#e2e8f0" opacity={0.2} roughness={0.15} />
      </mesh>
      <WaterColumn r={r * 0.92} h={h * 0.94} level={level} color={color} />
    </Part>
  );
}

// ---------- flow paths (pipes + animated water + direction arrow) ----------
const PIPE_STYLE: Record<PathKind, { water: string }> = {
  rain: { water: '#22d3ee' },
  filter: { water: '#22d3ee' },
  dist: { water: '#3b82f6' },
  lift: { water: '#60a5fa' },
};

function FlowPath({
  id,
  active,
  hidden = false,
}: {
  id: string;
  active: boolean;
  hidden?: boolean;
}) {
  const def = pathOf(id);
  const waterColor = PIPE_STYLE[def.kind].water;
  const connectedHi = useStore((s) => (s.selected ? connectedPaths(s.selected).includes(id) : false));

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(def.pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0),
    [def],
  );
  const tube = useMemo(
    () => new THREE.TubeGeometry(curve, Math.max(16, def.pts.length * 14), 0.085, 10, false),
    [curve, def],
  );
  const count = useMemo(() => Math.max(4, Math.round(curve.getLength() * 1.6)), [curve]);
  const arrow = useMemo(() => {
    const p = curve.getPointAt(0.5);
    const t = curve.getTangentAt(0.5).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    return { p, q };
  }, [curve]);

  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const on = active && !hidden;
    for (let i = 0; i < count; i++) {
      if (on) {
        const t = (i / count + flowClock.phase) % 1;
        curve.getPointAt(t, v);
        dummy.position.copy(v);
        dummy.scale.setScalar(1);
      } else {
        dummy.position.set(0, -99, 0);
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group visible={!hidden}>
      <Part id={id} forceHi={connectedHi}>
        <mesh geometry={tube}>
          <Mat color={active ? '#e0f2fe' : '#cbd5e1'} roughness={0.35} metalness={0.05} />
        </mesh>
      </Part>
      <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]} frustumCulled={false}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={waterColor} emissive={waterColor} emissiveIntensity={0.7} />
      </instancedMesh>
      <mesh position={arrow.p} quaternion={arrow.q}>
        <coneGeometry args={[0.13, 0.32, 10]} />
        <meshStandardMaterial
          color={active ? waterColor : '#475569'}
          emissive={active ? waterColor : '#000000'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// ---------- house ----------
function House({ i }: { i: 1 | 2 | 3 }) {
  const x = HOUSE_X[i];
  const idx = i - 1;
  const ugLevel = useStore((s) => s.ug[idx]);
  const roofLevel = useStore((s) => s.roof[idx]);
  const rainfall = useStore((s) => s.rainfall);
  const mainPump = useStore((s) => s.mainPump);
  const valveOpen = useStore((s) => s.valve[idx]);
  const hpOn = useStore((s) => s.housePump[idx]);
  const isolated = useStore((s) => s.isolated);
  const labels = useStore((s) => s.labels);
  const hidden = isolated !== null && isolated !== i;

  const roofStatus = roofLevel < 25 ? '#f87171' : roofLevel < 60 ? '#fbbf24' : '#34d399';
  const ugStatus = ugLevel < 25 ? '#f87171' : ugLevel < 60 ? '#fbbf24' : '#34d399';

  return (
    <group visible={!hidden}>
      {/* building */}
      <Part id={`house-body-${i}`} position={[x, 1.2, HOUSE_Z]}>
        <mesh>
          <boxGeometry args={[3, 2.4, 3]} />
          <Mat color="#f5e6c8" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.7, 1.52]}>
          <boxGeometry args={[0.6, 1.0, 0.05]} />
          <Mat color="#78350f" />
        </mesh>
        {[-0.9, 0.9].map((dx) => (
          <mesh key={dx} position={[dx, 0.5, 1.52]}>
            <boxGeometry args={[0.6, 0.6, 0.05]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#0ea5e9" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </Part>

      {/* rooftop catchment */}
      <Part id="rooftop" position={[x, 3.1, HOUSE_Z]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.2, 1.4, 4]} />
          <Mat color="#b45309" roughness={0.7} />
        </mesh>
      </Part>

      {/* gutter, downpipe, first flush */}
      <Part id="gutters" position={[x + 0.05, 2.42, -2.4]}>
        <mesh>
          <boxGeometry args={[3.2, 0.1, 0.14]} />
          <Mat color="#94a3b8" metalness={0.5} />
        </mesh>
      </Part>
      <Part id="downpipes" position={[x + 1.6, 0.95, -2.4]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 2.9, 12]} />
          <Mat color="#64748b" />
        </mesh>
      </Part>
      <Part id="first-flush" position={[x + 1.6, -0.7, -2.4]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 14]} />
          <Mat color="#f59e0b" />
        </mesh>
      </Part>

      {/* rooftop tank + stand + sensor */}
      <Part id="rooftop-stand" position={[x + 0.8, 3.55, HOUSE_Z]}>
        <mesh>
          <boxGeometry args={[0.9, 0.5, 0.9]} />
          <Mat color="#475569" />
        </mesh>
      </Part>
      <Tank id={`roof-tank-${i}`} position={[x + 0.8, 4.4, HOUSE_Z]} r={0.6} h={1.2} level={roofLevel} color="#38bdf8" />
      <Part id={`roof-sensor-${i}`} position={[x + 0.8, 5.05, HOUSE_Z]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={roofStatus} emissive={roofStatus} emissiveIntensity={0.9} />
        </mesh>
      </Part>

      {/* underground household tank + sensor */}
      <Tank id={`ug-tank-${i}`} position={[x, -2.0, HOUSE_Z]} r={1.0} h={2.0} level={ugLevel} color="#0ea5e9" />
      <Part id={`ug-sensor-${i}`} position={[x, -0.95, HOUSE_Z]}>
        <mesh>
          <boxGeometry args={[0.35, 0.12, 0.35]} />
          <Mat color="#334155" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={ugStatus} emissive={ugStatus} emissiveIntensity={0.9} />
        </mesh>
      </Part>

      {/* solenoid valve on branch line */}
      <Part id={`valve-${i}`} position={[x, -2.1, -2.6]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.13, 0.13, 0.42, 14]} />
          <meshStandardMaterial color={valveOpen ? '#22c55e' : '#ef4444'} emissive={valveOpen ? '#22c55e' : '#ef4444'} emissiveIntensity={0.25} />
        </mesh>
      </Part>

      {/* household pump, non-return valve */}
      <Part id={`hpump-${i}`} position={[x + 1.6, -2.0, HOUSE_Z]}>
        <mesh>
          <boxGeometry args={[0.45, 0.4, 0.45]} />
          <Mat color="#1d4ed8" />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={hpOn ? '#22c55e' : '#64748b'} emissive={hpOn ? '#22c55e' : '#000'} emissiveIntensity={0.9} />
        </mesh>
      </Part>
      <Part id={`nrv-${i}`} position={[x + 1.9, 0.6, HOUSE_Z]}>
        <mesh>
          <boxGeometry args={[0.28, 0.28, 0.28]} />
          <Mat color="#f97316" />
        </mesh>
      </Part>

      {/* household outlet */}
      <Part id={`outlets-${i}`} position={[x + 1.58, 0.9, -3.2]}>
        <mesh>
          <boxGeometry args={[0.16, 0.22, 0.22]} />
          <Mat color="#67e8f9" metalness={0.5} />
        </mesh>
      </Part>

      {/* pipelines */}
      <FlowPath id={`rain-${i}`} active={rainfall} />
      <FlowPath id={`branch-${i}`} active={mainPump && valveOpen} />
      <FlowPath id={`lift-${i}`} active={hpOn} />

      {labels && (
        <Html position={[x, 5.7, HOUSE_Z]} center distanceFactor={22} zIndexRange={[5, 0]}>
          <div className="scene-label">House {i}</div>
        </Html>
      )}
    </group>
  );
}

// ---------- community system ----------
function CommunitySystem() {
  const main = useStore((s) => s.main);
  const mainPump = useStore((s) => s.mainPump);
  const rainfall = useStore((s) => s.rainfall);
  const labels = useStore((s) => s.labels);
  const pumpColor = mainPump ? '#22c55e' : '#64748b';

  return (
    <group>
      <Tank id="main-tank" position={[MAIN_TANK.x, MAIN_TANK.y, MAIN_TANK.z]} r={MAIN_TANK.r} h={MAIN_TANK.h} level={main} color="#0284c7" />

      <Part id="main-sensor" position={[0, -0.32, MAIN_TANK.z]}>
        <mesh>
          <boxGeometry args={[0.34, 0.1, 0.34]} />
          <Mat color="#334155" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={main < 25 ? '#f87171' : '#34d399'} emissive={main < 25 ? '#f87171' : '#34d399'} emissiveIntensity={0.9} />
        </mesh>
      </Part>

      <Part id="overflow" position={[1.5, -0.1, MAIN_TANK.z]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.9, 12]} />
          <Mat color="#64748b" />
        </mesh>
      </Part>

      <Part id="main-pump" position={PUMP_MAIN}>
        <mesh>
          <boxGeometry args={[0.9, 0.7, 0.9]} />
          <Mat color="#1e40af" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={pumpColor} emissive={pumpColor} emissiveIntensity={0.9} />
        </mesh>
      </Part>

      <FlowPath id="main-line" active={mainPump} />
      <FlowPath id="filter-out" active={rainfall} />

      {labels && (
        <Html position={[MAIN_TANK.x, 0.7, MAIN_TANK.z]} center distanceFactor={22} zIndexRange={[5, 0]}>
          <div className="scene-label">Community tank · {main.toFixed(0)}%</div>
        </Html>
      )}
      {/* manifold marker */}
      <Part id="main-line" position={MANIFOLD}>
        <mesh>
          <sphereGeometry args={[0.16, 14, 14]} />
          <Mat color="#93c5fd" />
        </mesh>
      </Part>
    </group>
  );
}

// ---------- filtration chamber ----------
function Filtration() {
  const rainfall = useStore((s) => s.rainfall);
  const labels = useStore((s) => s.labels);
  const body = { y: 0.35, h: FILTER.y1 - FILTER.y0 };
  return (
    <group position={[FILTER.x, 0, FILTER.z]}>
      <Part id="filter-body" position={[0, body.y, 0]}>
        <mesh>
          <cylinderGeometry args={[FILTER.r, FILTER.r, body.h, 32, 1, true]} />
          <Mat color="#e2e8f0" opacity={0.18} />
        </mesh>
      </Part>
      <Part id="filter-mesh" position={[0, 1.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.86, 0.86, 0.05, 28]} />
          <Mat color="#d1d5db" metalness={0.6} />
        </mesh>
      </Part>
      <Part id="filter-sand" position={[0, 0.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.84, 0.84, 0.6, 28]} />
          <Mat color="#d6b98c" />
        </mesh>
      </Part>
      <Part id="filter-gravel" position={[0, 0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.84, 0.84, 0.5, 28]} />
          <Mat color="#94a3b8" />
        </mesh>
      </Part>
      <Part id="filter-charcoal" position={[0, -0.35, 0]}>
        <mesh>
          <cylinderGeometry args={[0.84, 0.84, 0.5, 28]} />
          <Mat color="#1f2937" />
        </mesh>
      </Part>
      <Part id="filter-outlet" position={[0, -1.1, 0.95]}>
        <mesh>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <Mat color="#475569" />
        </mesh>
      </Part>
      <FlowPath id="filter-out" active={rainfall} />
      {labels && (
        <Html position={[0, 2.0, 0]} center distanceFactor={20} zIndexRange={[5, 0]}>
          <div className="scene-label">Filtration</div>
        </Html>
      )}
    </group>
  );
}

// ---------- IoT control cabinet ----------
function ControlUnit() {
  const labels = useStore((s) => s.labels);
  const running = useStore((s) => s.running);
  const led = running ? '#22c55e' : '#f59e0b';
  return (
    <group position={[2.6, 0, 3.2]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 10]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <Part id="esp32" position={[0, 1.25, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.5, 0.6]} />
          <Mat color="#14532d" />
        </mesh>
        <mesh position={[0, 0.28, 0.31]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={led} emissive={led} emissiveIntensity={1} />
        </mesh>
      </Part>
      <Part id="relay" position={[-0.3, 1.25, 0.32]}>
        <mesh>
          <boxGeometry args={[0.25, 0.25, 0.04]} />
          <Mat color="#1e293b" />
        </mesh>
      </Part>
      <Part id="pump-circuit" position={[0.3, 1.25, 0.32]}>
        <mesh>
          <boxGeometry args={[0.25, 0.25, 0.04]} />
          <Mat color="#7c2d12" />
        </mesh>
      </Part>
      <Part id="wifi" position={[0.35, 1.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <Mat color="#94a3b8" />
        </mesh>
      </Part>
      {labels && (
        <Html position={[0, 2.1, 0]} center distanceFactor={18} zIndexRange={[5, 0]}>
          <div className="scene-label">ESP32 IoT unit</div>
        </Html>
      )}
    </group>
  );
}

// ---------- sensors on the site ----------
function SiteSensors() {
  const flowRain = useStore((s) => s.rainfall);
  const flowMain = useStore((s) => s.mainPump);
  return (
    <group>
      <Part id="rain-sensor" position={[-10.5, 0, -2]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
          <Mat color="#64748b" />
        </mesh>
        <mesh position={[0, 2.45, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
          <meshStandardMaterial color={flowRain ? '#38bdf8' : '#94a3b8'} emissive={flowRain ? '#0284c7' : '#000'} emissiveIntensity={0.5} />
        </mesh>
      </Part>
      <Part id="flow-sensor" position={[-3.4, -2.2, 4.6]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
          <meshStandardMaterial color={flowMain ? '#22c55e' : '#64748b'} emissive={flowMain ? '#22c55e' : '#000'} emissiveIntensity={0.3} />
        </mesh>
      </Part>
      <Part id="flow-sensor" position={[3.6, -0.9, -1.0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
          <meshStandardMaterial color={flowRain ? '#22c55e' : '#64748b'} emissive={flowRain ? '#22c55e' : '#000'} emissiveIntensity={0.3} />
        </mesh>
      </Part>
    </group>
  );
}

// ---------- ground, soil cross-section, landscape ----------
function Landscape() {
  const trees: [number, number][] = [
    [-11, -9], [11, -9], [-12, 3], [12, 3], [-4, 10.5], [5.5, 11], [-10, 10], [10, -1], [-13, -2],
  ];
  return (
    <group>
      {/* cutaway: grass slab + soil cross-section */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[30, 0.24, 24]} />
        <meshStandardMaterial color="#3f7d3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, -3.1, 0]}>
        <boxGeometry args={[30, 6, 24]} />
        <meshStandardMaterial color="#8b5a2b" transparent opacity={0.2} depthWrite={false} roughness={1} />
      </mesh>
      <mesh position={[0, -6.2, 0]}>
        <boxGeometry args={[30, 0.4, 24]} />
        <meshStandardMaterial color="#44403c" roughness={1} />
      </mesh>
      {/* road */}
      <mesh position={[0, 0.01, 0.5]}>
        <boxGeometry args={[30, 0.04, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
      {/* gardens */}
      {[[-11, -5.5], [11, -5.5], [-3, 11]].map(([x, z], k) => (
        <mesh key={k} position={[x, 0.03, z]}>
          <boxGeometry args={[3.2, 0.06, 2.4]} />
          <meshStandardMaterial color="#4d7c0f" />
        </mesh>
      ))}
      {trees.map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.18, 0.25, 1.4, 8]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <coneGeometry args={[1.1, 2.2, 10]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- rain ----------
function Rain() {
  const rainfall = useStore((s) => s.rainfall);
  const lowPerf = useStore((s) => s.lowPerf);
  const N = lowPerf ? 60 : 200;
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        x: (Math.random() - 0.5) * 26,
        z: (Math.random() - 0.5) * 20 - 1,
        y: Math.random() * 9,
      })),
    [N],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const st = useStore.getState();
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      if (st.rainfall && st.running) {
        d.y -= dt * 9;
        if (d.y < 0) d.y = 9;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(1, st.rainfall ? 1 : 0.0001, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, N]} frustumCulled={false}>
      <boxGeometry args={[0.02, 0.5, 0.02]} />
      <meshBasicMaterial color="#67e8f9" transparent opacity={rainfall ? 0.55 : 0} />
    </instancedMesh>
  );
}

// ---------- root ----------
export function Village() {
  useFrame((_, dt) => {
    const s = useStore.getState();
    if (s.running) flowClock.phase = (flowClock.phase + dt * s.flowSpeed * 0.12) % 1;
  });

  return (
    <group>
      <Landscape />
      {HOUSES.map((i) => (
        <House key={i} i={i} />
      ))}
      <CommunitySystem />
      <Filtration />
      <ControlUnit />
      <SiteSensors />
      <Rain />
    </group>
  );
}
