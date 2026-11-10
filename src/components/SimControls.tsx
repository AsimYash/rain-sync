import { Play, Pause, RotateCcw, CloudRain, CloudOff, Droplets, Cpu } from 'lucide-react';
import { useStore } from '../store';

const SPEEDS = [0.5, 1, 2, 4];

export function SimControls() {
  const s = useStore();

  return (
    <div className="sim glass" role="region" aria-label="Simulation controls">
      <div className="sim-group">
        <span className="sim-label">Simulation</span>
        {s.running ? (
          <button className="btn" onClick={s.pause}>
            <Pause size={16} /> Pause
          </button>
        ) : (
          <button className="btn primary" onClick={s.start}>
            <Play size={16} /> Start
          </button>
        )}
        <button className="btn" onClick={s.reset}>
          <RotateCcw size={16} /> Reset
        </button>
        <label className="speed">
          Flow speed
          <select value={s.flowSpeed} onChange={(e) => s.setSpeed(Number(e.target.value))}>
            {SPEEDS.map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sim-group">
        <span className="sim-label">Rain &amp; scenario</span>
        <button className={`btn ${s.rainfall ? 'on' : ''}`} onClick={s.toggleRain} aria-pressed={s.rainfall}>
          {s.rainfall ? <CloudRain size={16} /> : <CloudOff size={16} />}
          {s.rainfall ? 'Rain on' : 'Rain off'}
        </button>
        <button className="btn" onClick={s.simulateLow}>
          Simulate low levels
        </button>
        <button className="btn" onClick={s.simulateFull}>
          Simulate full tanks
        </button>
        <button className={`btn ${s.autoControl ? 'on' : ''}`} onClick={() => s.setAuto(!s.autoControl)} aria-pressed={s.autoControl}>
          <Cpu size={16} /> Auto control {s.autoControl ? 'on' : 'off'}
        </button>
      </div>

      <div className="sim-group">
        <span className="sim-label">Devices</span>
        <button className={`btn ${s.mainPump ? 'on' : ''}`} onClick={s.toggleMainPump} aria-pressed={s.mainPump}>
          Main pump {s.mainPump ? 'on' : 'off'}
        </button>
        {[0, 1, 2].map((i) => (
          <div key={i} className="house-ctl">
            <span className="house-tag">H{i + 1}</span>
            <button
              className={`btn sm ${s.valve[i] ? 'on' : ''}`}
              onClick={() => s.toggleValve(i)}
              aria-pressed={s.valve[i]}
              title={`House ${i + 1} supply valve`}
            >
              Valve {s.valve[i] ? 'open' : 'closed'}
            </button>
            <button
              className={`btn sm ${s.housePump[i] ? 'on' : ''}`}
              onClick={() => s.toggleHousePump(i)}
              aria-pressed={s.housePump[i]}
              title={`House ${i + 1} pump`}
            >
              Pump {s.housePump[i] ? 'on' : 'off'}
            </button>
            <button
              className={`btn sm ${s.demand[i] ? 'on' : ''}`}
              onClick={() => s.toggleDemand(i)}
              aria-pressed={s.demand[i]}
              title={`Simulate household water demand for House ${i + 1}`}
            >
              <Droplets size={14} /> Demand
            </button>
          </div>
        ))}
      </div>
      <p className="sim-note">
        Manual device changes switch auto control off. Simulated values are demonstration data, not hardware readings.
      </p>
    </div>
  );
}
