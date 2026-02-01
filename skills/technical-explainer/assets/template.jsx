// Technical Explainer Template - Complete Single-File React App
// Copy this to your .jsx artifact and customize

import { useState, useMemo } from 'react';
import { LineChart, BarChart, ResponsiveContainer, XAxis, YAxis, Line, Bar, Tooltip, Cell } from 'recharts';

// ============ DATA (Replace with your data) ============
const METRICS = {
  hero: {
    primary: { value: "129.6x", label: "Speedup Achieved" },
    secondary: [
      { value: "147,734", label: "Baseline" },
      { value: "1,137", label: "Final", highlight: true },
      { value: "<1,363", label: "Beats Best" }
    ]
  }
};

const MILESTONES = [
  { id: 1, title: "Baseline", cycles: 147734, technique: "Serial execution" },
  { id: 2, title: "SIMD", cycles: 18467, technique: "8-wide vectorization" },
  { id: 3, title: "Pipelining", cycles: 4200, technique: "Hide memory latency" },
  { id: 4, title: "Loop Unroll", cycles: 2100, technique: "Reduce branch overhead" },
  { id: 5, title: "Final", cycles: 1137, technique: "Full optimization" }
];

const UTILIZATION = [
  { engine: "ALU", baseline: 8, final: 92 },
  { engine: "Vector", baseline: 0, final: 85 },
  { engine: "Load", baseline: 12, final: 78 },
  { engine: "Store", baseline: 8, final: 65 }
];

const FAQ = [
  { 
    id: "what", 
    title: "What is this?", 
    content: "Explanation of the problem domain..." 
  },
  { 
    id: "how", 
    title: "How is this different?", 
    content: "Key differences from typical approaches..." 
  }
];

// ============ COMPONENTS ============

const Hero = ({ metrics }) => (
  <section className="hero">
    <div className="primary">
      <span className="value">{metrics.hero.primary.value}</span>
      <span className="label">{metrics.hero.primary.label}</span>
    </div>
    <div className="secondary">
      {metrics.hero.secondary.map(m => (
        <div key={m.label} className={`metric ${m.highlight ? 'highlight' : ''}`}>
          <span className="value">{m.value}</span>
          <span className="label">{m.label}</span>
        </div>
      ))}
    </div>
  </section>
);

const Expandable = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="expandable">
      <button className="toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="content">{children}</div>}
    </div>
  );
};

const TabNav = ({ tabs, active, onSelect }) => (
  <nav className="tabs">
    {tabs.map(t => (
      <button 
        key={t.id}
        className={active === t.id ? 'active' : ''}
        onClick={() => onSelect(t.id)}
      >
        {t.label}
      </button>
    ))}
  </nav>
);

