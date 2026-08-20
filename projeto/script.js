/* ================================================================
   PARA VOCÊ ❤️ — lógica completa da experiência
================================================================ */

/* ----------------------------------------------------------------
   0. UTILITÁRIOS GERAIS
---------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(id);
  target.classList.add('active');
  return target;
}

/* Toca uma sequência de linhas de texto (fade in / hold / fade out)
   dentro de um elemento alvo. Retorna uma Promise resolvida ao final. */
async function playSequence(el, lines) {
  for (const item of lines) {
    const { text, hold = 2200, className = 'line big-line' } = item;
    el.className = className;
    el.textContent = text;
    el.classList.remove('show');
    // força reflow para reiniciar a transição
    void el.offsetWidth;
    el.classList.add('show');
    await wait(hold);
    el.classList.remove('show');
    await wait(700);
  }
}

/* ----------------------------------------------------------------
   1. FUNDO — corações subindo/descendo, brilhos e auras (canvas)
---------------------------------------------------------------- */
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgParticles = [];

const THEME_COLORS = {
  mystery:  [ [178,141,214], [212,175,122] ],
  fase1:    [ [224,99,122],  [212,175,122] ],
  fase2:    [ [212,175,122], [178,141,214] ],
  surprise: [ [224,99,122],  [178,141,214] ],
  letter:   [ [224,99,122],  [212,175,122] ],
  proposal: [ [224,99,122],  [212,175,122] ],
  final:    [ [224,99,122],  [212,175,122] ],
};
let currentTheme = 'mystery';

function resizeCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function pickColor() {
  const palette = THEME_COLORS[currentTheme] || THEME_COLORS.mystery;
  return palette[Math.floor(Math.random() * palette.length)];
}

/* Tipos de partícula: corações subindo, corações descendo (como
   pétalas), brilhinhos cintilantes e auras suaves (bokeh) — dá
   profundidade e variedade sem poluir a tela. */
