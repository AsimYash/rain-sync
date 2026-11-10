import { useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { useStore } from './store';
import { Explorer } from './components/Explorer';
import { Dashboard } from './components/Dashboard';
import { FlowDiagram } from './components/FlowDiagram';

const NAV = [
  { href: '#overview', label: 'Overview' },
  { href: '#explorer', label: '3D Explorer' },
  { href: '#architecture', label: 'System Architecture' },
  { href: '#simulation', label: 'Live Simulation' },
  { href: '#iot', label: 'IoT Dashboard' },
  { href: '#about', label: 'About Project' },
];

export default function App() {
  // Simulation integration loop (10 Hz). Rendering runs independently at display rate.
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      useStore.getState().tick(dt);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  // Start in low-performance mode on small screens.
  useEffect(() => {
    if (window.matchMedia('(max-width: 700px)').matches) useStore.getState().setLowPerf(true);
  }, []);

  const main = useStore((s) => s.main);
  const running = useStore((s) => s.running);

  return (
    <>
      <header className="topbar">
        <a href="#overview" className="logo">
          <span className="logo-mark">
            <Droplets size={18} />
          </span>
          RainSync
        </a>
        <nav aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <span className={`status-dot ${running ? 'live' : ''}`} title="Simulation state">
          {running ? 'Live sim' : 'Paused'} · {main.toFixed(0)}%
        </span>
      </header>

      <main>
        <section id="overview" className="hero section">
          <span className="eyebrow">Smart Community Rainwater Harvesting &amp; Distribution</span>
          <h1>RainSync</h1>
          <p className="lead">
            An interactive 3D digital twin of a community system: rain is collected from three houses, filtered, stored in one
            large underground tank, and distributed through three independent pipelines to each house's own underground and
            rooftop tanks.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="#explorer">
              Open 3D Explorer
            </a>
            <a className="btn" href="#architecture">
              See the architecture
            </a>
          </div>
          <div className="stat-grid">
            <div className="stat glass">
              <strong>3</strong>
              <span>Houses, each independent</span>
            </div>
            <div className="stat glass">
              <strong>7</strong>
              <span>Underground tanks (1 community + 3 household)</span>
            </div>
            <div className="stat glass">
              <strong>3</strong>
              <span>Rooftop tanks, one per house</span>
            </div>
            <div className="stat glass">
              <strong>20+</strong>
              <span>Inspectable components</span>
            </div>
          </div>
        </section>

        <Explorer />

        <section id="architecture" className="section">
          <div className="section-head">
            <span className="eyebrow">System architecture</span>
            <h2>How water moves</h2>
            <p>The architecture below is the one the 3D model represents. Each house has its own underground and rooftop tanks and its own pump.</p>
          </div>
          <div className="arch-grid">
            <div className="glass card">
              <h3>A · Collection &amp; storage</h3>
              <ol>
                <li>Rain falls on the three rooftops.</li>
                <li>Gutters collect it; downpipes carry it down.</li>
                <li>A first-flush diverter discards the dirty first rain.</li>
                <li>A common filtration chamber cleans the water.</li>
                <li>Filtered water enters the large underground community tank.</li>
              </ol>
            </div>
            <div className="glass card">
              <h3>B · Community distribution</h3>
              <ol>
                <li>The main distribution pump draws from the community tank.</li>
                <li>The line branches into three independent pipelines.</li>
                <li>Each branch feeds only its own household underground tank.</li>
                <li>Level sensors and automatic valves control each supply.</li>
              </ol>
            </div>
            <div className="glass card">
              <h3>C · Household supply</h3>
              <ol>
                <li>Water is held in the household underground tank.</li>
                <li>The household's own pump lifts water up.</li>
                <li>It fills that house's rooftop tank.</li>
                <li>Gravity supplies bathrooms, kitchen and outlets.</li>
              </ol>
            </div>
          </div>
          <div className="glass diagram-wrap">
            <h3>2D system-flow diagram</h3>
            <FlowDiagram />
          </div>
          <p className="hint">
            The community tank never connects directly to a rooftop tank. Each house's supply path is separate.
          </p>
        </section>

        <section id="simulation" className="section">
          <div className="section-head">
            <span className="eyebrow">Live simulation</span>
            <h2>Scenarios you can run</h2>
            <p>Use the control bar under the 3D Explorer to run these scenarios. Everything here shares one live state.</p>
          </div>
          <div className="arch-grid">
            <div className="glass card">
              <h3>Rainfall</h3>
              <p>Enable rain: water collects from all three roofs, passes filtration and raises the community tank level.</p>
            </div>
            <div className="glass card">
              <h3>House 1 needs water</h3>
              <p>
                Low underground level opens House 1's valve, starts the main pump, and fills only House 1's underground tank
                until the target is reached. Houses 2 and 3 stay idle.
              </p>
            </div>
            <div className="glass card">
              <h3>Lift to roof</h3>
              <p>When a rooftop tank runs low, its own household pump moves water upward. Demand empties the rooftop tank.</p>
            </div>
          </div>
          <div className="cta-row">
            <a className="btn primary" href="#explorer">
              Go to the control bar
            </a>
          </div>
        </section>

        <Dashboard />

        <section id="about" className="section about">
          <div className="section-head">
            <span className="eyebrow">About this project</span>
            <h2>RainSync prototype</h2>
          </div>
          <div className="arch-grid">
            <div className="glass card">
              <h3>Purpose</h3>
              <p>
                An academic engineering prototype that makes a community rainwater system visible. The 3D model is the
                engineering reference; the dashboard uses simulated data.
              </p>
            </div>
            <div className="glass card">
              <h3>Technology</h3>
              <p>React, TypeScript, Vite, Three.js via React Three Fiber and Drei, Zustand, Recharts, Framer Motion, Lucide.</p>
            </div>
            <div className="glass card">
              <h3>Hardware integration</h3>
              <p>
                The ESP32 controller and MQTT path are documented in <code>docs/ESP32_INTEGRATION.md</code>. The site runs
                without any hardware.
              </p>
            </div>
          </div>
          <p className="hint">Simulated values are demonstration data and are not hardware readings.</p>
        </section>
      </main>

      <footer className="footer">RainSync · demonstration prototype · simulated data</footer>
    </>
  );
}
