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
const calculatorDisplay = document.getElementById("calculatorDisplay");
const answerButton = document.getElementById("answerButton");
const clearButton = document.getElementById("clearButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const streakDisplay = document.getElementById("streakDisplay");
const characterImg = document.getElementById("character");
const resultDiv = document.getElementById("result");
const rewardsDiv = document.getElementById("rewards");
const difficultySelector = document.getElementById("difficultySelector");
const progressBar = document.getElementById("progressFill");
const achievementsDisplay = document.getElementById("achievementsDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const hintButton = document.getElementById("hintButton");
const boat = document.getElementById("boat");
const flood = document.getElementById("flood");

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
let timerInterval;
let timerTimeout;
let remainingTime;
let hintUsed = false;
let floodLevel = 0;
let currentIsland = 0;
let islands = [];

// Logros
const ACHIEVEMENTS = [
    { name: "¡Multiplicador Novato! 🏅", condition: "score", value: 100 },
    { name: "¡Racha de 5! 🔥", condition: "streak", value: 5 },
    { name: "¡Racha Incendiaria! 🌋", condition: "streak", value: 10 },
    { name: "Tabla del 2 Completada 📚", condition: "tables", value: 2 },
    { name: "Tabla del 5 Completada 📖", condition: "tables", value: 5 },
    { name: "¡Maestro de 5 Tablas! 👑", condition: "totalTables", value: 5 },
    { name: "¡Tabla del 10 Dominada! 🎯", condition: "tables", value: 10 },
    { name: "¡Maestro de Todas las Tablas! 🏆", condition: "allTables", value: 10 },
    { name: "¡Multiplicador Maestro! 💎", condition: "score", value: 500 },
    { name: "¡Puntuación Épica! 🚀", condition: "score", value: 1000 },
];

function generateQuestion() {
    const config = GAME_CONFIG[currentDifficulty];
    remainingTime = Math.floor(config.timeLimit / 1000); // in seconds
    respuestaCorrecta = multiplicando * multiplicador;
    questionDisplay.textContent = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
    calculatorDisplay.textContent = '0';
    hintUsed = false;
    if (hintButton) {
        hintButton.disabled = !config.hints;
        if (config.hints) {
            hintButton.disabled = false;
        } else {
            hintButton.disabled = true;
        }
    }
    resultDiv.textContent = '';
    rewardsDiv.textContent = '';
    questionStartTime = Date.now();
    updateTimerDisplay();
    startTimer(config.timeLimit);
    updateUI();
}

function updateTimerDisplay() {
    if (timerDisplay) {
        timerDisplay.textContent = `Tiempo: ${remainingTime}s`;
        if (remainingTime <= 5) {
            timerDisplay.classList.add('critical');
        } else {
            timerDisplay.classList.remove('critical');
        }
    }
}

function startTimer(timeLimit) {
    // Clear any existing timers
    clearInterval(timerInterval);
    clearTimeout(timerTimeout);

    // Update display every second
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);

    // Timeout for time up
    timerTimeout = setTimeout(timeUp, timeLimit);
}

function timeUp() {
    clearInterval(timerInterval);
    clearTimeout(timerTimeout);
    wrongSound.play();
    streak = 0;
    resultDiv.textContent = '¡Se acabó el tiempo! La respuesta era ' + respuestaCorrecta + '.';
    resultDiv.className = 'result-message wrong';
    characterImg.classList.add('wrong');
    
    // Increase flood on time up
    floodLevel = Math.min(50, floodLevel + 30);
    // Activar peligro visual
    activateDanger();
    
    // Reinicia la tabla actual
    multiplicador = 1;
    questionsAnsweredInTable = 0;
    
    setTimeout(() => {
        resultDiv.className = 'result-message';
        characterImg.classList.remove('correct', 'wrong');
        nextQuestion();
    }, DELAY_NEXT_QUESTION);
    
    updateUI();
    saveProgress();
}

function checkAnswer() {
    // Clear timers first
    clearInterval(timerInterval);
    clearTimeout(timerTimeout);
    
    const userAnswer = parseInt(calculatorDisplay.textContent);
    const timeTaken = Date.now() - questionStartTime;
    const config = GAME_CONFIG[currentDifficulty];
    
    if (timeTaken >= config.timeLimit) {
        timeUp();
        return;
    }
    
    if (userAnswer === respuestaCorrecta) {
        correctSound.play();
        const points = calculatePoints(timeTaken);
        score += points;
        streak++;
        resultDiv.textContent = `¡Correcto! +${points} puntos`;
        resultDiv.className = 'result-message correct';
        characterImg.classList.add('correct');
        
        // Decrease flood on correct answer
        if (floodLevel > 0) {
            floodLevel = Math.max(0, floodLevel - 10);
        }
        
        // Recompensa visual por acierto
        if (streak > 0) {
            addReward('mini');
            correctSound.play();
        }
        
        checkAchievements();
        
        questionsAnsweredInTable++;
        
        if (questionsAnsweredInTable >= QUESTIONS_PER_TABLE) {
            checkTableCompletion();
        } else {
            setTimeout(nextQuestion, DELAY_NEXT_QUESTION);
        }

    } else {
        wrongSound.play();
        streak = 0;
        resultDiv.textContent = `Incorrecto. La respuesta era ${respuestaCorrecta}.`;
        resultDiv.className = 'result-message wrong';
        characterImg.classList.add('wrong');
        
        // Increase flood and activate danger on wrong answer
        floodLevel = Math.min(50, floodLevel + 20);
        activateDanger();
        
        // Reinicia la tabla actual para que el usuario la domine
        multiplicador = 1;
        questionsAnsweredInTable = 0;
        setTimeout(nextQuestion, DELAY_NEXT_QUESTION);
    }

    setTimeout(() => {
        resultDiv.className = 'result-message';
        characterImg.classList.remove('correct', 'wrong');
        calculatorDisplay.textContent = '0';
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
    
    // Clear any remaining timers before next question
    clearInterval(timerInterval);
    clearTimeout(timerTimeout);
    
    setTimeout(generateQuestion, DELAY_NEXT_QUESTION);
}

function checkTableCompletion() {
    if (questionsAnsweredInTable >= QUESTIONS_PER_TABLE && !tablesCompleted.includes(multiplicando)) {
        tablesCompleted.push(multiplicando);
        rewardsDiv.textContent = `¡Felicidades! ¡Has completado la tabla del ${multiplicando}! ¡Isla conquistada!`;
        
        // Marcar isla como completada
        if (islands[currentIsland]) {
            islands[currentIsland].classList.add('completed');
            addReward('treasure', parseInt(islands[currentIsland].style.left));
        }
        
        // Reset flood on table completion
        floodLevel = 0;
        
        // Reiniciar pregunta para nueva tabla
        multiplicador = 1;
        questionsAnsweredInTable = 0;

        // ¿Viaje completo?
        if (tablesCompleted.length === MAX_MULTIPLICADOR) {
            rewardsDiv.textContent += ` ¡Viaje completado! ¡Eres un/a navegante experto/a!`;
            boat.classList.add('arrived');
            updateBoatPosition();
        } else {
            // Avanzar a la siguiente isla/tabla
            currentIsland = Math.min(tablesCompleted.length, MAX_MULTIPLICADOR - 1);
            multiplicando = currentIsland + 1;
            updateBoatPosition();
        }
    }
    
    setTimeout(generateQuestion, DELAY_NEXT_TABLE);
}

function initIslands() {
    const container = document.getElementById('islands-container');
    container.innerHTML = '';
    islands = [];
    
    for (let i = 1; i <= MAX_MULTIPLICADOR; i++) {
        const island = document.createElement('div');
        island.className = 'island';
        island.style.left = `${(i - 1) * 12}%`; // Espaciadas de 0% a 108%
        island.dataset.table = i;

        // Etiqueta con número de tabla
        const label = document.createElement('span');
        label.className = 'island-label';
        label.textContent = i.toString();
        island.appendChild(label);

        container.appendChild(island);
        islands.push(island);
    }

    // Marcar islas ya completadas (desde progreso guardado)
    tablesCompleted.forEach(num => {
        if (islands[num - 1]) islands[num - 1].classList.add('completed');
    });

    // Alinear isla actual a partir del progreso
    currentIsland = Math.max(0, (multiplicando || 1) - 1);
    
    // Posición inicial barco
    updateBoatPosition();
}

function activateDanger(duration = 3000) {
    const danger = document.getElementById('danger-container');
    danger.classList.add('active');
    setTimeout(() => {
        danger.classList.remove('active');
    }, duration);
}

function addReward(type = 'mini', position = null) {
    const rewardsContainer = document.getElementById('rewards-container');
    const reward = document.createElement('div');
    reward.className = 'reward-item';
    reward.textContent = type === 'treasure' ? '🏝️💎' : '⭐';
    if (position) {
        reward.style.left = position + '%';
    } else {
        reward.style.left = '50%';
    }
    rewardsContainer.appendChild(reward);
    
    setTimeout(() => {
        rewardsContainer.removeChild(reward);
    }, 2000);
}

function calculatePoints(time) {
    const config = GAME_CONFIG[currentDifficulty];
    const basePoints = 10;
    const timeBonus = Math.max(0, 1 - (time / config.timeLimit));
    return Math.floor((basePoints + (basePoints * timeBonus)) * config.pointsMultiplier);
}

function updateBoatPosition() {
    // Posición del barco cerca de la isla actual
    const targetPos = currentIsland * 12; // Alineado con islas
    const progressInIsland = (questionsAnsweredInTable / QUESTIONS_PER_TABLE) * 5; // Avance sutil dentro de isla
    const translateX = (targetPos + progressInIsland - 5).toString() + '%'; // Offset para centrar en isla

    // Usar variable CSS para no interferir con la animación de balanceo
    boat.style.setProperty('--transX', translateX);

    // Si completado todo, celebración
    if (tablesCompleted.length >= MAX_MULTIPLICADOR) {
        boat.classList.add('arrived');
        // No sobreescribir transform para mantener el balanceo
    }
}

function updateFlood() {
    flood.style.height = floodLevel + '%';
    if (floodLevel > 0) {
        flood.classList.add('rising');
    } else {
        flood.classList.remove('rising');
    }
    
    // If floodLevel >=50, maybe add sinking animation or reset
    if (floodLevel >= 50) {
        boat.classList.add('sinking');
    } else {
        boat.classList.remove('sinking');
    }
}

function updateUI() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    
    // Actualizar barra de progreso
    const progress = (questionsAnsweredInTable / QUESTIONS_PER_TABLE) * 100;
    progressBar.style.width = `${progress}%`;
    
    updateBoatPosition();
    updateFlood();
    
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
        lastTable: multiplicando,
        currentIsland,
        floodLevel
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
        floodLevel = progress.floodLevel || 0;
        currentIsland = (typeof progress.currentIsland === 'number')
            ? progress.currentIsland
            : Math.max(0, (multiplicando || 1) - 1);
        difficultySelector.value = currentDifficulty;
        updateUI();
    }
}

// Inicializar el juego
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    initIslands(); // Inicializar islas
    // Ensure timerDisplay exists, but we'll add it to HTML next
    generateQuestion();
    updateBoatPosition(); // Initial position
    updateFlood(); // Initial flood

    // Calculator event listeners
    const calcButtons = document.querySelectorAll('.calc-btn');
    calcButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.dataset.value;
            let currentValue = calculatorDisplay.textContent;
            if (currentValue === '0' || currentValue === '') {
                calculatorDisplay.textContent = value;
            } else {
                calculatorDisplay.textContent = currentValue + value;
            }
        });
    });

    clearButton.addEventListener('click', function() {
        calculatorDisplay.textContent = '0';
    });

    // Hint button functionality
    if (hintButton) {
        hintButton.addEventListener('click', function() {
            if (!hintUsed) {
                const hintText = `Pista: ${multiplicando} x ${multiplicador} = ${respuestaCorrecta}`;
                resultDiv.textContent = hintText;
                resultDiv.className = 'result-message hint';
                hintUsed = true;
                this.disabled = true;
            }
        });
    }

    answerButton.addEventListener('click', checkAnswer);
});