function makeParticle(kind) {
  const type = kind || weightedType();
  const base = { type, color: pickColor(), wobble: Math.random() * Math.PI * 2 };

  if (type === 'heart-up') {
    return Object.assign(base, {
      x: Math.random() * bgCanvas.width,
      y: bgCanvas.height + Math.random() * 100,
      size: 6 + Math.random() * 14,
      speed: 0.25 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0.08 + Math.random() * 0.22,
      rot: 0,
    });
  }
  if (type === 'heart-down') {
    return Object.assign(base, {
      x: Math.random() * bgCanvas.width,
      y: -30 - Math.random() * 100,
      size: 5 + Math.random() * 10,
      speed: 0.18 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.6,
      opacity: 0.06 + Math.random() * 0.16,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }
  if (type === 'sparkle') {
    return Object.assign(base, {
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      size: 1 + Math.random() * 2,
      baseOpacity: 0.25 + Math.random() * 0.45,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      driftY: -(0.05 + Math.random() * 0.1),
    });
  }
  // orb (aura bokeh)
  return Object.assign(base, {
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    size: 60 + Math.random() * 90,
    speed: 0.06 + Math.random() * 0.1,
    drift: (Math.random() - 0.5) * 0.15,
    opacity: 0.04 + Math.random() * 0.05,
  });
}

function weightedType() {
  const r = Math.random();
  if (r < 0.38) return 'heart-up';
  if (r < 0.62) return 'heart-down';
  if (r < 0.85) return 'sparkle';
  return 'orb';
}

function initParticles(n = 60) {
  bgParticles = Array.from({ length: n }, () => {
    const p = makeParticle();
    if (p.type === 'heart-up' || p.type === 'orb') p.y = Math.random() * bgCanvas.height;
    if (p.type === 'heart-down') p.y = Math.random() * bgCanvas.height;
    return p;
  });
}
initParticles();

function drawHeart(ctx, x, y, size, color, opacity, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.beginPath();
  const s = size / 16;
  ctx.moveTo(0, 4 * s);
  ctx.bezierCurveTo(0, 2 * s, -2 * s, 0, -6 * s, 0);
  ctx.bezierCurveTo(-12 * s, 0, -12 * s, 8 * s, -12 * s, 8 * s);
  ctx.bezierCurveTo(-12 * s, 12 * s, -8 * s, 16 * s, 0, 22 * s);
  ctx.bezierCurveTo(8 * s, 16 * s, 12 * s, 12 * s, 12 * s, 8 * s);
  ctx.bezierCurveTo(12 * s, 8 * s, 12 * s, 0, 6 * s, 0);
  ctx.bezierCurveTo(2 * s, 0, 0, 2 * s, 0, 4 * s);
  ctx.closePath();
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx, p) {
  const tw = 0.5 + 0.5 * Math.sin(p.twinkle);
  const opacity = p.baseOpacity * tw;
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${opacity})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawOrb(ctx, p) {
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
  grad.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`);
  grad.addColorStop(1, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0)`);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function animateBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (const p of bgParticles) {
    if (p.type === 'heart-up') {
      p.y -= p.speed;
      p.wobble += 0.02;
      p.x += Math.sin(p.wobble) * p.drift;
      if (p.y < -30) { Object.assign(p, makeParticle('heart-up')); p.y = bgCanvas.height + 20; }
      drawHeart(bgCtx, p.x, p.y, p.size, p.color, p.opacity);

    } else if (p.type === 'heart-down') {
      p.y += p.speed;
      p.rot += p.rotSpeed;
      p.wobble += 0.015;
      p.x += Math.sin(p.wobble) * p.drift;
      if (p.y > bgCanvas.height + 30) { Object.assign(p, makeParticle('heart-down')); p.y = -20; }
      drawHeart(bgCtx, p.x, p.y, p.size, p.color, p.opacity, p.rot);

    } else if (p.type === 'sparkle') {
      p.twinkle += p.twinkleSpeed;
      p.y += p.driftY;
      if (p.y < -10) p.y = bgCanvas.height + 10;
      drawSparkle(bgCtx, p);

    } else if (p.type === 'orb') {
      p.y -= p.speed;
      p.wobble += 0.008;
      p.x += Math.sin(p.wobble) * p.drift;
      if (p.y < -p.size) { Object.assign(p, makeParticle('orb')); p.y = bgCanvas.height + p.size; }
      drawOrb(bgCtx, p);
    }
  }
  requestAnimationFrame(animateBg);
}
animateBg();

function setTheme(theme) {
  currentTheme = theme;
}

/* ----------------------------------------------------------------
   2. MOTOR DO CAÇA-PALAVRAS
---------------------------------------------------------------- */
// Palavras só podem ser encontradas na diagonal e "para frente":
// arrastando de cima para baixo, indo tanto para a direita (↘)
// quanto para a esquerda (↙) — nunca na horizontal, vertical ou
// de trás para frente.
const DIRECTIONS = [
  { dr: 1, dc: 1 },   // ↘
  { dr: 1, dc: -1 },  // ↙
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalizeKey(display) {
  return display.toUpperCase().replace(/\s+/g, '');
}

class WordSearch {
  /**
   * @param {HTMLElement} gridEl
   * @param {HTMLElement} listEl
   * @param {Array} words  [{display, message, locked, special}]
   * @param {Function} onWordFound (wordObj, allFoundInPhase) 
   * @param {Function} onPhaseComplete ()
   */
  constructor(gridEl, listEl, words, onWordFound, onPhaseComplete) {
    this.gridEl = gridEl;
    this.listEl = listEl;
    this.words = words.map((w) => ({ ...w, key: normalizeKey(w.display), found: false }));
    this.onWordFound = onWordFound;
    this.onPhaseComplete = onPhaseComplete;

    const longest = Math.max(...this.words.map((w) => w.key.length));
    this.size = Math.max(11, longest + 4);

    this.grid = [];
    this.placements = [];
    this.isSelecting = false;
    this.selection = [];
    this.startCell = null;

    this._buildGrid();
    this._renderGrid();
    this._renderList();
    this._bindEvents();
  }

  _emptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  _buildGrid() {
    let attemptsGlobal = 0;
    let ok = false;
    while (!ok && attemptsGlobal < 40) {
      attemptsGlobal++;
      this.grid = this._emptyGrid();
      this.placements = [];
      ok = true;
      const ordered = [...this.words].sort((a, b) => b.key.length - a.key.length);
      for (const w of ordered) {
        if (!this._placeWord(w)) { ok = false; break; }
      }
    }
    // preenche o restante com letras aleatórias
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          this.grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
      }
    }
  }

  _placeWord(w) {
    const letters = Array.from(w.key);
    const len = letters.length;
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 250; attempt++) {
      const dir = dirs[attempt % dirs.length];
      const row = Math.floor(Math.random() * this.size);
      const col = Math.floor(Math.random() * this.size);
      const endRow = row + dir.dr * (len - 1);
      const endCol = col + dir.dc * (len - 1);
      if (endRow < 0 || endRow >= this.size || endCol < 0 || endCol >= this.size) continue;

      let fits = true;
      for (let i = 0; i < len; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        const existing = this.grid[r][c];
        if (existing && existing !== letters[i]) { fits = false; break; }
      }
      if (!fits) continue;

      for (let i = 0; i < len; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        this.grid[r][c] = letters[i];
      }
      this.placements.push({ key: w.key, row, col, dir, len });
      return true;
    }
    return false;
  }

  _computeCellSize() {
    // espaço disponível estimado para a grade (reserva lugar para a
    // lista de palavras ao lado, em telas de computador)
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const isDesktop = viewportW >= 641;

    const availableW = isDesktop ? Math.min(viewportW * 0.6, 620) : viewportW * 0.92;
    const availableH = viewportH * 0.6;
    const available = Math.min(availableW, availableH * 1.05);

    const gap = 3;
    let cellPx = Math.floor((available - (this.size - 1) * gap) / this.size);
    cellPx = Math.max(14, Math.min(38, cellPx));

    this.gridEl.style.setProperty('--cell-size', `${cellPx}px`);
    this.gridEl.style.setProperty('--cell-font', `${Math.max(9, Math.round(cellPx * 0.42))}px`);
  }

  _renderGrid() {
    this.gridEl.innerHTML = '';
    this.gridEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    this._computeCellSize();
    this.cells = [];
    for (let r = 0; r < this.size; r++) {
      const rowCells = [];
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = this.grid[r][c];
        cell.dataset.row = r;
        cell.dataset.col = c;
        this.gridEl.appendChild(cell);
        rowCells.push(cell);
      }
      this.cells.push(rowCells);
    }
    window.addEventListener('resize', () => this._computeCellSize());
  }

  _renderList() {
    this.listEl.innerHTML = '';
    this.itemEls = {};
    for (const w of this.words) {
      const item = document.createElement('div');
      item.className = 'word-item';
      item.textContent = w.display;
      this.listEl.appendChild(item);
      this.itemEls[w.key] = item;
    }
  }

  _bindEvents() {
    this.gridEl.addEventListener('mousedown', (e) => this._start(e));
    this.gridEl.addEventListener('mousemove', (e) => this._move(e));
    window.addEventListener('mouseup', () => this._end());

    this.gridEl.addEventListener('touchstart', (e) => this._start(e), { passive: false });
    this.gridEl.addEventListener('touchmove', (e) => this._move(e), { passive: false });
    window.addEventListener('touchend', () => this._end());
  }

  _cellFromEvent(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !el.classList || !el.classList.contains('cell')) return null;
    return el;
  }

  _start(e) {
    const cell = this._cellFromEvent(e);
    if (!cell) return;
    if (e.type === 'touchstart') e.preventDefault();
    this.isSelecting = true;
    this.startCell = cell;
    this._setSelection([cell]);
  }

  _move(e) {
    if (!this.isSelecting) return;
    if (e.type === 'touchmove') e.preventDefault();
    const cell = this._cellFromEvent(e);
    if (!cell) return;

    const r0 = +this.startCell.dataset.row, c0 = +this.startCell.dataset.col;
    const r1 = +cell.dataset.row, c1 = +cell.dataset.col;
    const dr = r1 - r0, dc = c1 - c0;

    // só permite arrastar na diagonal e "para frente" (descendo):
    // ↘ (desce + direita) ou ↙ (desce + esquerda). Qualquer outra
    // direção é ignorada — a seleção não avança.
    if (dr <= 0 || Math.abs(dr) !== Math.abs(dc)) {
      this._setSelection([this.startCell]);
      return;
    }
    const stepR = 1;
    const stepC = dc > 0 ? 1 : -1;

    const len = Math.abs(dr) + 1;
    const path = [];
    for (let i = 0; i < len; i++) {
      const r = r0 + stepR * i;
      const c = c0 + stepC * i;
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) break;
      path.push(this.cells[r][c]);
    }
    this._setSelection(path.length ? path : [this.startCell]);
  }

  _setSelection(cells) {
    if (this.selection) this.selection.forEach((c) => c.classList.remove('selecting'));
    this.selection = cells;
    cells.forEach((c) => c.classList.add('selecting'));
  }

  _end() {
    if (!this.isSelecting) return;
    this.isSelecting = false;
    this._checkSelection();
  }

  _allOtherWordsFound(exceptKey) {
    return this.words.every((w) => w.key === exceptKey || w.found);
  }

  _checkSelection() {
    // só conta se for lida "para frente" (na ordem real da palavra),
    // nunca de trás para frente
    const letters = this.selection.map((c) => c.textContent).join('');

    const match = this.words.find((w) => !w.found && w.key === letters);

    if (match && (!match.locked || this._allOtherWordsFound(match.key))) {
      this._markFound(match);
    } else {
      this.selection.forEach((c) => c.classList.add('wrong'));
      setTimeout(() => this.selection.forEach((c) => c.classList.remove('wrong')), 350);
    }

    this.selection.forEach((c) => c.classList.remove('selecting'));
    this.selection = [];
  }

  _markFound(word) {
    word.found = true;
    this.selection.forEach((c) => {
      c.classList.remove('selecting');
      c.classList.add('found');
      if (word.special) c.classList.add('special');
    });
    const item = this.itemEls[word.key];
    if (item) item.classList.add('found');

    const remaining = this.words.filter((w) => !w.found).length;
    this.onWordFound(word, remaining === 0);

    if (remaining === 0) {
      setTimeout(() => this.onPhaseComplete(), 900);
    }
  }
}

