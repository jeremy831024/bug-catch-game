// 选中的角色 (支持自定义+预设)
let selectedCharFile = 'assets/child_small.png';
let playerName = '小探险家';
try {
  const saved = JSON.parse(localStorage.getItem('selectedChar'));
  if (saved && saved.name) {
    playerName = saved.name;
    // 自定义角色渲染在creator.html中处理
    selectedCharFile = 'assets/child_small.png'; // fallback
  } else {
    // 预设角色
    const id = localStorage.getItem('selectedChar') || 'child';
    selectedCharFile = id === 'child' ? 'assets/child_small.png' : 'assets/' + id + '_small.png';
    playerName = localStorage.getItem('selectedCharName') || '小探险家';
  }
} catch {
  // 旧版预设
  const id = localStorage.getItem('selectedChar') || 'child';
  selectedCharFile = id === 'child' ? 'assets/child_small.png' : 'assets/' + id + '_small.png';
  playerName = localStorage.getItem('selectedCharName') || '小探险家';
}

// 保存玩家名到排行榜用
const SAVE_NAME = playerName;

// ── 加载系统 ──
let loadingState = { total: 0, loaded: 0, errors: 0, ready: false };
const LOADING_IMAGES = [];

function trackImageLoad(img, label) {
  loadingState.total++;
  LOADING_IMAGES.push(img);
  const onDone = () => { loadingState.loaded++; drawLoadingScreen(); };
  const onError = () => { loadingState.loaded++; loadingState.errors++; drawLoadingScreen(); };
  img.addEventListener('load', onDone, { once: true });
  img.addEventListener('error', onError, { once: true });
  // 如果图片已经加载完
  if (img.complete && img.naturalWidth > 0) { setTimeout(onDone, 0); }
}

function drawLoadingScreen() {
  const pct = loadingState.total > 0 ? Math.round(loadingState.loaded / loadingState.total * 100) : 0;
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(0, 0, 960, 640);
  
  // 标题
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐛 抓虫大冒险', 480, 260);
  
  // 加载条背景
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(480 - 120, 310, 240, 20, 10);
  ctx.fill();
  
  // 加载条进度
  if (pct > 0) {
    const g = ctx.createLinearGradient(480 - 120, 0, 480 + 120, 0);
    g.addColorStop(0, '#4caf50'); g.addColorStop(1, '#8bc34a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(480 - 120, 310, 240 * pct / 100, 20, 10);
    ctx.fill();
  }
  
  // 百分比
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  const errorText = loadingState.errors > 0 ? ` (${loadingState.errors}个加载失败)` : '';
  ctx.fillText(`加载中 ${pct}%${errorText}`, 480, 350);
  
  // 提示
  if (loadingState.ready) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px sans-serif';
    ctx.fillText('按任意键或点击开始...', 480, 390);
  }
}

function checkAllLoaded() {
  if (loadingState.loaded >= loadingState.total) {
    loadingState.ready = true;
    drawLoadingScreen();
  }
}

const TILE = 32;
const COLS = 50;
const ROWS = 34;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;
const VIEW_W = 960;
const VIEW_H = 640;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ═══════════════════════════════════════
// 加载系统
// ═══════════════════════════════════════
const ui = {
  score: document.getElementById("scoreDisplay"),
  staminaBar: document.getElementById("staminaBar"),
  staminaText: document.getElementById("staminaText"),
  poisonWrap: document.getElementById("poisonArea"),
  poisonBar: document.getElementById("poisonBar"),
  statusBadge: document.getElementById("statusBadge"),
  bugCount: document.getElementById("bugCount"),
  timer: document.getElementById("timerDisplay"),
  gameOver: document.getElementById("gameOver"),
  finalScore: document.getElementById("finalScore"),
  caughtSummary: document.getElementById("caughtSummary"),
  replayButton: document.getElementById("replayButton"),
};

const BUG_DEFS = [
  { id: "grasshopper", name: "蚂蚱", rarity: "普通", points: 10, toxic: false, holeStyle: "土洞", asset: "grasshopper", speed: 62 },
  { id: "mantis", name: "螳螂", rarity: "普通", points: 15, toxic: false, holeStyle: "草洞", asset: "mantis", speed: 52 },
  { id: "beetle", name: "独角仙", rarity: "稀有", points: 50, toxic: false, holeStyle: "树洞", asset: "beetle", speed: 32 },
  { id: "butterfly", name: "蝴蝶", rarity: "稀有", points: 30, toxic: false, holeStyle: "花洞", asset: "butterfly", speed: 68 },
  { id: "cicada", name: "知了", rarity: "普通", points: 20, toxic: false, holeStyle: "树洞", asset: "cicada", speed: 24 },
  { id: "spider", name: "蜘蛛", rarity: "少见", points: 25, toxic: true, holeStyle: "网洞", asset: "spider", speed: 42 },
  { id: "dung", name: "屎壳郎", rarity: "陷阱", points: -10, toxic: true, holeStyle: "粪洞", asset: "dung", speed: 20 },
];

const HOLE_STYLES = ["土洞", "草洞", "树洞", "花洞", "网洞", "粪洞"];

const state = {
  time: 0,
  score: 0,
  stamina: 100,
  poison: 0,
  ended: false,
  map: [],
  ponds: [],
  roads: [],
  burrows: [],
  bugs: [],
  floats: [],
  caught: {},
  keys: Object.create(null),
  audio: null,
  assets: Object.create(null),
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function keyDown(code) {
  return !!state.keys[code];
}

function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return "pond";
  return state.map[ty][tx];
}

function terrainSpeed(tile) {
  if (tile === "road") return 0.66;
  if (tile === "pond") return 0;
  return 1;
}

function isWalkable(tile) {
  return tile !== "pond";
}

function nearestTile(x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

function centerOf(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addFloat(x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1.2 });
}

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem("bugCatchLeaderboard") || "[]");
  } catch {
    return [];
  }
}

function setLeaderboard(entry) {
  const scores = getLeaderboard();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("bugCatchLeaderboard", JSON.stringify(scores.slice(0, 5)));
}

function updateLeaderboard() {
  if (state.ended) {
    setLeaderboard({
      score: Math.round(state.score),
      count: Object.values(state.caught).reduce((sum, value) => sum + value, 0),
      date: Date.now(),
    });
  }
}

function storeCaught(bugId) {
  let caught = {};
  try {
    caught = JSON.parse(localStorage.getItem("bugCatchCaught") || "{}");
  } catch {
    caught = {};
  }
  caught[bugId] = (caught[bugId] || 0) + 1;
  localStorage.setItem("bugCatchCaught", JSON.stringify(caught));
}

function buildMap() {
  state.map = Array.from({ length: ROWS }, () => Array(COLS).fill("grass"));

  for (let i = 0; i < 4; i++) {
    let x = randInt(2, COLS - 3);
    let y = randInt(2, ROWS - 3);
    const length = randInt(10, 17);
    for (let s = 0; s < length; s++) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const tx = x + ox;
          const ty = y + oy;
          if (tx > 0 && ty > 0 && tx < COLS - 1 && ty < ROWS - 1) {
            state.map[ty][tx] = "road";
          }
        }
      }
      x += randInt(-1, 1);
      y += randInt(0, 1);
      x = clamp(x, 2, COLS - 3);
      y = clamp(y, 2, ROWS - 3);
    }
  }

  const pondCount = randInt(1, 2);
  for (let i = 0; i < pondCount; i++) {
    const cx = randInt(6, COLS - 7);
    const cy = randInt(4, ROWS - 6);
    const rx = randInt(2, 4);
    const ry = randInt(2, 3);
    state.ponds.push({ cx, cy, rx, ry });
    for (let ty = cy - ry; ty <= cy + ry; ty++) {
      for (let tx = cx - rx; tx <= cx + rx; tx++) {
        const nx = (tx - cx) / rx;
        const ny = (ty - cy) / ry;
        if (nx * nx + ny * ny <= 1 && tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS) {
          state.map[ty][tx] = "pond";
        }
      }
    }
  }
}

