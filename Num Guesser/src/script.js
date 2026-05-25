/* ══════════════════════════════════════
   CRACK THE CODE — full game script
   ══════════════════════════════════════ */

/* ── SETTINGS STATE ── */
let settings = {
    theme: localStorage.getItem('ctc_theme') || 'violet',
    digits: Number(localStorage.getItem('ctc_digits')) || 4,
    duplicates: localStorage.getItem('ctc_dups') !== 'false',
    mode: localStorage.getItem('ctc_mode') || 'computer',
};

/* ── GAME STATE ── */
let gameOver = false;
let attempts = 0;
let secretNumber = '';

/* 2-player state */
let p1Secret = '';
let p2Secret = '';
let currentPlayer = 1;   // whose turn it is to GUESS
let p1Attempts = 0;
let p2Attempts = 0;
let p1History = [];
let p2History = [];
let setupPhase = 0;       // 0=not started, 1=p1 entering, 2=p2 entering, 3=playing

/* ── DOM REFS ── */
const body = document.body;
const settingsBtn = document.getElementById('settingsBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
const modeGroup = document.getElementById('modeGroup');
const digitsGroup = document.getElementById('digitsGroup');
const dupToggle = document.getElementById('dupToggle');
const themeGrid = document.getElementById('themeGrid');
const applyBtn = document.getElementById('applyBtn');

const coverScreen = document.getElementById('coverScreen');
const coverTitle = document.getElementById('coverTitle');
const coverSub = document.getElementById('coverSub');
const coverBtn = document.getElementById('coverBtn');

const setupScreen = document.getElementById('setupScreen');
const setupBadge = document.getElementById('setupBadge');
const setupSub = document.getElementById('setupSub');
const setupInput = document.getElementById('setupInput');
const setupError = document.getElementById('setupError');
const setupBtn = document.getElementById('setupBtn');
const setupDigitCount = document.getElementById('setupDigitCount');

const winScreen = document.getElementById('winScreen');
const winTitle = document.getElementById('winTitle');
const winSub = document.getElementById('winSub');
const winStats = document.getElementById('winStats');
const winBtn = document.getElementById('winBtn');

const gameScreen = document.getElementById('gameScreen');
const playerBadge = document.getElementById('playerBadge');
const playerLabel = document.getElementById('playerLabel');
const gameSub = document.getElementById('gameSub');
const digitCountLabel = document.getElementById('digitCountLabel');
const guessInput = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');
const message = document.getElementById('message');
const attemptsEl = document.getElementById('attempts');
const bestScoreEl = document.getElementById('bestScore');
const historyList = document.getElementById('historyList');
const passBtn = document.getElementById('passBtn');

/* ── INIT ── */
applyTheme(settings.theme);
syncSettingsUI();
startGame();

/* ══════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════ */
settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);

function openSettings() {
    syncSettingsUI();
    settingsOverlay.classList.add('open');
    settingsPanel.classList.add('open');
}
function closeSettings() {
    settingsOverlay.classList.remove('open');
    settingsPanel.classList.remove('open');
}

modeGroup.addEventListener('click', e => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    modeGroup.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
});

digitsGroup.addEventListener('click', e => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    digitsGroup.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
});

themeGrid.addEventListener('click', e => {
    const btn = e.target.closest('.theme-opt');
    if (!btn) return;
    themeGrid.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyTheme(btn.dataset.theme);
});

applyBtn.addEventListener('click', () => {
    const activeMode = modeGroup.querySelector('.seg.active').dataset.mode;
    const activeDigits = Number(digitsGroup.querySelector('.seg.active').dataset.digits);
    const activeTheme = themeGrid.querySelector('.theme-opt.active').dataset.theme;
    const activeDups = dupToggle.checked;

    settings.mode = activeMode;
    settings.digits = activeDigits;
    settings.theme = activeTheme;
    settings.duplicates = activeDups;

    localStorage.setItem('ctc_theme', settings.theme);
    localStorage.setItem('ctc_digits', settings.digits);
    localStorage.setItem('ctc_dups', settings.duplicates);
    localStorage.setItem('ctc_mode', settings.mode);

    closeSettings();
    startGame();
});

