import React from 'react';
import { Cpu, HardDrive, Database, AlertCircle, ArrowUpRight, Flame, Activity, Zap } from 'lucide-react';

function Sparkline({ data, strokeColor, fillColor }) {
  if (!data || data.length < 2) return null;
  const width = 240;
  const height = 40;
  const max = 100;
  const min = 0;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / (max - min)) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;
  const gradId = `grad-${strokeColor.replace('#', '')}`;

  return (
    <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function TelemetryGauges({ metrics, history, anomalyRisk, hindsightStats }) {
  const getProgressColor = (val, highIsBad = true) => {
    if (highIsBad) {
      if (val > 80) return 'var(--rose-primary)';
      if (val > 60) return 'var(--amber-primary)';
      return 'var(--primary)';
    }
    return 'var(--emerald-primary)';
  };

  const cpuData = history?.map(h => h.cpu) || [20, 22, 25, 20, 24];
  const ramData = history?.map(h => h.ram) || [40, 41, 42, 43, 42];
  const diskData = history?.map(h => Math.min(100, (h.disk / 500) * 100)) || [10, 12, 11, 15, 12];
  const riskData = history?.map(h => h.risk) || [5, 8, 7, 10, 8];

  const retainDisplay = hindsightStats?.retain_tokens_display || '429 tokens';
  const recallDisplay = hindsightStats?.recall_tokens_display || '165.8K tokens';
  const totalUnits = hindsightStats?.total_nodes || 18;
  const totalLinks = hindsightStats?.total_links || 104;

  return (
    <div className="telemetry-grid">
      {/* Card 1: Host Workload & CPU Utilization */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Host Workload</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Total Process Thread Pool</div>
          </div>
          <span className="badge badge-zinc" style={{ fontSize: '0.68rem' }}>
            14C / 20T • i7-12700H
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '0.75rem 0' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Total threads</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              25.4k
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>CPU Load</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: metrics.cpu > 80 ? 'var(--rose-bright)' : 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              {metrics.cpu.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-progress-track" style={{ marginTop: '0.85rem' }}>
          <div 
            className="metric-progress-fill" 
            style={{ 
              width: `${Math.min(100, metrics.cpu)}%`,
              background: metrics.cpu > 80 ? 'var(--rose-primary)' : 'var(--primary)'
            }}
          />
        </div>

        <div className="metric-footer" style={{ marginTop: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} color={metrics.temp > 80 ? 'var(--rose-primary)' : 'var(--text-muted)'} />
            Pkg Temp: {metrics.temp}°C
          </span>
          <span>Active Capacity: 1.3M ops</span>
        </div>
      </div>

      {/* Card 2: Hindsight Episodic Memory Engine Breakdown */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <span className="metric-title" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            Hindsight Memory Engine
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>
            ● Synced
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0.5rem 0 0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Retain Volume</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {retainDisplay} <span style={{ fontSize: '0.72rem', color: '#10b981' }}>+22%</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Recall Activity</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{recallDisplay}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Indexed Units</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalUnits} Units • {totalLinks} Links</span>
          </div>
        </div>

        <div className="metric-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
          <span>Vector Engine</span>
          <span style={{ color: 'var(--emerald-bright)' }}>api.hindsight.vectorize.io</span>
        </div>
      </div>

      {/* Card 3: Host Anomaly Risk & Stability Index */}
      <div className="glass-panel metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="metric-card-header">
            <span className="metric-title" style={{ color: 'var(--text-muted)' }}>
              Anomaly Risk
            </span>
            <span className={`badge ${anomalyRisk > 60 ? 'badge-rose' : 'badge-zinc'}`} style={{ fontSize: '0.66rem' }}>
              {anomalyRisk > 60 ? 'ALERT' : 'LIVE PROBE'}
            </span>
          </div>

          <div style={{ margin: '0.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: anomalyRisk > 60 ? 'var(--rose-bright)' : 'var(--text-main)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {anomalyRisk}%
            </div>
            <div style={{ fontSize: '0.78rem', color: anomalyRisk > 60 ? 'var(--rose-bright)' : 'var(--text-muted)', marginTop: '4px' }}>
              {anomalyRisk > 60 ? 'Instability threat active' : 'System nominal • eBPF synced'}
            </div>
          </div>
        </div>

        {/* Clean soft dark wave fill curve */}
        <div style={{ position: 'relative', height: '65px', margin: '4px -1.35rem -1.35rem', width: 'calc(100% + 2.7rem)', overflow: 'hidden' }}>
          <svg viewBox="0 0 240 65" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="realtimeWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--text-subtle)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--text-subtle)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 Q40,48 80,38 T160,25 T240,10 L240,65 L0,65 Z"
              fill="url(#realtimeWaveGrad)"
            />
            <path
              d="M0,50 Q40,48 80,38 T160,25 T240,10"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Card 4: System Memory (RAM) Card */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <span className="metric-title">
            <HardDrive size={16} color="var(--text-muted)" />
            System Memory (RAM)
          </span>
          <span className="badge badge-zinc" style={{ fontSize: '0.68rem' }}>
            16 GB DDR5
          </span>
        </div>
        <div className="metric-value-display">
          <span 
            className="metric-number"
            style={{ color: metrics.ram > 85 ? 'var(--rose-bright)' : 'var(--text-main)' }}
          >
            {metrics.ram.toFixed(1)}
          </span>
          <span className="metric-unit">%</span>
        </div>
        <div className="metric-progress-track">
          <div 
            className="metric-progress-fill" 
            style={{ 
              width: `${Math.min(100, metrics.ram)}%`,
              background: metrics.ram > 85 ? 'var(--rose-primary)' : 'var(--primary)'
            }}
          />
        </div>
        <Sparkline 
          data={ramData} 
          strokeColor={metrics.ram > 85 ? 'var(--rose-primary)' : 'var(--text-subtle)'} 
        />
        <div className="metric-footer" style={{ marginTop: '6px' }}>
          <span>Used: {((metrics.ram / 100) * 16).toFixed(1)} GB</span>
          <span>Free: {(16 - (metrics.ram / 100) * 16).toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
}