/* ----------------------------------------------------------------
   3. MENSAGENS (TOAST)
---------------------------------------------------------------- */
let toastEl = null;
function showMessage(text, duration = 3400) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'message-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* ----------------------------------------------------------------
   4. DADOS DAS FASES
---------------------------------------------------------------- */
const FASE1_WORDS = [
  { display: 'SORRISO', message: 'Seu sorriso consegue melhorar até os meus piores dias.' },
  { display: 'CHEIRO', message: 'Sou viciado no seu cheiro, conseguiria ficar abraçado com você o dia todo, só sentindo seu cheiro.' },
  { display: 'OLHAR', message: 'Seus olhos me fazem viajar para longe, aonde eu encontro a paz.' },
  { display: 'CARINHO', message: 'O seu carinho me faz sentir amado, acolhido e em casa, mesmo nos dias mais difíceis.' },
  { display: 'ABRAÇO', message: 'Seu abraço é um dos lugares onde eu mais gosto de estar, meu porto seguro.' },
  { display: 'BEIJO', message: 'Seu beijo nunca me cansa, sempre quero mais, sentir a sua boca.' },
  { display: 'AMOR', message: 'O jeito que demonstra seu amor é aconchegante e quentinho.', locked: true, special: true },
];

const FASE2_WORDS = [
  { display: 'DIDI', message: 'É a gatinha mais incrível e amorosa que conheço.' },
  { display: 'BRINCADEIRAS', message: 'Todas as brincadeiras e piadas que fazemos me deixam muito leve, e eu amo.' },
  { display: 'SAFADEZA', message: 'Somos dois safados(a) e isso se encaixa totalmente entre a gente.' },
  { display: 'PROJECT ZOMBOID', message: 'Foi o primeiro jogo em que jogamos só nós dois, e até hoje amamos jogar.' },
  { display: 'ICARUS', message: 'Atualmente o jogo em que estamos focados a jogar, e sempre parece que sem você, ele não está completo.' },
  { display: 'DOCTOR WHO', message: 'A gente ama essa série, e sempre vemos juntinhos.' },
  { display: 'PARQUE CACHOEIRA', message: 'O nosso primeiro encontro.', special: true },
  { display: 'COMITÊ DO GUSTAVO', message: 'O nosso cantinho, aonde podemos chamar de lar, só nós dois.', locked: true, special: true },
];

