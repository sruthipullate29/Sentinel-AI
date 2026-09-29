// SentinelAI Mock Telemetry & Hindsight Knowledge Base

export const INITIAL_HINDSIGHT_INCIDENTS = [
  {
    id: 'INC-891',
    timestamp: '2026-09-21 14:32:10',
    app: 'Docker Engine',
    processName: 'buildkitd',
    pid: 4892,
    symptom: 'Multi-stage container build spawned runaway compiler threads causing CPU freeze',
    metricsBefore: { cpu: 95.4, ram: 86.2, disk: 184 },
    metricsAfter: { cpu: 28.1, ram: 42.0, disk: 12 },
    deltaCpu: -67.3,
    deltaRam: -44.2,
    rootCause: 'Unbounded layer cache compilation & missing cgroup CPU quota in docker-compose.override.yml',
    actionTaken: 'Paused non-essential worker container "worker-batch-3" & released build cache',
    approvedByUser: true,
    userNotes: 'Approved immediately. System recovered in 6 seconds with zero dropped connections.',
    effectivenessScore: 98,
    similarityKeywords: ['docker', 'buildkit', 'cpu spike', 'container', 'freeze']
  },
  {
    id: 'INC-742',
    timestamp: '2026-09-17 11:15:44',
    app: 'Node.js Runtime',
    processName: 'vite-dev-worker',
    pid: 14208,
    symptom: 'V8 heap memory leak in file-watching worker approaching 4GB limit',
    metricsBefore: { cpu: 78.0, ram: 93.8, disk: 45 },
    metricsAfter: { cpu: 14.5, ram: 36.2, disk: 8 },
    deltaCpu: -63.5,
    deltaRam: -57.6,
    rootCause: 'Circular AST cache references during hot module replacement reloads',
    actionTaken: 'Invoked v8.getHeapSnapshot() garbage collection trigger & warm worker restart',
    approvedByUser: true,
    userNotes: 'Warm restart preserved terminal session and freed 3.8GB memory.',
    effectivenessScore: 96,
    similarityKeywords: ['node', 'vite', 'memory leak', 'v8 heap', 'oom']
  },
  {
    id: 'INC-618',
    timestamp: '2026-09-12 16:48:02',
    app: 'PostgreSQL 16',
    processName: 'postgres: vacuum',
    pid: 2901,
    symptom: 'Concurrent index creation and autovacuum locking tables, saturating NVMe IOPS',
    metricsBefore: { cpu: 64.2, ram: 74.1, disk: 480 },
    metricsAfter: { cpu: 18.0, ram: 41.5, disk: 22 },
    deltaCpu: -46.2,
    deltaRam: -32.6,
    rootCause: 'Lock contention on large audit_logs partition during heavy writes',
    actionTaken: 'Temporarily throttled autovacuum cost limit & deferred uncommitted index batch',
    approvedByUser: true,
    userNotes: 'Saved database from stall. Applied throttle configuration permanently.',
    effectivenessScore: 94,
    similarityKeywords: ['postgres', 'disk io', 'autovacuum', 'lock contention', 'database']
  },
  {
    id: 'INC-502',
    timestamp: '2026-09-05 18:04:19',
    app: 'Google Chrome',
    processName: 'chrome.exe (GPU)',
    pid: 9214,
    symptom: '54 inactive tabs accumulating GPU canvas memory leak during Figma session',
    metricsBefore: { cpu: 42.0, ram: 89.5, disk: 15 },
    metricsAfter: { cpu: 11.2, ram: 52.1, disk: 4 },
    deltaCpu: -30.8,
    deltaRam: -37.4,
    rootCause: 'WebGL contexts retained by stale background dashboard tabs',
    actionTaken: 'Executed Chrome TabDiscard on 38 background tabs idle > 45 minutes',
    approvedByUser: true,
    userNotes: 'Great! Tabs seamlessly reloaded when clicked later. Freed ~4.5GB.',
    effectivenessScore: 97,
    similarityKeywords: ['chrome', 'browser', 'tab discard', 'gpu memory', 'webgl']
  }
];

