import React from 'react';
import { Terminal, AlertOctagon, CheckCircle2, AlertTriangle, Layers, ExternalLink } from 'lucide-react';

export default function ProcessTable({ processes, onInspectProcess }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'culprit':
        return (
          <span className="badge badge-rose">
            <AlertOctagon size={11} />
            Contributing Culprit
          </span>
        );
      case 'warning':
        return (
          <span className="badge badge-amber">
            <AlertTriangle size={11} />
            Elevated
          </span>
        );
      default:
        return (
          <span className="badge badge-cyan">
            <CheckCircle2 size={11} />
            Nominal
          </span>
        );
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#22d3ee" />
            Active Application Telemetry & Contribution Ranking
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Continuous per-process telemetry monitored by SentinelAI kernel eBPF probe
          </p>
        </div>
        <span className="badge badge-violet" style={{ fontSize: '0.72rem' }}>
          Real-time Process Tree
        </span>
      </div>

      <div className="process-table-container">
        <table className="process-table">
          <thead>
            <tr>
              <th>Process / Application</th>
              <th>PID</th>
              <th>CPU Usage</th>
              <th>RAM Allocation</th>
              <th>Disk I/O</th>
              <th>State Assessment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => {
              const isCulprit = proc.status === 'culprit';
              return (
                <tr key={proc.pid || Math.random()} className={isCulprit ? 'culprit-row' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: isCulprit ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isCulprit ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid var(--border-subtle)'
                      }}>
                        <Terminal size={14} color={isCulprit ? '#fb7185' : '#94a3b8'} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: isCulprit ? '#fff' : 'var(--text-main)' }}>
                          {proc.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                          cgroup: /system.slice/{proc.name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {proc.pid}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '70px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, proc.cpu)}%`,
                          background: isCulprit ? '#f43f5e' : (proc.cpu > 15 ? '#f59e0b' : '#06b6d4')
                        }} />
                      </div>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 600,
                        color: isCulprit ? '#fb7185' : 'inherit'
                      }}>
                        {proc.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {proc.ram > 1024 
                      ? `${(proc.ram / 1024).toFixed(2)} GB` 
                      : `${proc.ram} MB`}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: (proc.disk || 0) > 50 ? '#fb7185' : 'var(--text-muted)' }}>
                    {(proc.disk || 0).toFixed(1)} MB/s
                  </td>
                  <td>
                    {getStatusBadge(proc.status)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onInspectProcess && onInspectProcess(proc)}
                      className="btn-secondary-action"
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      <ExternalLink size={12} />
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
