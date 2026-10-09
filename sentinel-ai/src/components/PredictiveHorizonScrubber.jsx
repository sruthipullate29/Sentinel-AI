import React, { useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';
import { playTabClick } from '../utils/soundEffects';

export default function PredictiveHorizonScrubber({ 
  anomalyRisk, 
  currentScenario, 
  onPreemptAction 
}) {
  const [horizonOffset, setHorizonOffset] = useState(0); // 0 = now, 1 = +15s, 2 = +45s, 3 = +90s, 4 = +3m

  const HORIZONS = [
    { label: 'Now (Live)', seconds: 0, desc: 'Current active eBPF sensor telemetry' },
    { label: '+15s Projection', seconds: 15, desc: 'Early saturation signs in memory buses' },
    { label: '+45s Critical', seconds: 45, desc: 'Calculated host freeze threshold' },
    { label: '+90s Cascade', seconds: 90, desc: 'Out-Of-Memory kernel reaper invoked' },
    { label: '+3m Lockup', seconds: 180, desc: 'Hard system stall & dropped TCP sockets' }
  ];

  const currentHorizon = HORIZONS[horizonOffset];
  const isAnomalous = currentScenario.id !== 'NORMAL';

  // Calculate projected telemetry at selected horizon
  const projectedCpu = Math.min(100, isAnomalous 
    ? Math.min(100, currentScenario.metrics.cpu + (horizonOffset * 2)) 
    : 18 + (horizonOffset * 1));

  const projectedRam = Math.min(99, isAnomalous 
    ? Math.min(99, currentScenario.metrics.ram + (horizonOffset * 3.5)) 
    : 42 + (horizonOffset * 0.5));

  const projectedRisk = Math.min(100, isAnomalous 
    ? Math.min(100, anomalyRisk + (horizonOffset * 4)) 
    : 8);

  const handleSelectHorizon = (idx) => {
    setHorizonOffset(idx);
    playTabClick();
  };

  return (
    <div className="glass-panel" style={{
      padding: '1.25rem',
      background: 'var(--bg-card)',
      border: isAnomalous && horizonOffset >= 2 
        ? '1px solid rgba(239, 68, 68, 0.35)' 
        : '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow when projecting into danger zone */}
      {isAnomalous && horizonOffset >= 2 && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '280px',
          height: '100%',
          background: 'radial-gradient(ellipse at top right, rgba(239, 68, 68, 0.08), transparent 70%)',
          pointerEvents: 'none'
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--text-main)" />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Predictive Horizon Time-Travel Scrubber
          </h3>
          <span className="badge badge-zinc" style={{ fontSize: '0.66rem' }}>
            Forecast Engine
          </span>
        </div>

        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {isAnomalous ? (
            <span style={{ color: '#ef4444' }}>⚠ Trajectory: Velocity Vector Escalating</span>
          ) : (
            <span style={{ color: '#10b981' }}>✓ Trajectory: Steady-State Equilibrium</span>
          )}
        </div>
      </div>

      {/* Scrubber Horizon Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-subtle)',
        padding: '5px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        gap: '5px',
        overflowX: 'auto',
        marginBottom: '1rem'
      }}>
        {HORIZONS.map((h, idx) => {
          const isSelected = horizonOffset === idx;
          const isDanger = isAnomalous && idx >= 2;

          let pillBg = 'transparent';
          let pillBorder = '1px solid transparent';
          let pillColor = 'var(--text-muted)';
          let pillShadow = 'none';

          if (isSelected) {
            if (isDanger) {
              pillBg = 'rgba(239, 68, 68, 0.12)';
              pillBorder = '1px solid rgba(239, 68, 68, 0.35)';
              pillColor = '#ef4444';
            } else {
              pillBg = 'var(--bg-card)';
              pillBorder = '1px solid var(--border-subtle)';
              pillColor = 'var(--text-main)';
              pillShadow = 'var(--shadow-sm)';
            }
          }

          return (
            <button
              key={h.label}
              type="button"
              onClick={() => handleSelectHorizon(idx)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: isSelected ? '700' : '500',
                background: pillBg,
                color: pillColor,
                border: pillBorder,
                boxShadow: pillShadow,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>{h.label}</span>
              <span style={{ fontSize: '0.62rem', color: isSelected ? 'var(--text-main)' : 'var(--text-subtle)', opacity: 0.85 }}>
                {idx === 0 ? 'Live Telemetry' : `T+${h.seconds}s`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Projection Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Projected CPU Saturation</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: projectedCpu > 80 ? '#ef4444' : 'var(--text-main)'
            }}>
              {projectedCpu.toFixed(1)}%
            </span>
            {horizonOffset > 0 && isAnomalous && (
              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>
                (+{(projectedCpu - currentScenario.metrics.cpu).toFixed(0)}% projected)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {projectedCpu >= 98 ? 'All 32 hardware threads stalled' : 'Normal scheduling bandwidth'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Projected Memory Fill</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: projectedRam > 85 ? '#ef4444' : 'var(--text-main)'
            }}>
              {projectedRam.toFixed(1)}%
            </span>
            {horizonOffset > 0 && isAnomalous && (
              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>
                ({((projectedRam / 100) * 32).toFixed(1)} GB used)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {projectedRam >= 95 ? 'V8 OOM Crash imminent' : 'Buffer headroom available'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Risk Trajectory</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: projectedRisk > 60 ? '#ef4444' : 'var(--text-main)'
            }}>
              {projectedRisk} / 100
            </span>
            <span className={projectedRisk > 60 ? 'badge badge-rose' : 'badge badge-emerald'} style={{ fontSize: '0.62rem' }}>
              {projectedRisk > 60 ? 'CRITICAL' : 'STABLE'}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {currentHorizon.desc}
          </div>
        </div>

        {/* Quick Preemption trigger */}
        {isAnomalous && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn-primary-action"
              onClick={onPreemptAction}
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-text)',
                padding: '9px 16px',
                fontSize: '0.8rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Zap size={14} />
              Pre-empt Cascade Failure
            </button>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
              Executes proven Hindsight playbook
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
