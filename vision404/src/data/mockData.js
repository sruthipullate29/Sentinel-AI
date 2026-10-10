// Vision404 Real User Computer Telemetry & Hindsight Knowledge Base
// Workstation: Windows 11 Home 64-bit | 12th Gen Intel Core i7-12700H (14C/20T) | 16 GB RAM

export const INITIAL_HINDSIGHT_INCIDENTS = [
  {
    id: 'INC-891',
    timestamp: '2026-09-28 14:32:10',
    app: 'Google Chrome',
    processName: 'chrome.exe (GPU Sandbox)',
    pid: 12824,
    symptom: '54 inactive tabs accumulating GPU canvas and WebGL memory leak during browsing session',
    metricsBefore: { cpu: 38.4, ram: 88.5, disk: 14 },
    metricsAfter: { cpu: 12.1, ram: 54.2, disk: 4 },
    deltaCpu: -26.3,
    deltaRam: -34.3,
    rootCause: 'Retained WebGL contexts & uncollected background tab heap during Figma and dashboard sessions',
    actionTaken: 'Executed Chrome TabDiscard memory reclamation on 36 background tabs idle > 30 minutes',
    approvedByUser: true,
    userNotes: 'Approved immediately. Reclaimed 3.8GB RAM across browser processes with zero tab crashes.',
    effectivenessScore: 98,
    similarityKeywords: ['chrome', 'browser', 'webgl', 'memory leak', 'tab discard', 'gpu']
  },
  {
    id: 'INC-742',
    timestamp: '2026-09-24 11:15:44',
    app: 'Node.js Runtime',
    processName: 'node.exe (Vite Dev Server)',
    pid: 14208,
    symptom: 'V8 heap memory leak in file-watching worker during rapid hot module replacement reloads',
    metricsBefore: { cpu: 74.0, ram: 91.8, disk: 42 },
    metricsAfter: { cpu: 14.2, ram: 38.6, disk: 8 },
    deltaCpu: -59.8,
    deltaRam: -53.2,
    rootCause: 'Circular AST module cache references in Vite HMR watcher on Windows NTFS filesystem',
    actionTaken: 'Invoked v8.getHeapSnapshot() garbage collection sweep & warm worker thread recycle',
    approvedByUser: true,
    userNotes: 'Warm restart preserved terminal session and freed 3.4GB RAM on Windows 11 host.',
    effectivenessScore: 96,
    similarityKeywords: ['node', 'vite', 'memory leak', 'v8 heap', 'hmr', 'bundler']
  },
  {
    id: 'INC-618',
    timestamp: '2026-09-20 16:48:02',
    app: 'Antigravity IDE',
    processName: 'Antigravity IDE.exe (LSP Server)',
    pid: 37972,
    symptom: 'TypeScript Language Server AST indexing worker thread saturation locking CPU cores',
    metricsBefore: { cpu: 88.2, ram: 84.1, disk: 110 },
    metricsAfter: { cpu: 16.0, ram: 44.5, disk: 12 },
    deltaCpu: -72.2,
    deltaRam: -39.6,
    rootCause: 'Recursive file watcher scanning deep node_modules and build artifacts without ignore filter',
    actionTaken: 'Applied watcher exclude glob rules & throttled TypeScript language server thread priority',
    approvedByUser: true,
    userNotes: 'CPU dropped to 16% in 4 seconds. IDE responsiveness and cursor typing latency fully restored.',
    effectivenessScore: 97,
    similarityKeywords: ['antigravity', 'ide', 'cpu spike', 'lsp server', 'file watcher', 'typescript']
  },
  {
    id: 'INC-502',
    timestamp: '2026-09-15 18:04:19',
    app: 'Microsoft Edge',
    processName: 'msedge.exe (WebView2 Host)',
    pid: 31868,
    symptom: 'Background WebView2 host processes retaining hardware acceleration GPU lock',
    metricsBefore: { cpu: 46.5, ram: 82.3, disk: 28 },
    metricsAfter: { cpu: 10.4, ram: 48.0, disk: 5 },
    deltaCpu: -36.1,
    deltaRam: -34.3,
    rootCause: 'Orphaned background WebView2 sub-processes persisting after web view page unload',
    actionTaken: 'Gracefully terminated idle WebView2 child instances and flushed DirectX shader cache',
    approvedByUser: true,
    userNotes: 'Freed 2.6GB GPU shared memory without interrupting active browser tabs.',
    effectivenessScore: 95,
    similarityKeywords: ['edge', 'webview2', 'gpu acceleration', 'hardware lock', 'memory leak']
  },
  {
    id: 'INC-439',
    timestamp: '2026-09-10 10:22:15',
    app: 'Windows Explorer',
    processName: 'explorer.exe (Shell Host)',
    pid: 30260,
    symptom: 'Shell thumbnail cache & Windows search indexer saturating NVMe SSD throughput',
    metricsBefore: { cpu: 52.0, ram: 76.4, disk: 380 },
    metricsAfter: { cpu: 9.8, ram: 42.1, disk: 15 },
    deltaCpu: -42.2,
    deltaRam: -34.3,
    rootCause: 'Concurrent thumbnail generation and MFT change journal scan on large project workspace',
    actionTaken: 'Temporarily paused Windows search indexer queue & compacted shell icon cache',
    approvedByUser: true,
    userNotes: 'NVMe throughput normalized from 380MB/s to 15MB/s immediately.',
    effectivenessScore: 94,
    similarityKeywords: ['explorer', 'windows shell', 'disk io', 'thumbnail cache', 'nvme']
  },
  {
    id: 'INC-318',
    timestamp: '2026-09-02 15:40:08',
    app: 'OneDrive Sync',
    processName: 'OneDrive.exe (File Sync)',
    pid: 27128,
    symptom: 'Continuous file watcher delta scan on active node_modules creating high CPU thrash',
    metricsBefore: { cpu: 44.0, ram: 68.2, disk: 120 },
    metricsAfter: { cpu: 5.2, ram: 34.0, disk: 8 },
    deltaCpu: -38.8,
    deltaRam: -34.2,
    rootCause: 'Unfiltered cloud synchronization attempting to index 40,000 generated dependency files',
    actionTaken: 'Added .gitignore and node_modules sync exclusions & paused OneDrive during active dev',
    approvedByUser: true,
    userNotes: 'Eliminated sync churn. Workstation idle CPU stabilized below 8%.',
    effectivenessScore: 99,
    similarityKeywords: ['onedrive', 'cloud sync', 'file watcher', 'cpu thrash', 'delta sync']
  }
];

