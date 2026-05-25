/* ══════════════════════════════════════
   CRACK THE CODE — script.js
   ══════════════════════════════════════ */

/* ── SETTINGS STATE ── */
const DEFAULTS = { theme: 'slate', digits: 4, dups: true, mode: 'computer' };
let S = {
    theme: localStorage.getItem('ctc_theme') || DEFAULTS.theme,
    digits: Number(localStorage.getItem('ctc_digits')) || DEFAULTS.digits,
    dups: localStorage.getItem('ctc_dups') !== 'false',
    mode: localStorage.getItem('ctc_mode') || DEFAULTS.mode,
};

/* ── GAME STATE ── */
let secret = '', attempts = 0, gameOver = false, guessCount = 0;

/* 2-player */
let p1Secret = '', p2Secret = '';
let p1Att = 0, p2Att = 0;
let p1Hist = [], p2Hist = [];
let curPlayer = 1, setupPhase = 0;

/* ── DOM REFS ── */
const $ = id => document.getElementById(id);

const settingsBtn = $('settingsBtn');
const sOverlay = $('sOverlay');
const sPanel = $('sPanel');
const sClose = $('sClose');
const modeGroup = $('modeGroup');
const digitsGroup = $('digitsGroup');
const dupToggle = $('dupToggle');
const themeGrid = $('themeGrid');
const applyBtn = $('applyBtn');

const setupScreen = $('setupScreen');
const setupBadge = $('setupBadge');
const setupDigits = $('setupDigits');
const setupInput = $('setupInput');
const setupErr = $('setupErr');
const setupBtn = $('setupBtn');

const winScreen = $('winScreen');
const winEmoji = $('winEmoji');
const winTitle = $('winTitle');
const winSub = $('winSub');
const winStats = $('winStats');
const winBtn = $('winBtn');

const gameScreen = $('gameScreen');
const playerPill = $('playerPill');
const playerLabel = $('playerLabel');
const digitLabel = $('digitLabel');
const guessInput = $('guessInput');
const guessBtn = $('guessBtn');
const msgEl = $('message');
const attEl = $('attempts');
const bestEl = $('bestScore');
const histList = $('historyList');
const histCount = $('historyCount');
const histEmpty = $('historyEmpty');
const passBtn = $('passBtn');
const passTarget = $('passTarget');

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
applyTheme(S.theme);
syncSettingsUI();
showScreen('game');
startGame();

/* ══════════════════════════════════════
   SCREEN MANAGEMENT
   ══════════════════════════════════════ */
function showScreen(name) {
    setupScreen.classList.toggle('visible', name === 'setup');
    winScreen.classList.toggle('visible', name === 'win');
    gameScreen.classList.toggle('visible', name === 'game');
}

/* ══════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════ */
settingsBtn.addEventListener('click', openSettings);
sClose.addEventListener('click', closeSettings);
sOverlay.addEventListener('click', closeSettings);

function openSettings() {
    syncSettingsUI();
    sOverlay.classList.add('open');
    sPanel.classList.add('open');
}
function closeSettings() {
    sOverlay.classList.remove('open');
    sPanel.classList.remove('open');
}

modeGroup.addEventListener('click', e => {
    const b = e.target.closest('.seg');
    if (!b) return;
    modeGroup.querySelectorAll('.seg').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
});
digitsGroup.addEventListener('click', e => {
    const b = e.target.closest('.seg');
    if (!b) return;
    digitsGroup.querySelectorAll('.seg').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
});
themeGrid.addEventListener('click', e => {
    const b = e.target.closest('.th-opt');
    if (!b) return;
    themeGrid.querySelectorAll('.th-opt').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    applyTheme(b.dataset.val);
});

