import { spawn } from 'node:child_process';

const child = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\Vanessa\\AppData\\Local\\Temp\\codex-edge-newgenbank',
  '--no-first-run',
  '--disable-gpu',
  'http://127.0.0.1:5173/entrar',
], { detached: true, stdio: 'ignore' });

child.unref();
