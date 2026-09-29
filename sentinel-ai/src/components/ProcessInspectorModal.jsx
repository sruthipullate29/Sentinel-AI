import React, { useState } from 'react';
import { Terminal, Cpu, HardDrive, Shield, X, Activity, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { playStepChirp, playSuccessChime } from '../utils/soundEffects';

export default function ProcessInspectorModal({ process, onClose, onApplyAction }) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [actionStatus, setActionStatus] = useState(null);

  if (!process) return null;

  const handleAction = (actionName) => {
    playStepChirp(2);
    setActionStatus({ running: true, name: actionName });

    setTimeout(() => {
      playSuccessChime();
      setActionStatus({
        running: false,
        name: actionName,
        success: true,
        message: `Successfully executed: ${actionName} on PID ${process.pid}. eBPF verified scheduler stabilization.`
      });
      if (onApplyAction) onApplyAction(actionName, process);
    }, 900);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        {/* Header */}
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
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: process.status === 'culprit' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Terminal size={18} color={process.status === 'culprit' ? '#fb7185' : '#22d3ee'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  {process.name}
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  PID {process.pid}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                cgroup: /sys/fs/cgroup/system.slice/{process.name.split(' ')[0]}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Status Banner */}
        {actionStatus && (
          <div style={{
            padding: '10px 1.5rem',
            background: actionStatus.running ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            borderBottom: `1px solid ${actionStatus.running ? '#f59e0b' : '#10b981'}`,
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff'
          }}>
            {actionStatus.running ? (
              <>
                <RefreshCw size={14} className="spin" color="#fbbf24" />
                <span>Applying non-destructive cgroup constraint: {actionStatus.name}...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color="#34d399" />
                <span>{actionStatus.message}</span>
              </>
            )}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>CPU Load</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: process.cpu > 20 ? '#fb7185' : '#22d3ee' }}>
                {process.cpu.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>4 active threads</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Resident Memory</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                {process.ram > 1024 ? `${(process.ram / 1024).toFixed(2)} GB` : `${process.ram} MB`}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>VMS: 5.2 GB</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Disk Throughput</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: (process.disk || 0) > 40 ? '#fb7185' : '#34d399' }}>
                {(process.disk || 0).toFixed(1)} MB/s
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>IOPS: ~{((process.disk || 0) * 15).toFixed(0)}</div>
            </div>
          </div>

          {/* eBPF Syscall Trace Details */}
          <div style={{
            background: '#05070a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{ color: 'var(--text-subtle)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="#22d3ee" />
              <span>LIVE KERNEL eBPF PROBE TELEMETRY:</span>
            </div>
            <div style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              <div>• CPU scheduler quota: cpu.max = "max 100000"</div>
              <div>• Open socket descriptors: 28 TCP connections (0 TIME_WAIT)</div>
              <div>• Page faults rate: {process.status === 'culprit' ? '1,420 faults/s (ELEVATED)' : '14 faults/s (Normal)'}</div>
              <div>• Last context switch latency: 0.12 ms (Within nominal budget)</div>
            </div>
          </div>

          {/* Remediation Sandbox Actions */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Safe Remediation Sandbox Controls:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary-action"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => handleAction('cgroup CPU Throttling (-50%)')}
              >
                <Cpu size={13} color="#06b6d4" />
                Throttle CPU cgroup (-50%)
              </button>

              <button
                type="button"
                className="btn-secondary-action"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => handleAction('Release Transient Buffer Cache')}
              >
                <HardDrive size={13} color="#a855f7" />
                Evict Heap / Cache
              </button>

              <button
                type="button"
                className="btn-secondary-action"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => handleAction('Warm Process Isolate Recycle')}
              >
                <RefreshCw size={13} color="#10b981" />
                Warm Thread Recycle
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onClose}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