function grassCandidates() {
  const cells = [];
  for (let ty = 1; ty < ROWS - 1; ty++) {
    for (let tx = 1; tx < COLS - 1; tx++) {
      if (state.map[ty][tx] !== "grass") continue;
      let ok = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (tileAt(tx + dx, ty + dy) === "pond") ok = false;
        }
      }
      if (ok) cells.push({ tx, ty });
    }
  }
  return cells;
}

function createBurrows() {
  const candidates = grassCandidates();
  const used = new Set();
  const burrowCount = randInt(5, 8);
  const connectedCount = randInt(2, 3);
  const stylePool = [...HOLE_STYLES];
  state.burrows = [];

  function takeCell() {
    for (let i = 0; i < candidates.length; i++) {
      const cell = candidates[i];
      const key = `${cell.tx}:${cell.ty}`;
      if (!used.has(key)) {
        used.add(key);
        return cell;
      }
    }
    return null;
  }

  for (let i = 0; i < burrowCount; i++) {
    const connected = i < connectedCount;
    const exits = [];
    const exitCount = connected ? randInt(2, 3) : 1;
    const style = stylePool[i % stylePool.length];
    const anchor = takeCell();
    if (!anchor) break;
    exits.push({
      ...anchor,
      x: anchor.tx * TILE + TILE / 2,
      y: anchor.ty * TILE + TILE / 2 + 4,
    });
    for (let e = 1; e < exitCount; e++) {
      const near = candidates.find((cell) => {
        const key = `${cell.tx}:${cell.ty}`;
        if (used.has(key)) return false;
        const dx = Math.abs(cell.tx - anchor.tx);
        const dy = Math.abs(cell.ty - anchor.ty);
        return dx + dy >= 2 && dx + dy <= 5;
      });
      if (!near) break;
      used.add(`${near.tx}:${near.ty}`);
      exits.push({
        ...near,
        x: near.tx * TILE + TILE / 2,
        y: near.ty * TILE + TILE / 2 + 4,
      });
    }
    state.burrows.push({
      id: `burrow-${i}`,
      connected,
      style,
      exits,
      broken: false,
      bugs: [],
    });
  }
}

function bugDefById(id) {
  return BUG_DEFS.find((item) => item.id === id);
}

function randomSpawnPoint(def) {
  if (def.id === "cicada") {
    const side = randInt(0, 3);
    if (side === 0) return { x: rand(32, WIDTH - 32), y: 24 };
    if (side === 1) return { x: rand(32, WIDTH - 32), y: HEIGHT - 24 };
    if (side === 2) return { x: 24, y: rand(32, HEIGHT - 32) };
    return { x: WIDTH - 24, y: rand(32, HEIGHT - 32) };
  }
  if (def.id === "spider") {
    const x = randInt(6, COLS - 7) * TILE + TILE / 2;
    const y = randInt(4, ROWS - 5) * TILE + TILE / 2;
    return { x, y };
  }
  if (def.id === "dung") {
    const x = randInt(4, COLS - 5) * TILE + TILE / 2;
    const y = randInt(4, ROWS - 5) * TILE + TILE / 2;
    return { x, y };
  }
  for (let i = 0; i < 120; i++) {
    const tx = randInt(0, COLS - 1);
    const ty = randInt(0, ROWS - 1);
    if (tileAt(tx, ty) === "grass") return centerOf(tx, ty);
  }
  return { x: WIDTH / 2, y: HEIGHT / 2 };
}

function createBug(def) {
  const spawn = randomSpawnPoint(def);
  const bug = {
    ...def,
    x: spawn.x,
    y: spawn.y,
    vx: rand(-20, 20),
    vy: rand(-20, 20),
    dir: rand(0, Math.PI * 2),
    wing: 0,
    hop: 0,
    pause: rand(0.3, 1.2),
    jumpTimer: rand(0.8, 2.4),
    flightTimer: rand(6, 14),
    moveTimer: rand(1, 3),
    webCenter: { x: spawn.x, y: spawn.y },
    webRadius: rand(48, 96),
    carryAngle: rand(0, Math.PI * 2),
    carryDistance: rand(8, 18),
    holeId: null,
    holeExitId: null,
    holeTimer: 0,
    holeCooldown: 0,
    visible: true,
    alpha: 1,
    chaos: rand(0, 1000),
    textTimer: rand(1.4, 3.5),
  };
  if (def.id === "dung") {
    bug.ball = { x: bug.x + 10, y: bug.y + 2 };
  }
  if (def.id === "spider") {
    bug.webCenter = { x: bug.x, y: bug.y };
  }
  return bug;
}

function spawnBugs() {
  state.bugs = BUG_DEFS.map(createBug);
  while (state.bugs.length < 12) {
    state.bugs.push(createBug(BUG_DEFS[randInt(0, BUG_DEFS.length - 1)]));
  }
}

function drawSprite(name, x, y, size, fallback) {
  const image = state.assets[name];
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return;
  }
  fallback();
}

function drawHoleFallback(exit, burrow, time) {
  const x = exit.x;
  const y = exit.y;
  const glow = burrow.connected ? 1 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgba(35,24,16,0.92)";
  ctx.beginPath();
  ctx.ellipse(0, 7, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(17,12,8,0.98)";
  ctx.beginPath();
  ctx.ellipse(0, 5, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(-3, 1, 6, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();
  if (glow) {
    ctx.fillStyle = "rgba(102, 255, 136, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 7, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = holeTint(burrow.style);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 9, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function holeTint(style) {
  const colors = {
    "土洞": "#8b6a47",
    "草洞": "#74bb55",
    "树洞": "#8b5b31",
    "花洞": "#ea7ab4",
    "网洞": "#cfd9e0",
    "粪洞": "#5d462f",
  };
  return colors[style] || "#8b6a47";
}

function createAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctxAudio = new AudioCtx();
  const master = ctxAudio.createGain();
  master.gain.value = 0.18;
  master.connect(ctxAudio.destination);

  function tone(freq, duration, type, gain = 0.12) {
    const osc = ctxAudio.createOscillator();
    const amp = ctxAudio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    osc.stop(ctxAudio.currentTime + duration);
  }

  function noise(duration, gain = 0.04) {
    const buffer = ctxAudio.createBuffer(1, ctxAudio.sampleRate * duration, ctxAudio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctxAudio.createBufferSource();
    const amp = ctxAudio.createGain();
    amp.gain.value = gain;
    src.buffer = buffer;
    src.connect(amp);
    amp.connect(master);
    src.start();
    src.stop(ctxAudio.currentTime + duration);
  }

  let ambientTimer = null;
  let cicadaTimer = null;

  return {
    unlock() {
      if (ctxAudio.state === "suspended") ctxAudio.resume();
      if (!ambientTimer) {
        ambientTimer = setInterval(() => {
          noise(0.14, 0.018);
          tone(rand(180, 260), 0.04, "triangle", 0.012);
        }, 180);
      }
      if (!cicadaTimer) {
        cicadaTimer = setInterval(() => {
          if (Math.random() < 0.35) return;
          tone(3200, 0.05, "square", 0.03);
          setTimeout(() => tone(2900, 0.06, "square", 0.02), 90);
        }, randInt(3600, 5400));
      }
    },
    catch() {
      tone(980, 0.09, "sine", 0.16);
      setTimeout(() => tone(1320, 0.08, "sine", 0.12), 70);
    },
    shovel() {
      tone(160, 0.18, "triangle", 0.14);
    },
    poison() {
      tone(180, 0.14, "sawtooth", 0.1);
      setTimeout(() => tone(120, 0.16, "sawtooth", 0.08), 130);
    },
    cicada() {
      tone(3600, 0.05, "square", 0.04);
      setTimeout(() => tone(3300, 0.05, "square", 0.03), 120);
    },
  };
}

let bgMusicPlaying = false;

function startBgMusic() {
  if (bgMusicPlaying || !audio.ctx) return;
  bgMusicPlaying = true;
  const ctx = audio.ctx;
  const master = ctx.createGain();
  master.gain.value = 0.035;
  master.connect(ctx.destination);
  const notes = [262, 294, 330, 349, 392, 349, 330, 294, 262, 294, 330, 392, 440, 392, 330, 294];
  let noteIdx = 0;
  const bpm = 70, beatDuration = 60 / bpm;
  function playNextNote() {
    if (!bgMusicPlaying) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = notes[noteIdx % notes.length];
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatDuration * 0.9);
    osc.connect(gain); gain.connect(master);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + beatDuration * 0.9);
    noteIdx++;
    if (noteIdx % 4 === 0) {
      const bass = ctx.createOscillator(); const bg = ctx.createGain();
      bass.type = 'sine'; bass.frequency.value = 130;
      bg.gain.value = 0.04; bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatDuration * 1.5);
      bass.connect(bg); bg.connect(master);
      bass.start(ctx.currentTime); bass.stop(ctx.currentTime + beatDuration * 1.5);
    }
    setTimeout(playNextNote, beatDuration * 0.25 * 1000);
  }
  function ambient() {
    if (!bgMusicPlaying) return;
    if (Math.random() < 0.3) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 3000 + Math.random() * 2000;
      g.gain.value = 0.008; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.connect(g); g.connect(master);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    }
    setTimeout(ambient, 500 + Math.random() * 1500);
  }
  setTimeout(playNextNote, 500); setTimeout(ambient, 1000);
}

