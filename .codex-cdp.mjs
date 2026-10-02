import { mkdir, writeFile } from 'node:fs/promises';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = targets.find((item) => item.url.includes('127.0.0.1:5173'));
if (!target) throw new Error('Target do NewGenBank nao encontrado.');

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

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Page.reload', { ignoreCache: true });
await delay(700);
await mkdir('.codex-validation', { recursive: true });

const cardState = () => evaluate(`(() => {
  const card = document.querySelector('.card-object-control .newgen-card');
  const rect = card.getBoundingClientRect();
  const style = getComputedStyle(card);
  return {
    x: rect.x, y: rect.y, width: rect.width, height: rect.height,
    rotateX: parseFloat(style.getPropertyValue('--card-rotate-x')),
    rotateY: parseFloat(style.getPropertyValue('--card-rotate-y')),
    lightX: style.getPropertyValue('--card-light-x').trim(),
    shadowScale: style.getPropertyValue('--card-shadow-scale').trim(),
    className: card.className,
    bodyOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    flippedLabel: document.querySelector('.card-object-actions button')?.textContent.trim(),
  };
})()`);
const screenshot = async (name) => {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(`.codex-validation/${name}.png`, Buffer.from(result.data, 'base64'));
};
const moveMouse = (x, y, buttons = 0) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons });
const pressMouse = (x, y) => send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
const releaseMouse = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
const dragMouse = async (fromX, fromY, toX, toY, steps, stepDelay) => {
  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    await moveMouse(fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress, 1);
    await delay(stepDelay);
  }
};

await delay(500);
if (await evaluate(`location.pathname === '/entrar'`)) {
  await evaluate(`document.querySelector('.login-form').requestSubmit(); true`);
  await delay(450);
  await evaluate(`location.href = '/cartao'; true`);
  await delay(650);
}
const initialProbe = await evaluate(`({ url: location.href, title: document.title, body: document.body.innerText.slice(0, 1000), html: document.body.innerHTML.slice(0, 1000), hasCard: Boolean(document.querySelector('.card-stage')) })`);
if (!initialProbe.hasCard) {
  console.log(JSON.stringify({ ...initialProbe, browserErrors }, null, 2));
  socket.close();
  process.exit(2);
}
await evaluate(`document.querySelector('.card-stage').scrollIntoView({ block: 'center' }); true`);
await delay(350);
const report = { desktop: {}, touch: {}, reduced: {}, browserErrors };
report.desktop.rest = await cardState();
await screenshot('01-rest-light');

let rect = await cardState();
let startX = rect.x + rect.width * 0.46;
let startY = rect.y + rect.height * 0.5;
await moveMouse(startX, startY);
await pressMouse(startX, startY);
await delay(95);
report.desktop.capture = await cardState();
await screenshot('02-captured');

const positions = [45, 90, 180];
let currentX = startX;
for (const angle of positions) {
  const nextX = startX + rect.width * (angle / 280);
  await dragMouse(currentX, startY, nextX, startY, 6, 20);
  await delay(45);
  report.desktop[`angle${angle}`] = await cardState();
  await screenshot(`03-angle-${angle}`);
  currentX = nextX;
}
for (const angle of [90, 0]) {
  const nextX = startX + rect.width * (angle / 280);
  await dragMouse(currentX, startY, nextX, startY, 8, 24);
  await delay(45);
  report.desktop[`return${angle}`] = await cardState();
  currentX = nextX;
}
await delay(120);
await releaseMouse(currentX, startY);
report.desktop.slowRelease0 = await cardState();
await delay(170);
report.desktop.slowRelease170 = await cardState();
await delay(800);
report.desktop.slowSettled = await cardState();

rect = await cardState();
startX = rect.x + rect.width * 0.42;
startY = rect.y + rect.height * 0.52;
await moveMouse(startX, startY);
await pressMouse(startX, startY);
await delay(75);
const fastX = startX + rect.width * 0.22;
await dragMouse(startX, startY, fastX, startY - 16, 2, 8);
await releaseMouse(fastX, startY - 16);
report.desktop.fastRelease0 = await cardState();
await delay(120);
report.desktop.fastRelease120 = await cardState();
await delay(950);
report.desktop.fastSettled = await cardState();
await screenshot('04-fast-settled-back');

await evaluate(`document.querySelector('input[value="dark"]')?.click(); true`);
await delay(180);
report.desktop.dark = await cardState();
await screenshot('05-dark-back');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
await evaluate(`document.querySelector('.card-stage').scrollIntoView({ block: 'center' }); true`);
await delay(250);
report.touch.mobile390 = await cardState();
await screenshot('06-mobile-390');

rect = await cardState();
startX = rect.x + rect.width * 0.35;
startY = rect.y + rect.height * 0.5;
const touchPoint = (x, y) => ({ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 });
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint(startX, startY)] });
await delay(165);
await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(startX + rect.width * 0.34, startY + 28)] });
await delay(55);
report.touch.longPressDiagonal = await cardState();
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await delay(900);
report.touch.diagonalSettled = await cardState();

await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
await evaluate(`document.querySelector('.card-stage').scrollIntoView({ block: 'center' }); true`);
await delay(220);
report.touch.mobile320 = await cardState();
await screenshot('07-mobile-320');

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await delay(120);
report.reduced.before = {
  media: await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`),
  state: await cardState(),
};
await evaluate(`document.querySelector('.card-object-actions button').click(); true`);
await delay(80);
report.reduced.afterButton = await cardState();

console.log(JSON.stringify(report, null, 2));
socket.close();
