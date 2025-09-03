// script.js
const MAX_MULTIPLICADOR = 10;
const DELAY_NEXT_QUESTION = 1000;
const DELAY_NEXT_TABLE = 2000;
const QUESTIONS_PER_TABLE = 10;

let questionStartTime;
let multiplicando = 1;
let multiplicador = 1;
let respuestaCorrecta;
let questionsAnsweredInTable = 0;

// Elementos del DOM
const questionDisplay = document.getElementById("question");
const answerInput = document.getElementById("answer");
const answerButton = document.getElementById("answerButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const streakDisplay = document.getElementById("streakDisplay");
const characterImg = document.getElementById("character");
const resultDiv = document.getElementById("result");
const rewardsDiv = document.getElementById("rewards");
const difficultySelector = document.getElementById("difficultySelector");
const progressBar = document.getElementById("progressFill");
const achievementsDisplay = document.getElementById("achievementsDisplay");

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
let achievements = [];
let tablesCompleted = [];
let lastTable = 1;

// Logros
const ACHIEVEMENTS = [
    { name: "¡Multiplicador Novato!", condition: "score", value: 100 },
    { name: "¡Racha de 5!", condition: "streak", value: 5 },
    { name: "Tabla del 2 Completada", condition: "tables", value: 2 },
    { name: "Tabla del 5 Completada", condition: "tables", value: 5 },
    { name: "¡Multiplicador Maestro!", condition: "score", value: 500 },
];

function generateQuestion() {
    respuestaCorrecta = multiplicando * multiplicador;
    questionDisplay.textContent = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
    answerInput.value = '';
    answerInput.focus();
    resultDiv.textContent = '';
    rewardsDiv.textContent = '';
    questionStartTime = Date.now();
    updateUI();
}

function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    const timeTaken = Date.now() - questionStartTime;
    
    if (userAnswer === respuestaCorrecta) {
        correctSound.play();
        const points = calculatePoints(timeTaken);
        score += points;
        streak++;
        resultDiv.textContent = `¡Correcto! +${points} puntos`;
        resultDiv.className = 'result-message correct';
        characterImg.classList.add('correct');
        
        checkAchievements();
        
        questionsAnsweredInTable++;
        
        if (questionsAnsweredInTable >= QUESTIONS_PER_TABLE) {
            checkTableCompletion();
        } else {
            nextQuestion();
        }

    } else {
        wrongSound.play();
        streak = 0;
        resultDiv.textContent = `Incorrecto. La respuesta era ${respuestaCorrecta}.`;
        resultDiv.className = 'result-message wrong';
        characterImg.classList.add('wrong');
        
        // Reinicia la tabla actual para que el usuario la domine
        multiplicador = 1;
        questionsAnsweredInTable = 0;
    }

    setTimeout(() => {
        resultDiv.className = 'result-message';
        characterImg.classList.remove('correct', 'wrong');
        answerInput.value = '';
    }, DELAY_NEXT_QUESTION);
    
    updateUI();
    saveProgress();
}

function nextQuestion() {
    if (multiplicador < MAX_MULTIPLICADOR) {
        multiplicador++;
    } else {
        multiplicador = 1;
        questionsAnsweredInTable = 0;
    }
    
    setTimeout(generateQuestion, DELAY_NEXT_QUESTION);
}

function checkTableCompletion() {
    if (questionsAnsweredInTable >= QUESTIONS_PER_TABLE && !tablesCompleted.includes(multiplicando)) {
        tablesCompleted.push(multiplicando);
        rewardsDiv.textContent = `¡Felicidades! ¡Has completado la tabla del ${multiplicando}!`;
        
        // Pasa a la siguiente tabla
        multiplicando++;
        if (multiplicando > MAX_MULTIPLICADOR) {
            multiplicando = 1; // Opcional: Reiniciar el juego o mostrar mensaje de fin
            rewardsDiv.textContent = `¡Has completado todas las tablas! ¡Eres un/a crack!`;
        }
        
        multiplicador = 1;
        questionsAnsweredInTable = 0;
    }
    
    setTimeout(generateQuestion, DELAY_NEXT_TABLE);
}

function calculatePoints(time) {
    const config = GAME_CONFIG[currentDifficulty];
    const basePoints = 10;
    const timeBonus = Math.max(0, 1 - (time / config.timeLimit));
    return Math.floor(basePoints * config.pointsMultiplier + basePoints * timeBonus);
}

function updateUI() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    
    // Actualizar barra de progreso
    const progress = (questionsAnsweredInTable / QUESTIONS_PER_TABLE) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Actualizar logros
    displayAchievements();
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!achievements.includes(achievement.name)) {
            let unlocked = false;
            switch (achievement.condition) {
                case "score":
                    if (score >= achievement.value) unlocked = true;
                    break;
                case "streak":
                    if (streak >= achievement.value) unlocked = true;
                    break;
                case "tables":
                    if (tablesCompleted.includes(achievement.value)) unlocked = true;
                    break;
            }

            if (unlocked) {
                achievements.push(achievement.name);
                showAchievementNotification(achievement.name);
            }
        }
    });
}

function showAchievementNotification(name) {
    const notification = document.createElement('div');
    notification.textContent = `🏆 ¡Logro desbloqueado: ${name}!`;
    rewardsDiv.appendChild(notification);
    setTimeout(() => {
        rewardsDiv.removeChild(notification);
    }, 3000);
}

function displayAchievements() {
    const display = document.getElementById('achievementsDisplay');
    display.innerHTML = '';
    if (achievements.length > 0) {
        achievements.forEach(ach => {
            const p = document.createElement('p');
            p.textContent = ach;
            display.appendChild(p);
        });
    } else {
        display.innerHTML += '<p>Ninguno aún.</p>';
    }
}

// Agregar event listener para el selector de dificultad
difficultySelector.addEventListener('change', function(e) {
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
        tablesCompleted,
        lastTable: multiplicando
    };
    localStorage.setItem('multiplicationProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('multiplicationProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        score = progress.score || 0;
        streak = progress.streak || 0;
        achievements = progress.achievements || [];
        tablesCompleted = progress.tablesCompleted || [];
        multiplicando = progress.lastTable || 1;
        currentDifficulty = progress.difficulty || 'EASY';
        difficultySelector.value = currentDifficulty;
        updateUI();
    }
}

// Inicializar el juego
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    generateQuestion();
});

// Agregar event listeners para los botones
answerButton.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});