function stopBgMusic() { bgMusicPlaying = false; }

function initAudio() {
  if (!state.audio) state.audio = createAudio();
  if (state.audio) state.audio.unlock();
}

function pushCatch(bug, x, y, extra = 0) {
  state.score += bug.points + extra;
  state.caught[bug.id] = (state.caught[bug.id] || 0) + 1;
  storeCaught(bug.id);
  addFloat(x, y, `${bug.points >= 0 ? "+" : ""}${bug.points + extra}`, bug.points >= 0 ? "#ffd349" : "#ff6f6f");
  if (bug.toxic) triggerPoison();
  if (state.audio) state.audio.catch();
}

function triggerPoison() {
  state.poison = 8;
  ui.statusBadge.textContent = "🟡 中毒";
  ui.statusBadge.className = "status-badge status-poison";
  ui.poisonWrap.style.display = "inline-flex";
  if (state.audio) state.audio.poison();
}

function clearPoison() {
  ui.statusBadge.textContent = "🟢 正常";
  ui.statusBadge.className = "status-badge status-ok";
  ui.poisonWrap.style.display = "none";
}

function getPlayerTile() {
  return nearestTile(player.x, player.y);
}

function holeAtPlayer() {
  const { tx, ty } = getPlayerTile();
  for (const burrow of state.burrows) {
    if (burrow.broken) continue;
    for (const exit of burrow.exits) {
      if (exit.tx === tx && exit.ty === ty) return { burrow, exit };
    }
  }
  return null;
}

function bugAtTile(tx, ty) {
  return state.bugs.find((bug) => !bug.holeId && Math.floor(bug.x / TILE) === tx && Math.floor(bug.y / TILE) === ty);
}

function shovelHole() {
  if (state.ended) return;
  const found = holeAtPlayer();
  if (!found) {
    state.stamina = clamp(state.stamina - 8, 0, 100);
    addFloat(player.x, player.y - 24, "这里没有洞", "#fff3b0");
    if (state.audio) state.audio.shovel();
    return;
  }
  const { burrow, exit } = found;
  if (burrow.connected) {
    state.stamina = clamp(state.stamina - 15, 0, 100);
    burrow.broken = true;
    for (const bug of state.bugs) {
      if (bug.holeId === burrow.id) {
        bug.holeId = null;
        bug.holeExitId = null;
        bug.holeCooldown = state.time + 3;
        bug.x = exit.x + rand(-18, 18);
        bug.y = exit.y + rand(-18, 18);
      }
    }
    addFloat(player.x, player.y - 24, "破坏洞穴 -15", "#ffcf69");
    if (state.audio) state.audio.shovel();
    return;
  }

  const bug = state.bugs.find((item) => item.holeId === burrow.id);
  if (bug) {
    pushCatch(bug, exit.x, exit.y - 8, 30);
    state.stamina = clamp(state.stamina - 10, 0, 100);
    const bugIndex = state.bugs.indexOf(bug);
    if (bugIndex >= 0) state.bugs.splice(bugIndex, 1);
    burrow.broken = true;
    addFloat(player.x, player.y - 24, "死路洞 +30", "#8cff95");
  } else {
    state.stamina = clamp(state.stamina - 25, 0, 100);
    burrow.broken = true;
    addFloat(player.x, player.y - 24, "空洞 -25", "#ff9f4a");
  }
  if (state.audio) state.audio.shovel();
}

function catchWithNet() {
  if (state.ended) return;
  const range = 40;
  const px = player.x + Math.cos(player.dir) * range;
  const py = player.y + Math.sin(player.dir) * range;
  let targetIndex = -1;
  let best = Infinity;
  state.bugs.forEach((bug, index) => {
    if (bug.holeId) return;
    const d = Math.hypot(bug.x - px, bug.y - py);
    if (d < 26 && d < best) {
      targetIndex = index;
      best = d;
    }
  });
  if (targetIndex >= 0) {
    const bug = state.bugs[targetIndex];
    pushCatch(bug, bug.x, bug.y - 8, 0);
    state.bugs.splice(targetIndex, 1);
    addFloat(px, py - 20, "叮!", "#ffffff");
  } else {
    addFloat(px, py - 20, "没有抓到", "#ffffff");
  }
}

function updateBurrows(dt) {
  for (const bug of state.bugs) {
    if (!bug.holeId) continue;
    bug.holeTimer -= dt;
    if (bug.holeTimer > 0) continue;
    const burrow = state.burrows.find((item) => item.id === bug.holeId);
    if (!burrow || burrow.broken) {
      bug.holeId = null;
      bug.holeExitId = null;
      bug.holeCooldown = state.time + rand(3, 6);
      continue;
    }
    const exits = burrow.exits.filter((exit) => !exit.blocked);
    if (!exits.length) {
      bug.holeId = null;
      bug.holeExitId = null;
      bug.holeCooldown = state.time + rand(3, 6);
      continue;
    }
    let nextExit = exits[0];
    if (burrow.connected && exits.length > 1) {
      const options = exits.filter((exit) => exit.key !== bug.holeExitId);
      nextExit = options.length ? options[randInt(0, options.length - 1)] : exits[randInt(0, exits.length - 1)];
    }
    bug.x = nextExit.x + rand(-10, 10);
    bug.y = nextExit.y + rand(-10, 10);
    bug.holeId = null;
    bug.holeExitId = null;
    bug.holeCooldown = state.time + rand(3, 6);
    bug.vx = rand(-30, 30);
    bug.vy = rand(-30, 30);
    bug.pause = rand(0.4, 1.2);
    addFloat(bug.x, bug.y - 12, "钻出来", "#e4ff8b");
  }
}