applyBtn.addEventListener('click', () => {
    const modeActive = modeGroup.querySelector('.seg.active');
    const digitsActive = digitsGroup.querySelector('.seg.active');
    const themeActive = themeGrid.querySelector('.th-opt.active');
    if (!modeActive || !digitsActive || !themeActive) return;

    S.mode = modeActive.dataset.val;
    S.digits = Number(digitsActive.dataset.val);
    S.theme = themeActive.dataset.val;
    S.dups = dupToggle.checked;

    localStorage.setItem('ctc_theme', S.theme);
    localStorage.setItem('ctc_digits', S.digits);
    localStorage.setItem('ctc_dups', S.dups);
    localStorage.setItem('ctc_mode', S.mode);

    closeSettings();
    startGame();
});

function syncSettingsUI() {
    modeGroup.querySelectorAll('.seg').forEach(b =>
        b.classList.toggle('active', b.dataset.val === S.mode));
    digitsGroup.querySelectorAll('.seg').forEach(b =>
        b.classList.toggle('active', Number(b.dataset.val) === S.digits));
    themeGrid.querySelectorAll('.th-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.val === S.theme));
    dupToggle.checked = S.dups;
}

function applyTheme(t) {
    document.body.className = 'theme-' + t;
}

/* ══════════════════════════════════════
   GAME START
   ══════════════════════════════════════ */
function startGame() {
    gameOver = false;
    attempts = 0;
    guessCount = 0;

    guessInput.maxLength = S.digits;
    guessInput.placeholder = Array(S.digits).fill('_').join(' ');
    digitLabel.textContent = S.digits;

    // Reset button state
    guessBtn.textContent = 'Submit';
    guessBtn.classList.remove('play-again');
    guessBtn.disabled = false;
    guessBtn.onclick = null;

    if (S.mode === 'computer') startComputer();
    else startTwoPlayer();
}

/* ── VS COMPUTER ── */
function startComputer() {
    secret = genSecret(S.digits, S.dups);
    playerPill.style.display = 'none';
    passBtn.style.display = 'none';
    bestEl.style.display = '';

    resetHistoryUI();
    setMsg('Start guessing…', '');
    attEl.textContent = 'Attempts: 0';
    guessInput.value = '';
    guessInput.disabled = false;

    renderBest();
    showScreen('game');
    focusInput();
}

/* ══════════════════════════════════════
   2-PLAYER FLOW
   ══════════════════════════════════════ */
function startTwoPlayer() {
    p1Secret = ''; p2Secret = '';
    p1Att = 0; p2Att = 0;
    p1Hist = []; p2Hist = [];
    curPlayer = 1; setupPhase = 1;
    bestEl.style.display = 'none';
    showSetupScreen(1);
}

function showSetupScreen(player) {
    setupBadge.textContent = 'Player ' + player;
    setupDigits.textContent = S.digits;
    setupInput.maxLength = S.digits;
    setupInput.placeholder = '•'.repeat(S.digits);
    setupInput.value = '';
    setupErr.textContent = '';
    showScreen('setup');
    setTimeout(() => setupInput.focus(), 200);
}

setupInput.addEventListener('input', () => {
    setupInput.value = setupInput.value.replace(/\D/g, '').slice(0, S.digits);
    setupErr.textContent = '';
});
setupBtn.addEventListener('click', lockIn);
setupInput.addEventListener('keydown', e => { if (e.key === 'Enter') lockIn(); });

function lockIn() {
    const v = setupInput.value;
    const err = validate(v);
    if (err) { setupErr.textContent = err; return; }

    if (setupPhase === 1) {
        p1Secret = v;
        setupPhase = 2;
        showSetupScreen(2);
    } else {
        p2Secret = v;
        setupPhase = 3;
        curPlayer = 1;
        beginRound();
    }
}

function beginRound() {
    resetHistoryUI();
    playerPill.style.display = 'flex';
    passBtn.style.display = 'none';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    guessBtn.textContent = 'Submit';
    guessBtn.classList.remove('play-again');
    guessBtn.onclick = null;

    renderPill();
    renderPlayerHistory();
    renderPlayerMeta();
    showScreen('game');
    focusInput();
}

function renderPill() {
    playerLabel.textContent = 'Player ' + curPlayer + "'s turn";
}

function renderPlayerHistory() {
    const hist = curPlayer === 1 ? p1Hist : p2Hist;
    resetHistoryUI();
    // hist is stored newest-first; render in that order so newest is at top
    hist.forEach(h => appendHistRow(h.att, h.guess, h.c, h.p, h.win));
    updateHistCount(hist.length);
}

function renderPlayerMeta() {
    const att = curPlayer === 1 ? p1Att : p2Att;
    attEl.textContent = 'Attempts: ' + att;
    guessInput.value = '';
    if (att === 0) setMsg('Start guessing…', '');
}

/* ══════════════════════════════════════
   GUESS HANDLER
   ══════════════════════════════════════ */
guessBtn.addEventListener('click', handleGuess);
guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleGuess(); });
guessInput.addEventListener('input', () => {
    guessInput.value = guessInput.value.replace(/\D/g, '').slice(0, S.digits);
    if (msgEl.dataset.state === 'err') setMsg('Start guessing…', '');
});

