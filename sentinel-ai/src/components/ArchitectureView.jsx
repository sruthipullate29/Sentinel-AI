import React from 'react';
import { 
  Layers, 
  Workflow, 
  Database, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  TrendingUp, 
  Sparkles,
  GitBranch,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { LEARNING_LOOP_STEPS } from '../data/mockData';

export default function ArchitectureView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(15, 21, 35, 0.9))', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Workflow size={22} color="#c084fc" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              SentinelAI Architecture & Continuous Learning Loop
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <strong>Monitor → Remember → Learn → Predict → Recommend → Act → Measure → Remember</strong>
            </p>
          </div>
        </div>
      </div>

      {/* The 8 Stages Detailed Breakdown */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#22d3ee" />
          The 8 Stages of the Continuous Learning Engine
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {LEARNING_LOOP_STEPS.map((step, idx) => (
            <div key={step.id} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                  Stage {idx + 1}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                  {step.label}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison: Traditional vs SentinelAI */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
          Traditional System Monitors vs SentinelAI Self-Learning Agent
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Traditional */}
          <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ color: '#fb7185', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
              Generic System Monitors (htop, Datadog agent, Task Manager)
            </h4>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>Stateless: Forgets an incident the moment CPU returns to 0%</li>
              <li>Only reports symptoms ("High CPU: 98%") without historical context</li>
              <li>Zero knowledge of what applications you run or how you resolved prior spikes</li>
              <li>Requires manual panic troubleshooting while the system stutters</li>
              <li>No verified feedback loop or outcome measurement</li>
            </ul>
          </div>

          {/* SentinelAI */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ color: '#34d399', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
              SentinelAI Self-Learning Reliability Agent
            </h4>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li><strong>Hindsight Episodic Memory:</strong> Indexes past incidents, exact root causes, and user approvals</li>
              <li><strong>Predictive:</strong> Warns 45–90s in advance before thrashing locks your desktop</li>
              <li><strong>Personalized:</strong> Remembers that you approved pausing Docker instead of killing it</li>
              <li><strong>Closed-loop:</strong> Measures before vs after delta to verify if the fix actually worked</li>
              <li><strong>Evolves continuously:</strong> Gets smarter with every incident resolved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