/* ----------------------------------------------------------------
   5. FLUXO DA EXPERIÊNCIA
---------------------------------------------------------------- */
async function runIntro() {
  setTheme('mystery');
  showScreen('screen-intro1');
  const el1 = $('#screen-intro1 .content-box');
  const lines = $$('.line', el1);
  await wait(500);
  for (const l of lines) {
    l.classList.add('show');
    await wait(1400);
  }
  await wait(1800);

  showScreen('screen-intro2');
  const box2 = $('#screen-intro2 .content-box');
  $$('.line', box2).forEach((l, i) => setTimeout(() => l.classList.add('show'), 300 + i * 900));
  setTimeout(() => $('#btnStart').classList.add('reveal'), 300 + 2 * 900 + 400);
}

$('#btnStart').addEventListener('click', () => {
  $('#audioControls').classList.remove('hidden');
  playMusic();
  startFase1();
});

let fase1Game = null;
function startFase1() {
  setTheme('fase1');
  showScreen('screen-fase1');
  fase1Game = new WordSearch(
    $('#grid1'), $('#wordlist1'), FASE1_WORDS,
    (word) => showMessage(word.message),
    () => afterFase1()
  );
}

async function afterFase1() {
  setTheme('mystery');
  const screen = showScreen('screen-transition');
  const el = $('#transitionText', screen);
  await wait(600);
  await playSequence(el, [
    { text: 'Essa foi a primeira parte... ❤️', hold: 2600 },
    { text: 'Mas existem coisas que eu amo ainda mais...', hold: 2600 },
  ]);
  startFase2();
}

