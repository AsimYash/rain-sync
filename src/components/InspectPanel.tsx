import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Box, Info } from 'lucide-react';
import { useStore } from '../store';
import { getInfo, connectedPaths, INSPECTABLE_IDS, type Info as InfoT, type Kind } from '../data/components';

const SECTIONS: { key: keyof InfoT; label: string }[] = [
  { key: 'purpose', label: 'Purpose' },
  { key: 'how', label: 'How it works' },
  { key: 'connects', label: 'Connects to' },
  { key: 'io', label: 'Input and output' },
  { key: 'hardware', label: 'Hardware used' },
  { key: 'sensors', label: 'Relevant sensors' },
  { key: 'principle', label: 'Working principle' },
  { key: 'failures', label: 'Possible failure conditions' },
];

export function InspectPanel() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const [collapsed, setCollapsed] = useState(false);
  const info = selected ? getInfo(selected) : undefined;

  return (
    <aside className={`inspect glass ${collapsed ? 'collapsed' : ''}`} aria-label="Component inspection">
      <div className="inspect-head">
        <div className="inspect-title">
          <Info size={16} />
          <span>{info ? info.group : 'Component inspection'}</span>
        </div>
        <div className="inspect-actions">
          {selected && (
            <button className="icon-btn" onClick={() => select(null)} aria-label="Clear selection">
              <X size={16} />
            </button>
          )}
          <button className="icon-btn mobile-only" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
            {collapsed ? 'Open' : 'Hide'}
          </button>
        </div>
      </div>

      <div className="inspect-body">
        <AnimatePresence mode="wait">
          {info && selected ? (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="inspect-name">{info.title}</h3>
              <CloseUp kind={info.kind} />
              <p className="hint">Connected pipelines are highlighted in the 3D view.</p>
              <dl className="facts">
                {SECTIONS.map((sec) => (
                  <div key={sec.key}>
                    <dt>{sec.label}</dt>
                    <dd>{info[sec.key]}</dd>
                  </div>
                ))}
              </dl>
              {connectedPaths(selected).length > 0 && (
                <p className="hint">Linked pipelines: {connectedPaths(selected).join(', ')}</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="empty">
                <Box size={28} />
                <p>Select a component in the 3D model, or pick one below.</p>
              </div>
              <div className="pick-grid">
                {INSPECTABLE_IDS.map((id) => {
                  const i = getInfo(id);
                  return (
                    <button key={id} className="pick" onClick={() => select(id)}>
                      {i?.title ?? id}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

// ---- small 3D close-up of the selected component type ----
function CloseUp({ kind }: { kind: Kind }) {
  return (
    <div className="closeup">
      <Canvas camera={{ position: [2.4, 1.8, 2.8], fov: 34 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 2]} intensity={1.3} />
        <Model kind={kind} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2.2} />
      </Canvas>
      <span className="closeup-cap">Close-up schematic · drag to rotate</span>
    </div>
  );
}

function Model({ kind }: { kind: Kind }) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1, -0.6, 0),
        new THREE.Vector3(-0.2, 0.1, 0.3),
        new THREE.Vector3(0.4, -0.2, -0.2),
        new THREE.Vector3(1, 0.5, 0),
      ]),
    [],
  );

  switch (kind) {
    case 'tank':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.9, 0.9, 1.8, 32, 1, true]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, -0.45, 0]} scale={[0.86, 0.9, 0.86]}>
            <cylinderGeometry args={[1, 1, 1, 32]} />
            <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} emissive="#0284c7" emissiveIntensity={0.2} />
          </mesh>
        </group>
      );
    case 'pump':
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 0.7, 0.8]} />
            <meshStandardMaterial color="#1e40af" />
          </mesh>
          <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.5, 24]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      );
    case 'pipe':
      return (
        <mesh>
          <tubeGeometry args={[curve, 40, 0.12, 12, false]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.35} />
        </mesh>
      );
    case 'filter':
      return (
        <group>
          {[
            [1.1, '#d1d5db'],
            [0.5, '#d6b98c'],
            [0, '#94a3b8'],
            [-0.5, '#1f2937'],
          ].map(([y, c], k) => (
            <mesh key={k} position={[0, y as number, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 0.4, 32]} />
              <meshStandardMaterial color={c as string} />
            </mesh>
          ))}
        </group>
      );
    case 'sensor':
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.8, 0.2, 0.8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.9} />
          </mesh>
        </group>
      );
    case 'valve':
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 1.4, 24]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.25} />
        </mesh>
      );
    case 'roof':
      return (
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.2, 0.8, 4]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      );
    case 'gutter':
      return (
        <mesh>
          <boxGeometry args={[2, 0.25, 0.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
        </mesh>
      );
    case 'panel':
      return (
        <group>
          <mesh>
            <boxGeometry args={[1.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>
          <mesh position={[0.4, 0.2, 0.12]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
      );
  }
}
