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

export default function HindsightBankView({ incidents, onSelectIncident, onReinitializeHindsight }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [viewMode, setViewMode] = useState('lattice'); // 'lattice' | 'cards'
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [initStage, setInitStage] = useState(0); // 0 = idle, 1..5 = running, 6 = complete

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.app.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.rootCause.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesApp = selectedApp === 'ALL' || inc.app.toLowerCase().includes(selectedApp.toLowerCase());
    return matchesSearch && matchesApp;
  });

  const totalSavedCpu = incidents.reduce((acc, curr) => acc + Math.abs(curr.deltaCpu || 0), 0);

  const handleSwitchView = (mode) => {
    playTabClick();
    setViewMode(mode);
  };

  const handleStartInitialization = () => {
    playTabClick();
    setIsInitModalOpen(true);
    setInitStage(1);

    const stages = [
      'Probing kernel eBPF tracepoints & sensor telemetry channels',
      'Allocating SQLite Vector Store schema & index buffers',
      'Ingesting 4 baseline failure episodes (Docker, Node, Postgres, Chrome)',
      'Synthesizing 384-dimensional cosine similarity embeddings',
      'Validating Human-in-the-Loop sandbox boundaries'
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
      {/* Overview Stat Strip */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: '#0d0f26', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={22} color="#a78bfa" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Hindsight Episodic Memory Bank
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Persistent repository of past resource incidents, root causes, human approvals, and measured outcomes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Indexed Memories</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c4b5fd', fontFamily: 'var(--font-display)' }}>
                {incidents.length} Incidents
              </div>
            </div>
            <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Cumulative CPU Restored</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-display)' }}>
                -{totalSavedCpu.toFixed(0)}%
              </div>
            </div>
            <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
            
            {/* Initialize Hindsight Button */}
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleStartInitialization}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow: '0 4px 18px rgba(124, 58, 237, 0.4)',
                fontSize: '0.8rem',
                padding: '8px 18px',
                borderRadius: '9999px',
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              <Zap size={14} />
              Initialize Hindsight
            </button>
          </div>
        </div>
      </div>

      {/* Filter, View Switcher & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search Hindsight memories by app, root cause, symptom, or ID..."
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
            Incident Cards
          </button>
        </div>

        {/* App Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'Docker', 'Node', 'Postgres', 'Chrome'].map(app => (
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
          onSelectIncident={onSelectIncident}
        />
      )}

      {/* Incidents Card Grid */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {filteredIncidents.map((incident) => (
            <div 
              key={incident.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.35rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '1rem' 
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-violet" style={{ fontFamily: 'var(--font-mono)' }}>
                      {incident.id}
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

                {/* Symptom */}
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px', lineHeight: '1.4' }}>
                  {incident.symptom}
                </h4>

                {/* Root cause */}
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  background: 'rgba(0,0,0,0.25)', 
                  padding: '8px 10px', 
                  borderRadius: '6px',
                  borderLeft: '2px solid #8b5cf6',
                  marginBottom: '10px'
                }}>
                  <strong style={{ color: '#cbd5e1' }}>Identified Root Cause: </strong>
                  {incident.rootCause}
                </div>

                {/* Action Taken */}
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                  <strong style={{ color: '#38bdf8' }}>Proven Resolution: </strong>
                  {incident.actionTaken}
                </div>

                {/* User Note */}
                {incident.userNotes && (
                  <div style={{ fontSize: '0.78rem', color: '#a78bfa', fontStyle: 'italic', marginBottom: '10px' }}>
                    💬 "{incident.userNotes}"
                  </div>
                )}
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
                    CPU {incident.deltaCpu}%
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <TrendingDown size={14} />
                    RAM {incident.deltaRam}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                    <CheckCircle2 size={10} />
                    {incident.effectivenessScore}% Effective
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                    Approved
                  </span>
                </div>
              </div>
            </div>
          ))}
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
              background: 'rgba(15, 23, 42, 0.7)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={18} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
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
                    backgroundColor: initStage === 6 ? '#10b981' : '#8b5cf6'
                  }}
                />
              </div>

              {/* Progress Steps list */}
              <div className="terminal-box" style={{ maxHeight: '180px' }}>
                <div style={{ color: '#64748b', marginBottom: '6px' }}>// SQLite Vector Storage Indexer [384-d Cosine Metric]</div>
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
                    <div key={idx} className="terminal-line" style={{ color: isDone ? '#34d399' : (isCurrent ? '#38bdf8' : '#475569') }}>
                      <span>{isDone ? '✔' : (isCurrent ? '▶' : '○')}</span>
                      <span>{step}</span>
                      {isCurrent && <span className="pulse-dot" style={{ background: '#38bdf8' }}></span>}
                    </div>
                  );
                })}
              </div>

              {initStage === 6 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
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