let fase2Game = null;
function startFase2() {
  setTheme('fase2');
  showScreen('screen-fase2');
  fase2Game = new WordSearch(
    $('#grid2'), $('#wordlist2'), FASE2_WORDS,
    (word) => showMessage(word.message),
    () => afterFase2()
  );
}

async function afterFase2() {
  setTheme('mystery');
  const screen = showScreen('screen-transition');
  const el = $('#transitionText', screen);
  await wait(800);
  await playSequence(el, [
    { text: 'Você encontrou tudo... ❤️', hold: 2400 },
    { text: 'Acho que você já sabe o que está acontecendo...', hold: 2600 },
    { text: 'Ou será que não? 👀', hold: 2400 },
  ]);
  startSurpresa();
}

async function startSurpresa() {
  setTheme('surprise');
  showScreen('screen-surpresa');
  const textEl = $('#surpresaText');
  textEl.textContent = '';
  textEl.classList.remove('show');
  await wait(1800);

  await playSequence(textEl, [
    { text: 'Você encontrou a surpresa.', hold: 2200, className: 'line sub-line' },
    { text: 'Bom...', hold: 1400, className: 'line sub-line' },
    { text: '...acho que você encontrou a surpresa.', hold: 2200, className: 'line sub-line' },
    { text: '...ou talvez ainda não. 👀', hold: 2400, className: 'line sub-line' },
  ]);
  startCarta();
}

/* Tenta vários nomes/extensões comuns de foto, para não depender
   de renomear o arquivo com precisão. Basta o arquivo estar dentro
   de assets/ com um nome parecido com "foto" (ou até qualquer nome
   comum de câmera/celular listado abaixo). */
const FOTO_CANDIDATES = [
  'foto.jpg', 'foto.jpeg', 'foto.png', 'foto.webp', 'foto.JPG', 'foto.JPEG', 'foto.PNG',
  'Foto.jpg', 'Foto.jpeg', 'Foto.png', 'FOTO.JPG', 'FOTO.PNG',
  'photo.jpg', 'photo.jpeg', 'photo.png',
  'nos.jpg', 'nós.jpg', 'casal.jpg', 'casal.jpeg', 'casal.png',
];

