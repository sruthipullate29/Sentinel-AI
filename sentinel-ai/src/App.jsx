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
  reportIncident, 
  approveIncidentAction 
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

  // Hindsight episodic memory store
  const [hindsightIncidents, setHindsightIncidents] = useState(INITIAL_HINDSIGHT_INCIDENTS);
  
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

  // Periodic Telemetry Fetching (Real Data)
  useEffect(() => {
    if (!isAutoSimulating) return;

    // Fetch initial memories
    fetchMemories().then(data => {
      if (data && data.length > 0) setHindsightIncidents(data);
    }).catch(e => console.error("Memory fetch error", e));

    const interval = setInterval(async () => {
      try {
        const data = await fetchTelemetry();
        
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
            const incData = await reportIncident(data);
            setCurrentScenario(prev => ({
              ...prev,
              id: 'DOCKER_SPIKE',
              predictedIncident: {
                id: incData.id,
                culpritName: incData.probable_cause,
                hindsightMatchId: incData.historical_matches?.length > 0 ? incData.historical_matches[0].id : null,
                hindsightExplanation: incData.historical_matches?.length > 0 ? "Matches pattern from a previous incident." : "No relevant historical experience found.",
                similarityScore: incData.historical_matches?.length > 0 ? 95 : 0
              }
            }));
            
            setTimeout(() => setActiveStepId('learn'), 500);
            setTimeout(() => setActiveStepId('predict'), 1000);
            setTimeout(() => setActiveStepId('recommend'), 1500);
          } catch(e) {
            console.error("Failed to report incident", e);
          }
        } else if (data.risk_score < 40 && systemStatus !== 'HEALTHY' && systemStatus !== 'OPTIMIZING' && systemStatus !== 'MEASURED') {
           // Auto recover if pressure drops naturally
           setSystemStatus('HEALTHY');
           setActiveStepId('monitor');
        }
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [systemStatus, alertDismissed, isAutoSimulating]);

  // Handle Injecting Scenario
  const handleSelectScenario = useCallback((scenarioKey) => {
    const scenario = SIMULATION_SCENARIOS[scenarioKey];
    setCurrentScenario(scenario);
    setMetrics({ ...scenario.metrics });
    setProcesses([...scenario.processes]);
    setAnomalyRisk(scenario.anomalyRisk);
    setAlertDismissed(false);

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

      setTimeout(() => {
        setActiveStepId('learn');
      }, 500);

      setTimeout(() => {
        setActiveStepId('predict');
      }, 1000);

      setTimeout(() => {
        setActiveStepId('recommend');
      }, 1500);
    }
  }, []);

  // Reset to Baseline
  const handleResetToBaseline = useCallback(() => {
    handleSelectScenario('NORMAL');
  }, [handleSelectScenario]);

  // Open Approval & Execution Workflow
  const handleApproveAction = () => {
    playTabClick();
    setActiveStepId('act');
    setSystemStatus('OPTIMIZING');
    setIsOptimizationModalOpen(true);
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
        const scenarioKeys = ['NORMAL', 'DOCKER_SPIKE', 'NODE_LEAK', 'POSTGRES_LOCK'];
        const currentIndex = scenarioKeys.indexOf(currentScenario.id);
        const nextKey = scenarioKeys[(currentIndex + 1) % scenarioKeys.length];
        handleSelectScenario(nextKey);
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetToBaseline();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      } else if (e.key === 'Escape') {
        setIsOptimizationModalOpen(false);
        setInspectedProcess(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScenario, handleSelectScenario, handleResetToBaseline]);

  // When optimization is completed & outcome verified
  const handleCompleteOptimization = async (newIncident, afterMetrics) => {
    setIsOptimizationModalOpen(false);
    
    try {
      // Actually approve the action on the backend
      const incidentId = currentScenario.predictedIncident?.id || newIncident.id;
      if (incidentId) {
        await approveIncidentAction(incidentId);
      }
      
      // Fetch latest memories to update UI
      const updatedMemories = await fetchMemories();
      if (updatedMemories) {
        setHindsightIncidents(updatedMemories);
      }
    } catch(e) {
      console.error("Failed to approve action", e);
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
    <div className={`app-container ${isScanlineMode ? 'scanline-active' : ''}`}>
      {/* Interactive Neural Synapse Background Canvas */}
      <NeuralCanvas systemStatus={systemStatus} anomalyRisk={anomalyRisk} />

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
            : 'rgba(124, 58, 237, 0.15)',
          borderBottom: `1px solid ${statusNotification.type === 'success' ? '#10b981' : '#7c3aed'}`,
          padding: '8px 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusNotification.type === 'success' ? (
              <CheckCircle2 size={16} color="#34d399" />
            ) : (
              <Info size={16} color="#c4b5fd" />
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
        {/* Tab 1: RiteFlow-Style Live Dashboard Landing */}
        {activeTab === 'live' && (
          <>
            {/* 1. RiteFlow Hero Section */}
            <section className="riteflow-hero">
              <div className="hero-pill-badge">
                <Sparkles size={13} color="#a78bfa" />
                <span>AI-Powered System Reliability</span>
              </div>
              <h1 className="hero-main-title">
                Smarter Workflows<br />
                Start with <span className="hero-brand-serif">SentinelAI</span>
              </h1>
              <p className="hero-subtext">
                Unlock the power of autonomous AI to intercept anomalies, boost uptime, and streamline your infrastructure—zero manual intervention needed. Designed for modern engineering teams.
              </p>
              <div className="hero-cta-group">
                <button 
                  type="button" 
                  className="hero-cta-primary"
                  onClick={() => handleSelectScenario('DOCKER_SPIKE')}
                >
                  <Play size={14} fill="#070714" />
                  Simulate Live Incident
                </button>
                <button 
                  type="button" 
                  className="hero-cta-secondary"
                  onClick={() => handleResetToBaseline()}
                >
                  <RotateCcw size={14} />
                  Restore Baseline
                </button>
              </div>
            </section>

            {/* 2. Elevated Mac OS Window Mockup */}
            <div className="mac-window-container">
              <div className="mac-window-glow" />
              <div className="mac-window-frame">
                {/* Mac Window Chrome */}
                <div className="mac-window-header">
                  <div style={{ minWidth: '120px' }} />
                  <div className="mac-address-pill">
                    <Lock size={12} color="#818cf8" />
                    <span>sentinel-ai.internal/dashboard</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'flex-end' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
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
                        className={`scenario-pill-btn ${currentScenario.id === 'DOCKER_SPIKE' ? 'active' : ''}`}
                        onClick={() => handleSelectScenario('DOCKER_SPIKE')}
                      >
                        🐳 Docker CPU Spike
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
                        className={`scenario-pill-btn ${currentScenario.id === 'POSTGRES_LOCK' ? 'active' : ''}`}
                        onClick={() => handleSelectScenario('POSTGRES_LOCK')}
                      >
                        🐘 Postgres Disk I/O Lock
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
            onSelectIncident={(inc) => {
              playTabClick();
              setStatusNotification({
                type: 'info',
                message: `Focused incident memory #${inc.id} (${inc.app})`
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
