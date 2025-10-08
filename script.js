(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const playBtn = document.getElementById('playBtn');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const overlay = document.getElementById('overlay');
  const scoreEl = document.getElementById('score');

  // state
  let highScore = localStorage.getItem("highScore") || 0;
  let bonusMeat = null;

  let box = 24;
  let cols = 0, rows = 0;
  let width = 0, height = 0;
  let snake = [];
  let dir = 'RIGHT';
  let nextDir = null;
  let fruit = null;
  let score = 0;
  let speed = 200;
  let timer = null;
  let running = false;

  const FRUITS = [
    { name: 'apple', color: '#ff4d4d', dark: '#cc0000', leaf: '#2b8b3a' },
    { name: 'orange', color: '#ff9a1f', dark: '#d36b00', leaf: '#3aa14a' },
    { name: 'lemon', color: '#fff176', dark: '#f1c40f', leaf: '#6aa84f' },
    { name: 'grape', color: '#9b59b6', dark: '#6b2e91', leaf: '#3b8b46' },
    { name: 'pear', color: '#b6d455', dark: '#8aa22a', leaf: '#2e8b3a' }
  ];

  // resize canvas
  function resize() {
    const minDimension = Math.min(window.innerWidth, window.innerHeight - 140);
    const targetCells = Math.max(12, Math.floor(minDimension / 28));
    box = Math.max(12, Math.floor(minDimension / targetCells));
    cols = Math.floor(Math.min(window.innerWidth, 720) / box);
    rows = Math.floor((window.innerHeight - 160) / box);
    width = cols * box;
    height = rows * box;
    canvas.width = width;
    canvas.height = height;
  }

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function init() {
    resize();
    snake = [];
    const sx = Math.floor(cols / 2) * box;
    const sy = Math.floor(rows / 2) * box;
    snake.push({ x: sx, y: sy });
    snake.push({ x: sx - box, y: sy });
    snake.push({ x: sx - 2 * box, y: sy });
    dir = 'RIGHT';
    nextDir = null;
    score = 0;
    fruit = spawnFruit();
    bonusMeat = null;
    updateScore();
  }

  function spawnFruit() {
    const f = pick(FRUITS);
    let pos, tries = 0;
    do {
      pos = { x: rand(0, cols - 1) * box, y: rand(0, rows - 1) * box };
      tries++;
      if (tries > 200) break;
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return { ...f, x: pos.x, y: pos.y };
  }

  function spawnBonusMeat() {
    let pos, tries = 0;
    do {
      pos = { x: rand(0, cols - 1) * box, y: rand(0, rows - 1) * box };
      tries++;
      if (tries > 200) break;
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    bonusMeat = { x: pos.x, y: pos.y, char: '🥩' };
  }

  function drawBackground() {
    ctx.fillStyle = '#6f4b2b';
    ctx.fillRect(0, 0, width, height);
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, 'rgba(255,255,255,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += box) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += box) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); ctx.stroke();
    }
  }

  function drawFruit(f) {
    const cx = f.x + box / 2;
    const cy = f.y + box / 2;
    const r = box * 0.42;
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.05, cx, cy, r);
    grad.addColorStop(0, '#fff8c8');
    grad.addColorStop(0.12, f.color);
    grad.addColorStop(1, f.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.45, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = f.leaf;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.42, cy - r * 0.55, r * 0.22, r * 0.12, -0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBonusMeat() {
    if (!bonusMeat) return;
    ctx.font = `${box * 0.8}px serif`;
    ctx.fillText(bonusMeat.char, bonusMeat.x, bonusMeat.y + box * 0.8);
  }

  function drawSnake() {
    for (let i = snake.length - 1; i >= 0; i--) {
      const p = snake[i];
      const isHead = i === 0;
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + box, p.y + box);
      if (isHead) { grad.addColorStop(0, '#c8ffe0'); grad.addColorStop(1, '#00c853'); }
      else { grad.addColorStop(0, '#9fe8a2'); grad.addColorStop(1, '#2e8b3a'); }
      ctx.fillStyle = grad;
      roundRect(ctx, p.x + 1, p.y + 1, box - 2, box - 2, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (!isHead) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let s = 2; s < box - 4; s += 6) ctx.fillRect(p.x + s, p.y + box - 6, 2, 3);
      } else {
        ctx.fillStyle = '#000';
        const eyeR = Math.max(1, Math.floor(box * 0.08));
        ctx.beginPath();
        ctx.arc(p.x + box * 0.28, p.y + box * 0.32, eyeR, 0, Math.PI * 2);
        ctx.arc(p.x + box * 0.72, p.y + box * 0.32, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(p.x + box * 0.45, p.y + box * 0.25, Math.max(1, Math.floor(box * 0.06)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function step() {
    const head = { ...snake[0] };
    const d = nextDir || dir;
    dir = d;
    if (d === 'LEFT') head.x -= box;
    if (d === 'RIGHT') head.x += box;
    if (d === 'UP') head.y -= box;
    if (d === 'DOWN') head.y += box;

    if (head.x >= width) head.x = 0;
    if (head.x < 0) head.x = width - box;
    if (head.y >= height) head.y = 0;
    if (head.y < 0) head.y = height - box;

    if (snake.some((s, idx) => idx > 0 && s.x === head.x && s.y === head.y)) { endGame(); return; }

    snake.unshift(head);

    // makan buah
    if (head.x === fruit.x && head.y === fruit.y) {
      score += 1;
      updateScore();
      fruit = spawnFruit();
      if (score % 6 === 0 && speed > 50) { speed = Math.max(50, speed - 8); restartTimer(); }
    } else snake.pop();

    // spawn bonus daging
    if (score % 10 === 0 && !bonusMeat) spawnBonusMeat();
    // cek makan bonus daging
    if (bonusMeat && head.x === bonusMeat.x && head.y === bonusMeat.y) {
      for (let i = 0; i < 5; i++) snake.push({ ...snake[snake.length - 1] });
      bonusMeat = null;
    }

    drawBackground();
    drawFruit(fruit);
    drawBonusMeat();
    drawSnake();
  }

  function gameLoop() { step(); }

  function start() {
    if (running) return;
    init();
    running = true;
    restartBtn.classList.remove('hidden');
    startBtn.classList.add('hidden');
    overlay.classList.add('hidden');
    restartTimer();
  }

  function restartTimer() { if (timer) clearInterval(timer); timer = setInterval(gameLoop, speed); }

  function endGame() {
    running = false;
    if (timer) clearInterval(timer);
    overlay.classList.remove('hidden');
    overlay.querySelector('h1').textContent = '💀 Permainan Selesai';
    overlay.querySelector('p').textContent = `Score: ${score} — Main Lagi!`;
    startBtn.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    // simpan highscore
    if (score > highScore) { highScore = score; localStorage.setItem("highScore", highScore); }
  }

  function updateScore() { scoreEl.textContent = `Score: ${score}`; }

  function setDir(newDir) {
    if (dir === 'LEFT' && newDir === 'RIGHT') return;
    if (dir === 'RIGHT' && newDir === 'LEFT') return;
    if (dir === 'UP' && newDir === 'DOWN') return;
    if (dir === 'DOWN' && newDir === 'UP') return;
    nextDir = newDir;
  }

  document.addEventListener('keydown', (e) => {
    if (!running && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) start();
    if (e.key === 'ArrowLeft') setDir('LEFT');
    if (e.key === 'ArrowRight') setDir('RIGHT');
    if (e.key === 'ArrowUp') setDir('UP');
    if (e.key === 'ArrowDown') setDir('DOWN');
  });

  let sx = 0, sy = 0;
  canvas.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0]; sx = t.clientX; sy = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (ev) => {
    if (!sx) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (Math.max(absX, absY) < 20) { sx = 0; sy = 0; return; }
    if (absX > absY) { if (dx > 0) setDir('RIGHT'); else setDir('LEFT'); }
    else { if (dy > 0) setDir('DOWN'); else setDir('UP'); }
    if (!running) start();
    sx = 0; sy = 0;
  }, { passive: true });

  playBtn.addEventListener('click', () => { overlay.classList.add('hidden'); start(); });
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', () => { overlay.classList.add('hidden'); start(); });

  window.addEventListener('resize', () => {
    const wasRunning = running;
    if (timer) clearInterval(timer);
    resize();
    snake = snake.filter(s => s.x < width && s.y < height);
    if (snake.length === 0) init();
    if (wasRunning) restartTimer();
    drawBackground(); drawFruit(fruit); drawBonusMeat(); drawSnake();
  });

  resize(); init(); drawBackground(); drawFruit(fruit); drawSnake();
})();

