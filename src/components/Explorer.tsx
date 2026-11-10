import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore, VIEW_META, cameraGoal, type ViewId, type Angle } from '../store';
import { Village } from '../scene/Village';
import { CameraRig } from '../scene/CameraRig';
import { FlowDiagram } from './FlowDiagram';
import { InspectPanel } from './InspectPanel';
import { SimControls } from './SimControls';

const ANGLES: { id: Angle; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
  { id: 'iso', label: 'Isometric' },
];

const VIEWS = Object.keys(VIEW_META) as ViewId[];

export function Explorer() {
  const mode = useStore((s) => s.mode);
  const view = useStore((s) => s.view);
  const angle = useStore((s) => s.angle);
  const lowPerf = useStore((s) => s.lowPerf);
  const labels = useStore((s) => s.labels);
  const isolated = useStore((s) => s.isolated);
  const goView = useStore((s) => s.goView);
  const setAngle = useStore((s) => s.setAngle);
  const setMode = useStore((s) => s.setMode);
  const setLowPerf = useStore((s) => s.setLowPerf);
  const setLabels = useStore((s) => s.setLabels);
  const isolate = useStore((s) => s.isolate);
  const select = useStore((s) => s.select);
  const clearGoal = useStore((s) => s.clearGoal);

  const orbit = useRef<any>(null);
  const start = cameraGoal('village', 'iso').pos;

  return (
    <section id="explorer" className="section">
      <div className="section-head">
        <span className="eyebrow">Interactive digital twin</span>
        <h2>3D Explorer</h2>
        <p>
          Drag to rotate, scroll to zoom, right-drag to pan. Click any pipe, tank, pump, valve or sensor to inspect it.
          Connected pipelines highlight automatically.
        </p>
      </div>

      <div className="explorer">
        <div className="stage glass" aria-label="3D village model">
          {mode === '3d' ? (
            <Canvas
              dpr={lowPerf ? 1 : [1, 1.75]}
              camera={{ position: start, fov: 42, near: 0.1, far: 300 }}
              onPointerMissed={() => select(null)}
              gl={{ antialias: !lowPerf, powerPreference: 'high-performance' }}
            >
              <color attach="background" args={['#06101f']} />
              <fog attach="fog" args={['#06101f', 60, 130]} />
              <ambientLight intensity={0.6} />
              <hemisphereLight args={['#bae6fd', '#1e293b', 0.45]} />
              <directionalLight position={[14, 22, 12]} intensity={1.1} />
              <Village />
              <CameraRig controlsRef={orbit} />
              <OrbitControls
                ref={orbit}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={3}
                maxDistance={70}
                maxPolarAngle={Math.PI * 0.49}
                onStart={() => clearGoal()}
              />
            </Canvas>
          ) : (
            <FlowDiagram />
          )}

          <div className="toolbar top">
            <div className="chip-row" role="group" aria-label="Navigation views">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  className={`chip ${view === v ? 'active' : ''}`}
                  onClick={() => goView(v)}
                  aria-pressed={view === v}
                >
                  {VIEW_META[v].label}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar bottom">
            <div className="chip-row" role="group" aria-label="Camera angle">
              {ANGLES.map((a) => (
                <button
                  key={a.id}
                  className={`chip ${angle === a.id ? 'active' : ''}`}
                  onClick={() => setAngle(a.id)}
                  disabled={mode === '2d'}
                  aria-pressed={angle === a.id}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div className="chip-row" role="group" aria-label="Display options">
              <button className="chip" onClick={() => setMode(mode === '3d' ? '2d' : '3d')}>
                {mode === '3d' ? 'Show 2D flow diagram' : 'Show 3D model'}
              </button>
              <button className="chip" onClick={() => setLabels(!labels)} aria-pressed={labels}>
                Labels {labels ? 'on' : 'off'}
              </button>
              <button className="chip" onClick={() => setLowPerf(!lowPerf)} aria-pressed={lowPerf}>
                {lowPerf ? 'Full quality' : 'Low-performance mode'}
              </button>
              <button className="chip" onClick={() => isolate(null)} disabled={isolated === null}>
                Show all houses
              </button>
            </div>
          </div>
        </div>

        <InspectPanel />
      </div>

      <SimControls />
    </section>
  );
}
