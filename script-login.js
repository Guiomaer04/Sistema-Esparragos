// Limpieza obligatoria de sesiones viejas al cargar la pantalla
localStorage.removeItem("sesionActiva");
localStorage.removeItem("horaLogin");

// RECOMENDACIÓN: SALUDO DINÁMICO SEGÚN LA HORA DEL DÍA
document.addEventListener("DOMContentLoaded", function() {
    const saludoTxt = document.getElementById("saludo");
    const hora = new Date().getHours();

    if (hora >= 6 && hora < 12) {
        saludoTxt.textContent = "¡Buenos días!";
    } else if (hora >= 12 && hora < 18) {
        saludoTxt.textContent = "¡Buenas tardes!";
    } else {
        saludoTxt.textContent = "¡Buenas noches!";
    }
});

// RECOMENDACIÓN: FUNCIÓN PARA MOSTRAR / OCULTAR CONTRASEÑA
function alternarContrasena() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.getElementById("togglePassword");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

// INICIO DE SESIÓN CON SPINNER DE CARGA
function iniciarSesion() {
    let u = document.getElementById("usuario").value.trim();
    let p = document.getElementById("password").value.trim();
    let mensajeError = document.getElementById("mensajeError");
    
    let btnTexto = document.getElementById("btnTexto");
    let btnSpinner = document.getElementById("btnSpinner");
    let btnIngresar = document.getElementById("btnIngresar");

    mensajeError.textContent = "";

    if (u === "" || p === "") {
        mensajeError.textContent = "⚠ Por favor, complete todos los campos.";
        return;
    }

    // Activamos la animación visual de carga
    btnTexto.classList.add("oculto");
    btnSpinner.classList.remove("oculto");
    btnIngresar.style.pointerEvents = "none"; 

    // Retraso de 1 segundo para procesar de forma elegante
    setTimeout(() => {
        if (u.toLowerCase() === "admin" && p === "1234") {
            localStorage.setItem("sesionActiva", "true");
            localStorage.setItem("horaLogin", Date.now());
            window.location.href = "index.html";
        } else {
            // Si falla, se restaura el botón original
            btnTexto.classList.remove("oculto");
            btnSpinner.classList.add("oculto");
            btnIngresar.style.pointerEvents = "auto";
            mensajeError.textContent = "❌ Usuario o contraseña incorrectos.";
        }
    }, 1000);
}

// Escuchar teclas Enter
document.getElementById("usuario").addEventListener("keyup", function(e) { if (e.key === "Enter") iniciarSesion(); });
document.getElementById("password").addEventListener("keyup", function(e) { if (e.key === "Enter") iniciarSesion(); });


// CORRECCIÓN DE ESTÉTICA PARA LAPTOPS (Previene la superposición por autocompletado)
function verificarCamposRellenos() {
    const usuarioInput = document.getElementById("usuario");
    const passwordInput = document.getElementById("password");

    if (usuarioInput && usuarioInput.value.length > 0) {
        usuarioInput.setAttribute("placeholder", "Filled");
    } else if (usuarioInput) {
        usuarioInput.setAttribute("placeholder", " ");
    }

    if (passwordInput && passwordInput.value.length > 0) {
        passwordInput.setAttribute("placeholder", "Filled");
    } else if (passwordInput) {
        passwordInput.setAttribute("placeholder", " ");
    }
}

// Monitorear de forma constante el autocompletado en laptops
window.addEventListener("DOMContentLoaded", () => {
    verificarCamposRellenos();
    setTimeout(verificarCamposRellenos, 100);
    setTimeout(verificarCamposRellenos, 500);
    setInterval(verificarCamposRellenos, 1000);
});
