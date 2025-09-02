// Minimal; readable; just vanilla JS.

const posEl = document.getElementById('pos');
const lastEl = document.getElementById('last');
const pointsEl = document.getElementById('points');
const livesEl = document.getElementById('lives');
const logEl = document.getElementById('log');
const rollBtn = document.getElementById('rollBtn');
const restartBtn = document.getElementById('restart');
const diceEl = document.getElementById('dice');
const miniGridEl = document.getElementById('miniGrid');
const warGridEl = document.getElementById('warGrid');
const warNameEl = document.getElementById('warName');
const playerNameEl = document.getElementById('playerName');
const bestScoreEl = document.getElementById('bestScore');

// modal bits
const introModal = document.getElementById('introModal');
const usernameInput = document.getElementById('username');
const acceptCheck = document.getElementById('accept');
const startBtn = document.getElementById('startBtn');

// leaderboard bits
const lbList = document.getElementById('lbList');
const clearLBBtn = document.getElementById('clearLB');

// persistence keys
const LB_KEY = 'cp_leaderboard';

// procedural map seed
const SEED = Math.floor(Math.random()*1e9);
function randForIndex(n){ const x = Math.sin(n*9301 + SEED*49297) * 233280; return x - Math.floor(x); }
// tile mix: trap 3%, snake 5%, ladder 6%, m3 8%, m2 12%, normal 66%
function tileAt(n){
  if(n <= 0) return { type:'normal' };
  const r = randForIndex(n);
  if(r < 0.03) return { type:'trap' };
  if(r < 0.08) return { type:'snake' };
  if(r < 0.14){ const jump = 5 + Math.floor(randForIndex(n*7+13)*16); return { type:'ladder', jump }; }
  if(r < 0.22) return { type:'m3' };
  if(r < 0.34) return { type:'m2' };
  return { type:'normal' };
}

// warriors (emoji for the picker; SVG for the big tile)
const WARRIORS = [
  { id:'ronin',  name:'Neon Ronin',  color:'#00eaff', bg:'linear-gradient(135deg,#03243a,#0e2b3f)',  icon:'⚔️' },
  { id:'ninja',  name:'Synth Ninja', color:'#ff00e5', bg:'linear-gradient(135deg,#2a0b2e,#3b0f4a)',  icon:'🗡️' },
  { id:'tank',   name:'Chrome Tank', color:'#00ff88', bg:'linear-gradient(135deg,#0a3526,#0c4a33)',  icon:'🛡️' },
  { id:'ghost',  name:'Ghost Runner',color:'#8a5bff', bg:'linear-gradient(135deg,#1e1a3c,#2a2257)',  icon:'👻' },
  { id:'hacker', name:'Grid Hacker', color:'#ffb020', bg:'linear-gradient(135deg,#3a2a0a,#4a3510)',  icon:'💾' },
];
let currentWarriorId = WARRIORS[0].id;

// crisp SVG icons (white on colored tile)
function warriorSVG(id){
  switch(id){
    case 'ronin': return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M12 50l22-22m-8 30L54 30" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="12" cy="50" r="4" fill="#fff"/><circle cx="46" cy="8" r="3" fill="#fff"/></svg>`;
    case 'ninja': return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M32 8l6 14 14 6-14 6-6 14-6-14-14-6 14-6z"/><circle cx="32" cy="32" r="4" fill="#000"/></svg>`;
    case 'tank':  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 6l18 6v16c0 12-7 20-18 24C21 48 14 40 14 28V12z" fill="#fff"/></svg>`;
    case 'ghost': return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 10c10 0 18 8 18 18v18c0 3-2 4-4 2-2-2-4-2-6 0s-4 2-6 0-4-2-6 0-4 2-6 0-4-1-4-4V28C18 18 22 10 32 10z" fill="#fff"/><circle cx="26" cy="28" r="3" fill="#000"/><circle cx="38" cy="28" r="3" fill="#000"/><path d="M28 36c2 2 6 2 8 0" stroke="#000" stroke-width="3" stroke-linecap="round"/></svg>`;
    case 'hacker':return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="14" width="36" height="36" rx="6" fill="#fff"/><path d="M6 24h8m0 0v-8M58 24h-8m0 0v-8M6 40h8m0 0v8M58 40h-8m0 0v8" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`;
    default:      return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#fff"/></svg>`;
  }
}

