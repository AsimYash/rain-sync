import { useStore } from '../store';

function Node({ title, value, active }: { title: string; value?: string; active?: boolean }) {
  return (
    <div className={`node ${active ? 'active' : ''}`}>
      <span className="node-title">{title}</span>
      {value && <span className="node-value">{value}</span>}
    </div>
  );
}

const Arrow = () => <span className="arrow" aria-hidden="true">→</span>;

/** Simplified 2D system-flow diagram. Shares state with the 3D model. */
export function FlowDiagram() {
  const main = useStore((s) => s.main);
  const ug = useStore((s) => s.ug);
  const roof = useStore((s) => s.roof);
  const rainfall = useStore((s) => s.rainfall);
  const mainPump = useStore((s) => s.mainPump);
  const valve = useStore((s) => s.valve);
  const housePump = useStore((s) => s.housePump);

  return (
    <div className="diagram">
      <div className="lane">
        <h4>A · Rainwater collection &amp; storage</h4>
        <div className="chain">
          <Node title="Rooftops (3 houses)" active={rainfall} />
          <Arrow />
          <Node title="Gutters + downpipes" active={rainfall} />
          <Arrow />
          <Node title="First-flush diverter" active={rainfall} />
          <Arrow />
          <Node title="Common filtration" active={rainfall} />
          <Arrow />
          <Node title="Main UG community tank" value={`${main.toFixed(0)}%`} active={main > 0} />
        </div>
      </div>

      <div className="lane">
        <h4>B · Community distribution</h4>
        <div className="chain">
          <Node title="Main UG community tank" value={`${main.toFixed(0)}%`} />
          <Arrow />
          <Node title="Main distribution pump" active={mainPump} value={mainPump ? 'running' : 'stopped'} />
          <Arrow />
          <Node title="Three independent branch pipelines" active={mainPump} />
        </div>
      </div>

      <div className="lane">
        <h4>C · Independent household supply</h4>
        <div className="houses">
          {[0, 1, 2].map((i) => {
            const open = valve[i] && mainPump;
            return (
              <div key={i} className="house-col">
                <span className="house-col-title">House {i + 1}</span>
                <Node title="Solenoid valve" value={valve[i] ? 'open' : 'closed'} active={valve[i]} />
                <Node title="UG household tank" value={`${ug[i].toFixed(0)}%`} active={open} />
                <Node title="Household pump" value={housePump[i] ? 'running' : 'stopped'} active={housePump[i]} />
                <Node title="Rooftop tank" value={`${roof[i].toFixed(0)}%`} active={housePump[i]} />
                <Node title="Household outlets" active={roof[i] > 0} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
