
// script.js
// Versión unificada sin imports: integra constants.js + audio.js + main.js en un solo archivo

// =========================
// Configuración y constantes
// =========================
const ISLAND_COUNT = 10;
const QUESTION_COUNT_PER_ISLAND = 5;

const DELAY_AFTER_CORRECT = 1500;
const DELAY_AFTER_WRONG = 1500;

const TIME_LIMIT_SECONDS = 20;

const DANGER_COLOR = 0xff0000;
// const CORRECT_COLOR = 0x00ff00; // Reservado para futuros efectos
const SCORE_CORRECT = 10;
const SOUND_SNIP_MS = 150;
const SOUND_RATE = 1.3;

const STORAGE_KEY = 'multiplication3d_progress';

const ACHIEVEMENTS = [
  { key: 'score_100', type: 'score', value: 100, label: '¡Multiplicador Novato! 🏅' },
  { key: 'tables_5', type: 'totalTables', value: 5, label: '¡Navegante Audaz! 🏝️' },
  { key: 'tables_10', type: 'allTables', value: 10, label: '¡Maestro de Islas! 🏆' }
];

// =========================
// Audio: precarga y reproducción segura
// =========================
let __audio_correct;
let __audio_wrong;
let __audio_initialized = false;

/**
 * Inicializa los sonidos del juego
 * @param {{correctPath?: string, wrongPath?: string, volume?: number}} opts
 */
function initAudio(opts = {}) {
  const {
    correctPath = 'sounds/correct.mp3',
    wrongPath = 'sounds/wrong.mp3',
    volume = 0.5
  } = opts;

  __audio_correct = new Audio(correctPath);
  __audio_wrong = new Audio(wrongPath);

  // Volumen inicial
  __audio_correct.volume = volume;
  __audio_wrong.volume = volume;

  // Desbloquear audio tras la primera interacción del usuario
  setupAudioUnlock();

  __audio_initialized = true;
}

/**
 * Ajusta el volumen de todos los sonidos
 * @param {number} volume valor entre 0 y 1
 */
function setVolume(volume = 0.6) {
  if (!__audio_initialized) return;
  __audio_correct.volume = volume;
  __audio_wrong.volume = volume;
}

/**
 * Reproduce el sonido de acierto
 */
function playCorrect() {
  if (!__audio_initialized) return;
  safePlay(__audio_correct);
}

/**
 * Reproduce el sonido de error
 */
function playWrong() {
  if (!__audio_initialized) return;
  safePlay(__audio_wrong);
}

/**
 * Intenta reproducir un audio de forma segura
 * @param {HTMLAudioElement} audio
 */
function safePlay(audio) {
  try {
    const p = audio.cloneNode(); // evita solapamientos al clonar
    p.volume = audio.volume;
    p.playbackRate = SOUND_RATE;

    const playPromise = p.play();
    // Cortar el sonido rápidamente (snippet corto)
    setTimeout(() => {
      try {
        p.pause();
        p.currentTime = 0;
      } catch {}
    }, SOUND_SNIP_MS);

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => { /* ignorar bloqueo por falta de interacción */ });
    }
  } catch {
    // Ignorar fallos de reproducción
  }
}

/**
 * Desbloquea el audio tras la primera interacción del usuario
 */