function nearestOpenBurrow(bug) {
  let chosen = null;
  let best = Infinity;
  for (const burrow of state.burrows) {
    if (burrow.broken) continue;
    for (const exit of burrow.exits) {
      const d = Math.hypot(exit.x - bug.x, exit.y - bug.y);
      if (d < 28 && d < best) {
        best = d;
        chosen = { burrow, exit };
      }
    }
  }
  return chosen;
}

function enterHole(bug, burrow, exit) {
  bug.holeId = burrow.id;
  bug.holeExitId = exit.key;
  bug.holeTimer = rand(5, 15);
  bug.holeCooldown = state.time + rand(4, 8);
  bug.x = exit.x;
  bug.y = exit.y;
}

function updateBug(bug, dt) {
  if (bug.holeId) return;
  if (state.time < bug.holeCooldown) {
    bug.alpha = 1;
  }

  const playerDistance = Math.hypot(bug.x - player.x, bug.y - player.y);
  const scared = playerDistance < 116 && !state.poison;

  if (bug.id === "grasshopper") {
    bug.pause -= dt;
    if (bug.pause <= 0) {
      if (bug.jumpTimer <= 0) {
        bug.hop = randInt(2, 3) * TILE;
        const angle = rand(0, Math.PI * 2);
        bug.vx = Math.cos(angle) * 180;
        bug.vy = Math.sin(angle) * 180;
        bug.jumpTimer = rand(0.7, 1.5);
        bug.pause = 0.16;
      } else {
        bug.jumpTimer -= dt;
        bug.vx *= 0.98;
        bug.vy *= 0.98;
      }
    }
  } else if (bug.id === "mantis") {
    bug.alpha = scared ? 1 : 0.42;
    if (scared) {
      const ang = Math.atan2(bug.y - player.y, bug.x - player.x);
      bug.vx += Math.cos(ang) * 110 * dt;
      bug.vy += Math.sin(ang) * 110 * dt;
    } else {
      bug.vx *= 0.9;
      bug.vy *= 0.9;
      bug.moveTimer -= dt;
      if (bug.moveTimer <= 0) {
        const ang = rand(0, Math.PI * 2);
        bug.vx += Math.cos(ang) * 20;
        bug.vy += Math.sin(ang) * 20;
        bug.moveTimer = rand(1.5, 3);
      }
    }
  } else if (bug.id === "beetle") {
    bug.flightTimer -= dt;
    if (bug.flightTimer > 0) {
      bug.vx += Math.cos(bug.dir) * 18 * dt;
      bug.vy += Math.sin(bug.dir) * 18 * dt;
    } else {
      bug.dir += rand(-0.8, 0.8) * dt;
      bug.vx += Math.cos(bug.dir) * 34 * dt;
      bug.vy += Math.sin(bug.dir) * 34 * dt;
      if (bug.flightTimer < -4) bug.flightTimer = rand(6, 14);
    }
  } else if (bug.id === "butterfly") {
    bug.wing += dt * 10;
    bug.dir += Math.sin(state.time * 2 + bug.chaos) * 0.2 * dt;
    bug.vx += Math.cos(bug.dir) * 34 * dt;
    bug.vy += Math.sin(bug.dir) * 34 * dt;
    bug.y += Math.sin(state.time * 5 + bug.chaos) * 12 * dt;
  } else if (bug.id === "cicada") {
    bug.alpha = 1;
    bug.pause -= dt;
    bug.x = clamp(bug.x, 18, WIDTH - 18);
    bug.y = clamp(bug.y, 18, HEIGHT - 18);
    if (bug.pause <= 0) {
      bug.textTimer -= dt;
      if (bug.textTimer <= 0) {
        addFloat(bug.x, bug.y - 16, "知了", "#ffe9a4");
        if (state.audio) state.audio.cicada();
        bug.textTimer = rand(2.8, 5.5);
      }
      bug.vx *= 0.95;
      bug.vy *= 0.95;
      if (Math.random() < 0.008) {
        bug.vx = rand(-10, 10);
        bug.vy = rand(-8, 8);
      }
      const edgeBias = 0.7;
      if (bug.x < 40) bug.vx += edgeBias;
      if (bug.x > WIDTH - 40) bug.vx -= edgeBias;
      if (bug.y < 40) bug.vy += edgeBias;
      if (bug.y > HEIGHT - 40) bug.vy -= edgeBias;
    }
  } else if (bug.id === "spider") {
    const inWeb = distance({ x: bug.x, y: bug.y }, bug.webCenter) < bug.webRadius;
    const speed = inWeb ? 70 : 26;
    const turn = inWeb ? 0.7 : 0.18;
    bug.dir += rand(-turn, turn) * dt;
    bug.vx += Math.cos(bug.dir) * speed * dt;
    bug.vy += Math.sin(bug.dir) * speed * dt;
    if (!inWeb) {
      const back = Math.atan2(bug.webCenter.y - bug.y, bug.webCenter.x - bug.x);
      bug.vx += Math.cos(back) * 10 * dt;
      bug.vy += Math.sin(back) * 10 * dt;
    }
  } else if (bug.id === "dung") {
    const push = Math.atan2(bug.ball.y - bug.y, bug.ball.x - bug.x);
    bug.vx += Math.cos(push) * 12 * dt;
    bug.vy += Math.sin(push) * 12 * dt;
    bug.ball.x += Math.cos(bug.dir) * 36 * dt;
    bug.ball.y += Math.sin(bug.dir) * 36 * dt;
    if (Math.random() < 0.02) bug.dir += rand(-1, 1);
  }

  if (scared) {
    const ang = Math.atan2(bug.y - player.y, bug.x - player.x);
    bug.vx += Math.cos(ang) * 76 * dt;
    bug.vy += Math.sin(ang) * 76 * dt;
  }

  if (bug.id !== "cicada") {
    const tile = tileAt(Math.floor(bug.x / TILE), Math.floor(bug.y / TILE));
    const speedMul = terrainSpeed(tile);
    bug.x += bug.vx * dt * speedMul;
    bug.y += bug.vy * dt * speedMul;
  } else {
    bug.x += bug.vx * dt;
    bug.y += bug.vy * dt;
  }

  bug.vx *= 0.96;
  bug.vy *= 0.96;
  bug.x = clamp(bug.x, 16, WIDTH - 16);
  bug.y = clamp(bug.y, 16, HEIGHT - 16);

  if (tileAt(Math.floor(bug.x / TILE), Math.floor(bug.y / TILE)) === "pond") {
    bug.x -= bug.vx * dt * 2;
    bug.y -= bug.vy * dt * 2;
    bug.dir += Math.PI * 0.5;
  }

  const entry = nearestOpenBurrow(bug);
  if (entry && state.time >= bug.holeCooldown && !state.ended) {
    if (Math.random() < 0.004 + (bug.id === "mantis" ? 0.004 : 0)) {
      enterHole(bug, entry.burrow, {
        key: `${entry.exit.tx}:${entry.exit.ty}`,
        ...entry.exit,
      });
      entry.burrow.bugs.push(bug);
    }
  }

  if (bug.id === "spider") {
    if (playerDistance < 18) triggerPoison();
  }
  if (bug.id === "dung") {
    const ballDist = Math.hypot(bug.ball.x - player.x, bug.ball.y - player.y);
    if (ballDist < 18) {
      state.score -= 6;
      triggerPoison();
      addFloat(bug.ball.x, bug.ball.y - 8, "-6", "#ff7c7c");
    }
  }
}

