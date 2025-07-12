// script.js (mejoras visuales añadidas)
const MAX_MULTIPLICADOR = 10;
const MAX_MULTIPLICANDO = 10;
const DELAY_NEXT_QUESTION = 1000;
const DELAY_NEXT_TABLE = 2000;

let questionStartTime;
let multiplicando = 1;
let multiplicador = 1;
let respuestaCorrecta;

// Elementos del DOM
const answerButton = document.getElementById("answerButton");
const answerInput = document.getElementById("answer");
const characterImg = document.getElementById("character");
const resultDiv = document.getElementById("result");
const rewardsDiv = document.getElementById("rewards");

// Sonidos
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/wrong.mp3');

// Configuración del juego
const GAME_CONFIG = {
    EASY: {
        timeLimit: 20000,
        pointsMultiplier: 1,
        hints: true
    },
    MEDIUM: {
        timeLimit: 10000,
        pointsMultiplier: 2,
        hints: false
    },
    HARD: {
        timeLimit: 5000,
        pointsMultiplier: 3,
        hints: false
    }
};

// Variables de juego
let currentDifficulty = 'EASY';
let score = 0;
let streak = 0;
let timer = null;
let achievements = [];

// Sistema de logros
const ACHIEVEMENTS = {
    SPEED_MASTER: {
        id: 'SPEED_MASTER',
        name: '⚡ Maestro de la Velocidad',
        condition: (time) => time < 3000,
        earned: false
    },
    PERFECT_TABLE: {
        id: 'PERFECT_TABLE',
        name: '📚 Tabla Perfecta',
        condition: (streak) => streak >= 10,
        earned: false
    },
    LONG_STREAK: {
        id: 'LONG_STREAK',
        name: '🔥 Racha Increíble',
        condition: (streak) => streak >= 15,
        earned: false
    }
};

function generarPregunta() {
    questionStartTime = Date.now(); // Inicializar tiempo de pregunta
    respuestaCorrecta = multiplicando * multiplicador;
    document.getElementById("question").innerText = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
    answerInput.value = "";
    answerInput.focus();
    resultDiv.innerText = "";
    characterImg.classList.remove("correct-feedback");
}

function animateCorrect() {
    characterImg.classList.add("correct-feedback");
    setTimeout(() => characterImg.classList.remove("correct-feedback"), 1000);
}

function handleCorrectAnswer() {
    correctSound.play();
    animateCorrect();
    resultDiv.innerText = "¡Correcto! 🎉";
    resultDiv.style.color = "var(--success)";
    multiplicador++;
    
    if (multiplicador > MAX_MULTIPLICADOR) {
        handleTableCompletion();
    } else {
        setTimeout(generarPregunta, DELAY_NEXT_QUESTION);
    }
}

function handleTableCompletion() {
    resultDiv.innerHTML = `¡Tabla del ${multiplicando} completada! <span class="star">⭐</span>`;
    rewardsDiv.innerHTML += "🏆 ";
    
    multiplicador = 1;
    multiplicando++;
    
    if (multiplicando <= MAX_MULTIPLICANDO) {
        setTimeout(generarPregunta, DELAY_NEXT_TABLE);
    } else {
        resultDiv.innerHTML = "¡Todas las tablas completadas! <span class='star'>⭐⭐</span>";
        rewardsDiv.innerHTML += "🎉";
        setTimeout(startGame, 3000);
    }
}

function checkAnswer() {
    const respuestaUsuario = parseInt(answerInput.value);
    
    if (isNaN(respuestaUsuario)) {
        resultDiv.innerText = "Ingresa un número válido";
        resultDiv.style.color = "var(--error)";
        return;
    }

    answerButton.disabled = true;
    
    
    const responseTime = Date.now() - questionStartTime;

    if (respuestaUsuario === respuestaCorrecta) {
        updateScore(true, responseTime);
        handleCorrectAnswer();
    } else {
        updateScore(false);
        wrongSound.play();
        resultDiv.innerText = "Incorrecto 😞 Intenta de nuevo!";
        resultDiv.style.color = "var(--error)";
        answerInput.style.borderColor = "var(--error)";
        setTimeout(() => {
            answerButton.disabled = false;
            answerInput.style.borderColor = "";
        }, 2000);
    }
}

function startGame() {
    multiplicando = 1;
    multiplicador = 1;
    rewardsDiv.innerHTML = "";
    generarPregunta();
}

function updateScore(isCorrect, responseTime) {
    const config = GAME_CONFIG[currentDifficulty];
    
    if (isCorrect) {
        streak++;
        const timeBonus = Math.max(0, config.timeLimit - responseTime);
        const points = (10 * config.pointsMultiplier) + Math.floor(timeBonus / 1000);
        score += points;
        
        // Verificar logros
        checkAchievements(responseTime);
    } else {
        streak = 0;
    }
    
    updateUI();
}

function checkAchievements(responseTime) {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!achievement.earned) {
            if (achievement.id === 'SPEED_MASTER' && achievement.condition(responseTime)) {
                unlockAchievement(achievement);
            } else if (achievement.id === 'PERFECT_TABLE' && achievement.condition(streak)) {
                unlockAchievement(achievement);
            } else if (achievement.id === 'LONG_STREAK' && achievement.condition(streak)) {
                unlockAchievement(achievement);
            }
        }
    });
}

function unlockAchievement(achievement) {
    achievement.earned = true;
    achievements.push(achievement.id);
    
    const achievementDiv = document.createElement('div');
    achievementDiv.className = 'achievement-notification';
    achievementDiv.innerHTML = `¡Logro Desbloqueado! ${achievement.name}`;
    
    document.body.appendChild(achievementDiv);
    setTimeout(() => achievementDiv.remove(), 3000);
    
    saveProgress();
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('streakDisplay').textContent = streak;
    
    const progressFill = document.getElementById('progressFill');
    const progress = (multiplicador - 1) / MAX_MULTIPLICADOR * 100;
    progressFill.style.width = `${progress}%`;
}

// Agregar event listener para el selector de dificultad
document.getElementById('difficultySelector').addEventListener('change', function(e) {
    currentDifficulty = e.target.value;
    saveProgress();
});

// Sistema de guardado
function saveProgress() {
    const progress = {
        score,
        streak,
        achievements,
        difficulty: currentDifficulty,
        lastTable: multiplicando
    };
    localStorage.setItem('multiplicationProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('multiplicationProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        score = progress.score || 0;
        achievements = progress.achievements || [];
        currentDifficulty = progress.difficulty || 'EASY';
        document.getElementById('difficultySelector').value = currentDifficulty;
        updateUI();
    }
}

// Inicializar el juego
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    startGame();
});

// Agregar event listener para el botón (al final del archivo)
document.getElementById('answerButton').addEventListener('click', checkAnswer);
document.getElementById('answer').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});