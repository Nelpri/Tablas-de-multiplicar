import { GAME_CONFIG, COLORS } from './constants.js';
import { AudioSystem } from './audio.js';

// Clase principal del juego
export class MultiplicationGame {
    constructor() {
        this.currentTable = 1;
        this.questionsAnswered = 0;
        this.score = 0;
        this.currentAnswer = "";
        this.correctAnswer = 0;
        this.isPaused = false;
        this.sharkAttackCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.currentDifficulty = 'easy';
        
        // Objetos 3D
        this.boat = null;
        this.shark = null;
        this.islands = [];
        this.fishes = [];
        this.sea = null;
        
        // Sistema de audio
        this.audioSystem = new AudioSystem();
        
        // Referencias DOM
        this.gameCanvas = document.getElementById('gameCanvas');
        this.questionDisplay = document.getElementById('questionDisplay');
        this.calculatorDisplay = document.getElementById('calculatorDisplay');
        this.statusMessage = document.getElementById('statusMessage');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.difficultySelector = document.getElementById('difficulty');
        this.sharkWarning = document.getElementById('sharkWarning');
        
        this.init();
    }

    init() {
        this.initThreeJs();
        this.setupEventListeners();
        this.generateQuestion();
        this.animate();
    }

    initThreeJs() {
        // Configuración básica de Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.SEA);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.gameCanvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.setupLighting();
        this.createSea();
        this.createIslands();
        this.createBoat();
        this.createShark();
        this.createFish();
        this.updateBoatPosition();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    createSea() {
        const seaGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        const seaMaterial = new THREE.MeshPhongMaterial({ 
            color: COLORS.SEA, 
            shininess: 50, 
            flatShading: true, 
            wireframe: false 
        });
        this.sea = new THREE.Mesh(seaGeometry, seaMaterial);
        this.sea.rotation.x = -Math.PI / 2;
        this.sea.position.y = -5;
        this.scene.add(this.sea);
    }

    createIslands() {
        const islandGroundGeometry = new THREE.CylinderGeometry(5, 5, 2, 32);
        const islandGroundMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ISLAND_GROUND });
        const islandGrassGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
        const islandGrassMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ISLAND_GRASS });

        for (let i = 0; i < GAME_CONFIG.ISLAND_COUNT; i++) {
            const islandGroup = new THREE.Group();
            const islandGround = new THREE.Mesh(islandGroundGeometry, islandGroundMaterial);
            const islandGrass = new THREE.Mesh(islandGrassGeometry, islandGrassMaterial);
            islandGrass.position.y = 1.25;
            islandGroup.add(islandGround);
            islandGroup.add(islandGrass);

            const angle = (i / GAME_CONFIG.ISLAND_COUNT) * Math.PI * 2;
            islandGroup.position.x = Math.cos(angle) * 30;
            islandGroup.position.z = Math.sin(angle) * 30;
            islandGroup.userData = { table: i + 1, index: i };
            this.islands.push(islandGroup);
            this.scene.add(islandGroup);
        }
    }

    createBoat() {
        const boatGroup = new THREE.Group();
        const boatHull = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 1, 4),
            new THREE.MeshBasicMaterial({ color: COLORS.BOAT })
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

        this.boat = boatGroup;
        this.scene.add(this.boat);
    }

    createShark() {
        const sharkGeometry = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16);
        const sharkMaterial = new THREE.MeshBasicMaterial({ color: COLORS.SHARK });
        this.shark = new THREE.Mesh(sharkGeometry, sharkMaterial);
        this.shark.position.set(0, -10, -50);
        this.shark.rotation.y = Math.PI;
        this.scene.add(this.shark);
    }

    createFish() {
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
            this.fishes.push(fish);
            this.scene.add(fish);
        }
    }

    generateQuestion() {
        clearInterval(this.timerInterval);
        this.resetTimer();
        
        const multiplicando = this.currentTable;
        const multiplicador = Math.floor(Math.random() * 10) + 1;
        this.correctAnswer = multiplicando * multiplicador;
        this.questionDisplay.textContent = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
        this.calculatorDisplay.textContent = "0";
        this.currentAnswer = "";
        this.statusMessage.style.opacity = 0;

        // Reset shark
        this.shark.position.set(0, -10, -50);
        this.sharkWarning.style.display = 'none';

        this.startTimer();
    }

    checkAnswer() {
        if (this.isPaused) return;
        clearInterval(this.timerInterval);

        const userAnswer = parseInt(this.currentAnswer);
        if (userAnswer === this.correctAnswer) {
            this.score += 10;
            this.scoreDisplay.textContent = this.score;
            this.statusMessage.textContent = "¡Correcto!";
            this.statusMessage.className = 'status-message correct';
            this.audioSystem.playCorrect();
            
            this.questionsAnswered++;
            if (this.questionsAnswered >= GAME_CONFIG.QUESTION_COUNT_PER_ISLAND) {
                setTimeout(() => {
                    this.questionsAnswered = 0;
                    this.currentTable++;
                    if (this.currentTable > GAME_CONFIG.ISLAND_COUNT) {
                        this.showGameEndDialog();
                    } else {
                        this.updateBoatPosition();
                        this.generateQuestion();
                    }
                }, GAME_CONFIG.DELAY_AFTER_CORRECT);
            } else {
                setTimeout(() => {
                    this.generateQuestion();
                }, GAME_CONFIG.DELAY_AFTER_CORRECT);
            }
        } else {
            this.sharkAttackCount++;
            if (this.sharkAttackCount >= GAME_CONFIG.SHARK_ATTACKS_BEFORE_LOSE) {
                this.showGameOverDialog();
                return;
            }
            this.statusMessage.textContent = "¡Incorrecto! Cuidado, el tiburón se acerca...";
            this.statusMessage.className = 'status-message incorrect';
            this.sharkWarning.style.display = 'block';
            this.audioSystem.playWrong();
            
            this.animateSharkAttack();

            this.currentAnswer = "";
            this.calculatorDisplay.textContent = "0";
            setTimeout(() => {
                this.statusMessage.style.opacity = 0;
            }, GAME_CONFIG.DELAY_AFTER_WRONG);
        }
    }

    animateSharkAttack() {
        const sharkPosition = this.shark.position.clone();
        const targetPosition = this.boat.position.clone();
        const sharkSpeed = 0.05;
        
        const animate = () => {
            if (this.isPaused) return;

            const direction = targetPosition.clone().sub(this.shark.position).normalize();
            this.shark.position.add(direction.multiplyScalar(sharkSpeed));
            
            const distance = this.shark.position.distanceTo(targetPosition);
            if (distance > 1) {
                requestAnimationFrame(animate);
            } else {
                this.shark.position.set(0, -10, -50);
                this.sharkWarning.style.display = 'none';
                this.startTimer();
            }
        };
        animate();
    }

    updateBoatPosition() {
        const islandIndex = this.currentTable - 1;
        const targetIsland = this.islands[islandIndex];
        this.boat.position.x = targetIsland.position.x;
        this.boat.position.z = targetIsland.position.z;
        this.boat.position.y = targetIsland.position.y + 2;
        
        this.camera.position.x = this.boat.position.x;
        this.camera.position.z = this.boat.position.z + 15;
        this.camera.lookAt(this.boat.position);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Animate sea waves
        const now = Date.now() * 0.0005;
        const positions = this.sea.geometry.attributes.position;
        for(let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const y = Math.sin(x * 0.5 + now) * 0.5 + Math.sin(z * 0.5 + now) * 0.5;
            positions.setY(i, y);
        }
        positions.needsUpdate = true;

        // Animate fishes
        this.fishes.forEach(fish => {
            fish.position.x += Math.cos(fish.rotation.y) * 0.1;
            fish.position.z += Math.sin(fish.rotation.y) * 0.1;
            if (Math.abs(fish.position.x) > 100 || Math.abs(fish.position.z) > 100) {
                fish.position.set(0, -4.5, 0);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    resetTimer() {
        this.timer = GAME_CONFIG.DIFFICULTIES[this.currentDifficulty];
        this.timerDisplay.textContent = `Tiempo: ${this.timer}s`;
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.timerDisplay.textContent = `Tiempo: ${this.timer}s`;
            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.checkAnswer();
            }
        }, 1000);
    }

    showGameEndDialog() {
        const finalScore = this.score;
        const finalDialog = document.createElement('div');
        finalDialog.className = 'dialog active';
        finalDialog.innerHTML = `
            <h2>¡Aventura Terminada!</h2>
            <p>Has completado las tablas de multiplicar.</p>
            <p>Puntuación Final: ${finalScore}</p>
            <button class="dialog-button" id="playAgainButton">Jugar de Nuevo</button>
        `;
        document.body.appendChild(finalDialog);
        document.getElementById('gameUI').style.display = 'none';

        document.getElementById('playAgainButton').addEventListener('click', () => {
            window.location.reload();
        });
    }

    showGameOverDialog() {
        const finalScore = this.score;
        const gameOverDialog = document.createElement('div');
        gameOverDialog.className = 'dialog active';
        gameOverDialog.innerHTML = `
            <h2>¡Fin del Juego!</h2>
            <p>El tiburón te ha alcanzado.</p>
            <p>Puntuación Final: ${finalScore}</p>
            <button class="dialog-button" id="playAgainButton">Jugar de Nuevo</button>
        `;
        document.body.appendChild(gameOverDialog);
        document.getElementById('gameUI').style.display = 'none';

        document.getElementById('playAgainButton').addEventListener('click', () => {
            window.location.reload();
        });
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (event) => {
            if (this.isPaused) return;
            if (event.key >= '0' && event.key <= '9') {
                this.currentAnswer += event.key;
                if (this.calculatorDisplay.textContent === "0") {
                    this.calculatorDisplay.textContent = event.key;
                } else {
                    this.calculatorDisplay.textContent += event.key;
                }
            } else if (event.key === 'Enter') {
                this.checkAnswer();
            } else if (event.key === 'Backspace') {
                this.currentAnswer = this.currentAnswer.slice(0, -1);
                this.calculatorDisplay.textContent = this.currentAnswer === "" ? "0" : this.currentAnswer;
            } else if (event.key === 'Escape') {
                this.showPauseDialog();
            }
        });

        // Teclado virtual
        document.querySelectorAll('.keypad-button').forEach(button => {
            button.addEventListener('click', () => {
                if (this.isPaused) return;
                const value = button.dataset.value;
                const action = button.dataset.action;
                if (action === 'clear') {
                    this.currentAnswer = "";
                    this.calculatorDisplay.textContent = "0";
                } else if (action === 'check') {
                    this.checkAnswer();
                } else if (action === 'pause') {
                    this.showPauseDialog();
                } else {
                    this.currentAnswer += value;
                    if (this.calculatorDisplay.textContent === "0") {
                        this.calculatorDisplay.textContent = value;
                    } else {
                        this.calculatorDisplay.textContent += value;
                    }
                }
            });
        });

        // Selector de dificultad
        this.difficultySelector.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.resetTimer();
        });

        // Diálogos
        document.getElementById('resumeButton').addEventListener('click', () => this.hidePauseDialog());
        document.getElementById('exitButton').addEventListener('click', () => {
            window.location.reload();
        });

        // Cámara 3D
        this.setupCameraControls();
        
        // Redimensionar ventana
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupCameraControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.gameCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition.x = e.clientX;
            previousMousePosition.y = e.clientY;
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging || this.isPaused) return;
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            this.camera.position.x -= deltaX * 0.05;
            this.camera.position.y += deltaY * 0.05;
            this.camera.lookAt(this.boat.position.x, this.boat.position.y - 2, this.boat.position.z);
            previousMousePosition.x = e.clientX;
            previousMousePosition.y = e.clientY;
        });
    }

    showPauseDialog() {
        this.isPaused = true;
        clearInterval(this.timerInterval);
        document.getElementById('pauseDialog').classList.add('active');
        document.getElementById('gameUI').style.display = 'none';
    }

    hidePauseDialog() {
        this.isPaused = false;
        document.getElementById('pauseDialog').classList.remove('active');
        document.getElementById('gameUI').style.display = 'flex';
        this.startTimer();
    }
}
