import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Gauge, 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

import { playStepChirp, playSuccessChime, playTabClick } from '../utils/soundEffects';

export default function OptimizationModal({ 
  predictedIncident, 
  currentMetrics, 
  onCompleteOptimization, 
  onClose 
}) {
  const [stage, setStage] = useState('act'); // 'act' | 'measure' | 'remember'
  const [completedSteps, setCompletedSteps] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userNote, setUserNote] = useState('Approved optimization. Immediate recovery without restart.');

  const executionSteps = predictedIncident?.safeExecutionSteps || [
    'Applying cgroup quota throttling',
    'Releasing transient runtime buffer cache',
    'Restoring OS CPU scheduler balance'
  ];

  // Post-optimization target metrics
  const afterMetrics = {
    cpu: Math.max(16, currentMetrics.cpu - 65),
    ram: Math.max(34, currentMetrics.ram - 42),
    disk: Math.max(12, Math.floor(currentMetrics.disk * 0.1)),
    temp: 52
  };

  const deltaCpu = (afterMetrics.cpu - currentMetrics.cpu).toFixed(1);
  const deltaRam = (afterMetrics.ram - currentMetrics.ram).toFixed(1);

  // Simulate terminal execution steps
  useEffect(() => {
    if (stage === 'act') {
      const timers = executionSteps.map((step, idx) => {
        return setTimeout(() => {
          playStepChirp(idx + 1);
          setCompletedSteps(prev => [...prev, idx]);
          if (idx === executionSteps.length - 1) {
            setTimeout(() => {
              playSuccessChime();
              setStage('measure');
            }, 600);
          }
        }, (idx + 1) * 700);
      });

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [stage, executionSteps]);

  const handleCommitToHindsight = () => {
    const newIncident = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      app: predictedIncident?.culpritName?.split(' ')[0] || 'Docker Engine',
      processName: predictedIncident?.culpritName || 'docker (buildkitd)',
      pid: Math.floor(1000 + Math.random() * 8000),
      symptom: predictedIncident?.title || 'CPU & memory threshold runaway',
      metricsBefore: { ...currentMetrics },
      metricsAfter: { ...afterMetrics },
      deltaCpu: parseFloat(deltaCpu),
      deltaRam: parseFloat(deltaRam),
      rootCause: `Automated detection & Hindsight resolution of ${predictedIncident?.culpritName}`,
      actionTaken: predictedIncident?.recommendedAction || 'Optimization executed',
      approvedByUser: true,
      userNotes: userNote,
      effectivenessScore: 98,
      similarityKeywords: ['automated-remediation', 'user-approved', 'stabilized']
    };

    onCompleteOptimization(newIncident, afterMetrics);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}>
              <ShieldCheck size={18} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Autonomous Optimization Workflow
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Act → Measure → Remember in Hindsight Memory
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${stage === 'act' ? 'badge-amber' : (stage === 'measure' ? 'badge-cyan' : 'badge-violet')}`}>
              Stage: {stage.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Stage 1: ACT */}
          {stage === 'act' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Terminal size={18} color="#06b6d4" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Executing Non-Destructive Safe Remediation...
                </span>
              </div>

              <div className="terminal-box">
                <div style={{ color: '#64748b', marginBottom: '8px' }}>
                  // SentinelAI Sandbox Subshell [PID 9081 - Non-destructive]
                </div>
                {executionSteps.map((step, idx) => {
                  const isDone = completedSteps.includes(idx);
                  const isCurrent = completedSteps.length === idx;
                  return (
                    <div key={idx} className="terminal-line" style={{ color: isDone ? '#34d399' : (isCurrent ? '#38bdf8' : '#475569') }}>
                      <span>{isDone ? '✓' : (isCurrent ? '▶' : '○')}</span>
                      <span>{step}</span>
                      {isCurrent && <span className="pulse-dot" style={{ background: '#38bdf8' }}></span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage 2: MEASURE */}
          {stage === 'measure' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Gauge size={18} color="#34d399" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                  Telemetry Verification: Before vs After Delta
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* CPU Comparison */}
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HOST CPU</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#fff' }}>
                    {currentMetrics.cpu.toFixed(0)}% <ArrowRight size={14} style={{ display: 'inline', margin: '0 4px', color: '#64748b' }} /> {afterMetrics.cpu.toFixed(0)}%
                  </div>
                  <span className="badge badge-emerald">
                    {deltaCpu}% Drop
                  </span>
                </div>

                {/* RAM Comparison */}
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SYSTEM RAM</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#fff' }}>
                    {currentMetrics.ram.toFixed(0)}% <ArrowRight size={14} style={{ display: 'inline', margin: '0 4px', color: '#64748b' }} /> {afterMetrics.ram.toFixed(0)}%
                  </div>
                  <span className="badge badge-emerald">
                    {deltaRam}% Freed
                  </span>
                </div>

                {/* Disk I/O */}
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DISK I/O</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#fff' }}>
                    {currentMetrics.disk.toFixed(0)} <ArrowRight size={14} style={{ display: 'inline', margin: '0 4px', color: '#64748b' }} /> {afterMetrics.disk.toFixed(0)}
                  </div>
                  <span className="badge badge-emerald">
                    Stabilized
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => setStage('remember')}
                >
                  <Database size={15} />
                  Proceed to Commit in Hindsight
                </button>
              </div>
            </div>
          )}

          {/* Stage 3: REMEMBER */}
          {stage === 'remember' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <Database size={18} color="#a855f7" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                  Committing Experience to Hindsight Episodic Memory
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                SentinelAI will index this incident fingerprint, your approval, and the verified outcome so that when similar behavior recurs, it can automatically recommend this proven solution.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  User Satisfaction Rating with Solution:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      style={{ background: 'transparent', padding: '2px' }}
                    >
                      <Star 
                        size={20} 
                        color={star <= userRating ? '#fbbf24' : '#475569'} 
                        fill={star <= userRating ? '#fbbf24' : 'transparent'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Incident Feedback Note:
                </label>
                <input 
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#07090e',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-primary-action glow-violet"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                  onClick={handleCommitToHindsight}
                >
                  <Sparkles size={16} />
                  Save & Evolve SentinelAI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