export const SIMULATION_SCENARIOS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal System Idle (Windows 11)',
    description: 'Workstation running standard development background services at healthy thresholds on 12th Gen Intel Core i7.',
    targetApp: null,
    metrics: { cpu: 8.5, ram: 76.2, disk: 26.8, net: 4, temp: 46 },
    anomalyRisk: 12,
    predictedIncident: null,
    processes: [
      { id: 1, name: 'Antigravity IDE.exe', cpu: 14.5, ram: 722, disk: 4.2, status: 'normal', pid: 37972 },
      { id: 2, name: 'chrome.exe (Google Chrome)', cpu: 6.8, ram: 580, disk: 2.1, status: 'normal', pid: 12824 },
      { id: 3, name: 'node.exe (Vite Dev Server)', cpu: 2.4, ram: 310, disk: 1.5, status: 'normal', pid: 14208 },
      { id: 4, name: 'msedge.exe (Microsoft Edge)', cpu: 3.2, ram: 280, disk: 1.2, status: 'normal', pid: 31868 },
      { id: 5, name: 'explorer.exe (Windows Shell)', cpu: 1.8, ram: 265, disk: 0.8, status: 'normal', pid: 30260 },
      { id: 6, name: 'OneDrive.exe (Cloud Sync)', cpu: 1.2, ram: 150, disk: 0.4, status: 'normal', pid: 27128 },
      { id: 7, name: 'dwm.exe (Desktop Compositor)', cpu: 4.1, ram: 114, disk: 0.2, status: 'normal', pid: 34064 },
      { id: 8, name: 'System Kernel / OS', cpu: 2.0, ram: 885, disk: 1.0, status: 'normal', pid: 4 }
    ]
  },
  CHROME_SPIKE: {
    id: 'CHROME_SPIKE',
    name: 'Google Chrome GPU Canvas & Tab Memory Leak',
    description: '54 inactive background browser tabs accumulating GPU memory and retained WebGL canvas contexts.',
    targetApp: 'Google Chrome',
    culpritProcess: 'chrome.exe (GPU Sandbox)',
    metrics: { cpu: 42, ram: 92, disk: 18, net: 22, temp: 68 },
    anomalyRisk: 86,
    predictedIncident: {
      title: 'Imminent Browser GPU Sandbox Crash & RAM Exhaustion',
      timeToExhaustion: '1 minute 20 seconds',
      culpritName: 'chrome.exe (GPU Sandbox) #PID 12824',
      culpritShare: '4.8GB RAM allocated (92% total system memory)',
      hindsightMatchId: 'INC-891',
      similarityScore: 96,
      hindsightExplanation: 'Matches pattern from Incident #INC-891 ("Chrome multi-tab GPU memory leak"). You previously approved Chrome TabDiscard on 36 background tabs, reclaiming 3.8GB RAM with zero tab crashes.',
      recommendedAction: 'Execute Chrome TabDiscard on 36 inactive background tabs and flush GPU WebGL context buffer',
      expectedRecovery: 'RAM drop from 92% → ~54%, immediate stabilization of Windows desktop compositor',
      safeExecutionSteps: [
        'Querying Chrome DevTools protocol for inactive tab session IDs',
        'Executing non-destructive chrome.tabs.discard() on tabs idle > 30 mins',
        'Flushing retained DirectX / WebGL GPU shader cache',
        'Verifying Windows VirtualAlloc private working set compaction'
      ]
    },
    processes: [
      { id: 2, name: 'chrome.exe (GPU Sandbox)', cpu: 24.8, ram: 4850, disk: 18.2, status: 'culprit', pid: 12824 },
      { id: 1, name: 'Antigravity IDE.exe', cpu: 12.2, ram: 820, disk: 5.4, status: 'warning', pid: 37972 },
      { id: 3, name: 'node.exe (Vite Dev Server)', cpu: 3.4, ram: 320, disk: 2.1, status: 'normal', pid: 14208 },
      { id: 4, name: 'msedge.exe (Microsoft Edge)', cpu: 3.1, ram: 280, disk: 1.2, status: 'normal', pid: 31868 },
      { id: 5, name: 'explorer.exe (Windows Shell)', cpu: 2.0, ram: 265, disk: 0.8, status: 'normal', pid: 30260 },
      { id: 8, name: 'System Kernel / OS', cpu: 3.5, ram: 950, disk: 1.5, status: 'normal', pid: 4 }
    ]
  },
  NODE_LEAK: {
    id: 'NODE_LEAK',
    name: 'Node.js V8 Heap Memory Leak & Vite Worker Thrash',
    description: 'Vite hot reload AST module cache leak causing severe V8 garbage collection thrashing on Windows.',
    targetApp: 'Node.js Runtime',
    culpritProcess: 'node.exe (Vite Dev Server)',
    metrics: { cpu: 78, ram: 94, disk: 56, net: 14, temp: 76 },
    anomalyRisk: 92,
    predictedIncident: {
      title: 'Imminent Node.js OOM Process Crash',
      timeToExhaustion: '55 seconds',
      culpritName: 'node.exe (Vite Dev Server) #PID 14208',
      culpritShare: '4.2GB RAM allocated (approaching 32-bit/64-bit V8 max heap)',
      hindsightMatchId: 'INC-742',
      similarityScore: 94,
      hindsightExplanation: 'Matches pattern from Incident #INC-742 ("Vite worker AST leak"). You previously approved a warm GC sweep and dev worker recycle, recovering 53% RAM without dropping active localhost socket.',
      recommendedAction: 'Trigger V8 heap compaction and recycle Vite dev worker thread gracefully',
      expectedRecovery: 'RAM drop from 94% → ~38%, elimination of GC pause latency',
      safeExecutionSteps: [
        'Triggering explicit V8 isolate garbage collection cycle',
        'Flushing transformed module AST in-memory cache',
        'Warm recycling Node worker thread #14208',
        'Restoring client HMR websocket handshake on port 5173'
      ]
    },
    processes: [
      { id: 3, name: 'node.exe (Vite Dev Server)', cpu: 58.4, ram: 4250, disk: 38.4, status: 'culprit', pid: 14208 },
      { id: 1, name: 'Antigravity IDE.exe', cpu: 14.5, ram: 780, disk: 6.2, status: 'warning', pid: 37972 },
      { id: 2, name: 'chrome.exe (Google Chrome)', cpu: 6.2, ram: 590, disk: 3.1, status: 'normal', pid: 12824 },
      { id: 5, name: 'explorer.exe (Windows Shell)', cpu: 1.8, ram: 265, disk: 0.8, status: 'normal', pid: 30260 },
      { id: 8, name: 'System Kernel / OS', cpu: 4.2, ram: 890, disk: 1.8, status: 'normal', pid: 4 }
    ]
  },
  IDE_SPIKE: {
    id: 'IDE_SPIKE',
    name: 'Antigravity IDE TypeScript LSP Indexer CPU Burst',
    description: 'Recursive file watcher scanning unindexed workspace directories saturating all 14 CPU cores.',
    targetApp: 'Antigravity IDE',
    culpritProcess: 'Antigravity IDE.exe (LSP Server)',
    metrics: { cpu: 89, ram: 84, disk: 115, net: 10, temp: 82 },
    anomalyRisk: 95,
    predictedIncident: {
      title: 'Host CPU Saturation & Thermal Throttling on 14 Cores',
      timeToExhaustion: '40 seconds',
      culpritName: 'Antigravity IDE.exe (LSP Server) #PID 37972',
      culpritShare: '76.2% CPU total across worker threads',
      hindsightMatchId: 'INC-618',
      similarityScore: 97,
      hindsightExplanation: 'Corresponds with Incident #INC-618 ("Antigravity IDE LSP CPU spike"). Previous resolution: Injecting glob exclude rules on node_modules and throttling LSP process priority dropped CPU by 72% in 4s.',
      recommendedAction: 'Inject glob exclude rules into IDE workspace watcher and throttle TypeScript language server thread priority',
      expectedRecovery: 'CPU drop from 89% → ~16%, immediate cooling and zero dropped keystrokes',
      safeExecutionSteps: [
        'Injecting node_modules, .git, and dist exclusions into IDE watcher configuration',
        'Lowering process priority of TypeScript TSServer child PID to BelowNormal',
        'Evicting unreferenced AST symbol table cache',
        'Verifying thread scheduler load distribution across P-cores and E-cores'
      ]
    },
    processes: [
      { id: 1, name: 'Antigravity IDE.exe (LSP Server)', cpu: 76.2, ram: 1650, disk: 88.5, status: 'culprit', pid: 37972 },
      { id: 2, name: 'chrome.exe (Google Chrome)', cpu: 7.4, ram: 610, disk: 4.2, status: 'normal', pid: 12824 },
      { id: 3, name: 'node.exe (Vite Dev Server)', cpu: 4.8, ram: 340, disk: 3.1, status: 'normal', pid: 14208 },
      { id: 5, name: 'explorer.exe (Windows Shell)', cpu: 2.1, ram: 265, disk: 1.2, status: 'normal', pid: 30260 },
      { id: 8, name: 'System Kernel / OS', cpu: 3.8, ram: 890, disk: 2.0, status: 'normal', pid: 4 }
    ]
  }
};

