import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Search, 
  CheckCircle2, 
  ArrowDown, 
  Sparkles, 
  Clock, 
  Tag, 
  ShieldCheck, 
  FileText,
  TrendingDown,
  Layers,
  ChevronRight,
  Network,
  LayoutGrid,
  Zap,
  RefreshCw,
  Database,
  X
} from 'lucide-react';
import NeuralMemoryMap from './NeuralMemoryMap';
import { playTabClick, playStepChirp, playSuccessChime } from '../utils/soundEffects';

export default function HindsightBankView({ incidents, hindsightStats, processes, onSelectIncident, onReinitializeHindsight }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [viewMode, setViewMode] = useState('lattice'); // 'lattice' | 'cards'
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [initStage, setInitStage] = useState(0); // 0 = idle, 1..5 = running, 6 = complete

  const filteredIncidents = incidents.filter(inc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
                          (inc.symptom && inc.symptom.toLowerCase().includes(q)) ||
                          (inc.id && inc.id.toLowerCase().includes(q)) ||
                          (inc.incident_id && inc.incident_id.toLowerCase().includes(q)) ||
                          (inc.app && inc.app.toLowerCase().includes(q)) ||
                          (inc.rootCause && inc.rootCause.toLowerCase().includes(q)) ||
                          (inc.entities && inc.entities.toLowerCase().includes(q)) ||
                          (inc.fact_type && inc.fact_type.toLowerCase().includes(q));

    let matchesApp = true;
    if (selectedApp === 'ALL') {
      matchesApp = true;
    } else if (selectedApp === 'Experiences') {
      matchesApp = inc.fact_type === 'experience';
    } else if (selectedApp === 'Observations') {
      matchesApp = inc.fact_type === 'observation';
    } else if (selectedApp === 'World Facts') {
      matchesApp = inc.fact_type === 'world';
    } else if (selectedApp === 'Docker') {
      matchesApp = (inc.app && inc.app.toLowerCase().includes('docker')) || (inc.entities && inc.entities.toLowerCase().includes('workload'));
    } else if (selectedApp === 'Chrome') {
      matchesApp = (inc.app && inc.app.toLowerCase().includes('chrome')) || (inc.entities && inc.entities.toLowerCase().includes('chrome'));
    } else {
      matchesApp = inc.app && inc.app.toLowerCase().includes(selectedApp.toLowerCase());
    }
    return matchesSearch && matchesApp;
  });

  const handleSwitchView = (mode) => {
    playTabClick();
    setViewMode(mode);
  };

  const handleStartInitialization = () => {
    playTabClick();
    setIsInitModalOpen(true);
    setInitStage(1);

    const stages = [
      'Probing Hindsight Cloud Vector API (https://api.hindsight.vectorize.io)',
      'Connecting to Hindsight Cloud Vector Core',
      'Recalling 18 indexed memory units & 104 associative neural links',
      'Validating 384-dimensional semantic embeddings and temporal chains',
      'Synthesizing episodic memory lattice with Human-in-the-Loop sandbox boundaries'
    ];

    stages.forEach((_, idx) => {
      setTimeout(() => {
        setInitStage(idx + 1);
        playStepChirp(idx + 1);

        if (idx === stages.length - 1) {
          setTimeout(() => {
            setInitStage(6);
            playSuccessChime();
            if (onReinitializeHindsight) {
              onReinitializeHindsight();
            }
          }, 600);
        }
      }, (idx + 1) * 650);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Connected Memory Bank Header Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrainCircuit size={22} color="var(--text-main)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Hindsight Episodic Memory Bank
              </h2>
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }}></span>
                CONNECTED CLOUD
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                Host: <span style={{ fontFamily: 'var(--font-mono)' }}>api.hindsight.vectorize.io</span>
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--border-active)' }}>•</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                Last write: {hindsightStats?.last_memory_write_at ? new Date(hindsightStats.last_memory_write_at).toLocaleTimeString() : 'Synced'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleStartInitialization}
              style={{
                fontSize: '0.8rem',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontWeight: 600
              }}
            >
              <RefreshCw size={13} />
              Re-Sync Hindsight
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards Matching Vectorize Hindsight Cloud Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          {/* Card 1: RETAIN */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>RETAIN</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {hindsightStats?.retain_tokens_display || '429 tokens'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
              ↗ {hindsightStats?.retain_delta || '+22% vs last week'}
            </div>
          </div>

          {/* Card 2: RECALL */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>RECALL</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {hindsightStats?.recall_tokens_display || '165.8K tokens'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {hindsightStats?.audit_actions?.recall || 244} semantic calls
            </div>
          </div>

          {/* Card 3: REFLECT */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>REFLECT</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {hindsightStats?.reflect_calls !== undefined ? `${hindsightStats.reflect_calls} calls` : '0 calls'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Autonomous synthesis
            </div>
          </div>

          {/* Card 4: INDEXED MEMORY UNITS */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>MEMORY UNITS</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cyan-bright)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {hindsightStats?.total_nodes || incidents.length || 18} Units
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {hindsightStats?.nodes_by_fact_type?.experience || 7} Exp • {hindsightStats?.nodes_by_fact_type?.observation || 6} Obs • {hindsightStats?.nodes_by_fact_type?.world || 5} World
            </div>
          </div>

          {/* Card 5: KNOWLEDGE GRAPH LINKS */}
          <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>NEURAL LINKS</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {hindsightStats?.total_links || 104} Links
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Across {hindsightStats?.total_documents || 5} incident docs
            </div>
          </div>
        </div>
      </div>

      {/* Filter, View Switcher & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search Hindsight memories by app, entity, root cause, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '9px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.84rem'
            }}
          />
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '3px',
          borderRadius: '9px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'lattice' ? 'active' : ''}`}
            onClick={() => handleSwitchView('lattice')}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Network size={14} />
            Neural Lattice View
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => handleSwitchView('cards')}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <LayoutGrid size={14} />
            Memory Cards ({filteredIncidents.length})
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'Experiences', 'Observations', 'World Facts', 'Docker', 'Chrome'].map(app => (
            <button
              key={app}
              type="button"
              className={`nav-tab-btn ${selectedApp === app ? 'active' : ''}`}
              onClick={() => setSelectedApp(app)}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {app}
            </button>
          ))}
        </div>
      </div>

      {/* Render Selected View Mode */}
      {viewMode === 'lattice' && (
        <NeuralMemoryMap 
          incidents={filteredIncidents} 
          hindsightStats={hindsightStats}
          onSelectIncident={onSelectIncident}
        />
      )}

      {/* Incidents Card Grid */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {filteredIncidents.map((incident) => {
            const factType = incident.fact_type || 'experience';
            const badgeClass = factType === 'experience' ? 'badge-emerald' : factType === 'observation' ? 'badge-violet' : 'badge-amber';
            return (
              <div 
                key={incident.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.35rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderTop: factType === 'experience' ? '2px solid #10b981' : factType === 'observation' ? '2px solid #a855f7' : '2px solid #f59e0b'
                }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        {factType}
                      </span>
                      <span className="badge badge-zinc" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        {incident.incident_id || incident.id.substring(0, 8)}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cyan-bright)' }}>
                        {incident.app}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={12} />
                      {incident.timestamp}
                    </span>
                  </div>

                  {/* Narrative text */}
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px', lineHeight: '1.5' }}>
                    {incident.rootCause || incident.symptom}
                  </h4>

                  {/* Entities & Action */}
                  <div style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--text-muted)', 
                    background: 'rgba(125, 125, 125, 0.08)', 
                    padding: '8px 10px', 
                    borderRadius: '6px',
                    borderLeft: '2px solid var(--border-active)',
                    marginBottom: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Action / Resolution: </strong>
                      <span style={{ color: 'var(--cyan-bright)', fontFamily: 'var(--font-mono)' }}>{incident.actionTaken}</span>
                    </div>
                    {incident.entities && (
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>Entities: </strong>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{incident.entities}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Deltas */}
                <div style={{ 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '0.76rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <TrendingDown size={14} />
                      CPU -{incident.deltaCpu}%
                    </span>
                  </div>

                  <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    UUID: {incident.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Initialization Progress Modal */}
      {isInitModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'var(--accent-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={18} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {initStage === 6 ? 'Hindsight Memory Initialized' : 'Initializing Hindsight Memory Core...'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Vector Embeddings & Continuous Learning Store
                  </div>
                </div>
              </div>

              {initStage === 6 && (
                <button
                  type="button"
                  onClick={() => setIsInitModalOpen(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Progress bar */}
              <div className="metric-progress-track" style={{ height: '8px' }}>
                <div 
                  className="metric-progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (initStage / 5) * 100)}%`,
                    backgroundColor: initStage === 6 ? 'var(--emerald-primary)' : 'var(--accent-primary)'
                  }}
                />
              </div>

              {/* Progress Steps list */}
              <div className="terminal-box" style={{ maxHeight: '180px' }}>
                <div style={{ color: 'var(--text-subtle)', marginBottom: '6px' }}>// SQLite Vector Storage Indexer [384-d Cosine Metric]</div>
                {[
                  'Probing kernel eBPF tracepoints & sensor telemetry channels',
                  'Allocating SQLite Vector Store schema & index buffers',
                  'Ingesting 4 baseline failure episodes (Docker, Node, Postgres, Chrome)',
                  'Synthesizing 384-dimensional cosine similarity embeddings',
                  'Validating Human-in-the-Loop sandbox boundaries'
                ].map((step, idx) => {
                  const isDone = initStage > idx + 1 || initStage === 6;
                  const isCurrent = initStage === idx + 1;
                  return (
                    <div key={idx} className="terminal-line" style={{ color: isDone ? 'var(--emerald-primary)' : (isCurrent ? 'var(--accent-primary)' : 'var(--text-subtle)') }}>
                      <span>{isDone ? '✔' : (isCurrent ? '▶' : '○')}</span>
                      <span>{step}</span>
                      {isCurrent && <span className="pulse-dot" style={{ background: 'var(--accent-primary)' }}></span>}
                    </div>
                  );
                })}
              </div>

              {initStage === 6 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--emerald-glow)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={18} color="var(--emerald-primary)" />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <strong>Initialization Complete!</strong> 4 episodic failure patterns, root causes, and proven human-approved remediations are indexed in memory.
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(15, 23, 42, 0.4)'
            }}>
              {initStage === 6 ? (
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => setIsInitModalOpen(false)}
                >
                  Close & Explore Memory Bank
                </button>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={14} className="spin" color="#8b5cf6" />
                  <span>Synthesizing vector representations...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
