// Si ya hay una sesión activa con tiempo válido, salta directamente al panel principal
let sesionActiva = localStorage.getItem("sesionActiva");
let horaLogin = localStorage.getItem("horaLogin");
if (sesionActiva === "true" && horaLogin && (Date.now() - horaLogin < 600000)) {
    window.location.href = "index.html";
}

function iniciarSesion() {
    // Aplicamos .trim() a ambos campos para borrar espacios accidentales en blanco
    let usuarioInput = document.getElementById("usuario").value.trim();
    let passwordInput = document.getElementById("password").value.trim();
    let mensajeError = document.getElementById("mensajeError");

    // Limpiamos el mensaje de alerta anterior
    mensajeError.textContent = "";

    if (usuarioInput === "" || passwordInput === "") {
        mensajeError.textContent = "⚠ Por favor, complete todos los campos.";
        return;
    }

    // Validación limpia sin importar espacios ocultos
    if (usuarioInput.toLowerCase() === "admin" && passwordInput === "1234") {
        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("horaLogin", Date.now()); // Control de los 10 minutos
        
        // Redirección inmediata al panel de control
        window.location.href = "index.html";
    } else {
        mensajeError.textContent = "❌ Usuario o contraseña incorrectos.";
    }
}

// Permitir el ingreso presionando la tecla "Enter" en el teclado
document.getElementById("usuario").addEventListener("keyup", function(event) {
    if (event.key === "Enter") iniciarSesion();
});
document.getElementById("password").addEventListener("keyup", function(event) {
    if (event.key === "Enter") iniciarSesion();
});
