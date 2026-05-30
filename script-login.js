// Si ya hay una sesión activa con tiempo válido, salta directamente al panel principal
let sesionActiva = localStorage.getItem("sesionActiva");
let horaLogin = localStorage.getItem("horaLogin");
if (sesionActiva === "true" && horaLogin && (Date.now() - horaLogin < 600000)) {
    window.location.href = "index.html";
}

function iniciarSesion() {
    let usuarioInput = document.getElementById("usuario").value.trim();
    let passwordInput = document.getElementById("password").value;
    let mensajeError = document.getElementById("mensajeError");

    // Limpiamos el mensaje anterior
    mensajeError.textContent = "";

    if (usuarioInput === "" || passwordInput === "") {
        mensajeError.textContent = "⚠ Por favor, complete todos los campos.";
        return;
    }

    // Aquí es donde el sistema verifica tus nuevas credenciales
    if (usuarioInput === "admin" && passwordInput === "1234") {
        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("horaLogin", Date.now()); // Control de los 10 minutos
        
        // Redirección al panel principal
        window.location.href = "index.html";
    } else {
        mensajeError.textContent = "❌ Usuario o contraseña incorrectos.";
    }
}

// Permitir el ingreso presionando la tecla "Enter"
document.getElementById("usuario").addEventListener("keyup", function(event) {
    if (event.key === "Enter") iniciarSesion();
});
document.getElementById("password").addEventListener("keyup", function(event) {
    if (event.key === "Enter") iniciarSesion();
});
