// Sistema de audio del juego
export class AudioSystem {
    constructor() {
        this.sounds = {
            correct: new Audio('sounds/correct.mp3'),
            wrong: new Audio('sounds/wrong.mp3')
        };
        
        // Precargar sonidos
        Object.values(this.sounds).forEach(sound => {
            sound.preload = 'auto';
        });
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                console.log('No se pudo reproducir el sonido:', e);
            });
        }
    }

    playCorrect() {
        this.playSound('correct');
    }

    playWrong() {
        this.playSound('wrong');
    }
}
