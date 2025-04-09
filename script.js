console.log("El archivo script.js se ha cargado correctamente.");

let multiplicando = 1;
let multiplicador = 1;
let respuestaCorrecta;

const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');

function generarPregunta() {
    respuestaCorrecta = multiplicando * multiplicador;
    document.getElementById("question").innerText = `¿Cuánto es ${multiplicando} x ${multiplicador}?`;
    document.getElementById("answer").value = "";
    document.getElementById("result").innerText = "";
}

function checkAnswer() {
    const respuestaUsuario = parseInt(document.getElementById("answer").value);
    if (respuestaUsuario === respuestaCorrecta) {
        correctSound.play();
        document.getElementById("result").innerText = "¡Correcto! 🎉";
        multiplicador++;
        if (multiplicador > 10) {
            document.getElementById("result").innerHTML = "¡Felicidades, completaste la tabla del " + multiplicando + "! ⭐";
            document.getElementById("rewards").innerHTML += "🏆 ";
            multiplicador = 1;
            multiplicando++;
            if (multiplicando <= 10) {
                setTimeout(generarPregunta, 2000);
            } else {
                document.getElementById("result").innerHTML = "¡Felicidades, completaste todas las tablas! ⭐⭐";
            }
        } else {
            setTimeout(generarPregunta, 1000);
        }
    } else {
        wrongSound.play();
        document.getElementById("result").innerText = "Incorrecto 😞";
    }
}

function startGame() {
    multiplicando = 1;
    multiplicador = 1;
    generarPregunta();
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("answerButton").addEventListener("click", checkAnswer);
    startGame();
});
