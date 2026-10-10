import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LearningLoopBar from './components/LearningLoopBar';
import TelemetryGauges from './components/TelemetryGauges';
import ProcessTable from './components/ProcessTable';
import PredictionAlert from './components/PredictionAlert';
import OptimizationModal from './components/OptimizationModal';
import HindsightBankView from './components/HindsightBankView';
import IntelligenceView from './components/IntelligenceView';
import ArchitectureView from './components/ArchitectureView';
import NeuralCanvas from './components/NeuralCanvas';
import CognitiveStream from './components/CognitiveStream';
import PredictiveHorizonScrubber from './components/PredictiveHorizonScrubber';
import ProcessInspectorModal from './components/ProcessInspectorModal';

import {
  fetchTelemetry,
  fetchMemories,
  fetchHindsightStats,
  fetchIncidents,
  fetchIncident,
  reportIncident,
  approveIncidentAction,
  fetchHealth,
} from './api';

import {
  SIMULATION_SCENARIOS,
  INITIAL_HINDSIGHT_INCIDENTS,
  LEARNING_LOOP_STEPS
} from './data/mockData';

import {
  playAnomalyAlarm,
  playTabClick,
  playSuccessChime,
  toggleAudio
} from './utils/soundEffects';

import {
  Zap,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Play,
  ArrowRight,
  Lock,
  Activity,
  Check,
  ShieldCheck,
  Layers
} from 'lucide-react';