function syncSettingsUI() {
    modeGroup.querySelectorAll('.seg').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === settings.mode));
    digitsGroup.querySelectorAll('.seg').forEach(b =>
        b.classList.toggle('active', Number(b.dataset.digits) === settings.digits));
    themeGrid.querySelectorAll('.theme-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.theme === settings.theme));
    dupToggle.checked = settings.duplicates;
}

function applyTheme(theme) {
    body.className = body.className.replace(/theme-\S+/g, '').trim();
    if (theme !== 'violet') body.classList.add('theme-' + theme);
}

/* ══════════════════════════════════════
   GAME INIT
   ══════════════════════════════════════ */
function startGame() {
    gameOver = false;
    attempts = 0;

    guessInput.maxLength = settings.digits;
    guessInput.placeholder = '_ '.repeat(settings.digits).trim();
    digitCountLabel.textContent = settings.digits;
    gameSub.querySelector ? null : null;

    if (settings.mode === 'computer') {
        startComputerMode();
    } else {
        startTwoPlayerMode();
    }
}

/* ── COMPUTER MODE ── */
function startComputerMode() {
    secretNumber = generateSecret(settings.digits, settings.duplicates);
    setupPhase = 0;

    playerBadge.style.display = 'none';
    passBtn.style.display = 'none';
    bestScoreEl.style.display = '';

    resetGameUI();
    showScreen('game');
    renderBest();
}

/* ── 2-PLAYER MODE ── */
function startTwoPlayerMode() {
    p1Secret = '';
    p2Secret = '';
    p1Attempts = 0;
    p2Attempts = 0;
    p1History = [];
    p2History = [];
    currentPlayer = 1;
    setupPhase = 1;

    bestScoreEl.style.display = 'none';

    showSetupScreen(1);
}

function showSetupScreen(player) {
    setupBadge.textContent = 'Player ' + player;
    setupInput.value = '';
    setupError.textContent = '';
    setupDigitCount.textContent = settings.digits;
    setupInput.maxLength = settings.digits;
    setupInput.type = 'password';
    showScreen('setup');
    setTimeout(() => setupInput.focus(), 100);
}

setupInput.addEventListener('input', () => {
    setupInput.value = setupInput.value.replace(/\D/g, '').slice(0, settings.digits);
    setupError.textContent = '';
});

setupBtn.addEventListener('click', lockInSecret);
setupInput.addEventListener('keydown', e => { if (e.key === 'Enter') lockInSecret(); });

function lockInSecret() {
    const val = setupInput.value;
    const err = validateGuess(val);
    if (err) { setupError.textContent = err; return; }

    if (setupPhase === 1) {
        p1Secret = val;
        setupPhase = 2;
        showSetupScreen(2);
    } else if (setupPhase === 2) {
        p2Secret = val;
        setupPhase = 3;
        currentPlayer = 1;
        beginTwoPlayerRound();
    }
}

function beginTwoPlayerRound() {
    resetGameUI();
    playerBadge.style.display = 'flex';
    passBtn.style.display = 'none';
    renderPlayerBadge();

    // Load current player's history
    restoreHistory();
    renderCurrentPlayerStatus();
    showScreen('game');
    setTimeout(() => guessInput.focus(), 100);
}

function renderPlayerBadge() {
    playerLabel.textContent = 'Player ' + currentPlayer;
}

function restoreHistory() {
    historyList.innerHTML = '';
    const hist = currentPlayer === 1 ? p1History : p2History;
    // render oldest first (they were pushed newest-first during play)
    [...hist].reverse().forEach(item => {
        appendHistoryRow(item.attempt, item.guess, item.feedback, item.win);
    });
}

function renderCurrentPlayerStatus() {
    const att = currentPlayer === 1 ? p1Attempts : p2Attempts;
    attemptsEl.textContent = 'Attempts: ' + att;
    message.textContent = att === 0 ? 'Start guessing…' : '';
    message.className = 'message';
    guessInput.value = '';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    guessBtn.textContent = 'Submit';
    guessBtn.classList.remove('play-again');
}

/* ══════════════════════════════════════
   GUESS LOGIC
   ══════════════════════════════════════ */
