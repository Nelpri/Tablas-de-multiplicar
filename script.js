window.onload = function() {
    // --- VARIABLES GLOBALES ---
    const QUESTION_COUNT_PER_ISLAND = 5;
    const ISLAND_COUNT = 10;
    const DELAY_AFTER_CORRECT = 1500;
    const DELAY_AFTER_WRONG = 1500;
    const SHARK_ATTACKS_BEFORE_LOSE = 3;

    // --- SISTEMA DE AUDIO ---
    const audioSystem = {
        sounds: {
            correct: new Audio('sounds/correct.mp3'),
            wrong: new Audio('sounds/wrong.mp3')
        },
        
        init() {
            Object.values(this.sounds).forEach(sound => {
                sound.preload = 'auto';
            });
        },
        
        playSound(soundName) {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => {
                    console.log('No se pudo reproducir el sonido:', e);
                });
            }
        },
        
        playCorrect() {
            this.playSound('correct');
        },
        
        playWrong() {
            this.playSound('wrong');
        }
    };
    
    // Inicializar sistema de audio
    audioSystem.init();

    let scene, camera, renderer;
    let currentTable = 1;
    let questionsAnswered = 0;
    let score = 0;
    let currentAnswer = "";
    let correctAnswer;
    let isPaused = false;
    let sharkAttackCount = 0;
    let timer;
    let timerInterval;

    // 3D Objects
    let boat, shark;
    const islands = [];
    const fishes = [];
    let sea;

    // Difficulty settings
    const DIFFICULTIES = {
        easy: 30,
        medium: 20,
        hard: 10
    };
    let currentDifficulty = 'easy';

    // DOM Elements
    const gameCanvas = document.getElementById('gameCanvas');
    const questionDisplay = document.getElementById('questionDisplay');
    const calculatorDisplay = document.getElementById('calculatorDisplay');
    const statusMessage = document.getElementById('statusMessage');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const pauseDialog = document.getElementById('pauseDialog');
    const uiContainer = document.getElementById('gameUI');
    const timerDisplay = document.getElementById('timerDisplay');
    const difficultySelector = document.getElementById('difficulty');
    const sharkWarning = document.getElementById('sharkWarning');

    // --- INICIALIZAR LA ESCENA THREE.JS ---
    function initThreeJs() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 15);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Sea with waves
        const seaGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        const seaMaterial = new THREE.MeshPhongMaterial({ color: 0x4cc9f0, shininess: 50, flatShading: true, wireframe: false });
        sea = new THREE.Mesh(seaGeometry, seaMaterial);
        sea.rotation.x = -Math.PI / 2;
        sea.position.y = -5;
        scene.add(sea);

        // Create islands with grass top
        const islandGroundGeometry = new THREE.CylinderGeometry(5, 5, 2, 32);
        const islandGroundMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 });
        const islandGrassGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
        const islandGrassMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });

        for (let i = 0; i < ISLAND_COUNT; i++) {
            const islandGroup = new THREE.Group();
            const islandGround = new THREE.Mesh(islandGroundGeometry, islandGroundMaterial);
            const islandGrass = new THREE.Mesh(islandGrassGeometry, islandGrassMaterial);
            islandGrass.position.y = 1.25;
            islandGroup.add(islandGround);
            islandGroup.add(islandGrass);

            const angle = (i / ISLAND_COUNT) * Math.PI * 2;
            islandGroup.position.x = Math.cos(angle) * 30;
            islandGroup.position.z = Math.sin(angle) * 30;
            islandGroup.userData = { table: i + 1, index: i };
            islands.push(islandGroup);
            scene.add(islandGroup);
        }

        // Create boat with mast
        const boatGroup = new THREE.Group();
        const boatHull = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 1, 4),
            new THREE.MeshBasicMaterial({ color: 0xffa500 })
        );
        boatHull.rotation.y = Math.PI / 4;
        boatHull.rotation.x = -Math.PI / 2;
        boatGroup.add(boatHull);

        const mast = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 2, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x8B4513 })
        );
        mast.position.y = 1;
        boatGroup.add(mast);

        boat = boatGroup;
        scene.add(boat);

        // Create shark
        const sharkGeometry = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16);
        const sharkMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        shark = new THREE.Mesh(sharkGeometry, sharkMaterial);
        shark.position.set(0, -10, -50);
        shark.rotation.y = Math.PI;
        scene.add(shark);

        // Create fish
        for(let i = 0; i < 20; i++) {
            const fish = new THREE.Mesh(
                new THREE.ConeGeometry(0.3, 1, 8),
                new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
            );
            fish.position.set(
                (Math.random() - 0.5) * 100,
                -4.5,
                (Math.random() - 0.5) * 100
            );
            fish.rotation.y = Math.random() * Math.PI * 2;
            fishes.push(fish);
            scene.add(fish);
        }
        
        // Set initial boat position
        updateBoatPosition();
    }

    // --- LÓGICA DEL JUEGO ---
    function generateQuestion() {
        clearInterval(timerInterval);
        resetTimer();
        
        const multiplicando = currentTable;
        const multiplicador = Math.floor(Math.random() * 10) + 1;
        correctAnswer = multiplicando * multiplicador;
        questionDisplay.textContent = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
        calculatorDisplay.textContent = "0";
        currentAnswer = "";
        statusMessage.style.opacity = 0;

        // Reset shark
        shark.position.set(0, -10, -50);
        sharkWarning.style.display = 'none';

        startTimer();
    }

    function checkAnswer() {
        if (isPaused) return;
        clearInterval(timerInterval);

        const userAnswer = parseInt(currentAnswer);
        if (userAnswer === correctAnswer) {
            score += 10;
            scoreDisplay.textContent = score;
            statusMessage.textContent = "¡Correcto!";
            statusMessage.className = 'status-message correct';
            audioSystem.playCorrect();
            
            questionsAnswered++;
            if (questionsAnswered >= QUESTION_COUNT_PER_ISLAND) {
                setTimeout(() => {
                    questionsAnswered = 0;
                    currentTable++;
                    if (currentTable > ISLAND_COUNT) {
                        showGameEndDialog();
                    } else {
                        updateBoatPosition();
                        generateQuestion();
                    }
                }, DELAY_AFTER_CORRECT);
            } else {
                setTimeout(() => {
                    generateQuestion();
                }, DELAY_AFTER_CORRECT);
            }
        } else {
            sharkAttackCount++;
            if (sharkAttackCount >= SHARK_ATTACKS_BEFORE_LOSE) {
                showGameOverDialog();
                return;
            }
            statusMessage.textContent = "¡Incorrecto! Cuidado, el tiburón se acerca...";
            statusMessage.className = 'status-message incorrect';
            sharkWarning.style.display = 'block';
            audioSystem.playWrong();
            
            // Animate shark attack
            const sharkPosition = shark.position.clone();
            const targetPosition = boat.position.clone();
            const sharkSpeed = 0.05;
            
            const animateShark = () => {
                if (isPaused) return;

                const direction = targetPosition.clone().sub(shark.position).normalize();
                shark.position.add(direction.multiplyScalar(sharkSpeed));
                
                const distance = shark.position.distanceTo(targetPosition);
                if (distance > 1) {
                    requestAnimationFrame(animateShark);
                } else {
                    shark.position.set(0, -10, -50); // Reset shark position
                    sharkWarning.style.display = 'none';
                    startTimer(); // Restart timer
                }
            };
            animateShark();

            currentAnswer = "";
            calculatorDisplay.textContent = "0";
            setTimeout(() => {
                statusMessage.style.opacity = 0;
            }, DELAY_AFTER_WRONG);
        }
    }

    function updateBoatPosition() {
        const islandIndex = currentTable - 1;
        const targetIsland = islands[islandIndex];
        boat.position.x = targetIsland.position.x;
        boat.position.z = targetIsland.position.z;
        boat.position.y = targetIsland.position.y + 2;
        
        // Position camera to look at the new island
        camera.position.x = boat.position.x;
        camera.position.z = boat.position.z + 15;
        camera.lookAt(boat.position);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Animate sea waves
        const now = Date.now() * 0.0005;
        const positions = sea.geometry.attributes.position;
        for(let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const y = Math.sin(x * 0.5 + now) * 0.5 + Math.sin(z * 0.5 + now) * 0.5;
            positions.setY(i, y);
        }
        positions.needsUpdate = true;

        // Animate fishes
        fishes.forEach(fish => {
            fish.position.x += Math.cos(fish.rotation.y) * 0.1;
            fish.position.z += Math.sin(fish.rotation.y) * 0.1;
            if (Math.abs(fish.position.x) > 100 || Math.abs(fish.position.z) > 100) {
                fish.position.set(0, -4.5, 0);
            }
        });
        
        renderer.render(scene, camera);
    }

    function resetTimer() {
        timer = DIFFICULTIES[currentDifficulty];
        timerDisplay.textContent = `Tiempo: ${timer}s`;
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            timerDisplay.textContent = `Tiempo: ${timer}s`;
            if (timer <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }

    function handleTimeOut() {
        checkAnswer(); // Consider the answer incorrect
    }

    function showPauseDialog() {
        isPaused = true;
        clearInterval(timerInterval);
        pauseDialog.classList.add('active');
        uiContainer.style.display = 'none';
    }

    function hidePauseDialog() {
        isPaused = false;
        pauseDialog.classList.remove('active');
        uiContainer.style.display = 'flex';
        startTimer();
    }
    
    function showGameEndDialog() {
        const finalScore = score;
        const finalDialog = document.createElement('div');
        finalDialog.className = 'dialog active';
        finalDialog.innerHTML = `
            <h2>¡Aventura Terminada!</h2>
            <p>Has completado las tablas de multiplicar.</p>
            <p>Puntuación Final: ${finalScore}</p>
            <button class="dialog-button" id="playAgainButton">Jugar de Nuevo</button>
        `;
        document.body.appendChild(finalDialog);
        uiContainer.style.display = 'none';

        document.getElementById('playAgainButton').addEventListener('click', () => {
            window.location.reload();
        });
    }

    function showGameOverDialog() {
        const finalScore = score;
        const gameOverDialog = document.createElement('div');
        gameOverDialog.className = 'dialog active';
        gameOverDialog.innerHTML = `
            <h2>¡Fin del Juego!</h2>
            <p>El tiburón te ha alcanzado.</p>
            <p>Puntuación Final: ${finalScore}</p>
            <button class="dialog-button" id="playAgainButton">Jugar de Nuevo</button>
        `;
        document.body.appendChild(gameOverDialog);
        uiContainer.style.display = 'none';

        document.getElementById('playAgainButton').addEventListener('click', () => {
            window.location.reload();
        });
    }

    // --- MANEJO DE EVENTOS ---
    document.addEventListener('keydown', (event) => {
        if (isPaused) return;
        if (event.key >= '0' && event.key <= '9') {
            currentAnswer += event.key;
            if (calculatorDisplay.textContent === "0") {
                calculatorDisplay.textContent = event.key;
            } else {
                calculatorDisplay.textContent += event.key;
            }
        } else if (event.key === 'Enter') {
            checkAnswer();
        } else if (event.key === 'Backspace') {
            currentAnswer = currentAnswer.slice(0, -1);
            calculatorDisplay.textContent = currentAnswer === "" ? "0" : currentAnswer;
        } else if (event.key === 'Escape') {
            showPauseDialog();
        }
    });

    document.querySelectorAll('.keypad-button').forEach(button => {
        button.addEventListener('click', () => {
            if (isPaused) return;
            const value = button.dataset.value;
            const action = button.dataset.action;
            if (action === 'clear') {
                currentAnswer = "";
                calculatorDisplay.textContent = "0";
            } else if (action === 'check') {
                checkAnswer();
            } else if (action === 'pause') {
                showPauseDialog();
            } else {
                currentAnswer += value;
                if (calculatorDisplay.textContent === "0") {
                    calculatorDisplay.textContent = value;
                } else {
                    calculatorDisplay.textContent += value;
                }
            }
        });
    });

    difficultySelector.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        resetTimer();
    });

    document.getElementById('resumeButton').addEventListener('click', hidePauseDialog);
    document.getElementById('exitButton').addEventListener('click', () => {
        window.location.reload();
    });

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    gameCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition.x = e.clientX;
        previousMousePosition.y = e.clientY;
    });
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
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
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- INICIAR EL JUEGO ---
    initThreeJs();
    animate();
    generateQuestion();
};
