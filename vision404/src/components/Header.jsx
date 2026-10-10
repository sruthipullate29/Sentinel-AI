import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  BrainCircuit,
  Sparkles,
  Layers,
  RotateCcw,
  Volume2,
  VolumeX,
  Info,
  X,
  Cpu,
  HardDrive,
  Gauge,
  Thermometer,
  Globe,
  Code2,
  Terminal,
  FolderTree,
  Server,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { toggleAudio, isAudioEnabled, playTabClick } from '../utils/soundEffects';
import { apiFetch } from '../api';

export default function Header({
  activeTab,
  setActiveTab,
  systemStatus,
  anomalyRisk,
  onResetToBaseline,
  activeScenarioId,
  isScanlineMode,
  setIsScanlineMode,
  theme,
  onToggleTheme,
  metrics,
  processes,
  currentScenario,
  onCycleScenario,
  onInspectProcess
}) {
  const [audioActive, setAudioActive] = useState(isAudioEnabled());
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef(null);

  // Real-time keypress activity tracking
  const [lastKeyPressed, setLastKeyPressed] = useState({
    key: null,
    action: 'Ready — press any key',
    time: null
  });
  const [activeKeyPulse, setActiveKeyPulse] = useState(null);
  
  const [pushStatus, setPushStatus] = useState(() => {
    return (localStorage.getItem('vision404_push_active') === '1' || localStorage.getItem('sentinelai_push_active') === '1') ? 'Active ✔' : 'Enable Notifications';
  });
  const [testResult, setTestResult] = useState(null);

  const handleSubscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Web Push is not supported in this browser.');
        return;
      }

      // Request permission on explicit user action
      let perm = Notification.permission;
      if (perm === 'denied') {
        alert('Notifications are blocked. In Chrome: click the lock icon in the address bar → Notifications → Allow.');
        return;
      }
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm !== 'granted') {
        alert('Notification permission was not granted.');
        return;
      }

      setPushStatus('Subscribing...');
      const reg = await navigator.serviceWorker.ready;
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        alert('Missing VITE_VAPID_PUBLIC_KEY in vision404/.env');
        setPushStatus('Enable Notifications');
        return;
      }

      // Check for existing valid subscription first
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Reuse existing — just re-register with backend
        console.log('[Push] Reusing existing subscription');
      } else {
        // Create new subscription
        const padding = '='.repeat((4 - publicKey.length % 4) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
        console.log('[Push] New subscription created');
      }

      // Register with backend
      await apiFetch('/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON ? sub.toJSON() : sub)
      });

      localStorage.setItem('vision404_push_active', '1');
      setPushStatus('Active ✔');
      console.log('[Push] Subscribed and registered with backend');
    } catch (err) {
      console.error('[Push] Error:', err);
      alert('Error subscribing to push: ' + err.message);
      setPushStatus('Enable Notifications');
    }
  };

  const handleTestNotification = async () => {
    setTestResult('Testing...');
    // Request permission if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('[Push] Permission request error:', e);
      }
    }
    // 1. Direct browser notification test via Service Worker (primary on Chrome/Windows)
    console.log('[Notification] Current permission state:', Notification?.permission);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('Vision404 — Direct Browser Test', {
            body: 'Direct browser notification channel active. Click to focus Vision404.',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            requireInteraction: true,
            data: { url: '/' }
          });
          console.log('[Notification] Direct reg.showNotification dispatched successfully');
        } else {
          const n = new Notification('Vision404 — Direct Browser Test', {
            body: 'Direct browser notification channel active. Click to focus Vision404.',
            icon: '/favicon.svg',
            requireInteraction: true
          });
          n.onclick = () => { window.focus(); n.close(); };
          console.log('[Notification] Direct new Notification dispatched successfully');
        }
      } catch (err) {
        console.error('[Notification] Direct notification call failed:', err);
      }
    } else {
      console.warn('[Notification] Cannot show direct notification because permission is:', Notification?.permission);
    }
    // 2. Web Push via backend FCM dispatch (shows even with tab closed)
    try {
      const data = await apiFetch('/notifications/test', { method: 'POST' });
      const results = data.results || [];
      const allOk = results.length > 0 && results.every(r => !r.error && (r.status === 200 || r.status === 201));
      setTestResult(allOk ? '✓ Push Sent' : '⚠ Push Warning - check console');
      console.log('[Push] Backend test results (full object):', JSON.stringify(data, null, 2));
      results.forEach((r, idx) => {
        console.log(`[Push] Result #${idx + 1}: status=${r.status} error=${r.error || 'none'} endpoint=${r.endpoint}`);
      });
    } catch (e) {
      setTestResult('⚠ Backend Error');
      console.error('[Push] Backend test error:', e);
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setShowInfo(false);
      }
    };
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  // Real-time global keyboard listener for visual HUD feedback
  useEffect(() => {
    const handleKeyTracker = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const keyUpper = e.key.toUpperCase();
      let actionLabel = null;

      if (e.key === '1') actionLabel = 'Live Telemetry';
      else if (e.key === '2') actionLabel = 'Hindsight Memory';
      else if (e.key === '3') actionLabel = 'Intelligence Matrix';
      else if (e.key === '4') actionLabel = 'System Architecture';
      else if (keyUpper === 'S') actionLabel = 'Cycled Incident Scenario';
      else if (keyUpper === 'M') {
        actionLabel = !isAudioEnabled() ? 'Audio FX Enabled' : 'Audio FX Muted';
        setAudioActive(isAudioEnabled());
      }
      else if (keyUpper === 'R') actionLabel = 'Reset to Nominal Baseline';
      else if (keyUpper === 'T') actionLabel = `Theme Toggled (${theme === 'dark' ? 'Light' : 'Dark'})`;
      else if (keyUpper === 'I') {
        actionLabel = 'Toggled System Info HUD';
        setShowInfo(prev => !prev);
      }
      else if (e.key === 'Escape') {
        actionLabel = 'Closed Overlay';
        setShowInfo(false);
      }

      if (actionLabel) {
        setLastKeyPressed({
          key: keyUpper,
          action: actionLabel,
          time: new Date().toLocaleTimeString()
        });
        setActiveKeyPulse(keyUpper);
        setTimeout(() => setActiveKeyPulse(null), 750);
      }
    };

    window.addEventListener('keydown', handleKeyTracker);
    return () => window.removeEventListener('keydown', handleKeyTracker);
  }, [theme]);

  // Real-time active tabs and processes running on the user's computer system
  const getActiveSystemTabs = () => {
    const rawList = processes && processes.length > 0 ? processes : [
      { name: 'chrome.exe', pid: 17900, cpu: 14.2, ram: 668, status: 'running' },
      { name: 'Antigravity IDE.exe', pid: 37972, cpu: 8.5, ram: 663, status: 'running' },
      { name: 'explorer.exe', pid: 30260, cpu: 1.2, ram: 481, status: 'running' },
      { name: 'node.exe', pid: 13248, cpu: 2.1, ram: 88, status: 'running' },
      { name: 'python.exe', pid: 21484, cpu: 0.8, ram: 45, status: 'running' }
    ];

    const appMap = new Map();
    for (const proc of rawList) {
      let displayName = proc.name;
      let appType = 'System Process';
      let icon = 'terminal';

      const lower = (proc.name || '').toLowerCase();
      if (lower.includes('chrome')) {
        displayName = 'Google Chrome';
        appType = 'Browser (Active Tab: Vision404)';
        icon = 'globe';
      } else if (lower.includes('antigravity')) {
        displayName = 'Antigravity IDE';
        appType = 'Code Editor & Project Workspace';
        icon = 'code';
      } else if (lower.includes('node')) {
        displayName = 'Node.js Engine';
        appType = 'Vite Frontend Dev Server (:5173)';
        icon = 'server';
      } else if (lower.includes('python')) {
        displayName = 'Python Daemon';
        appType = 'FastAPI Telemetry Engine (:8000)';
        icon = 'server';
      } else if (lower.includes('explorer')) {
        displayName = 'Windows Explorer';
        appType = 'Desktop Shell & File Manager';
        icon = 'folder';
      }

      if (!appMap.has(displayName) || (proc.cpu || 0) > (appMap.get(displayName).cpu || 0)) {
        appMap.set(displayName, {
          ...proc,
          displayName,
          appType,
          icon
        });
      }
    }

    return Array.from(appMap.values()).slice(0, 5);
  };

  const activeSystemTabs = getActiveSystemTabs();

  const topProcess = processes && processes.length > 0
    ? [...processes].sort((a, b) => (b.cpu || 0) - (a.cpu || 0))[0]
    : null;

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
            <Shield size={18} color="#ffffff" strokeWidth={2.4} />
          </div>
          <div className="brand-title">
            Vision404
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => handleTabChange('live')}
            title="Press [1] to switch to Live Dashboard & Predictor"
          >
            <Activity size={14} />
            <span>Live Dashboard</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'hindsight' ? 'active' : ''}`}
            onClick={() => handleTabChange('hindsight')}
            title="Press [2] to switch to Hindsight Episodic Memory Bank"
          >
            <BrainCircuit size={14} />
            <span>Memory Bank</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleTabChange('insights')}
            title="Press [3] to switch to Learned Workstation Habits"
          >
            <Sparkles size={14} />
            <span>Learned Habits</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => handleTabChange('architecture')}
            title="Press [4] to switch to Agent Specs & Loop"
          >
            <Layers size={14} />
            <span>Specs & Loop</span>
          </button>
        </nav>

        {/* Status & Control Segments */}
        <div className="header-controls">
          {/* Segment A: Display & Sound */}
          <div className="header-control-group">
            <div className="theme-segmented-switch" role="group" aria-label="Theme Selection">
              <button
                type="button"
                className={`theme-segment-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  if (theme !== 'dark') onToggleTheme();
                }}
                title="Soft Dark Theme (Press T)"
              >
                <Moon size={12} />
                <span>Dark</span>
              </button>
              <button
                type="button"
                className={`theme-segment-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  if (theme !== 'light') onToggleTheme();
                }}
                title="Clean Light Theme (Press T)"
              >
                <Sun size={12} />
                <span>Light</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`btn-header-control ${audioActive ? 'audio-active' : ''}`}
              title={audioActive ? 'Sound Effects Enabled (Press M)' : 'Sound Effects Muted (Press M)'}
            >
              {audioActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{audioActive ? 'Audio ON' : 'Audio OFF'}</span>
            </button>
          </div>

          <div className="header-divider" />

          {/* Segment B: Push Notifications */}
          <div className="header-control-group">
            <button
              type="button"
              onClick={handleSubscribeToPush}
              className={`btn-header-control ${pushStatus.startsWith('Active') ? 'push-active' : ''}`}
              title="Browser Web Push Notifications"
            >
              <Bell size={13} />
              <span>{pushStatus}</span>
            </button>

            {pushStatus.startsWith('Active') && (
              <button
                type="button"
                onClick={handleTestNotification}
                className="btn-header-control"
                title="Send a real Windows desktop notification"
                style={{
                  color: testResult?.includes('✓') ? '#10b981' : testResult?.includes('⚠') ? '#f59e0b' : undefined,
                  borderColor: testResult?.includes('✓') ? '#10b981' : testResult?.includes('⚠') ? '#f59e0b' : undefined
                }}
              >
                <span>{testResult || '🔔 Test'}</span>
              </button>
            )}
          </div>

          <div className="header-divider" />

          {/* Segment C: System Health & HUD */}
          <div className="header-control-group">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={`btn-header-icon ${showInfo ? 'active' : ''}`}
              title="Real-Time System Information & Live Telemetry HUD (Press I)"
            >
              <Info size={14} />
            </button>

            <div className="status-badge-wrapper">
              {getStatusBadge()}
            </div>

            {activeScenarioId !== 'NORMAL' && (
              <button
                type="button"
                className="btn-header-control"
                onClick={onResetToBaseline}
                title="Reset system telemetry to normal idle baseline (Press R)"
                style={{ borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--rose-bright)' }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time System Info & Shortcuts Popover */}
      {showInfo && (
        <div
          ref={infoRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: '24px',
            marginTop: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: 'var(--shadow-xl, 0 16px 36px rgba(0, 0, 0, 0.35))',
            zIndex: 100,
            width: '370px',
            maxWidth: 'calc(100vw - 32px)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            backdropFilter: 'blur(16px)',
            color: 'var(--text-main)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '6px',
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <Info size={14} />
              </div>
              <span style={{ letterSpacing: '0.04em' }}>SYSTEM INFO & HUD</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                REAL-TIME
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title="Close Info HUD"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Active Tabs & Applications of the System */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                ACTIVE TABS OF THE SYSTEM ({activeSystemTabs.length})
              </span>
              <span style={{
                fontSize: '0.62rem',
                color: '#10b981',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ● REAL-TIME
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}>
              {activeSystemTabs.map((sysTab) => (
                <div
                  key={sysTab.pid || sysTab.displayName}
                  onClick={() => {
                    if (onInspectProcess) onInspectProcess(sysTab);
                  }}
                  title={`Click to inspect active system tab: ${sysTab.displayName} (PID ${sysTab.pid})`}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: onInspectProcess ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'var(--accent-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      background: 'var(--accent-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                      flexShrink: 0
                    }}>
                      {sysTab.icon === 'globe' ? <Globe size={14} /> :
                       sysTab.icon === 'code' ? <Code2 size={14} /> :
                       sysTab.icon === 'folder' ? <FolderTree size={14} /> :
                       sysTab.icon === 'server' ? <Server size={14} /> :
                       <Terminal size={14} />}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ fontWeight: 600, fontSize: '0.74rem', color: 'var(--text-main)' }}>
                          {sysTab.displayName}
                        </span>
                        <span style={{
                          fontSize: '0.58rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontWeight: 700
                        }}>
                          ● ACTIVE
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.64rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {sysTab.appType}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      color: (sysTab.cpu || 0) > 30 ? '#ef4444' : (sysTab.cpu || 0) > 10 ? '#f59e0b' : 'var(--accent-primary)'
                    }}>
                      {sysTab.cpu || 0}% CPU
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {typeof sysTab.ram === 'number' && sysTab.ram > 100 ? `${Math.round(sysTab.ram)} MB` : `${sysTab.ram}% RAM`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Interactive Keyboard Shortcuts HUD Section */}
          <div style={{
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '7px'
            }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }}></span>
                REAL-TIME SHORTCUTS
              </span>
              <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>
                {lastKeyPressed.key ? (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    LAST: [{lastKeyPressed.key}]
                  </span>
                ) : (
                  'PRESS KEY OR CLICK'
                )}
              </span>
            </div>

            {/* Live Keypress Broadcast Banner */}
            {lastKeyPressed.key && (
              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent-border)',
                borderRadius: '6px',
                padding: '4px 8px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.67rem'
              }}>
                <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <kbd style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--bg-dark)',
                    padding: '0px 5px',
                    borderRadius: '3px',
                    fontWeight: 800,
                    fontSize: '0.65rem'
                  }}>{lastKeyPressed.key}</kbd>
                  <span style={{ fontWeight: 600 }}>{lastKeyPressed.action}</span>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{lastKeyPressed.time}</span>
              </div>
            )}

            {/* Action shortcuts 2x2 grid [S], [M], [R], [T] */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '5px'
            }}>
                {/* [S] Cycle Scenario */}
                <button
                  type="button"
                  onClick={() => {
                    if (onCycleScenario) onCycleScenario();
                    setLastKeyPressed({
                      key: 'S',
                      action: 'Cycled Incident Scenario',
                      time: new Date().toLocaleTimeString()
                    });
                    setActiveKeyPulse('S');
                    setTimeout(() => setActiveKeyPulse(null), 750);
                  }}
                  title="Press [S] on keyboard to cycle through chaos scenarios in real time"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.67rem',
                    background: activeKeyPulse === 'S' ? 'rgba(245, 158, 11, 0.28)' : 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    border: `1px solid ${activeKeyPulse === 'S' ? '#f59e0b' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: activeKeyPulse === 'S' ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <kbd style={{ background: 'rgba(125,125,125,0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>S</kbd>
                    <span>Scenario</span>
                  </span>
                  <span style={{
                    fontSize: '0.61rem',
                    color: activeScenarioId !== 'NORMAL' ? '#f59e0b' : 'var(--text-muted)',
                    fontWeight: 600,
                    maxWidth: '85px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {currentScenario?.name?.split(' ')[0] || 'Nominal'}
                  </span>
                </button>

                {/* [M] Audio FX */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSound();
                    setLastKeyPressed({
                      key: 'M',
                      action: !audioActive ? 'Audio FX Enabled' : 'Audio FX Muted',
                      time: new Date().toLocaleTimeString()
                    });
                    setActiveKeyPulse('M');
                    setTimeout(() => setActiveKeyPulse(null), 750);
                  }}
                  title="Press [M] on keyboard to toggle sound effects in real time"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.67rem',
                    background: activeKeyPulse === 'M' ? 'rgba(16, 185, 129, 0.20)' : 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    border: `1px solid ${activeKeyPulse === 'M' ? '#10b981' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: activeKeyPulse === 'M' ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <kbd style={{ background: 'rgba(125,125,125,0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>M</kbd>
                    <span>Audio FX</span>
                  </span>
                  <span style={{
                    fontSize: '0.61rem',
                    color: audioActive ? '#10b981' : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {audioActive ? '● SOUND ON' : 'MUTED'}
                  </span>
                </button>

                {/* [R] Reset Baseline */}
                <button
                  type="button"
                  onClick={() => {
                    onResetToBaseline();
                    setLastKeyPressed({
                      key: 'R',
                      action: 'Reset to Nominal Baseline',
                      time: new Date().toLocaleTimeString()
                    });
                    setActiveKeyPulse('R');
                    setTimeout(() => setActiveKeyPulse(null), 750);
                  }}
                  title="Press [R] on keyboard to reset telemetry back to baseline"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.67rem',
                    background: activeKeyPulse === 'R' ? 'rgba(16, 185, 129, 0.28)' : 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    border: `1px solid ${activeKeyPulse === 'R' ? '#10b981' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: activeKeyPulse === 'R' ? '0 0 10px rgba(16, 185, 129, 0.45)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <kbd style={{ background: 'rgba(125,125,125,0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>R</kbd>
                    <span>Reset</span>
                  </span>
                  <span style={{
                    fontSize: '0.61rem',
                    color: activeScenarioId !== 'NORMAL' ? '#ef4444' : '#10b981',
                    fontWeight: 600
                  }}>
                    {activeScenarioId !== 'NORMAL' ? '● CAN RESET' : 'NOMINAL'}
                  </span>
                </button>

                {/* [T] Theme Mode */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setLastKeyPressed({
                      key: 'T',
                      action: `Switched Theme to ${theme === 'dark' ? 'Light' : 'Dark'}`,
                      time: new Date().toLocaleTimeString()
                    });
                    setActiveKeyPulse('T');
                    setTimeout(() => setActiveKeyPulse(null), 750);
                  }}
                  title="Press [T] on keyboard to switch Dark / Light theme in real time"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.67rem',
                    background: activeKeyPulse === 'T' ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    border: `1px solid ${activeKeyPulse === 'T' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: activeKeyPulse === 'T' ? '0 0 10px var(--accent-glow)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <kbd style={{ background: 'rgba(125,125,125,0.2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>T</kbd>
                    <span>Theme</span>
                  </span>
                  <span style={{
                    fontSize: '0.61rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {theme.toUpperCase()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
  );
}