// Compatibility aliases for legacy scenario identifiers
SIMULATION_SCENARIOS.DOCKER_SPIKE = SIMULATION_SCENARIOS.CHROME_SPIKE;
SIMULATION_SCENARIOS.POSTGRES_LOCK = SIMULATION_SCENARIOS.IDE_SPIKE;


export const LEARNING_LOOP_STEPS = [
  { id: 'monitor', label: 'Monitor', icon: 'Activity', desc: 'Continuously polling hardware sensors & per-process telemetry' },
  { id: 'remember', label: 'Remember', icon: 'Database', desc: 'Querying Hindsight vector memory for historical fingerprints' },
  { id: 'learn', label: 'Learn', icon: 'Brain', desc: 'Synthesizing application behavioral baselines & failure signatures' },
  { id: 'predict', label: 'Predict', icon: 'TrendingUp', desc: 'Forecasting resource saturation before host OS stability fails' },
  { id: 'recommend', label: 'Recommend', icon: 'Sparkles', desc: 'Synthesizing safe, proven remediation with user approval' },
  { id: 'act', label: 'Act', icon: 'ShieldCheck', desc: 'Executing verified optimization commands in non-destructive sandbox' },
  { id: 'measure', label: 'Measure', icon: 'Gauge', desc: 'Comparing before/after delta to validate exact recovery performance' },
  { id: 'remember_outcome', label: 'Remember', icon: 'CheckCircle2', desc: 'Committing outcome and human feedback back to Hindsight' }
];

export const SYSTEM_SPECS = {
  host: 'DESKTOP-SRUTHI (Windows Workstation)',
  cpuModel: '12th Gen Intel(R) Core(TM) i7-12700H (14 Cores, 20 Threads)',
  ramTotalGb: 16,
  diskType: '1TB PCIe NVMe SSD (C:)',
  os: 'Microsoft Windows 11 Home 64-bit',
  agentVersion: 'v2.4.0-self-learning'
};
