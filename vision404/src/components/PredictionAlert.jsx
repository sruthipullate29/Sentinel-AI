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
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={24} color="var(--rose-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-rose">Early Anomaly Warning</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--rose-bright)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                <Clock size={12} />
                Projected host lockup in: <strong>{predictedIncident.timeToExhaustion}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-main)' }}>
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
        background: 'var(--bg-subtle)', 
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Primary Contributing Process:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
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
            <BrainCircuit size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
              Hindsight Episodic Memory Recall
            </span>
          </div>
          <span className="badge badge-zinc" style={{ fontSize: '0.72rem' }}>
            {predictedIncident.similarityScore}% Pattern Match ({predictedIncident.hindsightMatchId})
          </span>
        </div>

        <blockquote style={{
          margin: '0.5rem 0',
          padding: '0.6rem 0.9rem',
          background: 'var(--bg-subtle)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: '0 8px 8px 0',
          fontSize: '0.92rem',
          color: 'var(--text-main)',
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
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <span>Previously verified on: <strong>{matchedHistorical.timestamp.split(' ')[0]}</strong></span>
            <span>Historical CPU Delta: <strong style={{ color: 'var(--emerald-primary)' }}>{matchedHistorical.deltaCpu}%</strong></span>
            <span>Effectiveness: <strong style={{ color: 'var(--emerald-primary)' }}>{matchedHistorical.effectivenessScore}%</strong></span>
            <span style={{ color: 'var(--accent-primary)' }}>✓ User Approved</span>
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
          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.92rem', marginTop: '2px' }}>
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
            className="btn-primary-action"
            onClick={onApproveAction}
          >
            <ShieldCheck size={16} />
            Approve & Execute Optimization
          </button>
        </div>
      </div>

      {/* Collapsible Execution Steps Preview */}
      {showSteps && (
        <div style={{ marginTop: '1rem', background: 'var(--bg-inset)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
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
              color: 'var(--text-muted)',
              padding: '3px 0'
            }}>
              <span style={{ color: 'var(--accent-primary)' }}>$</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