function updatePlayer(dt) {
  if (state.poison > 0) return;
  let dx = 0;
  let dy = 0;
  if (keyDown("KeyW") || keyDown("ArrowUp")) dy -= 1;
  if (keyDown("KeyS") || keyDown("ArrowDown")) dy += 1;
  if (keyDown("KeyA") || keyDown("ArrowLeft")) dx -= 1;
  if (keyDown("KeyD") || keyDown("ArrowRight")) dx += 1;
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    player.dir = Math.atan2(dy, dx);
    const tile = tileAt(Math.floor(player.x / TILE), Math.floor(player.y / TILE));
    const speedMul = terrainSpeed(tile) * (state.stamina > 70 ? 1 : state.stamina > 40 ? 0.82 : 0.66);
    const speed = 130 * speedMul;
    const nx = player.x + dx * speed * dt;
    const ny = player.y + dy * speed * dt;
    if (isWalkable(tileAt(Math.floor(nx / TILE), Math.floor(player.y / TILE)))) player.x = clamp(nx, 18, WIDTH - 18);
    if (isWalkable(tileAt(Math.floor(player.x / TILE), Math.floor(ny / TILE)))) player.y = clamp(ny, 18, HEIGHT - 18);
    state.stamina = clamp(state.stamina + 0.36 * dt, 0, 100);
  } else {
    state.stamina = clamp(state.stamina + 0.9 * dt, 0, 100);
  }
}

function updatePoison(dt) {
  if (state.poison <= 0) return;
  state.poison -= dt;
  state.score -= 5 * dt;
  if (state.poison <= 0) {
    state.poison = 0;
    clearPoison();
  }
}

function updateHoles(dt) {
  for (const burrow of state.burrows) {
    if (burrow.broken) continue;
    for (const exit of burrow.exits) {
      exit.blocked = false;
      exit.key = `${exit.tx}:${exit.ty}`;
    }
  }
  for (const bug of state.bugs) {
    if (!bug.holeId) continue;
    bug.holeTimer -= dt;
    if (bug.holeTimer > 0) continue;
    const burrow = state.burrows.find((item) => item.id === bug.holeId);
    if (!burrow || burrow.broken) {
      bug.holeId = null;
      bug.holeExitId = null;
      bug.holeCooldown = state.time + rand(3, 6);
      continue;
    }
    const exits = burrow.exits;
    let exit = exits[0];
    if (burrow.connected && exits.length > 1) {
      const choices = exits.filter((item) => `${item.tx}:${item.ty}` !== bug.holeExitId);
      exit = choices.length ? choices[randInt(0, choices.length - 1)] : exits[randInt(0, exits.length - 1)];
    }
    bug.x = exit.x + rand(-10, 10);
    bug.y = exit.y + rand(-10, 10);
    bug.holeId = null;
    bug.holeExitId = null;
    bug.holeCooldown = state.time + rand(4, 8);
    bug.vx = rand(-20, 20);
    bug.vy = rand(-20, 20);
    addFloat(bug.x, bug.y - 12, "出洞", "#d8ff86");
  }
}

function updateFloats(dt) {
  for (let i = state.floats.length - 1; i >= 0; i--) {
    state.floats[i].life -= dt;
    state.floats[i].y -= 22 * dt;
    if (state.floats[i].life <= 0) state.floats.splice(i, 1);
  }
}

function updateHUD() {
  ui.score.textContent = Math.round(state.score);
  ui.staminaBar.style.width = `${state.stamina}%`;
  ui.staminaText.textContent = Math.round(state.stamina);
  ui.bugCount.textContent = `🐛 ${state.bugs.filter((bug) => !bug.holeId).length} 只`;
  ui.timer.textContent = `⏱ ${Math.floor(state.time)}s`;
  if (state.poison > 0) {
    ui.poisonBar.style.width = `${(state.poison / 8) * 100}%`;
  }
}

function finishGame() {
  if (state.ended) return;
  state.ended = true;
  ui.gameOver.classList.add("show");
  ui.finalScore.textContent = Math.round(state.score);
  const summary = Object.entries(state.caught)
    .map(([id, count]) => `${bugDefById(id)?.name || id} × ${count}`)
    .join(" ");
  ui.caughtSummary.textContent = summary || "还没有抓到虫子";
  updateLeaderboard();
}

function update(dt) {
  if (state.ended) return;
  state.time += dt;
  updatePoison(dt);
  updatePlayer(dt);
  updateHoles(dt);
  for (const bug of state.bugs) updateBug(bug, dt);
  updateFloats(dt);
  updateHUD();
  if (state.time >= 90) finishGame();
}

// 简化perlin噪声用于地图
let pSeed=[];
for(let i=0;i<256;i++)pSeed.push(Math.random());
function pNoise(x,y){
  let ix=x|0,iy=y|0;
  let fx=x-ix,fy=y-iy;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  let a=pSeed[(ix&255)+(iy&255)*37&255];
  let b=pSeed[((ix+1)&255)+(iy&255)*37&255];
  let c=pSeed[(ix&255)+((iy+1)&255)*37&255];
  let d=pSeed[((ix+1)&255)+((iy+1)&255)*37&255];
  return a+(b-a)*fx+(c-a)*fy*((d-c)-(b-a));
}

function drawTerrain() {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const tile = state.map[ty][tx];
      const cx = tx * TILE, cy = ty * TILE;
      if (tile === "water") {
        // 池塘 — 卫星图效果
        const wat = Math.sin(state.time * 0.5 + tx + ty) * 3;
        ctx.fillStyle = `hsl(210,68%,${45 + wat}%)`;
        ctx.fillRect(cx, cy, TILE, TILE);
        ctx.fillStyle = `rgba(200,230,255,${0.06 + Math.sin(state.time * 2 + tx * 0.5 + ty * 0.3) * 0.03})`;
        ctx.fillRect(cx + 4, cy + 6, TILE - 8, 3);
      } else if (tile === "road") {
        // 山路 — 航拍棕色
        const n = pNoise(tx * 2.5, ty * 2.5);
        ctx.fillStyle = `hsl(35,12%,${42 + n * 12}%)`;
        ctx.fillRect(cx, cy, TILE, TILE);
        ctx.fillStyle = `rgba(80,70,50,${0.08 + n * 0.12})`;
        ctx.beginPath(); ctx.arc(cx + 8 + n * 10, cy + 8 + n * 10, 2 + n * 3, 0, 7); ctx.fill();
      } else {
        // 草地 — 航拍风格，噪点纹理
        const n1 = pNoise(tx * 1.7, ty * 1.7), n2 = pNoise(tx * 0.3, ty * 0.3);
        const h = 62 + n1 * 18 + n2 * 5;
        ctx.fillStyle = `hsl(105,48%,${h}%)`;
        ctx.fillRect(cx, cy, TILE, TILE);
        // 植被纹理斑点
        if (n1 > 0.15) {
          ctx.fillStyle = `rgba(45,110,35,${(n1 - 0.15) * 0.12})`;
          ctx.beginPath(); ctx.arc(cx + 8 + n1 * 16, cy + 10 + n1 * 12, 2 + n1 * 3, 0, 7); ctx.fill();
        }
      }
    }
  }
}

