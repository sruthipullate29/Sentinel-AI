#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BANNER = `
\x1b[36m   ____             _   _            _    _    ___ \x1b[0m
\x1b[36m  / ___|  ___ _ __ | |_(_)_ __   ___| |  / \\  |_ _|\x1b[0m
\x1b[36m  \\___ \\ / _ \\ '_ \\| __| | '_ \\ / _ \\ | / _ \\  | | \x1b[0m
\x1b[36m   ___) |  __/ | | | |_| | | | |  __/ |/ ___ \\ | | \x1b[0m
\x1b[36m  |____/ \\___|_| |_|\\__|_|_| |_|\\___|_/_/   \\_\\___|\x1b[0m
\x1b[35m  Self-Learning System Reliability Agent\x1b[0m
\x1b[90m  Continuous Learning Loop: Monitor → Remember → Learn → Predict → Recommend → Act → Measure → Remember\x1b[0m
`;

console.log(BANNER);

// Check if user requested to initialize hindsight
const cliArgs = process.argv.slice(2);
if (cliArgs.includes('--init') || cliArgs.includes('init') || cliArgs.includes('init-hindsight') || cliArgs.includes('--init-hindsight')) {
  import('./init-hindsight.js');
} else {
  console.log(`\x1b[32m✔ Starting SentinelAI Global Server on 0.0.0.0 (Accessible across all network interfaces)...\x1b[0m\n`);

// Locate vite binary
const isWindows = process.platform === 'win32';
const viteBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  isWindows ? 'vite.cmd' : 'vite'
);

const args = ['--host', '0.0.0.0', '--port', '5173', '--open'];

const child = spawn(viteBin, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('\x1b[31m[SentinelAI Error] Failed to launch global agent:\x1b[0m', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

  process.on('SIGINT', () => {
    console.log('\n\x1b[33mShutting down SentinelAI agent gracefully...\x1b[0m');
    child.kill('SIGINT');
    process.exit(0);
  });
}