function handleGuess() {
    if (gameOver) return;
    const g = guessInput.value.trim();
    const err = validate(g);
    if (err) { setMsg(err, 'err'); return; }

    if (S.mode === 'computer') doComputerGuess(g);
    else doTwoPlayerGuess(g);
}

/* ── Computer guess ── */
function doComputerGuess(g) {
    attempts++;
    guessCount++;
    attEl.textContent = 'Attempts: ' + attempts;

    if (g === secret) {
        setMsg('🎉 You cracked it!', 'win');
        appendHistRow(attempts, g, null, null, true);
        saveBest(attempts);
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = false;
        guessBtn.textContent = 'Play Again';
        guessBtn.classList.add('play-again');
        guessBtn.onclick = () => { guessBtn.onclick = null; startGame(); };
        updateHistCount(guessCount);
        return;
    }

    const { c, p } = feedback(g, secret);
    setMsg(c + 'C  ' + p + 'P', '');
    appendHistRow(attempts, g, c, p, false);
    updateHistCount(guessCount);
    guessInput.value = '';
    focusInput();
}

/* ── 2-player guess ── */
function doTwoPlayerGuess(g) {
    const sec = curPlayer === 1 ? p2Secret : p1Secret;
    if (curPlayer === 1) p1Att++; else p2Att++;
    const att = curPlayer === 1 ? p1Att : p2Att;
    attEl.textContent = 'Attempts: ' + att;

    if (g === sec) {
        const hist = curPlayer === 1 ? p1Hist : p2Hist;
        hist.unshift({ att, guess: g, c: null, p: null, win: true });
        appendHistRow(att, g, null, null, true);
        updateHistCount(hist.length);
        const winner = curPlayer, wAtt = att, lAtt = curPlayer === 1 ? p2Att : p1Att;
        setTimeout(() => show2PWin(winner, wAtt, lAtt), 600);
        return;
    }

    const { c, p } = feedback(g, sec);
    setMsg(c + 'C  ' + p + 'P', '');
    const hist = curPlayer === 1 ? p1Hist : p2Hist;
    hist.unshift({ att, guess: g, c, p, win: false });
    appendHistRow(att, g, c, p, false);
    updateHistCount(hist.length);

    guessInput.value = '';
    guessInput.disabled = true;
    guessBtn.disabled = true;
    passTarget.textContent = curPlayer === 1 ? 2 : 1;
    passBtn.style.display = 'block';
}

passBtn.addEventListener('click', () => {
    curPlayer = curPlayer === 1 ? 2 : 1;
    passBtn.style.display = 'none';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    renderPill();
    renderPlayerHistory();
    renderPlayerMeta();
    focusInput();
});

/* ══════════════════════════════════════
   WIN SCREEN
   ══════════════════════════════════════ */