guessBtn.addEventListener('click', handleGuess);
guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleGuess(); });
guessInput.addEventListener('input', () => {
    guessInput.value = guessInput.value.replace(/\D/g, '').slice(0, settings.digits);
    if (message.dataset.state === 'error') {
        message.textContent = 'Start guessing…';
        message.dataset.state = '';
        message.className = 'message';
    }
});

function handleGuess() {
    if (gameOver) return;
    const guess = guessInput.value.trim();
    const err = validateGuess(guess);
    if (err) {
        message.textContent = err;
        message.dataset.state = 'error';
        message.className = 'message error';
        return;
    }

    message.dataset.state = '';

    if (settings.mode === 'computer') {
        handleComputerGuess(guess);
    } else {
        handleTwoPlayerGuess(guess);
    }
}

function handleComputerGuess(guess) {
    attempts++;
    attemptsEl.textContent = 'Attempts: ' + attempts;

    if (guess === secretNumber) {
        message.textContent = '🎉 You cracked it!';
        message.className = 'message win';
        addHistory(attempts, guess, '🏆 WIN', true);
        saveBestScore(attempts);
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.textContent = 'Play Again';
        guessBtn.classList.add('play-again');
        guessBtn.disabled = false;
        guessBtn.onclick = () => startGame();
        return;
    }

    const { c, p } = getFeedback(guess, secretNumber);
    const fbStr = c + 'C  ' + p + 'P';
    message.textContent = fbStr;
    message.className = 'message';
    addHistory(attempts, guess, fbStr, false);
    guessInput.value = '';
    if (window.innerWidth > 600) guessInput.focus();
}

function handleTwoPlayerGuess(guess) {
    const secret = currentPlayer === 1 ? p2Secret : p1Secret;

    if (currentPlayer === 1) p1Attempts++;
    else p2Attempts++;

    const att = currentPlayer === 1 ? p1Attempts : p2Attempts;
    attemptsEl.textContent = 'Attempts: ' + att;

    if (guess === secret) {
        // This player won
        const winner = currentPlayer;
        const winAtt = att;
        const loserAtt = winner === 1 ? p2Attempts : p1Attempts;

        addHistory(att, guess, '🏆 WIN', true);
        const fbItem = { attempt: att, guess, feedback: '🏆 WIN', win: true };
        if (currentPlayer === 1) p1History.unshift(fbItem); else p2History.unshift(fbItem);

        showWinScreen(winner, winAtt, loserAtt);
        return;
    }

    const { c, p } = getFeedback(guess, secret);
    const fbStr = c + 'C  ' + p + 'P';
    message.textContent = fbStr;
    message.className = 'message';
    addHistory(att, guess, fbStr, false);
    const fbItem = { attempt: att, guess, feedback: fbStr, win: false };
    if (currentPlayer === 1) p1History.unshift(fbItem); else p2History.unshift(fbItem);

    guessInput.value = '';

    // Show pass button
    passBtn.style.display = 'block';
    passBtn.textContent = 'Pass to Player ' + (currentPlayer === 1 ? 2 : 1) + ' →';
    guessInput.disabled = true;
    guessBtn.disabled = true;
}

passBtn.addEventListener('click', () => {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    attempts = currentPlayer === 1 ? p1Attempts : p2Attempts;
    gameOver = false;

    passBtn.style.display = 'none';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    guessInput.value = '';

    renderPlayerBadge();
    restoreHistory();
    renderCurrentPlayerStatus();
    setTimeout(() => guessInput.focus(), 100);
});

/* ── WIN SCREEN ── */
function showWinScreen(winner, winAtt, loserAtt) {
    winTitle.textContent = '🎉 Player ' + winner + ' wins!';
    winSub.textContent = 'Player ' + winner + ' cracked the code first!';
    winStats.innerHTML = `
    <div class="win-stat">
      <div class="win-stat-num">${winAtt}</div>
      <div class="win-stat-label">P${winner} guesses</div>
    </div>
    <div class="win-stat">
      <div class="win-stat-num">${loserAtt}</div>
      <div class="win-stat-label">P${winner === 1 ? 2 : 1} guesses</div>
    </div>
  `;
    winBtn.onclick = () => startGame();
    showScreen('win');
}

coverBtn.addEventListener('click', () => {
    showScreen('game');
    setTimeout(() => guessInput.focus(), 100);
});