export const SIMULATION_SCENARIOS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal System Idle',
    description: 'Workstation running standard development background services at healthy thresholds.',
    targetApp: null,
    metrics: { cpu: 18, ram: 42, disk: 14, net: 8, temp: 48 },
    anomalyRisk: 8,
    predictedIncident: null,
    processes: [
      { id: 1, name: 'code.exe (VS Code)', cpu: 4.8, ram: 850, disk: 2.1, status: 'normal', pid: 3102 },
      { id: 2, name: 'docker (dockerd)', cpu: 3.2, ram: 1420, disk: 4.5, status: 'normal', pid: 1204 },
      { id: 3, name: 'node (Next.js dev)', cpu: 2.5, ram: 620, disk: 1.2, status: 'normal', pid: 4811 },
      { id: 4, name: 'chrome.exe', cpu: 3.9, ram: 1850, disk: 3.0, status: 'normal', pid: 7890 },
      { id: 5, name: 'postgres (local)', cpu: 1.1, ram: 410, disk: 1.8, status: 'normal', pid: 9022 },
      { id: 6, name: 'slack.exe', cpu: 1.4, ram: 580, disk: 0.4, status: 'normal', pid: 6114 },
      { id: 7, name: 'System Kernel / OS', cpu: 1.1, ram: 2100, disk: 1.0, status: 'normal', pid: 4 }
    ]
  },
  DOCKER_SPIKE: {
    id: 'DOCKER_SPIKE',
    name: 'Docker Container CPU Spike & Build Runaway',
    description: 'Multi-stage Docker container build triggers unbounded worker threads, saturating all CPU cores.',
    targetApp: 'Docker Engine',
    culpritProcess: 'docker (buildkitd)',
    metrics: { cpu: 96, ram: 84, disk: 192, net: 45, temp: 88 },
    anomalyRisk: 94,
    predictedIncident: {
      title: 'Imminent Host CPU Throttling & Thermal Lock',
      timeToExhaustion: '42 seconds',
      culpritName: 'docker (buildkitd) #PID 4892',
      culpritShare: '72.4% CPU total',
      hindsightMatchId: 'INC-891',
      similarityScore: 95,
      hindsightExplanation: 'Looks similar to Incident #INC-891 ("Docker build runaway"). You previously approved pausing Docker container worker-batch-3 and flushing build cache, which reduced CPU usage by 67% in 6 seconds.',
      recommendedAction: 'Pause Docker container "worker-batch-3" & release temporary buildkit cache layer',
      expectedRecovery: 'CPU drop from 96% → ~29%, thermal stabilization in < 10s',
      safeExecutionSteps: [
        'Issuing SIGSTOP to docker container id: d7a1b89fc',
        'Evicting buildkit stale memory layer cache (4.2GB)',
        'Applying CPU cgroup quota limit: 50% to Docker daemon',
        'Verifying process thread scheduler stabilization'
      ]
    },
    processes: [
      { id: 2, name: 'docker (buildkitd)', cpu: 72.4, ram: 4600, disk: 145.2, status: 'culprit', pid: 4892 },
      { id: 1, name: 'code.exe (VS Code)', cpu: 6.2, ram: 920, disk: 8.5, status: 'warning', pid: 3102 },
      { id: 3, name: 'node (Next.js dev)', cpu: 4.8, ram: 710, disk: 12.1, status: 'normal', pid: 4811 },
      { id: 4, name: 'chrome.exe', cpu: 7.1, ram: 1980, disk: 14.0, status: 'normal', pid: 7890 },
      { id: 5, name: 'postgres (local)', cpu: 2.5, ram: 420, disk: 6.8, status: 'normal', pid: 9022 },
      { id: 7, name: 'System Kernel / OS', cpu: 3.0, ram: 2200, disk: 5.4, status: 'normal', pid: 4 }
    ]
  },
  NODE_LEAK: {
    id: 'NODE_LEAK',
    name: 'Node.js V8 Heap Memory Leak & GC Thrash',
    description: 'Vite/Node hot reload cache leak causing severe garbage collection thrashing and RAM exhaustion.',
    targetApp: 'Node.js Runtime',
    culpritProcess: 'node (vite-dev-worker)',
    metrics: { cpu: 82, ram: 94, disk: 68, net: 12, temp: 76 },
    anomalyRisk: 91,
    predictedIncident: {
      title: 'Imminent Node.js OOM Process Crash',
      timeToExhaustion: '1 minute 15 seconds',
      culpritName: 'node (vite-dev-worker) #PID 14208',
      culpritShare: '7.8GB RAM allocated (92% limit)',
      hindsightMatchId: 'INC-742',
      similarityScore: 92,
      hindsightExplanation: 'Matches pattern from Incident #INC-742 ("Vite worker AST leak"). You previously approved a warm GC sweep and dev worker recycle, recovering 57% RAM without dropping active localhost socket.',
      recommendedAction: 'Trigger V8 heap compaction and recycle Vite dev worker thread gracefully',
      expectedRecovery: 'RAM drop from 94% → ~38%, elimination of GC pause latency',
      safeExecutionSteps: [
        'Triggering explicit V8 isolate garbage collection cycle',
        'Flushing transformed module AST in-memory cache',
        'Warm recycling Node worker thread #14208',
        'Restoring client HMR websocket handshake'
      ]
    },
    processes: [
      { id: 3, name: 'node (vite-dev-worker)', cpu: 54.2, ram: 7850, disk: 42.1, status: 'culprit', pid: 14208 },
      { id: 1, name: 'code.exe (VS Code)', cpu: 9.4, ram: 1050, disk: 11.0, status: 'warning', pid: 3102 },
      { id: 4, name: 'chrome.exe', cpu: 8.1, ram: 2100, disk: 8.5, status: 'normal', pid: 7890 },
      { id: 2, name: 'docker (dockerd)', cpu: 4.1, ram: 1480, disk: 3.2, status: 'normal', pid: 1204 },
      { id: 7, name: 'System Kernel / OS', cpu: 6.2, ram: 2300, disk: 3.2, status: 'normal', pid: 4 }
    ]
  },
  POSTGRES_LOCK: {
    id: 'POSTGRES_LOCK',
    name: 'PostgreSQL Lock Contention & Disk I/O Storm',
    description: 'Unindexed batch transaction holding exclusive locks while autovacuum thrashes disk subsystem.',
    targetApp: 'PostgreSQL 16',
    culpritProcess: 'postgres: worker process',
    metrics: { cpu: 68, ram: 79, disk: 495, net: 28, temp: 79 },
    anomalyRisk: 88,
    predictedIncident: {
      title: 'Database Read Queue Starvation & Storage IOPS Bottleneck',
      timeToExhaustion: '2 minutes 30 seconds',
      culpritName: 'postgres: autovacuum & batch #PID 2901',
      culpritShare: '480 MB/s sustained disk writes',
      hindsightMatchId: 'INC-618',
      similarityScore: 89,
      hindsightExplanation: 'Corresponds with Incident #INC-618 ("Postgres autovacuum contention"). Previous resolution: Throttling autovacuum cost delay dropped IOPS from 480MB/s to 22MB/s and released row locks.',
      recommendedAction: 'Apply pg_cancel_backend() on stale idle transaction & throttle vacuum cost limit',
      expectedRecovery: 'Disk I/O down from 495 MB/s → ~24 MB/s, query latency normalized',
      safeExecutionSteps: [
        'Identifying blocking transaction PID 2901',
        'Executing pg_cancel_backend() on idle-in-transaction connection',
        'Lowering vacuum_cost_limit to 200 units',
        'Verifying disk queue depth returning to baseline (< 2.0)'
      ]
    },
    processes: [
      { id: 5, name: 'postgres: worker process', cpu: 38.6, ram: 3800, disk: 442.0, status: 'culprit', pid: 2901 },
      { id: 1, name: 'code.exe (VS Code)', cpu: 7.2, ram: 980, disk: 18.5, status: 'normal', pid: 3102 },
      { id: 3, name: 'node (Next.js dev)', cpu: 11.4, ram: 840, disk: 15.2, status: 'warning', pid: 4811 },
      { id: 4, name: 'chrome.exe', cpu: 5.5, ram: 1910, disk: 11.0, status: 'normal', pid: 7890 },
      { id: 7, name: 'System Kernel / OS', cpu: 5.3, ram: 2200, disk: 8.3, status: 'normal', pid: 4 }
    ]
  }
};

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
  host: 'sentinel-dev-workstation',
  cpuModel: 'AMD Ryzen 9 7950X (16 Cores, 32 Threads)',
  ramTotalGb: 32,
  diskType: 'PCIe 4.0 NVMe SSD (2.0 TB)',
  os: 'Ubuntu 24.04 LTS / WSL2 Virtualized Host',
  agentVersion: 'v2.4.0-self-learning'
};