function show2PWin(winner, wAtt, lAtt) {
    const loser = winner === 1 ? 2 : 1;
    winEmoji.textContent = '🏆';
    winTitle.textContent = 'Player ' + winner + ' wins!';
    winSub.textContent = 'Player ' + winner + ' cracked the code in ' +
        wAtt + (wAtt === 1 ? ' guess' : ' guesses') + '!';
    winStats.innerHTML = `
    <div class="win-stat">
      <div class="win-stat-n">${wAtt}</div>
      <div class="win-stat-l">P${winner} guesses</div>
    </div>
    <div class="win-stat">
      <div class="win-stat-n">${lAtt}</div>
      <div class="win-stat-l">P${loser} guesses</div>
    </div>`;
    winBtn.onclick = () => startGame();
    showScreen('win');
}

/* ══════════════════════════════════════
   FEEDBACK ALGORITHM
   C = correct digit anywhere (pool-based, no double-count)
   P = correct digit in correct position
   ══════════════════════════════════════ */
function feedback(guess, sec) {
    let p = 0;
    for (let i = 0; i < sec.length; i++) {
        if (guess[i] === sec[i]) p++;
    }
    let c = 0;
    const pool = [...sec];
    for (const d of guess) {
        const idx = pool.indexOf(d);
        if (idx !== -1) { c++; pool[idx] = null; }
    }
    return { c, p };
}

/* ══════════════════════════════════════
   HISTORY RENDERING
   ══════════════════════════════════════ */

/**
 * appendHistRow — inserts a row at the TOP of the list
 * so the newest entry is always first.
 */
function appendHistRow(att, guess, c, p, win) {
    if (histList.contains(histEmpty)) histList.removeChild(histEmpty);
    const row = buildHistRow(att, guess, c, p, win);
    histList.prepend(row);
}

function buildHistRow(att, guess, c, p, win) {
    const row = document.createElement('div');
    row.className = 'h-item' + (win ? ' h-win' : '');
    const fb = win
        ? `<div class="h-fb"><span class="fb-pill win">WIN 🏆</span></div>`
        : `<div class="h-fb"><span class="fb-pill c">${c}C</span><span class="fb-pill p">${p}P</span></div>`;
    row.innerHTML = `<span class="h-num">#${att}</span><span class="h-guess">${guess}</span>${fb}`;
    return row;
}

function updateHistCount(n) {
    histCount.textContent = n + (n === 1 ? ' guess' : ' guesses');
}

function resetHistoryUI() {
    histList.innerHTML = '';
    histList.appendChild(histEmpty);
    histCount.textContent = '0 guesses';
    guessCount = 0;
}

/* ══════════════════════════════════════
   UTILS
   ══════════════════════════════════════ */
function genSecret(len, dups) {
    if (dups) {
        let s = String(Math.floor(Math.random() * 9) + 1);
        while (s.length < len) s += Math.floor(Math.random() * 10);
        return s;
    }
    const pool = '0123456789'.split('');
    const fi = Math.floor(Math.random() * 9) + 1;
    const first = pool.splice(fi, 1)[0];
    let s = first;
    while (s.length < len) {
        const i = Math.floor(Math.random() * pool.length);
        s += pool.splice(i, 1)[0];
    }
    return s;
}

function validate(v) {
    if (!v || !/^\d+$/.test(v) || v.length !== S.digits)
        return `Enter exactly ${S.digits} digits`;
    if (!S.dups) {
        const seen = new Set();
        for (const d of v) {
            if (seen.has(d)) return 'No duplicate digits allowed';
            seen.add(d);
        }
    }
    return null;
}

function setMsg(txt, state) {
    msgEl.textContent = txt;
    msgEl.className = 'status-msg' + (state ? ' ' + state : '');
    msgEl.dataset.state = state || '';
}

function focusInput() {
    // Only auto-focus on non-touch devices to avoid keyboard pop on mobile
    if (window.innerWidth > 768) {
        setTimeout(() => guessInput.focus(), 80);
    }
}

function getBest() { const v = localStorage.getItem('ctc_best'); return v !== null ? Number(v) : null; }
function renderBest() { const b = getBest(); bestEl.textContent = b !== null ? 'Best: ' + b : 'Best: —'; }
function saveBest(n) {
    const b = getBest();
    if (b === null || n < b) localStorage.setItem('ctc_best', n);
    renderBest();
}