import React, { useState } from 'react';
import { 
  AlertTriangle, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  ArrowRight,
  Terminal,
  X
} from 'lucide-react';

export default function PredictionAlert({ 
  predictedIncident, 
  hindsightIncidents, 
  onApproveAction, 
  onDismiss 
}) {
  const [showSteps, setShowSteps] = useState(false);

  if (!predictedIncident) return null;

  const matchedHistorical = hindsightIncidents?.find(
    inc => inc.id === predictedIncident.hindsightMatchId
  );

  return (
    <div className="prediction-alert-banner">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid rgba(244, 63, 94, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={24} color="#f43f5e" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-rose">Early Anomaly Warning</span>
              <span style={{ fontSize: '0.78rem', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                <Clock size={12} />
                Projected host lockup in: <strong>{predictedIncident.timeToExhaustion}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0 0', color: '#fff' }}>
              {predictedIncident.title}
            </h2>
          </div>
        </div>

        <button 
          type="button" 
          onClick={onDismiss}
          style={{ background: 'transparent', color: 'var(--text-subtle)', padding: '4px' }}
          title="Dismiss alert"
        >
          <X size={18} />
        </button>
      </div>

      {/* Culprit Identification */}
      <div style={{ 
        margin: '1rem 0', 
        padding: '0.75rem 1rem', 
        background: 'rgba(0, 0, 0, 0.25)', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Primary Contributing Process:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f8fafc' }}>
            {predictedIncident.culpritName}
          </span>
        </div>
        <span className="badge badge-rose" style={{ fontFamily: 'var(--font-mono)' }}>
          {predictedIncident.culpritShare}
        </span>
      </div>

      {/* HINDSIGHT MEMORY CARD (The core innovation) */}
      <div className="hindsight-match-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="#a855f7" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#c084fc' }}>
              Hindsight Episodic Memory Recall
            </span>
          </div>
          <span className="badge badge-violet" style={{ fontSize: '0.72rem' }}>
            {predictedIncident.similarityScore}% Pattern Match ({predictedIncident.hindsightMatchId})
          </span>
        </div>

        <blockquote style={{
          margin: '0.5rem 0',
          padding: '0.6rem 0.9rem',
          background: 'rgba(139, 92, 246, 0.1)',
          borderLeft: '3px solid #8b5cf6',
          borderRadius: '0 8px 8px 0',
          fontSize: '0.92rem',
          color: '#e2e8f0',
          lineHeight: '1.5'
        }}>
          "{predictedIncident.hindsightExplanation}"
        </blockquote>

        {matchedHistorical && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <span>Previously verified on: <strong>{matchedHistorical.timestamp.split(' ')[0]}</strong></span>
            <span>Historical CPU Delta: <strong style={{ color: '#34d399' }}>{matchedHistorical.deltaCpu}%</strong></span>
            <span>Effectiveness: <strong style={{ color: '#34d399' }}>{matchedHistorical.effectivenessScore}%</strong></span>
            <span style={{ color: '#a78bfa' }}>✓ User Approved</span>
          </div>
        )}
      </div>

      {/* Recommended Action & Workflow trigger */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '1.25rem'
      }}>
        <div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Safe Optimization Recommended:
          </div>
          <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.92rem', marginTop: '2px' }}>
            {predictedIncident.recommendedAction}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => setShowSteps(!showSteps)}
          >
            <Terminal size={14} />
            {showSteps ? 'Hide Execution Steps' : 'Preview Execution Steps'}
          </button>
          
          <button
            type="button"
            className="btn-primary-action glow-cyan"
            onClick={onApproveAction}
          >
            <ShieldCheck size={16} />
            Approve & Execute Optimization
          </button>
        </div>
      </div>

      {/* Collapsible Execution Steps Preview */}
      {showSteps && (
        <div style={{ marginTop: '1rem', background: '#05070a', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            NON-DESTRUCTIVE EXECUTION PLAN (SANDBOXED):
          </div>
          {predictedIncident.safeExecutionSteps.map((step, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.8rem', 
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              padding: '3px 0'
            }}>
              <span style={{ color: '#06b6d4' }}>$</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
