// Forzar limpieza de cualquier sesión previa al cargar la página
localStorage.removeItem("sesionActiva");
localStorage.removeItem("horaLogin");

function iniciarSesion() {
    let u = document.getElementById("usuario").value;
    let p = document.getElementById("password").value;
    let mensajeError = document.getElementById("mensajeError");

    mensajeError.textContent = "";

    // Comparación directa y simple
    if (u === "admin" && p === "1234") {
        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("horaLogin", Date.now());
        
        // Redireccionar al panel principal
        window.location.href = "index.html";
    } else {
        mensajeError.textContent = "❌ Usuario o contraseña incorrectos. Escribiste: " + u + " / " + p;
    }
}

// Escuchar la tecla Enter
document.getElementById("usuario").addEventListener("keyup", function(e) { if (e.key === "Enter") iniciarSesion(); });
document.getElementById("password").addEventListener("keyup", function(e) { if (e.key === "Enter") iniciarSesion(); });
