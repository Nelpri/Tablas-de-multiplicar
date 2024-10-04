// Muestra un mensaje en la consola confirmando la carga del archivo JavaScript
console.log("El archivo script.js se ha cargado correctamente.");

// Variables iniciales para la multiplicación
let multiplicando = 1;  // Empezar con la tabla del 1
let multiplicador = 1;
let respuestaCorrecta; // Almacena la respuesta correcta

// Genera una nueva pregunta de multiplicación
function generarPregunta() {
    respuestaCorrecta = multiplicando * multiplicador; // Calcula la respuesta correcta
    document.getElementById("question").innerText = `¿Cuánto es ${multiplicando} x ${multiplicador}?`; // Actualiza la pregunta
    document.getElementById("answer").value = "";  // Limpia el campo de respuesta
    document.getElementById("result").innerText = "";  // Limpia el resultado anterior
}

// Verifica si la respuesta del usuario es correcta
function checkAnswer() {
    const respuestaUsuario = parseInt(document.getElementById("answer").value); // Obtiene la respuesta del usuario
    if (respuestaUsuario === respuestaCorrecta) { // Verifica si la respuesta es correcta
        document.getElementById("result").innerText = "¡Correcto! 🎉"; // Muestra mensaje de acierto
        multiplicador++; // Avanza al siguiente multiplicador
        if (multiplicador > 10) { // Verifica si completó la tabla actual
            document.getElementById("result").innerHTML = "¡Felicidades, completaste la tabla del " + multiplicando + "! ⭐";
            multiplicador = 1; // Reinicia el multiplicador para la nueva tabla
            multiplicando++; // Avanza al siguiente multiplicando
            if (multiplicando <= 10) { // Verifica si quedan tablas por completar
                setTimeout(generarPregunta, 2000);  // Espera 2 segundos antes de generar la siguiente tabla
            } else {
                document.getElementById("result").innerHTML = "¡Felicidades, completaste todas las tablas! ⭐⭐";
            }
        } else {
            setTimeout(generarPregunta, 1000);  // Espera 1 segundo antes de generar la siguiente pregunta
        }
    } else {
        document.getElementById("result").innerText = "Incorrecto 😞"; // Muestra mensaje de error
    }
}

// Inicia el juego con la primera tabla
function startGame() {
    multiplicando = 1; // Resetea el multiplicando al 1
    multiplicador = 1; // Resetea el multiplicador al 1
    generarPregunta(); // Genera la primera pregunta
}

// Asegura que el código se ejecute después de que la página ha cargado completamente
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("answerButton").addEventListener("click", checkAnswer); // Añade evento al botón de respuesta
    startGame(); // Inicia el juego
});