function drawPondDetails(time) {
  for (const pond of state.ponds) {
    const cx = pond.cx * TILE + TILE / 2;
    const cy = pond.cy * TILE + TILE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.sin(time * 0.8 + i) * 2, Math.cos(time * 0.9 + i) * 2, 18 + i * 4, 10 + i * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHoles(time) {
  for (const burrow of state.burrows) {
    if (burrow.broken) continue;
    for (const exit of burrow.exits) {
      // 2.5D 洞 — 有深度的地洞
      const cx = exit.x, cy = exit.y;
      ctx.save();
      // 外圈阴影
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(cx + 2, cy + 3, 14, 7, 0, 0, 7); ctx.fill();
      // 洞壁
      ctx.fillStyle = 'rgba(60,40,20,0.5)'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 6, 0, 0, 7); ctx.fill();
      // 内部深色
      ctx.fillStyle = 'rgba(20,10,0,0.7)'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, 7, 4, 0, 0, 7); ctx.fill();
      // 连通洞绿色光晕
      if (burrow.connected) {
        ctx.fillStyle = 'rgba(100,255,150,0.1)';
        ctx.beginPath(); ctx.ellipse(cx, cy, 14, 7, 0, 0, 7); ctx.fill();
      }
      // 标签
      ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.sin(time * 2) * 0.04})`;
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(burrow.style || '洞', cx, cy + 15);
      ctx.restore();
    }
  }
}

// 真实风格昆虫绘制

// ═══════════════════════════════════════
// 高分辨率昆虫精灵 (256x256 → 平滑抗锯齿)
// ═══════════════════════════════════════
const SPRITE_CACHE = {};

function cacheSprite(id, drawFn) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = true;
  drawFn(cx, 128, 128, 80);
  SPRITE_CACHE[id] = c;
}

function initSprites() {
  // 蚂蚱
  cacheSprite('hopper', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#5a8a30'; ctx.beginPath(); ctx.ellipse(0, 0, s*0.8, s*0.35, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6a9a30'; ctx.beginPath(); ctx.arc(s*0.6, -s*0.1, s*0.25, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(s*0.65, -s*0.12, 3, 0, 7); ctx.arc(s*0.65, s*0.02, 3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4a6a20'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s*0.3, s*0.2); ctx.lineTo(-s*0.7, s*0.7); ctx.lineTo(-s*0.5, s*0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.3, -s*0.2); ctx.lineTo(-s*0.7, -s*0.7); ctx.lineTo(-s*0.5, -s*0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(150,200,100,0.2)'; ctx.beginPath(); ctx.ellipse(-s*0.1, -s*0.35, s*0.4, s*0.12, -0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a5a10'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s*0.7, -s*0.2); ctx.lineTo(s*1.1, -s*0.5); ctx.moveTo(s*0.7, s*0.1); ctx.lineTo(s*1.1, s*0.4); ctx.stroke();
    ctx.restore();
  });
  
  // 螳螂
  cacheSprite('mantis', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#4a7a30';
    ctx.beginPath(); ctx.moveTo(-s*0.8, 0); ctx.lineTo(0, -s*0.15); ctx.lineTo(s*0.8, -s*0.05);
    ctx.lineTo(s*0.8, s*0.05); ctx.lineTo(0, s*0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a8a30'; ctx.beginPath();
    ctx.moveTo(s*0.6, -s*0.2); ctx.lineTo(s*1.1, 0); ctx.lineTo(s*0.6, s*0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff2222'; ctx.beginPath(); ctx.arc(s*0.9, -s*0.05, 2.5, 0, 7); ctx.arc(s*0.9, s*0.05, 2.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(140,200,100,0.15)'; ctx.beginPath(); ctx.ellipse(-s*0.2, -s*0.22, s*0.35, s*0.1, -0.05, 0, 7); ctx.fill();
    ctx.restore();
  });
  
  // 独角仙
  cacheSprite('beetle', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-10, -5, 0, 0, 0, s*0.9);
    g.addColorStop(0, '#6a4a22'); g.addColorStop(0.5, '#4a2a10'); g.addColorStop(1, '#2a1a00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s*0.9, s*0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2a10'; ctx.beginPath(); ctx.arc(s*0.6, -s*0.02, s*0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1a00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(s*0.7, -s*0.1); ctx.lineTo(s*1.2, -s*0.3); ctx.lineTo(s*1.3, -s*0.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.7, s*0.06); ctx.lineTo(s*1.2, s*0.26); ctx.lineTo(s*1.3, s*0.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,0,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-s*0.3, 0); ctx.lineTo(s*0.4, 0); ctx.stroke();
    ctx.restore();
  });
  
  // 蝴蝶 - 高分辨率渐变翅膀
  cacheSprite('butterfly', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    const gw = ctx.createRadialGradient(-s*0.4, -s*0.2, 0, 0, 0, s*0.8);
    gw.addColorStop(0, '#ff88d0'); gw.addColorStop(0.3, '#ffaa50');
    gw.addColorStop(0.6, '#e890d0'); gw.addColorStop(1, '#8a60aa');
    // 左翅
    ctx.fillStyle = gw; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(-s*0.8, -s*0.5, -s*0.9, -s*0.2, -s*0.5, s*0.1);
    ctx.bezierCurveTo(-s*0.7, s*0.3, -s*0.3, s*0.5, 0, s*0.1); ctx.closePath(); ctx.fill();
    // 右翅
    ctx.fillStyle = gw; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.8, -s*0.5, s*0.9, -s*0.2, s*0.5, s*0.1);
    ctx.bezierCurveTo(s*0.7, s*0.3, s*0.3, s*0.5, 0, s*0.1); ctx.closePath(); ctx.fill();
    // 身体
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(0, 0, s*0.08, s*0.25, 0, 0, 7); ctx.fill();
    ctx.restore();
  });
  
  // 知了
  cacheSprite('cicada', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#4a6a3a'; ctx.fillRect(-6, -20, 12, 32);
    ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.arc(0, -24, 16, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a4a2a'; ctx.beginPath(); ctx.ellipse(0, -18, 8, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(180,200,150,0.25)';
    ctx.beginPath(); ctx.ellipse(-4, -20, 5, 3, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -20, 5, 3, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#cc3333'; ctx.beginPath(); ctx.arc(-3, -19, 2, 0, 7); ctx.arc(3, -19, 2, 0, 7); ctx.fill();
    ctx.restore();
  });
  
  // 蜘蛛 + 网
  cacheSprite('spider', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(200,200,200,0.1)'; ctx.lineWidth = 0.5;
    for(let i=0;i<8;i++){let a=i*0.785;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*s*2,Math.sin(a)*s*2);ctx.stroke()}
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(0, 0, s*0.35, s*0.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(0, -s*0.25, s*0.25, s*0.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(-s*0.12, -s*0.3, 2, 0, 7); ctx.arc(s*0.12, -s*0.3, 2, 0, 7); ctx.fill();
    ctx.restore();
  });
  
  // 屎壳郎 + 粪球
  cacheSprite('dung', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    const bg = ctx.createRadialGradient(-4, 6, 0, 0, 4, s*0.7);
    bg.addColorStop(0, '#7a5a3a'); bg.addColorStop(0.5, '#5a3a1a'); bg.addColorStop(1, '#3a2a10');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s*0.5, s*0.3, s*0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.ellipse(0, 0, s*0.55, s*0.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a0a00'; ctx.beginPath(); ctx.arc(-s*0.35, -s*0.05, s*0.25, 0, 7); ctx.fill();
    ctx.restore();
  });
  
  // 小朋友
  cacheSprite('child', (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#e8c8a8'; ctx.beginPath(); ctx.arc(0, 0, s*0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0d8b8'; ctx.beginPath(); ctx.arc(0, -s*0.25, s*0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#c89830';
    ctx.beginPath(); ctx.ellipse(0, -s*0.5, s*0.35, s*0.08, 0, 0, 7); ctx.fill();
    ctx.fillRect(-s*0.25, -s*0.65, s*0.5, s*0.18);
    ctx.fillStyle = '#333'; ctx.beginPath();
    ctx.arc(-s*0.1, -s*0.28, 2, 0, 7); ctx.arc(s*0.1, -s*0.28, 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.arc(-s*0.08, -s*0.3, 0.8, 0, 7); ctx.arc(s*0.12, -s*0.3, 0.8, 0, 7); ctx.fill();
    ctx.fillStyle = '#c08060'; ctx.beginPath(); ctx.arc(0, -s*0.1, s*0.08, 0.1, 3, 0); ctx.fill();
    ctx.restore();
  });
}

// 用高分辨率 sprite 替代实时绘制
function drawSpriteFromCache(id, x, y, sz) {
  const c = SPRITE_CACHE[id];
  if (!c) return;
  ctx.drawImage(c, x - sz/2, y - sz/2, sz, sz);
}
function drawRealBug(bug) {
  const bx = bug.x, by = bug.y - (bug.flying ? 14 : 0);
  const sz = bug.size || 12;
  ctx.save(); ctx.translate(bx, by);
  
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath();
  ctx.ellipse(2, sz * 0.6, sz * 0.6, 3, 0, 0, 7); ctx.fill();
  
  if (bug.id === 'hopper') {
    ctx.fillStyle = '#5a8a30'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.8, sz * 0.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6a8a40'; ctx.beginPath(); ctx.arc(sz * 0.6, -sz * 0.1, sz * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath();
    ctx.arc(sz * 0.7, -sz * 0.15, 1.5, 0, 7); ctx.arc(sz * 0.7, sz * 0.05, 1.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5a7a28'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-sz * 0.3, sz * 0.2); ctx.lineTo(-sz * 0.7, sz * 0.7); ctx.lineTo(-sz * 0.5, sz * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-sz * 0.3, -sz * 0.2); ctx.lineTo(-sz * 0.7, -sz * 0.7); ctx.lineTo(-sz * 0.5, -sz * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(150,200,100,0.25)'; ctx.beginPath(); ctx.ellipse(-sz * 0.1, -sz * 0.35, sz * 0.4, sz * 0.15, -0.1, 0, 7); ctx.fill();
    
  } else if (bug.id === 'mantis') {
    ctx.fillStyle = '#4a7a30'; ctx.beginPath();
    ctx.moveTo(-sz * 0.8, 0); ctx.lineTo(0, -sz * 0.2); ctx.lineTo(sz * 0.8, -sz * 0.1);
    ctx.lineTo(sz * 0.8, sz * 0.1); ctx.lineTo(0, sz * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a8a30'; ctx.beginPath();
    ctx.moveTo(sz * 0.6, -sz * 0.3); ctx.lineTo(sz * 1.1, 0); ctx.lineTo(sz * 0.6, sz * 0.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(sz * 0.9, -sz * 0.1, 2, 0, 7); ctx.arc(sz * 0.9, sz * 0.1, 2, 0, 7); ctx.fill();
    
  } else if (bug.id === 'beetle') {
    ctx.fillStyle = '#4a2a10'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.9, sz * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2a10'; ctx.beginPath(); ctx.arc(sz * 0.6, -sz * 0.05, sz * 0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1a00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sz * 0.7, -sz * 0.15); ctx.lineTo(sz * 1.1, -sz * 0.35); ctx.lineTo(sz * 1.2, -sz * 0.2); ctx.stroke();
    
  } else if (bug.id === 'butterfly') {
    const w = bug.flying ? Math.sin(state.time * 12) * 0.3 : 0.05;
    ctx.fillStyle = '#ff88c0'; ctx.beginPath(); ctx.ellipse(-sz * 0.4, -sz * 0.2 + w, sz * 0.6, sz * 0.4, -0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff88c0'; ctx.beginPath(); ctx.ellipse(sz * 0.4, -sz * 0.2 + w, sz * 0.6, sz * 0.4, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.1, sz * 0.3, 0, 0, 7); ctx.fill();
    
  } else if (bug.id === 'cicada') {
    ctx.fillStyle = '#4a6a3a'; ctx.fillRect(-4, -14, 8, 22);
    ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.arc(0, -16, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a4a2a'; ctx.beginPath(); ctx.ellipse(0, -12, 5, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#cc3333'; ctx.beginPath(); ctx.arc(-2, -13, 1.5, 0, 7); ctx.arc(2, -13, 1.5, 0, 7); ctx.fill();
    
  } else if (bug.id === 'spider') {
    ctx.strokeStyle = 'rgba(200,200,200,0.12)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) { const a = i * 0.785; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * sz * 2.5, Math.sin(a) * sz * 2.5); ctx.stroke(); }
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.4, sz * 0.35, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(0, -sz * 0.3, sz * 0.3, sz * 0.25, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(-sz * 0.15, -sz * 0.35, 1.5, 0, 7); ctx.arc(sz * 0.15, -sz * 0.35, 1.5, 0, 7); ctx.fill();
    
  } else if (bug.id === 'dung') {
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(sz * 0.5, sz * 0.3, sz * 0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.6, sz * 0.35, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawBug(bug) {
  if (!bug) return;
  const alpha = bug.id === "mantis" && !state.poison ? 0.3 : 1;
  ctx.save();
  ctx.globalAlpha = bug.holeId ? 0.25 : alpha;
  if (bug.id === "spider") {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bug.x, bug.y, 28, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i * (Math.PI * 2 / 6);
      ctx.beginPath();
      ctx.moveTo(bug.x, bug.y);
      ctx.lineTo(bug.x + Math.cos(a) * 24, bug.y + Math.sin(a) * 18);
      ctx.stroke();
    }
  }
  if (bug.id === "cicada") {
    ctx.fillStyle = "#5f8a45";
    ctx.fillRect(bug.x - 4, bug.y + 4, 8, 18);
    ctx.beginPath();
    ctx.arc(bug.x, bug.y + 2, 14, Math.PI, 0);
    ctx.fill();
  }
  drawRealBug(bug);
  if (bug.id === "cicada" && bug.showCall) {
    ctx.fillStyle = "rgba(255,231,164,0.9)";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("知了!", bug.x, bug.y - 26);
  }
  ctx.restore();
}

function drawRealPlayer() {
  if (state.finish) return;
  ctx.save(); ctx.translate(player.x, player.y);
  const sz = 22;
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath();
  ctx.ellipse(2, sz * 0.6, sz * 0.7, 4, 0, 0, 7); ctx.fill();
  // 身体
  ctx.fillStyle = state.poison > 0 ? '#a080c0' : '#e8c8a8';
  ctx.beginPath(); ctx.arc(0, 0, sz, 0, 7); ctx.fill();
  // 头
  ctx.fillStyle = state.poison > 0 ? '#c090e0' : '#f0d8b8';
  ctx.beginPath(); ctx.arc(0, -sz * 0.3, sz * 0.5, 0, 7); ctx.fill();
  // 帽子
  ctx.fillStyle = '#c89830';
  ctx.beginPath(); ctx.ellipse(0, -sz * 0.6, sz * 0.55, sz * 0.12, 0, 0, 7); ctx.fill();
  ctx.fillRect(-sz * 0.4, -sz * 0.8, sz * 0.8, sz * 0.25);
  // 眼
  ctx.fillStyle = '#333'; ctx.beginPath();
  ctx.arc(-sz * 0.2, -sz * 0.35, 2.5, 0, 7); ctx.arc(sz * 0.2, -sz * 0.35, 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath();
  ctx.arc(-sz * 0.17, -sz * 0.38, 1, 0, 7); ctx.arc(sz * 0.23, -sz * 0.38, 1, 0, 7); ctx.fill();
  // 抄子
  const d = player.dir;
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(Math.cos(d) * sz * 0.5, Math.sin(d) * sz * 0.5);
  ctx.lineTo(Math.cos(d) * (sz + 18), Math.sin(d) * (sz + 18)); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,200,200,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(Math.cos(d) * (sz + 22), Math.sin(d) * (sz + 22), 8, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  if (state.finish) return;
  const sz = 48;
  const t = state.time;
  const px = player.x, py = player.y;
  
  // 走路晃动
  const walkBob = player.moving ? Math.sin(t * 8) * 2 : 0;
  
  // 2.5D 投影
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(px + 2, py + 5 + walkBob * 0.3, sz * 0.32, sz * 0.1, 0, 0, 7);
  ctx.fill();
  
  ctx.save();
  ctx.translate(px, py + walkBob);
  
  // 鞋子
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.ellipse(-10, 30, 9, 4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 30, 9, 4, 0, 0, 7); ctx.fill();
  
  // 裤子
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-14, 6, 28, 24);
  
  // 上衣
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(-18, 8); ctx.lineTo(18, 8); ctx.closePath();
  ctx.fill();
  
  // 手臂(带抄子)
  ctx.fillStyle = '#f0d8b8';
  ctx.fillRect(-22, 2, 8, 16);
  ctx.fillRect(14, 2, 8, 16);
  
  // 抄子
  const d = player.dir;
  ctx.save();
  ctx.translate(20, 8);
  ctx.rotate(d + 0.3);
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(24, -8); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(28, -10, 8, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
  ctx.restore();
  
  // 头
  ctx.fillStyle = '#f0d8b8';
  ctx.beginPath(); ctx.arc(0, -16, 16, 0, 7); ctx.fill();
  
  // 头发
  ctx.fillStyle = '#4a2a0a';
  ctx.beginPath(); ctx.arc(0, -18, 14, 3.14, 0); ctx.fill();
  
  // 草帽
  ctx.fillStyle = '#d4a030';
  ctx.beginPath(); ctx.ellipse(0, -28, 22, 5, 0, 0, 7); ctx.fill();
  ctx.fillRect(-12, -34, 24, 7);
  
  // 眼睛 (跟随方向)
  const eyeX = Math.cos(d) * 3;
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-5 + eyeX, -17, 2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + eyeX, -17, 2, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-4 + eyeX, -18, 0.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(6 + eyeX, -18, 0.8, 0, 7); ctx.fill();
  
  // 微笑
  ctx.strokeStyle = '#c08060'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -11, 4, 0.1, 2.8); ctx.stroke();
  
  ctx.restore();
}

function drawFloats() {
  for (const item of state.floats) {
    ctx.save();
    ctx.globalAlpha = clamp(item.life / 1.2, 0, 1);
    ctx.fillStyle = item.color;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}

function render(time) {
  updateCamera();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawTerrain();
  drawPondDetails(time);
  drawHoles(time);
  for (const bug of state.bugs) drawBug(bug, time);
  drawPlayer();
  drawFloats();
  if (state.poison > 0) {
    ctx.fillStyle = "rgba(158, 74, 201, 0.08)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}


function drawMinimap() {
  const mmW = 140, mmH = Math.round(mmW * 1088 / 1600);
  const mx = 960 - mmW - 10, my = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(mx - 4, my - 4, mmW + 8, mmH + 8, 8); }
  else { ctx.rect(mx - 4, my - 4, mmW + 8, mmH + 8); }
  ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mmW, mmH); ctx.clip();
  const sx = mmW / 1600, sy = mmH / 1088;
  for (let ty = 0; ty < 34; ty++) {
    for (let tx = 0; tx < 50; tx++) {
      const t = state.map[ty] ? state.map[ty][tx] : 'grass';
      let c = '#5a9a4a';
      if (t === 'road') c = '#8a7a6a';
      else if (t === 'pond') c = '#4a8aba';
      ctx.fillStyle = c;
      ctx.fillRect(mx + tx * 32 * sx, my + ty * 32 * sy, Math.max(1, 32 * sx), Math.max(1, 32 * sy));
    }
  }
  // 视野框
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(mx + camera.x * sx, my + camera.y * sy, 960 * sx, 640 * sy);
  // 玩家
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(mx + player.x * sx, my + player.y * sy, 3, 0, 7); ctx.fill();
    ctx.restore();
  ctx.restore();
}

function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  update(dt);
  render(state.time);
    drawMinimap();
  requestAnimationFrame(loop);
}

function handleAssetLoaded(name, img) {
  state.assets[name] = img;
}

function loadAssets() {
  // 游戏秒开, 不加载图片
  initSprites();
  const files = {
    child: selectedCharFile,
    grassTiles: ["assets/grass1_tile.png","assets/grass2_tile.png","assets/grass3_tile.png"],
    roadTiles: ["assets/road2_tile.png"],
    waterTiles: ["assets/water1_tile.png","assets/water2_tile.png"],
  };
  for (const [name, src] of Object.entries(files)) {
    const img = new Image();
    img.onload = () => handleAssetLoaded(name, img);
    img.onerror = () => {};
    img.src = src;
  }
}

async function downloadBlob(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

async function generateAssets() {
  const key = window.UCODE_API_KEY || document.querySelector('meta[name="ucode-api-key"]')?.content || "";
  const endpoint = "https://www.uocode.com/v1/images/generations";
  const promptMap = {
    child: "A cute cartoon child wearing a straw hat, smiling, full body, centered, transparent background, 64x64 sprite, colorful, clean outline, high detail.",
    grasshopper: "A realistic but cute cartoon grasshopper, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    mantis: "A realistic but cute cartoon praying mantis, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    beetle: "A realistic but cute cartoon rhinoceros beetle, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    butterfly: "A realistic but cute cartoon butterfly, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    cicada: "A realistic but cute cartoon cicada, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    spider: "A realistic but cute cartoon spider, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    dung: "A realistic but cute cartoon dung beetle with a small dung ball, transparent background, 64x64 sprite, colorful, non-pixel art, clean outline, isolated.",
    hole: "A realistic three-dimensional burrow hole with depth and rim, transparent background, 64x64 sprite, colorful, clean outline, isolated.",
  };
  const names = Object.keys(promptMap);
  const created = [];
  for (const name of names) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: promptMap[name],
          n: 1,
          size: "1024x1024",
        }),
      });
      if (!response.ok) throw new Error(`image api ${response.status}`);
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error("missing image url");
      await downloadBlob(imageUrl, `${name}.png`);
      created.push(name);
    } catch (error) {
      console.warn("asset generation failed for", name, error);
    }
  }
  return created;
}

function ensurePlayer() {
  return {
    x: TILE * 3 + 16,
    y: TILE * 3 + 16,
    dir: 0,
  };
}

let player = ensurePlayer();
let lastFrame = performance.now();

document.addEventListener("keydown", (event) => {
  state.keys[event.code] = true;
  if (["KeyE", "Space", "KeyQ", "KeyR"].includes(event.code)) event.preventDefault();
  initAudio();
  if (event.code === "KeyE" || event.code === "Space") catchWithNet();
  if (event.code === "KeyQ") shovelHole();
  if (event.code === "KeyR") window.location.href = "index.html";
});

document.addEventListener("keyup", (event) => {
  state.keys[event.code] = false;
});

ui.replayButton.addEventListener("click", () => window.location.reload());

canvas.addEventListener("pointerdown", () => initAudio(), { passive: true });

function initGame() {
  buildMap();
  createBurrows();
  spawnBugs();
  // 直接启动, 不加载图片 (虫子用Canvas画)
  ui.poisonWrap.style.display = "none";
  // 简单显示加载中的文字
  drawLoadingScreen();
  setTimeout(() => {
    requestAnimationFrame(loop);
  }, 300);
}

window.generateAssets = generateAssets;
window.bugCatchState = state;
initGame();
