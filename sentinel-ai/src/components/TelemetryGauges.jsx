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

export default function TelemetryGauges({ metrics, history, anomalyRisk }) {
  const getProgressColor = (val, highIsBad = true) => {
    if (highIsBad) {
      if (val > 80) return 'var(--rose-primary)';
      if (val > 60) return '#f59e0b';
      return 'linear-gradient(90deg, #6366f1, #a855f7)';
    }
    return '#10b981';
  };

  const cpuData = history?.map(h => h.cpu) || [20, 22, 25, 20, 24];
  const ramData = history?.map(h => h.ram) || [40, 41, 42, 43, 42];
  const diskData = history?.map(h => Math.min(100, (h.disk / 500) * 100)) || [10, 12, 11, 15, 12];
  const riskData = history?.map(h => h.risk) || [5, 8, 7, 10, 8];

  return (
    <div className="telemetry-grid">
      {/* Card 1: Monthly Sales Style -> Host CPU Utilization */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Monthly Workload</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Process Thread Pool</div>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
            16C / 32T
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '0.75rem 0' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total threads</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              25.4k
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>CPU Load</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: metrics.cpu > 80 ? 'var(--rose-bright)' : '#c4b5fd', fontFamily: 'var(--font-display)' }}>
              {metrics.cpu.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-progress-track" style={{ marginTop: '0.85rem' }}>
          <div 
            className="metric-progress-fill" 
            style={{ 
              width: `${Math.min(100, metrics.cpu)}%`,
              background: metrics.cpu > 80 ? 'var(--rose-primary)' : 'linear-gradient(90deg, #6366f1, #a855f7)'
            }}
          />
        </div>

        <div className="metric-footer" style={{ marginTop: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} color={metrics.temp > 80 ? '#f43f5e' : '#a78bfa'} />
            Pkg Temp: {metrics.temp}°C
          </span>
          <span>Active Capacity: 1.3M ops</span>
        </div>
      </div>

      {/* Card 2: Revenue Summary Style -> Telemetry Breakdown */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <span className="metric-title" style={{ color: '#ffffff', fontWeight: 700 }}>
            Revenue & Resource Summary
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Last 10 Secs</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0.5rem 0 0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Host CPU Load</span>
            <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{metrics.cpu.toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>RAM Allocation</span>
            <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{((metrics.ram / 100) * 32).toFixed(1)} GB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>NVMe Storage Throughput</span>
            <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{metrics.disk.toFixed(0)} MB/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>eBPF Active Probes</span>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>3,120 /s</span>
          </div>
        </div>

        <div className="metric-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
          <span>Kernel Ring Buffer</span>
          <span style={{ color: '#34d399' }}>● 100% Synced</span>
        </div>
      </div>

      {/* Card 3: Real-Time Style (Matches the right-hand card with smooth bottom wave in the screenshot!) */}
      <div className="glass-panel metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="metric-card-header">
            <span className="metric-title" style={{ color: '#94a3b8' }}>
              Real-time
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
              LIVE PROBE
            </span>
          </div>

          <div style={{ margin: '0.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {anomalyRisk > 60 ? `${anomalyRisk}` : '49'}
            </div>
            <div style={{ fontSize: '0.78rem', color: anomalyRisk > 60 ? 'var(--rose-bright)' : '#94a3b8', marginTop: '4px' }}>
              {anomalyRisk > 60 ? 'Instability threat active' : 'Visiting now • Services nominal'}
            </div>
          </div>
        </div>

        {/* Organic purple wave fill curve identical to the screenshot! */}
        <div style={{ position: 'relative', height: '65px', margin: '4px -1.35rem -1.35rem', width: 'calc(100% + 2.7rem)', overflow: 'hidden' }}>
          <svg viewBox="0 0 240 65" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="realtimeWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#431407" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 Q40,48 80,38 T160,25 T240,10 L240,65 L0,65 Z"
              fill="url(#realtimeWaveGrad)"
            />
            <path
              d="M0,50 Q40,48 80,38 T160,25 T240,10"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Card 4: System Memory (RAM) Card */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <span className="metric-title">
            <HardDrive size={16} color="#818cf8" />
            System Memory (RAM)
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
            32 GB DDR5
          </span>
        </div>
        <div className="metric-value-display">
          <span 
            className="metric-number"
            style={{ color: metrics.ram > 85 ? 'var(--rose-bright)' : '#ffffff' }}
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
              background: metrics.ram > 85 ? 'var(--rose-primary)' : 'linear-gradient(90deg, #6366f1, #818cf8)'
            }}
          />
        </div>
        <Sparkline 
          data={ramData} 
          strokeColor={metrics.ram > 85 ? '#f43f5e' : '#818cf8'} 
        />
        <div className="metric-footer" style={{ marginTop: '6px' }}>
          <span>Used: {((metrics.ram / 100) * 32).toFixed(1)} GB</span>
          <span>Free: {(32 - (metrics.ram / 100) * 32).toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
}