const Journey = ({ milestones }) => {
  const [selected, setSelected] = useState(null);
  const selectedMilestone = milestones.find(m => m.id === selected);
  
  return (
    <div className="journey">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={milestones}>
            <XAxis dataKey="id" />
            <YAxis scale="log" domain={['auto', 'auto']} tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={v => v.toLocaleString()} />
            <Line 
              type="monotone" 
              dataKey="cycles" 
              stroke="#3b82f6"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle 
                  key={payload.id}
                  cx={cx} cy={cy} r={8}
                  fill={selected === payload.id ? '#3b82f6' : '#1e293b'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(payload.id)}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="milestone-list">
        {milestones.map(m => (
          <div 
            key={m.id}
            className={`milestone-card ${selected === m.id ? 'selected' : ''}`}
            onClick={() => setSelected(m.id)}
          >
            <div className="milestone-header">
              <span className="milestone-id">{m.id}</span>
              <span className="milestone-title">{m.title}</span>
              <span className="milestone-cycles">{m.cycles.toLocaleString()}</span>
            </div>
            {selected === m.id && (
              <div className="milestone-detail">
                <p><strong>Technique:</strong> {m.technique}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Utilization = ({ data }) => (
  <div className="utilization">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" domain={[0, 100]} />
        <YAxis type="category" dataKey="engine" width={80} />
        <Tooltip />
        <Bar dataKey="baseline" fill="#64748b" name="Baseline" />
        <Bar dataKey="final" fill="#3b82f6" name="Final" />
      </BarChart>
    </ResponsiveContainer>
    <div className="legend">
      <span><span className="dot baseline"></span> Baseline</span>
      <span><span className="dot final"></span> Final</span>
    </div>
  </div>
);

const Overview = ({ faq }) => (
  <div className="overview">
    <h2>The Challenge</h2>
    <p>Brief description of what this project achieved and why it matters.</p>
    
    <div className="faq-section">
      {faq.map(item => (
        <Expandable key={item.id} title={item.title}>
          <p>{item.content}</p>
        </Expandable>
      ))}
    </div>
  </div>
);

// ============ MAIN APP ============

export default function TechnicalExplainer() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'journey', label: 'Journey' },
    { id: 'utilization', label: 'Utilization' }
  ];
  
  return (
    <div className="explainer">
      <header>
        <h1>Your Project Title</h1>
        <p className="subtitle">Progressive disclosure for technical deep-dives</p>
      </header>
      
      <Hero metrics={METRICS} />
      
      <TabNav tabs={tabs} active={activeTab} onSelect={setActiveTab} />
      
      <main>
        {activeTab === 'overview' && <Overview faq={FAQ} />}
        {activeTab === 'journey' && <Journey milestones={MILESTONES} />}
        {activeTab === 'utilization' && <Utilization data={UTILIZATION} />}
      </main>
      
      <style>{`
        .explainer {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fafafa;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 2rem;
        }
        
        header { text-align: center; margin-bottom: 2rem; }
        header h1 { font-size: 2rem; margin: 0; }
        .subtitle { color: #71717a; margin-top: 0.5rem; }
        
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 3rem;
          background: #141414;
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        
        .primary .value {
          font-size: 4rem;
          font-weight: 700;
          color: #3b82f6;
          display: block;
        }
        
        .primary .label {
          font-size: 1.25rem;
          color: #71717a;
        }
        
        .secondary {
          display: flex;
          gap: 3rem;
        }
        
        .metric {
          text-align: center;
        }
        
        .metric .value {
          font-size: 1.5rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          display: block;
        }
        
        .metric .label {
          font-size: 0.875rem;
          color: #71717a;
        }
        
        .metric.highlight .value {
          color: #22c55e;
        }
        
        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #262626;
          padding-bottom: 1rem;
        }
        
        .tabs button {
          background: none;
          border: none;
          color: #71717a;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tabs button:hover {
          background: #1e293b;
          color: #fafafa;
        }
        
        .tabs button.active {
          background: #3b82f6;
          color: white;
        }
        
        .expandable {
          border: 1px solid #262626;
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        
        .expandable .toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: #141414;
          border: none;
          color: #fafafa;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .expandable .toggle:hover {
          background: #1e293b;
        }
        
        .expandable .content {
          padding: 1.5rem;
          background: #0f0f0f;
          border-top: 1px solid #262626;
        }
        
        .journey {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }
        
        .chart-container {
          background: #141414;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .milestone-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .milestone-card {
          background: #141414;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .milestone-card:hover {
          border-color: #3b82f6;
        }
        
        .milestone-card.selected {
          border-color: #3b82f6;
          background: #1e293b;
        }
        
        .milestone-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .milestone-id {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .milestone-title {
          flex: 1;
          font-weight: 500;
        }
        
        .milestone-cycles {
          font-variant-numeric: tabular-nums;
          color: #71717a;
        }
        
        .milestone-detail {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #262626;
          font-size: 0.875rem;
          color: #a1a1aa;
        }
        
        .utilization {
          background: #141414;
          border-radius: 8px;
          padding: 2rem;
        }
        
        .legend {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 1rem;
        }
        
        .legend .dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 0.5rem;
        }
        
        .legend .dot.baseline { background: #64748b; }
        .legend .dot.final { background: #3b82f6; }
        
        @media (max-width: 768px) {
          .journey {
            grid-template-columns: 1fr;
          }
          .secondary {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
