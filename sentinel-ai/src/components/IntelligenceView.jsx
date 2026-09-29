import React from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Shield, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Sliders, 
  AlertCircle,
  Lightbulb,
  Workflow
} from 'lucide-react';
import { SYSTEM_SPECS } from '../data/mockData';

export default function IntelligenceView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(15, 21, 35, 0.9))', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#22d3ee" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Learned Workstation Habits & Behavioral Profile
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Over time, SentinelAI evolves from a generic monitor into your personalized reliability assistant.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Learned Knowledge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Learned Pattern 1: Docker */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan">Application Habit #1</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>Confidence: 97%</span>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
            Docker Multi-stage Builds Cause 68% of CPU Spikes
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
            SentinelAI observed that between 2:00 PM – 5:30 PM on weekdays, containerized compiles frequently saturate cores 12–16. 
          </p>
          <div style={{ 
            background: 'rgba(6, 182, 212, 0.08)', 
            border: '1px solid rgba(6, 182, 212, 0.2)', 
            padding: '8px 12px', 
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#67e8f9'
          }}>
            <strong>Learned Action Preference:</strong> User consistently prefers pausing secondary workers over cold container kills (100% approval).
          </div>
        </div>

        {/* Learned Pattern 2: Node.js */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-violet">Application Habit #2</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>Confidence: 94%</span>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
            Vite / Node Dev Workers Accumulate ~450MB/hr Heap
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
            Hot Module Replacement in TypeScript codebases creates stale AST references in the V8 isolate heap if sessions exceed 3.5 continuous hours.
          </p>
          <div style={{ 
            background: 'rgba(139, 92, 246, 0.08)', 
            border: '1px solid rgba(139, 92, 246, 0.2)', 
            padding: '8px 12px', 
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#c084fc'
          }}>
            <strong>Learned Action Preference:</strong> Warm worker recycles preserve active localhost dev ports without dropping browser sessions.
          </div>
        </div>

        {/* Learned Pattern 3: Postgres */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-emerald">Storage Habit #3</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>Confidence: 91%</span>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
            Autovacuum Clashes with Batch Migration Writes
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
            PostgreSQL background autovacuum triggers during bulk seeding scripts, causing temporary NVMe queue thrashing above 450 MB/s.
          </p>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            padding: '8px 12px', 
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#6ee7b7'
          }}>
            <strong>Learned Action Preference:</strong> Throttle vacuum cost delay rather than stopping the Postgres service daemon.
          </div>
        </div>
      </div>

      {/* User Governance & Autonomy Preferences */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#22d3ee" />
          Autonomous Control & Safety Thresholds
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              Human-in-the-Loop Mode
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Always requires explicit user approval before executing any system command.
            </div>
            <span className="badge badge-emerald">Active & Enforced</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              Prediction Lead Time Target
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Anomaly detection forecasts instability 45–90 seconds prior to system freeze.
            </div>
            <span className="badge badge-cyan">45s–90s Window</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              Hindsight Similarity Threshold
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Requires ≥ 85% vector similarity match before quoting past incident resolutions.
            </div>
            <span className="badge badge-violet">≥ 85% Cosine Match</span>
          </div>
        </div>
      </div>
    </div>
  );
}
