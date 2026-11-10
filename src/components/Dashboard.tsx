import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Droplet, Home, Warehouse, Radio, Gauge } from 'lucide-react';
import { useStore } from '../store';
import { CAP } from '../topology';

const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const litres = (pct: number, cap: number) => Math.round((pct / 100) * cap).toLocaleString('en-IN');

function Bar({ value, tone }: { value: number; tone?: 'ok' | 'warn' | 'low' }) {
  const t = tone ?? (value < 25 ? 'low' : value < 60 ? 'warn' : 'ok');
  return (
    <div className="bar" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`bar-fill ${t}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Dashboard() {
  const st = useStore();

  const totalStored =
    (st.main / 100) * CAP.main +
    st.ug.reduce((a, p) => a + (p / 100) * CAP.house, 0) +
    st.roof.reduce((a, p) => a + (p / 100) * CAP.roof, 0);

  const chartData = st.history.map((h) => ({
    t: fmtTime(h.t),
    main: h.main,
    'House 1 UG': h.h1,
    'House 2 UG': h.h2,
    'House 3 UG': h.h3,
  }));

  return (
    <section id="iot" className="section">
      <div className="section-head">
        <span className="eyebrow">Monitoring</span>
        <h2>IoT Monitoring Dashboard</h2>
        <p className="notice">
          <Radio size={14} /> Demonstration data: values are simulated for the prototype, not actual hardware readings.
        </p>
      </div>

      <div className="kpis">
        <div className="kpi glass">
          <Warehouse size={18} />
          <div>
            <span>Community tank</span>
            <strong>{st.main.toFixed(1)}%</strong>
            <Bar value={st.main} />
          </div>
        </div>
        <div className="kpi glass">
          <Droplet size={18} />
          <div>
            <span>Total water stored</span>
            <strong>{Math.round(totalStored).toLocaleString('en-IN')} L</strong>
            <small>Collected so far: {Math.round(st.collected).toLocaleString('en-IN')} L</small>
          </div>
        </div>
        <div className="kpi glass">
          <Gauge size={18} />
          <div>
            <span>Pipeline flow rates</span>
            <strong>{Math.round(st.rates.main)} L/min</strong>
            <small>
              Main {Math.round(st.rates.main)} · Rain {Math.round(st.rates.rain)} L/min
            </small>
          </div>
        </div>
        <div className="kpi glass">
          <Radio size={18} />
          <div>
            <span>Rain detection</span>
            <strong>{st.rainfall ? 'Raining' : 'Dry'}</strong>
            <small>Main pump: {st.mainPump ? 'running' : 'stopped'}</small>
          </div>
        </div>
      </div>

      <div className="house-cards">
        {[0, 1, 2].map((i) => (
          <div key={i} className="house-card glass">
            <div className="house-card-head">
              <Home size={16} />
              <strong>House {i + 1}</strong>
              <span className={`pill ${st.valve[i] ? 'on' : ''}`}>Valve {st.valve[i] ? 'open' : 'closed'}</span>
            </div>
            <div className="metric">
              <span>Underground tank</span>
              <span>
                {st.ug[i].toFixed(0)}% · {litres(st.ug[i], CAP.house)} L
              </span>
            </div>
            <Bar value={st.ug[i]} />
            <div className="metric">
              <span>Rooftop tank</span>
              <span>
                {st.roof[i].toFixed(0)}% · {litres(st.roof[i], CAP.roof)} L
              </span>
            </div>
            <Bar value={st.roof[i]} />
            <div className="metric">
              <span>Household pump</span>
              <span className={st.housePump[i] ? 'ok-text' : ''}>{st.housePump[i] ? 'Running' : 'Stopped'}</span>
            </div>
            <div className="metric">
              <span>Branch flow</span>
              <span>{Math.round(st.rates.branch[i])} L/min</span>
            </div>
            <div className="metric">
              <span>Delivered to house</span>
              <span>{Math.round(st.delivered[i]).toLocaleString('en-IN')} L</span>
            </div>
            <div className="metric">
              <span>Demand</span>
              <span>{st.demand[i] ? 'Active' : 'None'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass chart-card">
        <div className="chart-head">
          <strong>Water levels over simulated time</strong>
          <span className="hint">Simulated time {fmtTime(st.simTime)}</span>
        </div>
        {chartData.length === 0 ? (
          <p className="empty-chart">Start the simulation to record levels.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="t" stroke="#64748b" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ background: '#0b1424', border: '1px solid #1e3a5f', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="main" stroke="#22d3ee" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dataKey="House 1 UG" stroke="#38bdf8" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="House 2 UG" stroke="#34d399" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="House 3 UG" stroke="#fbbf24" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