/* ══════════════════════════════════════
   FEEDBACK ALGORITHM
   C = correct digits (anywhere in secret, not counting position)
   P = correct digits in the exact right position
   A digit in the right position is ALSO counted in C.
   Duplicates handled by consuming matched digits.
   ══════════════════════════════════════ */
function getFeedback(guess, secret) {
    const n = secret.length;
    const sArr = [...secret];
    const gArr = [...guess];
    const sLeft = [...sArr];
    const gLeft = [...gArr];

    // P = exact position matches
    let p = 0;
    for (let i = 0; i < n; i++) {
        if (gArr[i] === sArr[i]) p++;
    }

    // C = total digit matches (consumes from pool, including position matches)
    let c = 0;
    const pool = [...sArr];
    for (const d of gArr) {
        const idx = pool.indexOf(d);
        if (idx !== -1) { c++; pool[idx] = null; }
    }

    return { c, p };
}

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
function generateSecret(digits, allowDups) {
    if (allowDups) {
        let n = '';
        while (n.length < digits) n += Math.floor(Math.random() * 10);
        return n;
    } else {
        const pool = [...'0123456789'];
        let n = '';
        // first digit non-zero
        const firstIdx = Math.floor(Math.random() * 9) + 1; // 1-9 index in pool
        n += pool[firstIdx];
        pool.splice(firstIdx, 1);
        while (n.length < digits) {
            const i = Math.floor(Math.random() * pool.length);
            n += pool[i];
            pool.splice(i, 1);
        }
        return n;
    }
}

function validateGuess(val) {
    if (!/^\d+$/.test(val) || val.length !== settings.digits)
        return `Enter exactly ${settings.digits} digits`;
    if (!settings.duplicates) {
        const seen = new Set();
        for (const d of val) {
            if (seen.has(d)) return 'No duplicate digits allowed';
            seen.add(d);
        }
    }
    return null;
}

function addHistory(attempt, guess, feedback, isWin) {
    appendHistoryRow(attempt, guess, feedback, isWin);
}

function appendHistoryRow(attempt, guess, feedback, isWin) {
    const item = document.createElement('div');
    item.className = 'history-item' + (isWin ? ' h-win' : '');

    let fbHTML;
    if (isWin) {
        fbHTML = `<span class="h-feedback fb-win">${feedback}</span>`;
    } else {
        // parse e.g. "3C  2P" into pills
        const m = feedback.match(/(\d+)C\s*(\d+)P/);
        if (m) {
            fbHTML = `<span class="h-feedback fb-normal">
        <span class="fb-pill fb-c">${m[1]}C</span>
        <span class="fb-pill">${m[2]}P</span>
      </span>`;
        } else {
            fbHTML = `<span class="h-feedback fb-normal">${feedback}</span>`;
        }
    }

    item.innerHTML = `
    <span class="h-num">#${attempt}</span>
    <span class="h-guess">${guess}</span>
    ${fbHTML}
  `;
    historyList.prepend(item);
}

function resetGameUI() {
    message.textContent = 'Start guessing…';
    message.className = 'message';
    message.dataset.state = '';
    attemptsEl.textContent = 'Attempts: 0';
    historyList.innerHTML = '';
    guessInput.value = '';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    guessBtn.textContent = 'Submit';
    guessBtn.classList.remove('play-again');
    guessBtn.onclick = handleGuess;
    passBtn.style.display = 'none';
}

function showScreen(name) {
    coverScreen.style.display = name === 'cover' ? 'flex' : 'none';
    setupScreen.style.display = name === 'setup' ? 'flex' : 'none';
    winScreen.style.display = name === 'win' ? 'flex' : 'none';
    gameScreen.style.display = name === 'game' ? 'flex' : 'none';
}

/* ── BEST SCORE ── */
function getBest() {
    const v = localStorage.getItem('ctc_best');
    return v !== null ? Number(v) : null;
}
function renderBest() {
    const b = getBest();
    bestScoreEl.textContent = b !== null ? 'Best: ' + b : 'Best: —';
}
function saveBestScore(att) {
    const cur = getBest();
    if (cur === null || att < cur) localStorage.setItem('ctc_best', att);
    renderBest();
}