function loadFirstAvailable(imgEl, placeholderEl, candidates, basePath) {
  let i = 0;
  function tryNext() {
    if (i >= candidates.length) {
      imgEl.style.display = 'none';
      placeholderEl.style.display = 'flex';
      return;
    }
    const name = candidates[i++];
    imgEl.onload = () => { placeholderEl.style.display = 'none'; imgEl.style.display = 'block'; };
    imgEl.onerror = tryNext;
    imgEl.src = `${basePath}${name}`;
  }
  tryNext();
}

async function startCarta() {
  setTheme('letter');
  showScreen('screen-carta');
  const img = $('#fotoCasal');
  const placeholder = $('#photoPlaceholder');
  loadFirstAvailable(img, placeholder, FOTO_CANDIDATES, 'assets/');

  const cartaText = $('#cartaText');
  const fullText =
    'Sei que não sou a melhor pessoa do mundo, e que demorou mais do que deveria, mas eu estou disposto a viver por ti, amar por ti, e crescer por ti para todo o sempre.\n\n' +
    'Quero te amar mais a cada dia assim como tenho feito.\n\n' +
    'Eu sei que um único pedido é muito pouco, então irei te pedir quantas vezes forem necessárias.';
  cartaText.textContent = fullText;

  await wait(1400);
  cartaText.classList.add('show');
  await wait(7000);
  $('#btnAfterCarta').classList.remove('hidden');
  $('#btnAfterCarta').classList.add('reveal');
}

$('#btnAfterCarta').addEventListener('click', () => startPedido());

function startPedido() {
  setTheme('proposal');
  showScreen('screen-pedido');
}

$('#btnAsk').addEventListener('click', () => {
  $('#btnAsk').classList.add('hidden');
  const answerBox = $('#answerButtons');
  answerBox.classList.remove('hidden');
  setupRunawayButton();
});

/* --------- pegadinha do botão "Preciso pensar..." --------- */
function setupRunawayButton() {
  const container = $('#answerButtons');
  const thinkBtn = $('#btnThink');
  const waitMsg = $('#waitMsg');
  let dodgeCount = 0;
  const MAX_DODGES = 8;
  let active = true; // pausado enquanto mostra "Tudo bem... eu espero"
  let lastMouseX = -9999, lastMouseY = -9999;

  function dodge() {
    if (!active || dodgeCount >= MAX_DODGES) return;
    dodgeCount++;
    container.classList.add('dodging');

    const cRect = container.getBoundingClientRect();
    const bRect = thinkBtn.getBoundingClientRect();
    const maxLeft = Math.max(0, cRect.width - bRect.width);
    const maxTop = Math.max(0, cRect.height - bRect.height);

    const newLeft = Math.random() * maxLeft;
    const newTop = Math.random() * maxTop;

    thinkBtn.style.left = `${newLeft}px`;
    thinkBtn.style.top = `${newTop}px`;

    // depois de fugir, checa de novo se o cursor continua perto —
    // assim ele continua fugindo enquanto o mouse insistir em segui-lo
    setTimeout(() => proximityCheck(lastMouseX, lastMouseY), 120);
  }

  function proximityCheck(clientX, clientY) {
    if (!active || dodgeCount >= MAX_DODGES) return;
    const rect = thinkBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    if (dist < 110) dodge();
  }

  document.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    proximityCheck(e.clientX, e.clientY);
  });

  // rede de segurança: se o cursor "encostar" mesmo assim, foge também
  thinkBtn.addEventListener('mouseenter', () => dodge());

  thinkBtn.addEventListener('touchstart', (e) => {
    if (active && dodgeCount < MAX_DODGES) {
      e.preventDefault();
      dodge();
    }
  }, { passive: false });

  thinkBtn.addEventListener('click', () => {
    active = false;
    container.classList.remove('dodging');
    thinkBtn.style.left = '';
    thinkBtn.style.top = '';
    $('#answerButtons').classList.add('hidden');
    waitMsg.classList.remove('hidden');
    waitMsg.classList.add('show');

    setTimeout(() => {
      waitMsg.classList.remove('show');
      setTimeout(() => {
        waitMsg.classList.add('hidden');
        dodgeCount = 0;
        active = true;
        $('#answerButtons').classList.remove('hidden');
      }, 500);
    }, 2200);
  });
}