import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vision404_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vision404_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [activeTab, setActiveTab] = useState('live');
  const [currentScenario, setCurrentScenario] = useState(SIMULATION_SCENARIOS.NORMAL);
  const [metrics, setMetrics] = useState({ ...SIMULATION_SCENARIOS.NORMAL.metrics });
  const [processes, setProcesses] = useState([...SIMULATION_SCENARIOS.NORMAL.processes]);
  const [anomalyRisk, setAnomalyRisk] = useState(SIMULATION_SCENARIOS.NORMAL.anomalyRisk);

  // History buffer for sparklines
  const [history, setHistory] = useState([
    { cpu: 18, ram: 42, disk: 14, risk: 8 },
    { cpu: 19, ram: 42, disk: 15, risk: 8 },
    { cpu: 17, ram: 41, disk: 13, risk: 7 },
    { cpu: 20, ram: 42, disk: 14, risk: 9 },
    { cpu: 18, ram: 42, disk: 14, risk: 8 }
  ]);

  // Hindsight memories recalled from the real backend
  const [hindsightIncidents, setHindsightIncidents] = useState(INITIAL_HINDSIGHT_INCIDENTS);
  // Real Hindsight bank stats directly matching Hindsight Cloud
  const [hindsightStats, setHindsightStats] = useState(null);
  // Real persisted incident history from SQLite
  const [realIncidentHistory, setRealIncidentHistory] = useState([]);
  // Backend health (includes Hindsight connectivity)
  const [backendHealth, setBackendHealth] = useState({ hindsight: 'checking...' });

  // Continuous Learning Loop Stage
  const [activeStepId, setActiveStepId] = useState('monitor');
  const [systemStatus, setSystemStatus] = useState('HEALTHY'); // 'HEALTHY' | 'PRE-ANOMALY' | 'OPTIMIZING' | 'MEASURED'
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(true);
  const [statusNotification, setStatusNotification] = useState(null);

  // Creative features state
  const [inspectedProcess, setInspectedProcess] = useState(null);
  const [isScanlineMode, setIsScanlineMode] = useState(false);

  // Load backend health & real incident history on mount
  useEffect(() => {
    fetchHealth().then(h => {
      setBackendHealth(h);
      if (h.hindsight_stats) setHindsightStats(h.hindsight_stats);
    }).catch(() => {});
    fetchHindsightStats().then(s => {
      if (s) setHindsightStats(s);
    }).catch(() => {});
    fetchIncidents(20).then(incs => {
      if (incs && incs.length > 0) setRealIncidentHistory(incs);
    }).catch(e => console.error('Incident history fetch error', e));

    const params = new URLSearchParams(window.location.search);
    const incidentId = params.get('incident');
    if (incidentId) {
      fetchIncident(incidentId)
        .then(data => {
          const memCount = data.historical_matches?.length || 0;
          setCurrentScenario({
            id: 'NOTIFICATION_LOAD',
            predictedIncident: {
              id: data.id,
              culpritName: data.probable_cause,
              hindsightMatchId: memCount > 0 ? 'hindsight-recall' : null,
              hindsightExplanation: memCount > 0
                ? `Hindsight recalled ${memCount} relevant past experience(s).`
                : 'No relevant historical experience found.',
              similarityScore: memCount > 0 ? 90 : 0,
              memoryInformed: data.recommendation?.memory_informed || false,
              memoryCount: memCount,
              recommendation: data.recommendation,
            }
          });
          setSystemStatus('PRE-ANOMALY');
          setActiveStepId('recommend');
          setIsOptimizationModalOpen(true);
          // Remove query param without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(e => console.error('Failed to load incident from URL', e));
    }
  }, []);

  // Periodic Telemetry Fetching (Real Data)
  useEffect(() => {
    if (!isAutoSimulating) return;

    // Fetch real Hindsight memories for memory bank tab
    fetchMemories().then(data => {
      if (data && data.memories && data.memories.length > 0) {
        const extractApp = (text, meta) => {
          const content = ((text || '') + ' ' + (meta?.top_processes || '') + ' ' + (meta?.probable_cause || '')).toLowerCase();
          
          if (content.includes('chrome')) return 'Chrome';
          if (content.includes('postgres') || content.includes('sql')) return 'Postgres';
          if (content.includes('stress')) return 'Stress Test';
          if (content.includes('sentinelai-demo') || content.includes('vision404-demo')) return 'Docker Workload';
          if (content.includes('python')) return 'Python';
          if (content.includes('node')) return 'NodeJS';
          if (content.includes('docker') || content.includes('container')) return 'Docker';
          if (content.includes('ide') || content.includes('antigravity')) return 'AGY IDE';
          
          return 'System Workload';
        };

        const totalMems = data.memories.length;
        const mappedMemories = data.memories.map((m, idx) => {
          const angle = (idx / totalMems) * 2 * Math.PI - Math.PI / 2;
          
          const rawDelta = parseFloat(m.delta_cpu || m.metadata?.delta_cpu || m.metadata?.cpu_delta || 35.0);
          const cpuRestored = Math.abs(rawDelta).toFixed(1);

          return {
            id: m.id || `MEM-${idx}`,
            incident_id: m.incident_id || `INC-${idx}`,
            fact_type: m.fact_type || 'experience',
            app: extractApp(m.text, m.metadata),
            symptom: m.text ? (m.text.length > 85 ? m.text.substring(0, 85) + '…' : m.text) : 'System observation',
            rootCause: m.text || 'Incident observed in Hindsight',
            actionTaken: m.action || m.metadata?.action || 'pause_container',
            deltaCpu: cpuRestored,
            deltaRam: 0,
            entities: m.entities || '',
            effectivenessScore: (m.metadata?.outcome === 'success' || m.metadata?.outcome === 'SUCCESSFUL' || m.metadata?.outcome === 'resolved') ? 100 : 85,
            timestamp: m.date ? new Date(m.date).toLocaleTimeString() : 'Active',
            userNotes: `Indexed in Hindsight (${m.fact_type || 'memory'})`,
            coordinates: { 
              x: 50 + 36 * Math.cos(angle), 
              y: 50 + 36 * Math.sin(angle) 
            }
          };
        });
        
        setHindsightIncidents(mappedMemories);
      }
    }).catch(e => console.error('Memory fetch error', e));

    const interval = setInterval(async () => {
      try {
        const data = await fetchTelemetry();

        // If a simulated chaos incident is active, do not overwrite the simulated metrics with normal idle data
        if (currentScenario && currentScenario.id !== 'NORMAL') {
          return;
        }

        setMetrics(data.system);
        setProcesses(data.processes);
        setAnomalyRisk(data.risk_score);

        const newPoint = {
          cpu: data.system.cpu,
          ram: data.system.ram,
          disk: data.system.disk,
          risk: data.risk_score
        };

        setHistory(hist => [...hist.slice(-14), newPoint]);

        // Trigger incident creation if risk is high and we are HEALTHY
        if (data.risk_score >= 60 && systemStatus === 'HEALTHY' && !alertDismissed) {
          playAnomalyAlarm();
          setActiveStepId('remember');
          setSystemStatus('PRE-ANOMALY');

          try {
            // Report real incident (not simulation)
            const incData = await reportIncident(data, false, null);
            // Refresh real incident history
            fetchIncidents(20).then(incs => setRealIncidentHistory(incs)).catch(() => {});

            // Show Local Native Notification Immediately!
            if ('Notification' in window && Notification.permission === 'granted') {
              const notif = new Notification('Vision404 — Anomaly Detected', {
                body: `${incData.probable_cause} (Risk: ${data.risk_score})`,
                icon: '/favicon.svg',
                requireInteraction: true,
                data: { url: `/?incident=${incData.id}` }
              });
              notif.onclick = (e) => {
                e.preventDefault();
                window.focus();
                notif.close();
              };
            }

            const memCount = incData.historical_matches?.length || 0;
            setCurrentScenario(prev => ({
              ...prev,
              id: 'CHROME_SPIKE',
              predictedIncident: {
                id: incData.id,
                culpritName: incData.probable_cause,
                hindsightMatchId: memCount > 0 ? 'hindsight-recall' : null,
                hindsightExplanation: memCount > 0
                  ? `Hindsight recalled ${memCount} relevant past experience(s). ${incData.recommendation?.reason || ''}`
                  : 'No relevant historical experience found. This is a first-time incident of this type.',
                similarityScore: memCount > 0 ? 90 : 0,
                memoryInformed: incData.recommendation?.memory_informed || false,
                memoryCount: memCount,
                recommendation: incData.recommendation,
              }
            }));

            setTimeout(() => setActiveStepId('learn'), 500);
            setTimeout(() => setActiveStepId('predict'), 1000);
            setTimeout(() => setActiveStepId('recommend'), 1500);
          } catch (e) {
            console.error('Failed to report incident', e);
          }
        } else if (data.risk_score < 40 && systemStatus !== 'HEALTHY' && systemStatus !== 'OPTIMIZING' && systemStatus !== 'MEASURED') {
          // Auto recover if pressure drops naturally and no simulation is running
          if (!currentScenario || currentScenario.id === 'NORMAL') {
            setSystemStatus('HEALTHY');
            setActiveStepId('monitor');
          }
        }
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [systemStatus, alertDismissed, isAutoSimulating, currentScenario?.id]);

  // Handle Injecting Scenario
  const handleSelectScenario = useCallback((scenarioKey) => {
    const scenario = SIMULATION_SCENARIOS[scenarioKey] || SIMULATION_SCENARIOS.CHROME_SPIKE || SIMULATION_SCENARIOS.NORMAL;
    if (!scenario) return;

    setCurrentScenario(scenario);
    setMetrics({ ...scenario.metrics });
    setProcesses([...scenario.processes]);
    setAnomalyRisk(scenario.anomalyRisk);
    setAlertDismissed(false);

    const newPoint = {
      cpu: scenario.metrics.cpu,
      ram: scenario.metrics.ram,
      disk: scenario.metrics.disk,
      risk: scenario.anomalyRisk
    };
    setHistory(hist => [...hist.slice(-14), newPoint]);

    if (scenario.id === 'NORMAL') {
      playTabClick();
      setActiveStepId('monitor');
      setSystemStatus('HEALTHY');
      setStatusNotification(null);
    } else {
      // Play cyber alarm alert sound!
      playAnomalyAlarm();

      // Advance through learning loop
      setActiveStepId('remember');
      setSystemStatus('PRE-ANOMALY');

      setStatusNotification({
        type: 'warning',
        message: `Live Chaos Injected: ${scenario.name} (Risk Score: ${scenario.anomalyRisk}%)`
      });

      // Fire LOCAL notification immediately (instant, no network) 
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification('Vision404 — Anomaly Detected', {
          body: `${scenario.name} (Risk: ${scenario.anomalyRisk})`,
          icon: '/favicon.svg',
          requireInteraction: true
        });
        notif.onclick = () => { window.focus(); notif.close(); };
      }

      // Create real backend incident (async) — this triggers the Web Push too
      const snapshotPayload = {
        system: {
          cpu: scenario.metrics.cpu,
          ram: scenario.metrics.ram,
          disk: scenario.metrics.disk || 0
        },
        processes: scenario.processes.map(p => ({
          pid: p.pid || p.id || 0,
          name: p.name,
          cpu: p.cpu || 0,
          ram: p.ram || 0,
          status: p.status || 'running'
        })),
        anomaly_signals: [`Simulated: ${scenario.name}`],
        risk_score: scenario.anomalyRisk,
        timestamp: new Date().toISOString()
      };

      reportIncident(snapshotPayload, true, scenario.id)
        .then(incData => {
          const memCount = incData.historical_matches?.length || 0;
          setCurrentScenario(prev => ({
            ...prev,
            predictedIncident: {
              ...(prev.predictedIncident || {}),
              id: incData.id,
              culpritName: incData.probable_cause,
              hindsightMatchId: memCount > 0 ? 'hindsight-recall' : null,
              hindsightExplanation: memCount > 0
                ? `Hindsight recalled ${memCount} relevant past experience(s).`
                : 'No relevant historical experience found.',
              similarityScore: memCount > 0 ? 90 : 0,
              memoryInformed: incData.recommendation?.memory_informed || false,
              memoryCount: memCount,
              recommendation: incData.recommendation,
            }
          }));
          fetchIncidents(20).catch(() => {});
        })
        .catch(e => console.error('[Simulation] Failed to create backend incident:', e));

      setTimeout(() => { setActiveStepId('learn'); }, 500);
      setTimeout(() => { setActiveStepId('predict'); }, 1000);
      setTimeout(() => { setActiveStepId('recommend'); }, 1500);
    }
  }, []);


  // Reset to Baseline
  const handleResetToBaseline = useCallback(() => {
    handleSelectScenario('NORMAL');
  }, [handleSelectScenario]);

  // Activate Simulate Live Incident from Hero CTA
  const handleSimulateLiveIncident = useCallback(() => {
    const anomalyKeys = ['CHROME_SPIKE', 'NODE_LEAK', 'IDE_SPIKE'];
    const nextKey = currentScenario.id === 'NORMAL' 
      ? 'CHROME_SPIKE' 
      : anomalyKeys[(anomalyKeys.indexOf(currentScenario.id) + 1) % anomalyKeys.length] || 'CHROME_SPIKE';

    handleSelectScenario(nextKey);

    // Smooth scroll down to the live dashboard & alert banner
    setTimeout(() => {
      const target = document.querySelector('.mac-window-container') || document.querySelector('.prediction-alert-banner');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }, [currentScenario.id, handleSelectScenario]);

  // Open Approval & Execution Workflow
  const handleApproveAction = () => {
    playTabClick();
    setActiveStepId('act');
    setSystemStatus('OPTIMIZING');
    setIsOptimizationModalOpen(true);
  };

  // Cycle scenario helper for shortcuts and HUD
  const handleCycleScenario = () => {
    const scenarioKeys = ['NORMAL', 'CHROME_SPIKE', 'NODE_LEAK', 'IDE_SPIKE'];
    const currentIndex = scenarioKeys.indexOf(currentScenario.id);
    const nextKey = scenarioKeys[(currentIndex + 1) % scenarioKeys.length];
    handleSelectScenario(nextKey);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') {
        setActiveTab('live');
        playTabClick();
      } else if (e.key === '2') {
        setActiveTab('hindsight');
        playTabClick();
      } else if (e.key === '3') {
        setActiveTab('insights');
        playTabClick();
      } else if (e.key === '4') {
        setActiveTab('architecture');
        playTabClick();
      } else if (e.key === 's' || e.key === 'S') {
        handleCycleScenario();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetToBaseline();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      } else if (e.key === 'Escape') {
        setIsOptimizationModalOpen(false);
        setInspectedProcess(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScenario, handleSelectScenario, handleResetToBaseline, toggleTheme]);

  // When optimization is completed & outcome verified
  const handleCompleteOptimization = async (newIncident, afterMetrics) => {
    setIsOptimizationModalOpen(false);

    try {
      // Actually approve the action on the real backend
      const incidentId = currentScenario.predictedIncident?.id || newIncident.id;
      if (incidentId) {
        const result = await approveIncidentAction(incidentId);
        // Show real outcome from backend
        const realDelta = result?.attempts?.[0]?.delta_cpu || 0;
        if (realDelta !== 0) {
          newIncident.deltaCpu = realDelta.toFixed(1);
        }
      }

      // Refresh real incident history and memories
      fetchIncidents(20).then(incs => setRealIncidentHistory(incs)).catch(() => {});
      const updatedMemories = await fetchMemories();
      if (updatedMemories?.memories?.length > 0) {
        setHindsightIncidents(updatedMemories.memories);
      }
    } catch (e) {
      console.error('Failed to approve action', e);
    }

    // Update Hindsight memory bank with new entry visually
    if (!hindsightIncidents.find(inc => inc.id === newIncident.id)) {
      setHindsightIncidents(prev => [newIncident, ...prev]);
    }

    setAnomalyRisk(10);
    setActiveStepId('remember_outcome');
    setSystemStatus('MEASURED');
    setAlertDismissed(true);

    setStatusNotification({
      type: 'success',
      message: `Verified & Remembered: CPU reduced by ${Math.abs(newIncident.deltaCpu)}%. Incident #${newIncident.id} committed to Hindsight Memory Bank.`
    });

    // Transition back to continuous monitoring after 4 seconds
    setTimeout(() => {
      setActiveStepId('monitor');
      setSystemStatus('HEALTHY');
      handleResetToBaseline(); // Ensure frontend state resets
    }, 4000);
  };

  // Direct action applied from Process Inspector Modal
  const handleApplyProcessRemediation = (actionName, proc) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === proc.id) {
        return {
          ...p,
          status: 'normal',
          cpu: Math.max(2.1, p.cpu * 0.3),
          ram: Math.max(350, p.ram * 0.5)
        };
      }
      return p;
    }));

    setMetrics(prev => ({
      ...prev,
      cpu: Math.max(22, prev.cpu - 35),
      ram: Math.max(44, prev.ram - 20)
    }));

    setStatusNotification({
      type: 'success',
      message: `Sandbox constraint applied to PID ${proc.pid}: ${actionName}. Telemetry normalized.`
    });
  };

  return (
    <div className={`app-container ${isScanlineMode ? 'scanline-active' : ''}`} data-theme={theme}>
      {/* Interactive Neural Synapse Background Canvas */}
      <NeuralCanvas systemStatus={systemStatus} anomalyRisk={anomalyRisk} theme={theme} />

      {/* Cyber Scanline Overlay when enabled */}
      {isScanlineMode && <div className="cyber-scanline-screen" />}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        anomalyRisk={anomalyRisk}
        onResetToBaseline={handleResetToBaseline}
        activeScenarioId={currentScenario.id}
        isScanlineMode={isScanlineMode}
        setIsScanlineMode={setIsScanlineMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        metrics={metrics}
        processes={processes}
        currentScenario={currentScenario}
        onCycleScenario={handleCycleScenario}
        onInspectProcess={setInspectedProcess}
      />

      {/* The 8-Stage Continuous Learning Loop Bar */}
      <LearningLoopBar
        activeStepId={activeStepId}
        onSelectStep={(step) => {
          playTabClick();
          setStatusNotification({
            type: 'info',
            message: `Stage [${step.label}]: ${step.desc}`
          });
        }}
      />

      {/* Notification Toast if any */}
      {statusNotification && (
        <div style={{
          background: statusNotification.type === 'success'
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(125, 125, 125, 0.12)',
          borderBottom: `1px solid ${statusNotification.type === 'success' ? 'var(--emerald-primary)' : 'var(--border-subtle)'}`,
          padding: '8px 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusNotification.type === 'success' ? (
              <CheckCircle2 size={16} color="#34d399" />
            ) : (
              <Info size={16} color="var(--primary)" />
            )}
            <span>{statusNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="dashboard-main" style={{ position: 'relative', zIndex: 10 }}>
        {/* Tab 1: Live Dashboard Landing */}
        {activeTab === 'live' && (
          <>
            {/* 1. Hero Section */}
            <section className="riteflow-hero">
              <div className="hero-pill-badge">
                <Sparkles size={13} color="var(--primary)" />
                <span>AI-Powered System Reliability</span>
              </div>
              <h1 className="hero-main-title">
                Smarter Workflows<br />
                Start with <span className="hero-brand-serif">Vision404</span>
              </h1>
              <p className="hero-subtext">
                Unlock the power of autonomous AI to intercept anomalies, boost uptime, and streamline your infrastructure—zero manual intervention needed. Designed for modern engineering teams.
              </p>
              <div className="hero-cta-group">
                <button
                  type="button"
                  className={`hero-cta-primary ${currentScenario.id !== 'NORMAL' ? 'active-simulating' : ''}`}
                  onClick={handleSimulateLiveIncident}
                  title="Click to simulate live anomaly and test autonomous learning loop"
                >
                  <Play size={14} fill="currentColor" />
                  {currentScenario.id !== 'NORMAL' ? 'Active: Simulating Incident' : 'Simulate Live Incident'}
                </button>
                <button
                  type="button"
                  className="hero-cta-secondary"
                  onClick={handleResetToBaseline}
                  title="Restore system telemetry to normal idle baseline"
                >
                  <RotateCcw size={14} />
                  Restore Baseline
                </button>
              </div>
            </section>

            {/* 2. Elevated Window Mockup */}
            <div className="mac-window-container">
              <div className="mac-window-glow" />
              <div className="mac-window-frame">
                {/* Mac Window Chrome */}
                <div className="mac-window-header">
                  <div style={{ minWidth: '120px' }} />
                  <div className="mac-address-pill">
                    <Lock size={12} color="var(--text-subtle)" />
                    <span>vision404.internal/dashboard</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'flex-end' }}>
                    <span className="badge badge-zinc" style={{ fontSize: '0.66rem' }}>
                      KERNEL eBPF ACTIVE
                    </span>
                  </div>
                </div>

                {/* Inside Dashboard Window */}
                <div className="mac-window-content">
                  <div className="dash-header-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="brand-logo-icon" style={{ width: '34px', height: '34px' }}>
                        <Activity size={18} color="#ffffff" />
                      </div>
                      <div>
                        <h2 className="dash-title">Dashboard</h2>
                        <div className="dash-date">
                          Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Telemetry Gauges with 4 Cards matching RiteFlow layout */}
                  <TelemetryGauges
                    metrics={metrics}
                    history={history}
                    anomalyRisk={anomalyRisk}
                    hindsightStats={hindsightStats}
                  />

                  {/* The 8-Stage Continuous Learning Loop Bar */}
                  <div style={{ margin: '0.5rem 0' }}>
                    <LearningLoopBar
                      activeStepId={activeStepId}
                      onSelectStep={(step) => {
                        playTabClick();
                        setStatusNotification({
                          type: 'info',
                          message: `Stage [${step.label}]: ${step.desc}`
                        });
                      }}
                    />
                  </div>

                  {/* Scenario Injector Strip inside Dashboard */}
                  <div className="scenario-strip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} color="#fbbf24" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Trigger Live Chaos Scenario:
                      </span>
                    </div>

                    <div className="scenario-pills">
                      <button
                        type="button"
                        className={`scenario-pill-btn ${currentScenario.id === 'NORMAL' ? 'active-normal' : ''}`}
                        onClick={() => handleSelectScenario('NORMAL')}
                      >
                        Normal Idle (Baseline)
                      </button>
                      <button
                        type="button"
                        className={`scenario-pill-btn ${currentScenario.id === 'CHROME_SPIKE' ? 'active' : ''}`}
                        onClick={() => handleSelectScenario('CHROME_SPIKE')}
                      >
                        🌐 Chrome Tab Surge
                      </button>
                      <button
                        type="button"
                        className={`scenario-pill-btn ${currentScenario.id === 'NODE_LEAK' ? 'active' : ''}`}
                        onClick={() => handleSelectScenario('NODE_LEAK')}
                      >
                        🟢 Node.js Memory Leak
                      </button>
                      <button
                        type="button"
                        className={`scenario-pill-btn ${currentScenario.id === 'IDE_SPIKE' ? 'active' : ''}`}
                        onClick={() => handleSelectScenario('IDE_SPIKE')}
                      >
                        ⚡ Antigravity IDE CPU Burst
                      </button>
                    </div>
                  </div>

                  {/* Predictive Anomaly & Hindsight Match Banner */}
                  {currentScenario.predictedIncident && !alertDismissed && (
                    <PredictionAlert
                      predictedIncident={currentScenario.predictedIncident}
                      hindsightIncidents={hindsightIncidents}
                      onApproveAction={handleApproveAction}
                      onDismiss={() => setAlertDismissed(true)}
                    />
                  )}

                  {/* Predictive Horizon Scrubber (Interactive Time-Travel Projection) */}
                  <PredictiveHorizonScrubber
                    anomalyRisk={anomalyRisk}
                    currentScenario={currentScenario}
                    onPreemptAction={handleApproveAction}
                  />

                  {/* Per-Application Resource Usage Table */}
                  <ProcessTable
                    processes={processes}
                    onInspectProcess={(proc) => {
                      playTabClick();
                      setInspectedProcess(proc);
                    }}
                  />
                </div>
              </div>
            </div>

          </>
        )}

        {/* Tab 2: Hindsight Memory Bank */}
        {activeTab === 'hindsight' && (
          <HindsightBankView
            incidents={hindsightIncidents}
            hindsightStats={hindsightStats}
            processes={processes}
            onSelectIncident={(inc) => {
              playTabClick();
              setStatusNotification({
                type: 'info',
                message: `Focused Hindsight memory #${inc.incident_id || inc.id} (${inc.fact_type || inc.app})`
              });
            }}
          />
        )}

        {/* Tab 3: Learned Workstation Habits & Intelligence */}
        {activeTab === 'insights' && (
          <IntelligenceView />
        )}

        {/* Tab 4: Agent Architecture & Technical Deep Dive */}
        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Live AI Cognitive Stream Floating Terminal */}
      <CognitiveStream
        systemStatus={systemStatus}
        currentScenario={currentScenario}
        activeStepId={activeStepId}
      />

      {/* Human-in-the-Loop Optimization Workflow Modal */}
      {isOptimizationModalOpen && (
        <OptimizationModal
          predictedIncident={currentScenario.predictedIncident}
          currentMetrics={metrics}
          onCompleteOptimization={handleCompleteOptimization}
          onClose={() => setIsOptimizationModalOpen(false)}
        />
      )}

      {/* Deep Process Inspector Modal */}
      {inspectedProcess && (
        <ProcessInspectorModal
          process={inspectedProcess}
          onClose={() => setInspectedProcess(null)}
          onApplyAction={handleApplyProcessRemediation}
        />
      )}
    </div>
  );
}
