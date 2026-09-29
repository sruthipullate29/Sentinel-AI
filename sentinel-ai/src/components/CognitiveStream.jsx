import React, { useState, useEffect, useRef } from 'react';
import { Terminal, BrainCircuit, ChevronDown, ChevronUp, Pause, Play, Trash2, Cpu } from 'lucide-react';

export default function CognitiveStream({ systemStatus, currentScenario, activeStepId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, time: '22:45:01', tag: 'KERNEL', text: 'eBPF kprobe attached: sys_enter_sched_switch & mm_page_alloc', level: 'info' },
    { id: 2, time: '22:45:03', tag: 'VECTOR-DB', text: 'Loaded 4 episodic incidents from SQLite vector store', level: 'info' },
    { id: 3, time: '22:45:05', tag: 'INVARIANT', text: 'Workstation baseline established: CPU idle ~18%, RAM 42%', level: 'success' }
  ]);
  const logContainerRef = useRef(null);

  // Auto-scroll when new logs arrive unless user is scrolled up
  useEffect(() => {
    if (logContainerRef.current && isOpen && !isPaused) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen, isPaused]);

  // Generate dynamic logs based on current system scenario and step
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = new Date().toTimeString().split(' ')[0];

      let newLog;
      if (currentScenario.id === 'NORMAL') {
        const sampleLogs = [
          { tag: 'KERNEL', text: `eBPF sampled PID 3102 (code.exe): CPU ${ (Math.random() * 3 + 2).toFixed(1) }%, 0 lock waits`, level: 'info' },
          { tag: 'HINDSIGHT', text: 'Periodic vector similarity scan against anomalous clusters: cosine dist > 0.88 (All Nominal)', level: 'info' },
          { tag: 'POLICY', text: 'Host power governor: Balanced. Thermal envelope within safe TDP (48°C)', level: 'success' },
          { tag: 'OBSERVE', text: 'Workstation habit: User actively typing in editor, dev server HMR idle', level: 'info' }
        ];
        newLog = { ...sampleLogs[Math.floor(Math.random() * sampleLogs.length)], id: Date.now(), time: now };
      } else {
        // High anomaly logs
        const anomalyLogs = [
          { tag: 'ALERT', text: `Entropy spike detected in process "${currentScenario.culpritProcess || 'culprit'}": +34% variance`, level: 'error' },
          { tag: 'HINDSIGHT', text: `Retrieved historical memory ${currentScenario.predictedIncident?.hindsightMatchId || 'INC-891'}: 95% behavioral signature match!`, level: 'warning' },
          { tag: 'SANDBOX', text: 'Evaluating safety boundaries: Remediation non-destructive to persistent disk state', level: 'warning' },
          { tag: 'PROJECTION', text: `Exhaustion trajectory calculated: Host freeze in ~${currentScenario.predictedIncident?.timeToExhaustion || '45s'}`, level: 'error' }
        ];
        newLog = { ...anomalyLogs[Math.floor(Math.random() * anomalyLogs.length)], id: Date.now(), time: now };
      }

      setLogs(prev => [...prev.slice(-30), newLog]);
    }, 2800);

    return () => clearInterval(interval);
  }, [currentScenario, isPaused]);

  const getTagColor = (tag) => {
    switch (tag) {
      case 'KERNEL': return '#22d3ee';
      case 'VECTOR-DB':
      case 'HINDSIGHT': return '#c084fc';
      case 'ALERT': return '#fb7185';
      case 'POLICY':
      case 'INVARIANT': return '#34d399';
      default: return '#fbbf24';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '18px',
      right: '24px',
      zIndex: 90,
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Floating launcher badge when closed */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.95))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '999px',
            padding: '8px 16px',
            color: '#fff',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.3)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            backdropFilter: 'blur(10px)'
          }}
          className="glow-cyan"
        >
          <BrainCircuit size={15} color="#22d3ee" />
          <span style={{ fontWeight: 600 }}>AI Cognitive Stream</span>
          <span className="pulse-dot" style={{ background: currentScenario.id === 'NORMAL' ? '#10b981' : '#f43f5e', width: '7px', height: '7px' }}></span>
          <ChevronUp size={14} color="var(--text-muted)" />
        </button>
      ) : (
        /* Expanded Terminal Window */
        <div style={{
          width: '460px',
          maxWidth: '92vw',
          height: '320px',
          background: 'rgba(8, 11, 20, 0.96)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="#22d3ee" />
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                SentinelAI • Cognitive Stream
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                LIVE eBPF
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume stream' : 'Pause stream'}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px 4px' }}
              >
                {isPaused ? <Play size={13} color="#34d399" /> : <Pause size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setLogs([])}
                title="Clear terminal"
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px 4px' }}
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize stream"
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px 4px' }}
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>

          {/* Log Stream Content */}
          <div
            ref={logContainerRef}
            style={{
              flex: 1,
              padding: '10px 12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.74rem',
              lineHeight: '1.45'
            }}
          >
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-subtle)' }}>[{log.time}]</span>
                <span style={{ 
                  color: getTagColor(log.tag), 
                  fontWeight: 700, 
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0 4px',
                  borderRadius: '3px'
                }}>
                  {log.tag}
                </span>
                <span style={{ color: log.level === 'error' ? '#fb7185' : (log.level === 'warning' ? '#fde047' : '#e2e8f0'), flex: 1 }}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Status Bar */}
          <div style={{
            padding: '4px 12px',
            background: 'rgba(5, 7, 12, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.68rem',
            color: 'var(--text-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Agent Inference Cycle: ~12ms</span>
            <span style={{ color: '#22d3ee' }}>Loop Stage: {activeStepId.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
