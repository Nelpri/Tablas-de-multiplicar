import { MultiplicationGame } from './main.js';

// Inicializar el juego cuando la página esté cargada
window.addEventListener('DOMContentLoaded', () => {
    const game = new MultiplicationGame();
    window.game = game; // Para debugging
});