/* warrior picker */
function renderWarriors(){
  warGridEl.innerHTML = '';
  WARRIORS.forEach(w=>{
    const card = document.createElement('button');
    card.className = 'war-card';
    card.type = 'button';
    card.dataset.id = w.id;

    const face = document.createElement('div');
    face.className = 'war-portrait';
    face.style.background = w.bg;
    face.style.boxShadow = `inset 0 0 20px ${w.color}55, 0 0 12px ${w.color}22`;
    face.style.borderColor = `${w.color}55`;
    face.textContent = w.icon;

    const name = document.createElement('div');
    name.className = 'war-name';
    name.textContent = w.name;

    card.append(face, name);
    card.addEventListener('click', ()=> setWarrior(w, true));
    warGridEl.appendChild(card);
  });
  updateWarriorSelectionUI();
}
function setWarrior(w, persist){
  document.documentElement.style.setProperty('--accent', w.color);
  warNameEl.textContent = w.name;
  if(persist) localStorage.setItem('cp_warrior', w.id);
  currentWarriorId = w.id;
  updateWarriorSelectionUI();
  updateMiniMap(); // recolor avatar immediately
}
function updateWarriorSelectionUI(){
  const id = currentWarriorId;
  [...warGridEl.children].forEach(card=>{
    const on = card.dataset.id===id;
    card.dataset.selected = String(on);
    if(on){
      const w = WARRIORS.find(x=>x.id===id);
      card.style.boxShadow = `0 0 12px ${w.color}33, inset 0 0 18px ${w.color}22`;
      card.style.borderColor = `${w.color}aa`;
    }else{
      card.style.boxShadow = '';
      card.style.borderColor = '#1b2537';
    }
  });
}
function loadWarrior(){
  const saved = localStorage.getItem('cp_warrior');
  setWarrior(WARRIORS.find(w=>w.id===saved) || WARRIORS[0], false);
}

/* endless window (10×10) */
let windowStart = 1;
function rebuildWindow(){
  miniGridEl.innerHTML = '';
  for(let i=0;i<100;i++){
    const idx = windowStart + (99 - i);
    const cell = document.createElement('div');
    cell.className = 'mini-cell';
    const t = tileAt(idx);
    if(t.type==='ladder') cell.classList.add('mini-ladder');
    if(t.type==='snake')  cell.classList.add('mini-snake');
    if(t.type==='m2')     cell.classList.add('mini-m2');
    if(t.type==='m3')     cell.classList.add('mini-m3');
    if(t.type==='trap')   cell.classList.add('mini-trap');
    cell.dataset.n = idx;
    miniGridEl.appendChild(cell);
  }
}
function ensureVisible(target){
  const desiredStart = Math.max(1, target - 30);
  if (target < windowStart || target > windowStart + 99){
    windowStart = desiredStart;
    rebuildWindow();
  }
}
function updateMiniMap(){
  ensureVisible(pos);
  const current = WARRIORS.find(x => x.id === currentWarriorId) || WARRIORS[0];
  for (const c of miniGridEl.children) {
    const here = Number(c.dataset.n) === pos;
    c.classList.toggle('mini-active', here);

    const old = c.querySelector('.mini-avatar');
    if (old) old.remove();

    if (here) {
      const holder = document.createElement('div');
      holder.className = 'mini-avatar';
      holder.innerHTML = warriorSVG(current.id);
      holder.setAttribute('aria-hidden', 'true');
      c.appendChild(holder);
      c.title = `${current.name} @ ${pos}`;
    } else {
      if(!c.classList.contains('mini-ladder') &&
         !c.classList.contains('mini-snake') &&
         !c.classList.contains('mini-m2') &&
         !c.classList.contains('mini-m3') &&
         !c.classList.contains('mini-trap')) c.removeAttribute('title');
    }
  }
}
function fitHeroGrid(){
  const host = miniGridEl.parentElement;
  const pad = 28, gap = 6;
  const w = host.clientWidth - pad;
  const h = host.clientHeight - pad;
  const limiting = Math.min(w, h);
  const cell = Math.floor((limiting - gap*9) / 10);
  const size = Math.max(18, Math.min(60, cell));
  miniGridEl.style.gridTemplateColumns = `repeat(10, ${size}px)`;
  miniGridEl.style.gridTemplateRows    = `repeat(10, ${size}px)`;
}

/* dice */
const pipMaps = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
function renderDice(n){
  const p = document.createElement('div'); p.className='pips';
  for(let i=0;i<9;i++){
    const d = document.createElement('div'); d.className='pip';
    d.style.opacity = pipMaps[n]?.includes(i) ? 1 : .1;
    p.appendChild(d);
  }
  diceEl.innerHTML=''; diceEl.appendChild(p);
}

/* game state */
let pos = 1;
let points = 0;
let lives = 3;
let locked = false;

function setPoints(v){ points = v; pointsEl.textContent = String(points); }
function setLives(v){ lives = v; livesEl.textContent = String(lives); }
function log(msg){ logEl.innerHTML = `<div>${msg}</div>` + logEl.innerHTML; }
function placeToken(){ posEl.textContent = String(pos); updateMiniMap(); }

/* identity + best score */
function loadIdentity(){
  const name = localStorage.getItem('cp_username');
  if(name){ playerNameEl.textContent = name; } else { showIntro(); }
  const best = parseInt(localStorage.getItem('cp_best')||'0',10);
  bestScoreEl.textContent = String(best);
}
function setBestIfHigher(score){
  const best = parseInt(localStorage.getItem('cp_best')||'0',10);
  if(score > best){
    localStorage.setItem('cp_best', String(score));
    bestScoreEl.textContent = String(score);
  }
}

