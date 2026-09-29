import React, { useState } from 'react';
import { 
  Shield, 
  Activity, 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toggleAudio, isAudioEnabled, playTabClick } from '../utils/soundEffects';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  systemStatus, 
  anomalyRisk, 
  onResetToBaseline,
  activeScenarioId,
  isScanlineMode,
  setIsScanlineMode
}) {
  const [audioActive, setAudioActive] = useState(isAudioEnabled());
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleToggleSound = () => {
    const newState = toggleAudio();
    setAudioActive(newState);
  };

  const handleTabChange = (tab) => {
    playTabClick();
    setActiveTab(tab);
  };

  const getStatusBadge = () => {
    if (systemStatus === 'OPTIMIZING') {
      return (
        <span className="badge badge-amber">
          <span className="pulse-dot" style={{ background: '#f59e0b' }}></span>
          OPTIMIZING IN PROGRESS
        </span>
      );
    }
    if (systemStatus === 'MEASURED') {
      return (
        <span className="badge badge-emerald">
          <CheckCircle2 size={12} />
          OUTCOME VERIFIED & SAVED
        </span>
      );
    }
    if (anomalyRisk > 60) {
      return (
        <span className="badge badge-rose">
          <span className="pulse-dot" style={{ background: '#f43f5e' }}></span>
          PRE-ANOMALY DETECTED
        </span>
      );
    }
    return (
      <span className="badge badge-emerald">
        <span className="pulse-dot" style={{ background: '#10b981' }}></span>
        MONITORING • HEALTHY
      </span>
    );
  };

  return (
    <header className="header-wrapper" style={{ position: 'relative', zIndex: 50 }}>
      <div className="header-content">
        {/* Brand identity */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Shield size={20} color="#ffffff" strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">
              SentinelAI
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>
                Self-Learning
              </span>
            </div>
            <div className="brand-subtitle">
              System Reliability Agent • Hindsight Memory Core
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => handleTabChange('live')}
            title="Press [1] to switch to Live Dashboard"
          >
            <Activity size={15} />
            Live Dashboard & Predictor
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'hindsight' ? 'active' : ''}`}
            onClick={() => handleTabChange('hindsight')}
            title="Press [2] to switch to Hindsight Bank"
          >
            <BrainCircuit size={15} />
            Hindsight Memory Bank
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleTabChange('insights')}
            title="Press [3] to switch to Workstation Habits"
          >
            <Sparkles size={15} />
            Learned Workstation Habits
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => handleTabChange('architecture')}
            title="Press [4] to switch to Architecture"
          >
            <Layers size={15} />
            Agent Specs & Loop
          </button>
        </nav>

        {/* Status & Control */}
        <div className="header-controls">
          {/* Cyber audio FX toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`btn-secondary-action ${audioActive ? 'audio-active' : ''}`}
            title={audioActive ? 'Audio FX Enabled' : 'Enable Audio FX'}
            style={{
              padding: '6px 10px',
              fontSize: '0.76rem',
              color: audioActive ? 'var(--purple-bright)' : 'var(--text-muted)',
              borderColor: audioActive ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-subtle)'
            }}
          >
            {audioActive ? <Volume2 size={14} color="#a78bfa" /> : <VolumeX size={14} />}
            <span style={{ fontSize: '0.72rem' }}>{audioActive ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* CRT scanline mode toggle */}
          <button
            type="button"
            onClick={() => setIsScanlineMode(!isScanlineMode)}
            className="btn-secondary-action"
            title="Toggle Retro-Cyber HUD Scanline Effect"
            style={{
              padding: '6px 10px',
              color: isScanlineMode ? '#a78bfa' : 'var(--text-muted)',
              borderColor: isScanlineMode ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-subtle)'
            }}
          >
            <Tv size={14} />
          </button>

          {/* Keyboard shortcut guide */}
          <button
            type="button"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="btn-secondary-action"
            title="Keyboard shortcuts guide"
            style={{ padding: '6px 8px' }}
          >
            <HelpCircle size={14} />
          </button>

          {getStatusBadge()}

          {activeScenarioId !== 'NORMAL' ? (
            <button 
              type="button"
              className="btn-secondary-action"
              onClick={onResetToBaseline}
              title="Reset system telemetry to normal idle baseline"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} />
              Reset Baseline
            </button>
          ) : (
            <button
              type="button"
              className="header-pill-cta"
              onClick={() => handleTabChange('hindsight')}
              title="Open Episodic Memory Bank"
            >
              <Sparkles size={13} />
              Memory Bank
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Popover */}
      {showShortcuts && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '24px',
          marginTop: '8px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 100,
          width: '260px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.74rem',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>KEYBOARD SHORTCUTS</span>
            <span style={{ color: '#22d3ee' }}>[HUD]</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Tabs 1 – 4</span>
              <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>1, 2, 3, 4</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Cycle Scenario</span>
              <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>S</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Toggle Audio</span>
              <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>M</kbd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Reset Baseline</span>
              <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>R</kbd>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
