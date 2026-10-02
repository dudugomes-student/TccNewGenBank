import { mkdir, writeFile } from 'node:fs/promises';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = targets.find((item) => item.url.includes('127.0.0.1:5173'));
if (!target) throw new Error('Target do vertical slice não encontrado.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const browserErrors = [];
let sequence = 0;

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') browserErrors.push(message.params.entry.text);
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const screenshot = async (name) => {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const path = `.codex-validation/${name}.png`;
  await writeFile(path, Buffer.from(result.data, 'base64'));
  return path;
};
const probe = () => evaluate(`(() => {
  const card = document.querySelector('.slice-card .newgen-card');
  const form = document.querySelector('.login-panel--mineral');
  const core = document.querySelector('.dashboard-core');
  const movement = document.querySelector('.movement-peek');
  const rect = (node) => node ? Object.fromEntries(['x','y','width','height','top','bottom'].map((key) => [key, Math.round(node.getBoundingClientRect()[key])])) : null;
  return {
    path: location.pathname,
    theme: document.documentElement.dataset.theme,
    accent: document.documentElement.dataset.accent,
    viewport: [innerWidth, innerHeight],
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    documentHeight: document.documentElement.scrollHeight,
    card: rect(card), form: rect(form), core: rect(core), movement: rect(movement),
    cardViewName: card ? getComputedStyle(card).viewTransitionName : null,
    mineralViewName: getComputedStyle(document.querySelector('.mineral-backdrop')).viewTransitionName,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    imageLoaded: performance.getEntriesByType('resource').some((entry) => entry.name.includes('ngb-mineral-base')),
  };
})()`);

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await mkdir('.codex-validation', { recursive: true });

const navigate = async (path) => {
  await send('Page.navigate', { url: `http://127.0.0.1:5173${path}` });
  await delay(650);
};

const report = { desktop: {}, mobile390: {}, mobile320: {}, reduced: {}, browserErrors };

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await navigate('/entrar');
await evaluate(`sessionStorage.clear(); localStorage.setItem('ngb2:theme','dark'); localStorage.setItem('ngb2:accent','green'); location.reload(); true`);
await delay(800);
report.desktop.loginGreen = await probe();
await screenshot('slice-01-login-1440-green');
await evaluate(`document.querySelector('input[value="violet"]').click(); true`);
await delay(220);
report.desktop.loginViolet = await probe();
await screenshot('slice-02-login-1440-violet');
await evaluate(`document.querySelector('.login-form').requestSubmit(); true`);
await delay(260);
report.desktop.transitionPress = await probe();
await screenshot('slice-03-transition-press');
await delay(520);
report.desktop.transitionTraverse = await probe();
await screenshot('slice-04-transition-traverse');
await delay(1050);
report.desktop.dashboardViolet = await probe();
await screenshot('slice-05-dashboard-1440-violet');
await evaluate(`document.querySelector('input[value="green"]').click(); true`);
await delay(180);
report.desktop.dashboardGreen = await probe();
await screenshot('slice-06-dashboard-1440-green');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await navigate('/entrar');
await evaluate(`sessionStorage.clear(); localStorage.setItem('ngb2:theme','dark'); localStorage.setItem('ngb2:accent','violet'); location.reload(); true`);
await delay(800);
report.mobile390.login = await probe();
await screenshot('slice-07-login-390-violet');
await evaluate(`sessionStorage.setItem('ngb2:session','active'); true`);
await navigate('/dashboard');
await delay(850);
report.mobile390.dashboard = await probe();
await screenshot('slice-08-dashboard-390-violet');

await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
await navigate('/entrar');
await evaluate(`sessionStorage.clear(); localStorage.setItem('ngb2:theme','dark'); localStorage.setItem('ngb2:accent','green'); location.reload(); true`);
await delay(800);
report.mobile320.login = await probe();
await screenshot('slice-09-login-320-green');
await evaluate(`sessionStorage.setItem('ngb2:session','active'); true`);
await navigate('/dashboard');
await delay(850);
report.mobile320.dashboard = await probe();
await screenshot('slice-10-dashboard-320-green');

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await navigate('/entrar');
await evaluate(`sessionStorage.clear(); true`);
report.reduced.login = await probe();
await evaluate(`document.querySelector('.login-form').requestSubmit(); true`);
await delay(150);
report.reduced.dashboard = await probe();

console.log(JSON.stringify(report, null, 2));
socket.close();