$('#btnYes').addEventListener('click', () => startFinal());

/* ----------------------------------------------------------------
   6. FINAL — CELEBRAÇÃO
---------------------------------------------------------------- */
function startFinal() {
  setTheme('final');
  showScreen('screen-final');
  startCelebrationCanvas();
  // a música já está tocando desde o botão "Começar ❤️" — não reinicia aqui
}

/* Mesmo raciocínio da foto: tenta vários nomes/extensões comuns
   de música, sem depender de um nome exato. */
const MUSICA_CANDIDATES = [
  'musica.mp3', 'musica.m4a', 'musica.wav', 'musica.ogg', 'musica.MP3',
  'Musica.mp3', 'MUSICA.MP3', 'music.mp3', 'cancao.mp3', 'canção.mp3', 'song.mp3',
];

function playMusic() {
  const audio = $('#bgMusic');
  audio.volume = $('#volumeSlider').value / 100;
  let i = 0;
  function tryNext() {
    if (i >= MUSICA_CANDIDATES.length) return; // nenhum arquivo encontrado, tudo bem
    const name = MUSICA_CANDIDATES[i++];
    audio.src = `assets/${name}`;
    audio.play().catch(tryNext);
  }
  audio.onerror = tryNext;
  tryNext();
  updateAudioIcon();
}

let lastVolume = 70;
$('#audioToggle').addEventListener('click', () => {
  const audio = $('#bgMusic');
  const slider = $('#volumeSlider');
  audio.muted = !audio.muted;
  if (!audio.muted && +slider.value === 0) {
    slider.value = lastVolume || 70;
    audio.volume = slider.value / 100;
  }
  updateAudioIcon();
});

$('#volumeSlider').addEventListener('input', (e) => {
  const audio = $('#bgMusic');
  const value = +e.target.value;
  audio.volume = value / 100;
  audio.muted = value === 0;
  if (value > 0) lastVolume = value;
  updateAudioIcon();
});

function updateAudioIcon() {
  const audio = $('#bgMusic');
  const slider = $('#volumeSlider');
  const isSilent = audio.muted || +slider.value === 0;
  $('#audioToggle').textContent = isSilent ? '🔇' : '🔈';
}

function startCelebrationCanvas() {
  const canvas = $('#celebration-canvas');
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#e0637a', '#d4af7a', '#b28dd6', '#f7ecd8', '#ff8fa3'];
  const confetti = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height,
    size: 5 + Math.random() * 7,
    speed: 1.5 + Math.random() * 2.5,
    drift: (Math.random() - 0.5) * 1.6,
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() > 0.5 ? 'rect' : 'heart',
  }));

  const rising = Array.from({ length: 26 }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 200,
    size: 10 + Math.random() * 18,
    speed: 0.6 + Math.random() * 1.1,
    drift: (Math.random() - 0.5) * 0.5,
    opacity: 0.5 + Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    wobble: Math.random() * Math.PI * 2,
  }));

  function hexToRgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  let frame = 0;
  const maxFrames = 60 * 30; // ~30s de festa intensa, depois segue mais suave

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of confetti) {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6);
      } else {
        const [r, g, b] = hexToRgb(p.color);
        drawHeart(ctx, 0, 0, p.size, [r, g, b], 0.95);
      }
      ctx.restore();
    }

    for (const h of rising) {
      h.y -= h.speed;
      h.wobble += 0.02;
      h.x += Math.sin(h.wobble) * h.drift;
      if (h.y < -30) {
        h.y = canvas.height + 20;
        h.x = Math.random() * canvas.width;
      }
      const [r, g, b] = hexToRgb(h.color);
      drawHeart(ctx, h.x, h.y, h.size, [r, g, b], h.opacity);
    }

    frame++;
    if (document.getElementById('screen-final').classList.contains('active')) {
      requestAnimationFrame(loop);
    }
  }
  loop();
}

/* ----------------------------------------------------------------
   7. INÍCIO
---------------------------------------------------------------- */
runIntro();