function setupAudioUnlock() {
  const unlock = () => {
    // Intento de play/pause para establecer el estado de "permitido"
    [__audio_correct, __audio_wrong].forEach(a => {
      try {
        a.play().then(() => {
          a.pause();
          a.currentTime = 0;
        }).catch(() => { /* ignorar */ });
      } catch { /* ignorar */ }
    });
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}

// =========================
// Estado del juego y DOM
// =========================
let scene, camera, renderer;
let boat, danger;
const islands = [];

let currentTable = 1; // 1..ISLAND_COUNT
let questionsAnswered = 0;
let score = 0;
let currentAnswer = '';
let correctAnswer = 0;
let isPaused = false;

// Progreso/Logros
let tablesCompleted = new Set();        // set de índices 1..ISLAND_COUNT
let unlockedAchievements = new Set();   // set de keys

// Temporizador
let timeLeft = TIME_LIMIT_SECONDS;
let timerId = null;

// DOM
const gameCanvas = document.getElementById('gameCanvas');
const questionDisplay = document.getElementById('questionDisplay');
const calculatorDisplay = document.getElementById('calculatorDisplay');
const statusMessage = document.getElementById('statusMessage');
const scoreDisplay = document.getElementById('scoreDisplay');
const pauseDialog = document.getElementById('pauseDialog');
const uiContainer = document.getElementById('gameUI');
const timerDisplay = document.getElementById('timerDisplay');
const achievementsContainer = document.getElementById('achievementsContainer');

// =========================
// Utilidades de UI
// =========================
function showStatus(text, cls) {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${cls || ''}`.trim();
  statusMessage.style.opacity = 1;
}

function clearStatus(delay = 800) {
  setTimeout(() => {
    statusMessage.style.opacity = 0;
  }, delay);
}

function updateScoreUI() {
  scoreDisplay.textContent = String(score);
}

function updateTimerUI() {
  if (!timerDisplay) return;
  timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
  if (timeLeft <= 5) {
    timerDisplay.classList.add('critical');
  } else {
    timerDisplay.classList.remove('critical');
  }
}

// =========================
// Temporizador
// =========================
function startTimer() {
  stopTimer();
  timeLeft = TIME_LIMIT_SECONDS;
  updateTimerUI();
  timerId = setInterval(() => {
    if (isPaused) return;
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerUI();
      stopTimer();
      onTimeUp();
    } else {
      updateTimerUI();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

// =========================
/* Logros */
// =========================
function showAchievement(label) {
  if (!achievementsContainer) return;
  achievementsContainer.textContent = `🏆 ${label}`;
  achievementsContainer.classList.add('active');
  setTimeout(() => achievementsContainer.classList.remove('active'), 3000);
}

function unlockAchievementByKey(key) {
  if (unlockedAchievements.has(key)) return;
  const item = ACHIEVEMENTS.find(a => a.key === key);
  if (!item) return;
  unlockedAchievements.add(key);
  showAchievement(item.label);
  saveProgress();
}

function evaluateAchievements() {
  // score
  const score100 = ACHIEVEMENTS.find(a => a.type === 'score' && a.value === 100);
  if (score100 && score >= score100.value) {
    unlockAchievementByKey(score100.key);
  }
  // totalTables (p.ej. 5)
  const totalTables = ACHIEVEMENTS.find(a => a.type === 'totalTables');
  if (totalTables && tablesCompleted.size >= totalTables.value) {
    unlockAchievementByKey(totalTables.key);
  }
  // allTables (p.ej. 10)
  const allTables = ACHIEVEMENTS.find(a => a.type === 'allTables');
  if (allTables && tablesCompleted.size >= allTables.value) {
    unlockAchievementByKey(allTables.key);
  }
}

// =========================
/* Persistencia */
// =========================
function saveProgress() {
  const data = {
    score,
    currentTable,
    questionsAnswered,
    tablesCompleted: Array.from(tablesCompleted),
    achievements: Array.from(unlockedAchievements)
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // almacenamiento no disponible
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    score = data.score ?? 0;
    currentTable = data.currentTable ?? 1;
    questionsAnswered = data.questionsAnswered ?? 0;
    (data.tablesCompleted ?? []).forEach(n => tablesCompleted.add(n));
    (data.achievements ?? []).forEach(k => unlockedAchievements.add(k));
  } catch {
    // ignorar errores de parseo
  }
}

// =========================
/* Escena 3D (Three.js) */
// =========================
function initThreeJs() {
  // THREE proviene del script CDN en index.html
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Luz
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Mar
  const seaGeometry = new THREE.PlaneGeometry(500, 500);
  const seaMaterial = new THREE.MeshPhongMaterial({ color: 0x4cc9f0, shininess: 50, flatShading: true });
  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -5;
  scene.add(sea);

  // Islas (círculo)
  const islandGeometry = new THREE.CylinderGeometry(5, 5, 2, 32);
  const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 });
  for (let i = 0; i < ISLAND_COUNT; i++) {
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    const angle = (i / ISLAND_COUNT) * Math.PI * 2;
    island.position.x = Math.cos(angle) * 30;
    island.position.z = Math.sin(angle) * 30;
    island.userData = { table: i + 1, index: i };
    islands.push(island);
    scene.add(island);
  }

  // Barco
  const boatGeometry = new THREE.BoxGeometry(1.5, 0.5, 3);
  const boatMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
  boat = new THREE.Mesh(boatGeometry, boatMaterial);
  scene.add(boat);

  // Peligro
  const dangerGeometry = new THREE.DodecahedronGeometry(2, 0);
  const dangerMaterial = new THREE.MeshBasicMaterial({ color: DANGER_COLOR });
  danger = new THREE.Mesh(dangerGeometry, dangerMaterial);
  danger.visible = false;
  scene.add(danger);

  // Posición inicial
  updateBoatPosition();
}

function updateBoatPosition() {
  const islandIndex = Math.max(0, Math.min(ISLAND_COUNT - 1, currentTable - 1));
  const targetIsland = islands[islandIndex];
  boat.position.x = targetIsland.position.x;
  boat.position.z = targetIsland.position.z;
  boat.position.y = targetIsland.position.y + 2;

  camera.position.x = boat.position.x;
  camera.position.z = boat.position.z + 15;
  camera.lookAt(boat.position);
}

function animate() {
  requestAnimationFrame(animate);

  if (danger.visible) {
    danger.rotation.x += 0.01;
    danger.rotation.y += 0.01;
  }

  const idx = currentTable - 1;
  if (islands[idx] && danger.visible) {
    danger.position.x = islands[idx].position.x;
    danger.position.z = islands[idx].position.z;
    danger.position.y = islands[idx].position.y + 4;
  }

  renderer.render(scene, camera);
}

// =========================
/* Preguntas y Pistas */
// =========================
function generateQuestion() {
  const multiplicando = currentTable;
  const multiplicador = Math.floor(Math.random() * 10) + 1;
  correctAnswer = multiplicando * multiplicador;
  currentAnswer = '';
  calculatorDisplay.textContent = '0';
  questionDisplay.textContent = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
  statusMessage.style.opacity = 0;

  // Mostrar peligro
  danger.visible = true;

  // Iniciar temporizador
  startTimer();

  // Guardar los operandos para pista
  questionDisplay.dataset.multiplicando = String(multiplicando);
  questionDisplay.dataset.multiplicador = String(multiplicador);
}

function getHintText(multiplicando, multiplicador) {
  // Pista no reveladora: suma repetida
  const veces = multiplicador;
  const sumando = multiplicando;
  const preview = Array(Math.min(veces, 5)).fill(sumando).join(' + ');
  const extra = veces > 5 ? ` + ... (${veces} veces)` : '';
  return `Pista: ${sumando} sumado ${veces} veces (ej: ${preview}${extra})`;
}

function onTimeUp() {
  showStatus(`¡Se acabó el tiempo!`, 'incorrect');
  playWrong();
  // No avanzar de isla; solo nueva pregunta en la misma
  setTimeout(() => {
    generateQuestion();
  }, DELAY_AFTER_WRONG);
}

// =========================
/* Respuesta */
// =========================
function checkAnswer() {
  if (isPaused) return;

  const userAnswer = parseInt(currentAnswer || '0', 10);
  if (userAnswer === correctAnswer) {
    score += SCORE_CORRECT;
    updateScoreUI();
    showStatus('¡Correcto!', 'correct');
    playCorrect();

    danger.visible = false;
    stopTimer();

    questionsAnswered++;
    evaluateAchievements();

    if (questionsAnswered >= QUESTION_COUNT_PER_ISLAND) {
      // Isla completada
      tablesCompleted.add(currentTable);
      questionsAnswered = 0;
      currentTable++;

      if (currentTable > ISLAND_COUNT) {
        // Viaje completo
        evaluateAchievements(); // vuelve a evaluar (allTables)
        showGameEndDialog();
        saveProgress();
        return;
      } else {
        updateBoatPosition();
      }
    }

    saveProgress();

    setTimeout(() => {
      generateQuestion();
    }, DELAY_AFTER_CORRECT);
  } else {
    showStatus('¡Incorrecto! Inténtalo de nuevo.', 'incorrect');
    playWrong();
    currentAnswer = '';
    calculatorDisplay.textContent = '0';
    clearStatus(DELAY_AFTER_WRONG);
  }
}

// =========================
/* Diálogos */
// =========================
function showPauseDialog() {
  isPaused = true;
  pauseDialog.classList.add('active');
  uiContainer.style.display = 'none';
}

function hidePauseDialog() {
  isPaused = false;
  pauseDialog.classList.remove('active');
  uiContainer.style.display = 'flex';
}

function showGameEndDialog() {
  const finalScore = score;
  const finalDialog = document.createElement('div');
  finalDialog.className = 'dialog active';
  finalDialog.innerHTML = `
      <h2>¡Aventura Terminada!</h2>
      <p>Has completado las tablas de multiplicar.</p>
      <p>Puntuación Final: ${finalScore}</p>
      <button class="dialog-button" onclick="window.location.reload();">Jugar de Nuevo</button>
  `;
  document.body.appendChild(finalDialog);
  uiContainer.style.display = 'none';
}

// =========================
/* Eventos UI */
// =========================
function attachEvents() {
  // Teclado
  document.addEventListener('keydown', (event) => {
    if (isPaused) {
      if (event.key === 'Escape' || event.key === 'Enter') hidePauseDialog();
      return;
    }
    if (event.key >= '0' && event.key <= '9') {
      currentAnswer += event.key;
      calculatorDisplay.textContent = calculatorDisplay.textContent === '0'
        ? event.key
        : (calculatorDisplay.textContent + event.key);
    } else if (event.key === 'Enter') {
      checkAnswer();
    } else if (event.key === 'Backspace') {
      currentAnswer = currentAnswer.slice(0, -1);
      calculatorDisplay.textContent = currentAnswer === '' ? '0' : currentAnswer;
    } else if (event.key === 'Escape') {
      showPauseDialog();
    } else if (event.key === 'h' || event.key === 'H') {
      // pista con tecla H
      const m = parseInt(questionDisplay.dataset.multiplicando, 10);
      const n = parseInt(questionDisplay.dataset.multiplicador, 10);
      showStatus(getHintText(m, n), 'hint');
    }
  });

  // Botones de keypad
  document.querySelectorAll('.keypad-button').forEach(button => {
    button.addEventListener('click', () => {
      if (isPaused) return;

      const value = button.dataset.value;
      const action = button.dataset.action;

      if (action === 'clear') {
        currentAnswer = '';
        calculatorDisplay.textContent = '0';
      } else if (action === 'check') {
        checkAnswer();
      } else if (action === 'hint') {
        const m = parseInt(questionDisplay.dataset.multiplicando, 10);
        const n = parseInt(questionDisplay.dataset.multiplicador, 10);
        showStatus(getHintText(m, n), 'hint');
      } else if (typeof value !== 'undefined') {
        currentAnswer += value;
        calculatorDisplay.textContent = calculatorDisplay.textContent === '0'
          ? value
          : (calculatorDisplay.textContent + value);
      }
    });
  });

  // Pausa
  document.getElementById('resumeButton')?.addEventListener('click', hidePauseDialog);
  document.getElementById('pauseButton')?.addEventListener('click', showPauseDialog);
  document.getElementById('exitQuickButton')?.addEventListener('click', () => window.location.reload());

  // Cámara drag
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  gameCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || isPaused) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    camera.position.x -= deltaX * 0.05;
    camera.position.y += deltaY * 0.05;
    camera.lookAt(boat.position.x, boat.position.y - 2, boat.position.z);

    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// =========================
/* Bootstrap */
// =========================
(function start() {
  // Audio
  initAudio({ volume: 0.5 });

  // Progreso
  loadProgress();
  updateScoreUI();

  // Escena
  initThreeJs();
  attachEvents();
  animate();
  updateBoatPosition();
  generateQuestion();
})();