/* LOCAL LEADERBOARD ----------------------- */
function loadLeaderboard(){
  try{ return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
  catch{ return []; }
}
function saveLeaderboard(list){
  localStorage.setItem(LB_KEY, JSON.stringify(list));
}
function addToLeaderboard(name, score){
  const now = new Date();
  const entry = { name, score, ts: now.toISOString() };
  const list = loadLeaderboard();

  list.push(entry);
  // sort higher first, then earlier timestamp to break ties
  list.sort((a,b)=> b.score - a.score || new Date(a.ts) - new Date(b.ts));
  // keep top 10
  const top = list.slice(0, 10);
  saveLeaderboard(top);
  return top;
}
function renderLeaderboard(){
  const list = loadLeaderboard();
  lbList.innerHTML = '';
  if(list.length === 0){
    const li = document.createElement('li');
    li.className = 'lb-item';
    li.innerHTML = `<span class="who">No scores yet.</span><span class="when"></span>`;
    lbList.appendChild(li);
    return;
  }
  list.forEach(item=>{
    const when = new Date(item.ts);
    const li = document.createElement('li');
    li.className = 'lb-item';
    li.innerHTML = `
      <span class="who">${escapeHTML(item.name)}</span>
      <span class="score">${item.score}</span>
      <span class="when">${when.toLocaleDateString()} ${when.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
    `;
    lbList.appendChild(li);
  });
}
function clearLeaderboard(){
  if(!confirm('Clear local leaderboard?')) return;
  saveLeaderboard([]);
  renderLeaderboard();
}
clearLBBtn.addEventListener('click', clearLeaderboard);

// tiny helper to avoid weird names breaking the UI
function escapeHTML(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* tile aftermath */
function applyTileEffects(){
  const t = tileAt(pos);
  if(t.type==='ladder'){
    const jump = t.jump, bonus = jump * 20;
    pos += jump; setPoints(points + bonus);
    ensureVisible(pos);
    log(`🚀 Ladder +${jump} → <b>${pos}</b> (bonus +${bonus})`);
    placeToken();
  }else if(t.type==='snake'){
    pos = 1; ensureVisible(pos);
    log(`🐍 Snake! Back to start.`);
    placeToken();
  }else if(t.type==='trap'){
    setLives(Math.max(0, lives-1));
    pos = 1; ensureVisible(pos);
    log(`☠️ Death trap! Lost <b>1 life</b>. Lives left: ${lives}`);
    placeToken();
    if(lives === 0) gameOver();
  }
}

/* move loop */
async function animateMove(steps){
  if(lives <= 0) return;
  locked = true; rollBtn.disabled = true;

  for(let i=0;i<steps;i++){
    if(lives <= 0) break;
    pos += 1;
    let gain = 1;
    const t = tileAt(pos);
    if(t.type==='m2') gain *= 2;
    if(t.type==='m3') gain *= 3;
    setPoints(points + gain);
    placeToken();
    await new Promise(r=>setTimeout(r, 140));
  }

  applyTileEffects();

  if(lives > 0){
    locked = false; rollBtn.disabled = false;
  }
}

function roll(){
  if(locked || lives<=0) return;
  const n = Math.floor(Math.random()*6)+1;
  lastEl.textContent = String(n);
  renderDice(n);
  log(`Rolled <b>${n}</b>`);
  animateMove(n);
}

function gameOver(){
  locked = true;
  rollBtn.disabled = true;
  log(`<b style="color:var(--gold)">Game Over</b> — final score: <b>${points}</b>`);

  // update best + leaderboard
  setBestIfHigher(points);
  const name = localStorage.getItem('cp_username') || 'Player';
  addToLeaderboard(name, points);
  renderLeaderboard();
}

function restart(){
  pos = 1; setPoints(0); setLives(3); lastEl.textContent = '–';
  windowStart = 1; rebuildWindow(); ensureVisible(pos); placeToken();
  rollBtn.disabled = false; locked = false;
  log('— Reset —');
}

/* intro UX */
function showIntro(){
  introModal.classList.remove('hidden');
  introModal.setAttribute('aria-hidden','false');
  setTimeout(()=> usernameInput.focus(), 50);
}
function hideIntro(){
  introModal.classList.add('hidden');
  introModal.setAttribute('aria-hidden','true');
}
function validateForm(){
  const ok = usernameInput.value.trim().length >= 3 && acceptCheck.checked;
  startBtn.disabled = !ok;
}
usernameInput.addEventListener('input', validateForm);
acceptCheck.addEventListener('change', validateForm);
startBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if(name.length < 3 || !acceptCheck.checked) return;
  localStorage.setItem('cp_username', name);
  localStorage.setItem('cp_accept', 'yes');
  playerNameEl.textContent = name;
  hideIntro();
});

/* boot */
renderWarriors();
loadWarrior();
loadIdentity();
rebuildWindow(); fitHeroGrid(); renderDice(6); placeToken();
renderLeaderboard();

window.addEventListener('resize', fitHeroGrid);
rollBtn.onclick = roll;
diceEl.onclick = roll;
restartBtn.onclick = restart;

// hotkeys, but not while modal is up
document.addEventListener('keydown', e=>{
  if(!introModal.classList.contains('hidden')) return;
  if(e.key.toLowerCase()==='r') roll();
  if(e.key.toLowerCase()==='n') restart();
});
