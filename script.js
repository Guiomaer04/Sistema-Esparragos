/* =========================
   VALIDAR SESIÓN CON TIEMPO
========================= */
let sesionActiva = localStorage.getItem("sesionActiva");
let horaLogin = localStorage.getItem("horaLogin");
let tiempoActual = Date.now();
let tiempoLimite = 600000; 

if(sesionActiva !== "true" || !horaLogin || (tiempoActual - horaLogin > tiempoLimite)){
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("horaLogin");
    window.location.href = "login.html";
}

/* =========================
   CONTADOR DE VISITAS
========================= */
let visitas = localStorage.getItem("contadorVisitas") || 0;
visitas++;
localStorage.setItem("contadorVisitas", visitas);

/* ==========================================================================
   ESTRUCTURA MULTI-CAMPAÑA CENTRALIZADA
   ========================================================================== */
let baseDatosCampanas = JSON.parse(localStorage.getItem("sistemaCampanasEsparrafos"));

// MIGRACIÓN AUTOMÁTICA: Estructura adaptada para soportar datos de producción y préstamos.
if (!baseDatosCampanas) {
    let datosViejos = JSON.parse(localStorage.getItem("esparragos"));
    if (datosViejos && datosViejos.length > 0) {
        baseDatosCampanas = {
            campanaActiva: "2026-1",
            lista: { "2026-1": datosViejos },
            prestamos: { "2026-1": 0 }
        };
    } else {
        baseDatosCampanas = {
            campanaActiva: "2026-1",
            lista: { "2026-1": [] },
            prestamos: { "2026-1": 0 }
        };
    }
    localStorage.setItem("sistemaCampanasEsparrafos", JSON.stringify(baseDatosCampanas));
}

// Asegurar que exista el objeto de préstamos en datos recuperados de versiones previas
if (!baseDatosCampanas.prestamos) {
    baseDatosCampanas.prestamos = {};
}

let campanaActiva = baseDatosCampanas.campanaActiva || "2026-1";
let datos = baseDatosCampanas.lista[campanaActiva] || [];
let prestamoCampana = baseDatosCampanas.prestamos[campanaActiva] || 0;

let indiceEdicion = -1;
let miGraficoSemanas = null; 
let miGraficoComparativo = null;
let ordenAscendente = true; 

document.addEventListener("DOMContentLoaded", function(){
    let c = document.getElementById("contadorVisitas");
    if(c) c.textContent = visitas;
    
    construirSelectorCampanas();
    mostrarDatos();
    sugerirSiguienteDia();
    verificarEstadoCampana();
});

/* ==========================================================================
   CONTROL DE CAMPAÑAS (CAMBIAR Y CREAR NUEVAS)
   ========================================================================== */
function construirSelectorCampanas() {
    let select = document.getElementById("selectCampanaActiva");
    if(!select) return;
    select.innerHTML = "";
    
    let codigos = Object.keys(baseDatosCampanas.lista).sort();
    codigos.forEach(cod => {
        select.innerHTML += `<option value="${cod}">${cod}</option>`;
    });
    select.value = campanaActiva;
    document.getElementById("nombreCampanaTitulo").textContent = "Campaña " + campanaActiva;
}

function cambiarCampana(nuevoCodigo) {
    campanaActiva = nuevoCodigo;
    baseDatosCampanas.campanaActiva = campanaActiva;
    datos = baseDatosCampanas.lista[campanaActiva] || [];
    prestamoCampana = baseDatosCampanas.prestamos[campanaActiva] || 0;
    
    localStorage.setItem("sistemaCampanasEsparrafos", JSON.stringify(baseDatosCampanas));
    
    document.getElementById("nombreCampanaTitulo").textContent = "Campaña " + campanaActiva;
    indiceEdicion = -1;
    
    let btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Registro';
    
    limpiarFiltros();
    mostrarDatos();
    sugerirSiguienteDia();
    verificarEstadoCampana();
}

function crearNuevaCampana() {
    let nuevoCodigo = prompt("Ingrese el código de la nueva campaña (Ejemplo: 2026-2 o 2027-1):");
    if (!nuevoCodigo) return;
    
    nuevoCodigo = nuevoCodigo.trim().toUpperCase();
    if(baseDatosCampanas.lista[nuevoCodigo]) {
        alert("La campaña ya existe. Selecciónela en la lista desplegable.");
        return;
    }
    
    baseDatosCampanas.lista[nuevoCodigo] = [];
    baseDatosCampanas.prestamos[nuevoCodigo] = 0;
    baseDatosCampanas.campanaActiva = nuevoCodigo;
    localStorage.setItem("sistemaCampanasEsparrafos", JSON.stringify(baseDatosCampanas));
    
    campanaActiva = nuevoCodigo;
    datos = [];
    prestamoCampana = 0;
    
    construirSelectorCampanas();
    cambiarCampana(nuevoCodigo);
}

/* ==========================================================================
   GESTIÓN DE PRESTAMISTAS (NUEVO REGISTRO Y EDICIÓN COSECHA)
   ========================================================================== */
function ajustarPrestamo() {
    // Validar si la campaña está archivada
    let cierresListado = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    if (cierresListado.includes(campanaActiva)) {
        alert("⛔ Operación denegada. No puedes alterar las finanzas de una campaña archivada.");
        return;
    }

    let mensaje = `Dinero actual facilitado por prestamistas en esta campaña: $${prestamoCampana.toFixed(2)}\n\n` +
                  `• Para agregar un NUEVO préstamo a mitad de cosecha, escribe el monto con el signo más adelante (Ejemplo: +500)\n` +
                  `• Para CORREGIR o cambiar la cantidad total por completo, escribe directamente el nuevo número (Ejemplo: 2500):`;
                  
    let entrada = prompt(mensaje);
    if (entrada === null) return; // Cancelado

    entrada = entrada.trim();
    if (entrada.startsWith("+")) {
        let montoExtra = parseFloat(entrada.replace("+", ""));
        if (isNaN(montoExtra) || montoExtra <= 0) {
            alert("Monto inválido ingresado.");
            return;
        }
        prestamoCampana += montoExtra;
    } else {
        let nuevoMonto = parseFloat(entrada);
        if (isNaN(nuevoMonto) || nuevoMonto < 0) {
            alert("Monto inválido ingresado.");
            return;
        }
        prestamoCampana = nuevoMonto;
    }

    guardarDatos();
    mostrarDatos();
    alert(`💰 Préstamo actualizado con éxito. Total financiado: $${prestamoCampana.toFixed(2)}`);
}

/* ==========================================================================
   CIERRE DE CAMPAÑA DEFINITIVO
   ========================================================================== */
function confirmarCierreCampana() {
    let cierresViejos = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    if (cierresViejos.includes(campanaActiva)) {
        alert("Esta campaña ya se encuentra archivada y cerrada.");
        return;
    }

    let totalJabas = 0;
    let totalPesoNeto = 0;
    let totalGanancia = 0;

    datos.forEach(item => {
        totalJabas += item.jabas;
        totalPesoNeto += item.pesoNeto;
        totalGanancia += item.total;
    });
    
    // Cálculo de la deuda arrastrada para el reporte de confirmación
    let deudaCampanaAnterior = 0;
    let codigosCampanas = Object.keys(baseDatosCampanas.lista).sort();
    let indiceActual = codigosCampanas.indexOf(campanaActiva);
    if (indiceActual > 0) {
        let codigoAnterior = codigosCampanas[indiceActual - 1];
        let registrosAnteriores = baseDatosCampanas.lista[codigoAnterior] || [];
        let prestamoAnterior = baseDatosCampanas.prestamos[codigoAnterior] || 0;
        let gananciaBrutaAnterior = registrosAnteriores.reduce((acc, item) => acc + item.total, 0);
        let saldoNetoAnterior = gananciaBrutaAnterior - prestamoAnterior;
        if (saldoNetoAnterior < 0) {
            deudaCampanaAnterior = Math.abs(saldoNetoAnterior);
        }
    }

    let saldoNetoFinanzas = totalGanancia - prestamoCampana - deudaCampanaAnterior;

    let mensajeConfirmacion = 
        `¿ESTÁS SEGURO DE HACER UN CIERRE DE CAMPAÑA?\n\n` +
        `Esta acción es definitiva para la Temporada Activa de los Campos Dora Graciela.\n` +
        `Una vez ejecutada, la información quedará protegida e inmutable.\n\n` +
        `RESUMEN FINAL ACUMULADO (${campanaActiva}):\n` +
        `📦 Total de Javas cosechadas: ${totalJabas}\n` +
        `⚖️ Peso Neto Total: ${totalPesoNeto.toFixed(2)} kg\n` +
        `💰 Total Bruto Liquidado: $${totalGanancia.toFixed(2)}\n` +
        `💸 Financiamiento de Prestamistas: $${prestamoCampana.toFixed(2)}\n` +
        `🛑 Deuda Arrastrada Pasada: $${deudaCampanaAnterior.toFixed(2)}\n` +
        `💵 SALDO NETO REAL LIMPIO: $${saldoNetoFinanzas.toFixed(2)}\n\n` +
        `Presiona ACEPTAR para proceder al cierre total del campo.`;

    if (confirm(mensajeConfirmacion)) {
        cierresViejos.push(campanaActiva);
        localStorage.setItem("campanasCerradasListado", JSON.stringify(cierresViejos));
        alert(`🔒 Campaña ${campanaActiva} cerrada de forma exitosa. Los registros han sido archivados.`);
        verificarEstadoCampana();
    }
}

function verificarEstadoCampana() {
    let cierresListado = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    const badge = document.getElementById("estadoCampana");
    const btnCierre = document.getElementById("btnCerrarCampana");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnPrestamo = document.getElementById("btnModificarPrestamo");

    if (cierresListado.includes(campanaActiva)) {
        if (badge) {
            badge.className = "badge-cerrada";
            badge.innerHTML = `<i class="fa-solid fa-lock"></i> CERRADA`;
        }
        if (btnCierre) {
            btnCierre.className = "btn-cierre btn-desactivado";
            btnCierre.innerHTML = `<i class="fa-solid fa-file-invoice"></i> Campo Archivado`;
        }
        if (btnPrestamo) {
            btnPrestamo.style.opacity = "0.5";
            btnPrestamo.disabled = true;
        }
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.style.opacity = "0.5";
            btnGuardar.innerHTML = `<i class="fa-solid fa-ban"></i> Campaña Cerrada`;
        }
    } else {
        if (badge) {
            badge.className = "badge-activa";
            badge.innerHTML = `<i class="fa-solid fa-circle-dot"></i> ACTIVA`;
        }
        if (btnCierre) {
            btnCierre.className = "btn-cierre";
            btnCierre.innerHTML = `<i class="fa-solid fa-box-archive"></i> Cerrar Campaña`;
        }
        if (btnPrestamo) {
            btnPrestamo.style.opacity = "1";
            btnPrestamo.disabled = false;
        }
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = "1";
            btnGuardar.innerHTML = indiceEdicion >= 0 ? '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios' : '<i class="fa-solid fa-plus"></i> Agregar Registro';
        }
    }
}

/* =========================
   SUGERENCIA DE FECHAS
========================= */
function sugerirSiguienteDia() {
    if (datos.length === 0) {
        document.getElementById("semana").value = 1;
        document.getElementById("dia").value = 1;
        let hoy = new Date().toISOString().split('T')[0];
        document.getElementById("fecha").value = hoy;
        return;
    }

    let copiaDatos = [...datos].sort((a, b) => {
        if (parseInt(a.semana) !== parseInt(b.semana)) {
            return parseInt(a.semana) - parseInt(b.semana);
        }
        return parseInt(a.dia) - parseInt(b.dia);
    });

    let ultimoRegistro = copiaDatos[copiaDatos.length - 1];
    let sem = parseInt(ultimoRegistro.semana);
    let dia = parseInt(ultimoRegistro.dia);

    if (dia < 7) {
        dia += 1;
    } else {
        sem += 1;
        dia = 1;
    }

    document.getElementById("semana").value = sem;
    document.getElementById("dia").value = dia;
    
    let ultimaFecha = new Date(ultimoRegistro.fecha + "T00:00:00");
    ultimaFecha.setDate(ultimaFecha.getDate() + 1);
    document.getElementById("fecha").value = ultimaFecha.toISOString().split('T')[0];
}

function agregarFila(){
    let cierresListado = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    if (cierresListado.includes(campanaActiva)) {
        alert("⛔ Operación denegada. La campaña se encuentra archivada y protegida contra modificaciones.");
        return;
    }

    let semana = parseInt(document.getElementById("semana").value);
    let dia = parseInt(document.getElementById("dia").value);
    let fecha = document.getElementById("fecha").value;
    let jabas = parseInt(document.getElementById("jabas").value);
    let peso = parseFloat(document.getElementById("peso").value);
    let precio = parseFloat(document.getElementById("precio").value);

    if(!semana || !dia || !fecha || !jabas || !peso || !precio){
        alert("Complete todos los campos de forma correcta");
        return;
    }

    let tara = jabas * 1.60;
    let pesoNeto = peso - tara;
    let total = pesoNeto * precio;

    let registro = { semana, dia, fecha, jabas, peso, tara, pesoNeto, total, precio };

    if(indiceEdicion >= 0){
        datos[indiceEdicion] = registro;
        indiceEdicion = -1;
        document.getElementById("btnGuardar").innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Registro';
    }else{
        datos.push(registro);
    }

    guardarDatos();
    mostrarDatos();
    limpiarCampos();
    sugerirSiguienteDia();
}

/* =========================
   FILTROS INTERNOS DE CAMPAÑA
========================= */
function actualizarSelectFiltroSemanas() {
    let select = document.getElementById("filtroSemana");
    if(!select) return;
    
    let valorSeleccionado = select.value;
    select.innerHTML = '<option value="todos">Mostrar Todas</option>';
    
    let semanasUnicas = [...new Set(datos.map(item => {
        let num = parseInt(String(item.semana).replace(/\D/g, ""), 10);
        return isNaN(num) ? 1 : num;
    }))].sort((a,b)=>a-b);

    semanasUnicas.forEach(sem => {
        let semFormat = String(sem).padStart(2, '0');
        select.innerHTML += `<option value="${sem}">Semana ${semFormat}</option>`;
    });
    select.value = valorSeleccionado;
}

function filtrarYMostrar() {
    let filtroSem = document.getElementById("filtroSemana").value;
    let fechaInicio = document.getElementById("filtroFechaInicio").value;
    let fechaFin = document.getElementById("filtroFechaFin").value;

    let datosFiltrados = datos.filter(item => {
        let itemSemNum = parseInt(String(item.semana).replace(/\D/g, ""), 10);
        let cumpleSemana = (filtroSem === "todos" || itemSemNum === parseInt(filtroSem));
        let cumpleFecha = true;
        if(fechaInicio) { cumpleFecha = cumpleFecha && (item.fecha >= fechaInicio); }
        if(fechaFin) { cumpleFecha = cumpleFecha && (item.fecha <= fechaFin); }
        return cumpleSemana && cumpleFecha;
    });

    renderizarTablaHTML(datosFiltrados);
}

function limpiarFiltros() {
    document.getElementById("filtroSemana").value = "todos";
    document.getElementById("filtroFechaInicio").value = "";
    document.getElementById("filtroFechaFin").value = "";
    renderizarTablaHTML(datos);
}

function mostrarDatos(){
    actualizarSelectFiltroSemanas();
    filtrarYMostrar();
    
    let totalJabas = 0;
    let totalPeso = 0;
    let totalGanado = 0;

    datos.forEach((item)=>{
        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;
    });

    // ==========================================================================
    // LÓGICA AUTOMÁTICA: DETECTAR SI LA CAMPAÑA ANTERIOR DEJÓ ALGO PENDIENTE
    // ==========================================================================
    let deudaCampanaAnterior = 0;
    let codigosCampanas = Object.keys(baseDatosCampanas.lista).sort(); 
    let indiceActual = codigosCampanas.indexOf(campanaActiva);

    if (indiceActual > 0) {
        let codigoAnterior = codigosCampanas[indiceActual - 1];
        let registrosAnteriores = baseDatosCampanas.lista[codigoAnterior] || [];
        let prestamoAnterior = baseDatosCampanas.prestamos[codigoAnterior] || 0;
        
        let gananciaBrutaAnterior = registrosAnteriores.reduce((acc, item) => acc + item.total, 0);
        let saldoNetoAnterior = gananciaBrutaAnterior - prestamoAnterior;

        if (saldoNetoAnterior < 0) {
            deudaCampanaAnterior = Math.abs(saldoNetoAnterior); 
        }
    }

    // Calcular las deudas y el saldo neto real de la campaña actual
    let deudaTotalEstaCampana = prestamoCampana;
    let saldoNeto = totalGanado - deudaTotalEstaCampana - deudaCampanaAnterior;

    // Pintar los datos en los contenedores superiores del HTML
    document.getElementById("totalJabas").textContent = totalJabas;
    document.getElementById("totalPeso").textContent = totalPeso.toFixed(2) + " kg";
    document.getElementById("totalGanado").textContent = "$" + totalGanado.toFixed(2);
    
    if (document.getElementById("totalDeuda")) {
        document.getElementById("totalDeuda").textContent = "$" + deudaTotalEstaCampana.toFixed(2);
    }
    
    if (document.getElementById("deudaAnterior")) {
        document.getElementById("deudaAnterior").textContent = "$" + deudaCampanaAnterior.toFixed(2);
        document.getElementById("deudaAnterior").style.color = deudaCampanaAnterior > 0 ? "#dc2626" : "gray";
    }

    if (document.getElementById("saldoNetoReal")) {
        document.getElementById("saldoNetoReal").textContent = "$" + saldoNeto.toFixed(2);
        document.getElementById("saldoNetoReal").style.color = saldoNeto >= 0 ? "#2d6a4f" : "#dc2626";
    }

    mostrarResumenSemanal();
    actualizarGraficoSemanas(); 
    calcularYMostrarModuloComparativo(); 
}

function renderizarTablaHTML(listaParaMostrar) {
    let tbody = document.querySelector("#tabla tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    listaParaMostrar.forEach((item)=>{
        let indexReal = datos.findIndex(d => d === item);
        let semDisplay = String(item.semana).replace(/\D/g, "").padStart(2, '0');

        tbody.innerHTML += `
        <tr>
            <td data-label="Semana"><strong>Semana ${semDisplay}</strong></td>
            <td data-label="Día">Día ${item.dia}</td>
            <td data-label="Fecha">${item.fecha}</td>
            <td data-label="Jabas">${item.jabas}</td>
            <td data-label="Peso Bruto">${item.peso.toFixed(2)}</td>
            <td data-label="Tara (1.6kg)">${item.tara.toFixed(2)}</td>
            <td data-label="Peso Neto" style="color:#2d6a4f; font-weight:bold;">${item.pesoNeto.toFixed(2)}</td>
            <td data-label="Precio">$${item.precio.toFixed(2)}</td>
            <td data-label="Total Ganado" style="color:#1b4332; font-weight:bold;">$${item.total.toFixed(2)}</td>
            <td data-label="Acciones">
                <button onclick="editarFila(${indexReal})">✏️</button>
                <button class="eliminar" onclick="eliminarFila(${indexReal})">🗑️</button>
            </td>
        </tr>`;
    });
}

function editarFila(index){
    let cierresListado = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    if (cierresListado.includes(campanaActiva)) {
        alert("⛔ No se pueden editar registros en una campaña archivada.");
        return;
    }

    let item = datos[index];
    document.getElementById("semana").value = parseInt(String(item.semana).replace(/\D/g, ""), 10);
    document.getElementById("dia").value = item.dia;
    document.getElementById("fecha").value = item.fecha;
    document.getElementById("jabas").value = item.jabas;
    document.getElementById("peso").value = item.peso;
    document.getElementById("precio").value = item.precio;

    indiceEdicion = index;
    document.getElementById("btnGuardar").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
    document.getElementById("semana").focus();
}

function eliminarFila(index){
    let cierresListado = JSON.parse(localStorage.getItem("campanasCerradasListado")) || [];
    if (cierresListado.includes(campanaActiva)) {
        alert("⛔ No se pueden eliminar registros en una campaña archivada.");
        return;
    }

    if(confirm("¿Está seguro de que desea eliminar este registro?")){
        datos.splice(index, 1);
        guardarDatos();
        mostrarDatos();
        sugerirSiguienteDia();
    }
}

function ordenarTabla(criterio) {
    ordenAscendente = !ordenAscendente;
    datos.sort((a, b) => {
        let valA = a[criterio];
        let valB = b[criterio];
        if (criterio === 'semana' || criterio === 'total') {
            valA = parseFloat(String(valA).replace(/\D/g, "")); 
            valB = parseFloat(String(valB).replace(/\D/g, ""));
        }
        if (valA < valB) return ordenAscendente ? -1 : 1;
        if (valA > valB) return ordenAscendente ? 1 : -1;
        return 0;
    });
    mostrarDatos();
}

function obtenerResumenPorSemanas() {
    let resumen = {};
    datos.forEach(item=>{
        let numeroLimpio = parseInt(String(item.semana).replace(/\D/g, ""), 10);
        if (isNaN(numeroLimpio)) numeroLimpio = 1;
        let semanaNormalizada = String(numeroLimpio).padStart(2, '0');

        if(!resumen[semanaNormalizada]){ 
            resumen[semanaNormalizada] = { jabas: 0, peso: 0, total: 0 }; 
        }
        resumen[semanaNormalizada].jabas += item.jabas;
        resumen[semanaNormalizada].peso += item.pesoNeto;
        resumen[semanaNormalizada].total += item.total;
    });
    return resumen;
}

function mostrarResumenSemanal(){
    let contenedor = document.getElementById("resumenSemanal");
    if(!contenedor) return;
    let resumen = obtenerResumenPorSemanas();
    let html = "";

    Object.keys(resumen).sort().forEach(semana => {
        html += `
        <div class="card" style="border-top: 4px solid #2d6a4f; display:block;">
            <h3 style="color:#2d6a4f; font-weight:bold; margin-bottom:8px;">Semana ${semana}</h3>
            <p style="margin:4px 0;">📦 Jabas: <strong>${resumen[semana].jabas}</strong></p>
            <p style="margin:4px 0;">⚖️ Peso Neto: <strong>${resumen[semana].peso.toFixed(2)} kg</strong></p>
            <p style="margin:4px 0;">💰 Ganancia: <strong style="color:#2d6a4f;">$${resumen[semana].total.toFixed(2)}</strong></p>
        </div>`;
    });
    contenedor.innerHTML = html || "<p style='color:gray; padding:10px;'>No hay registros ingresados todavía.</p>";
}

/* ==========================================================================
   MÓDULO DE COMPARATIVA INTER-CAMPAÑAS
   ========================================================================== */
function calcularYMostrarModuloComparativo() {
    let tbody = document.querySelector("#tablaComparativa tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    let labelsCampanas = [];
    let gananciasCampanas = [];
    let pesoCampanas = [];

    let codigos = Object.keys(baseDatosCampanas.lista).sort();

    codigos.forEach(cod => {
        let registrosCamp = baseDatosCampanas.lista[cod] || [];
        
        let semanasUnicas = [...new Set(registrosCamp.map(item => {
            let n = parseInt(String(item.semana).replace(/\D/g, ""), 10);
            return isNaN(n) ? 1 : n;
        }))].length;

        let tJabas = 0, tPeso = 0, tGanado = 0;

        registrosCamp.forEach(item => {
            tJabas += item.jabas;
            tPeso += item.pesoNeto;
            tGanado += item.total;
        });

        tbody.innerHTML += `
        <tr>
            <td><strong>Campaña ${cod}</strong></td>
            <td>${semanasUnicas} semanas</td>
            <td>${tJabas} un.</td>
            <td>${tPeso.toFixed(2)} kg</td>
            <td style="color:#0284c7; font-weight:bold;">$${tGanado.toFixed(2)}</td>
        </tr>`;

        labelsCampanas.push("Campaña " + cod);
        gananciasCampanas.push(tGanado.toFixed(2));
        pesoCampanas.push(tPeso.toFixed(2));
    });

    let ctxComp = document.getElementById('graficoComparativo');
    if (!ctxComp) return;

    if (miGraficoComparativo) { miGraficoComparativo.destroy(); }

    miGraficoComparativo = new Chart(ctxComp, {
        type: 'bar',
        data: {
            labels: labelsCampanas,
            datasets: [
                {
                    label: 'Ganancias Totales Acumuladas ($)',
                    data: gananciasCampanas,
                    backgroundColor: '#0284c7',
                    borderColor: '#0369a1',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Producción Neta Acumulada (kg)',
                    data: pesoCampanas,
                    backgroundColor: '#14b8a6',
                    borderColor: '#0d9488',
                    borderWidth: 1,
                    borderRadius: 4,
                    hidden: true 
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Rendimiento Financiero Global por Temporada' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* ==========================================================================
   GRÁFICO INTERNO SEMANAL
   ========================================================================== */
function actualizarGraficoSemanas() {
    let ctx = document.getElementById('graficoSemanas');
    if (!ctx) return;

    let resumen = obtenerResumenPorSemanas();
    let semanasLabels = Object.keys(resumen).map(s => "Semana " + s);
    let gananciasData = Object.values(resumen).map(r => r.total.toFixed(2));

    if (miGraficoSemanas) { miGraficoSemanas.destroy(); }

    miGraficoSemanas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: semanasLabels,
            datasets: [{
                label: 'Ganancias Semanales ($)',
                data: gananciasData,
                backgroundColor: '#2d6a4f',
                borderColor: '#1b4332',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return '$' + value; } }
                }
            }
        }
    });
}

function guardarDatos(){
    baseDatosCampanas.lista[campanaActiva] = datos;
    baseDatosCampanas.prestamos[campanaActiva] = prestamoCampana;
    localStorage.setItem("sistemaCampanasEsparrafos", JSON.stringify(baseDatosCampanas));
}

function limpiarCampos(){
    document.getElementById("semana").value = "";
    document.getElementById("dia").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("jabas").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("precio").value = "";
}

/* ==========================================================================
   RESPALDOS GLOBALES DE TODO EL SISTEMA MULTI-CAMPAÑA
   ========================================================================== */
function exportarBackup() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(baseDatosCampanas, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    let fechaFichero = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `Sistema_Total_Esparragos_${fechaFichero}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importarBackup(event) {
    let file = event.target.files[0];
    if (!file) return;

    let lector = new FileReader();
    lector.onload = function(e) {
        try {
            let backup = JSON.parse(e.target.result);
            if (backup && backup.lista) {
                if(confirm("¿Deseas restaurar esta copia de seguridad? Se sobreescribirán todas las campañas actuales del sistema.")){
                    baseDatosCampanas = backup;
                    if(!baseDatosCampanas.prestamos) baseDatosCampanas.prestamos = {};
                    
                    localStorage.setItem("sistemaCampanasEsparrafos", JSON.stringify(baseDatosCampanas));
                    campanaActiva = baseDatosCampanas.campanaActiva;
                    datos = baseDatosCampanas.lista[campanaActiva] || [];
                    prestamoCampana = baseDatosCampanas.prestamos[campanaActiva] || 0;
                    
                    construirSelectorCampanas();
                    mostrarDatos();
                    sugerirSiguienteDia();
                    verificarEstadoCampana();
                    alert("Sistema multi-campaña restaurado con éxito.");
                }
            } else {
                alert("El archivo no contiene una estructura multi-campaña válida.");
            }
        } catch (err) {
            alert("Error al leer el archivo .json.");
        }
    };
    lector.readAsText(file);
    event.target.value = ''; 
}

/* =========================
   EXPORTAR EXCEL REAL (.XLSX)
========================= */
function exportarExcel(){
    if(datos.length === 0){ alert("No hay datos para exportar"); return; }
    let wb = XLSX.utils.book_new();

    let mapearDatos = (lista) => lista.map(item => {
        let numSem = parseInt(String(item.semana).replace(/\D/g, ""), 10);
        let semFormat = String(numSem).padStart(2, '0');
        return {
            "Semana": "Semana " + semFormat,
            "Día": "Día " + item.dia,
            "Fecha": item.fecha,
            "Jabas": item.jabas,
            "Peso Bruto (kg)": parseFloat(item.peso.toFixed(2)),
            "Tara (kg)": parseFloat(item.tara.toFixed(2)),
            "Peso Neto (kg)": parseFloat(item.pesoNeto.toFixed(2)),
            "Precio ($)": parseFloat(item.precio.toFixed(2)),
            "Total ($)": parseFloat(item.total.toFixed(2))
        };
    });

    let wsGeneral = XLSX.utils.json_to_sheet(mapearDatos(datos));
    XLSX.utils.book_append_sheet(wb, wsGeneral, `Historial — ${campanaActiva}`);
    
    // Obtener deuda anterior para el balance general de Excel
    let deudaCampanaAnterior = 0;
    let codigosCampanas = Object.keys(baseDatosCampanas.lista).sort();
    let indiceActual = codigosCampanas.indexOf(campanaActiva);
    if (indiceActual > 0) {
        let codigoAnterior = codigosCampanas[indiceActual - 1];
        let registrosAnteriores = baseDatosCampanas.lista[codigoAnterior] || [];
        let prestamoAnterior = baseDatosCampanas.prestamos[codigoAnterior] || 0;
        let gananciaBrutaAnterior = registrosAnteriores.reduce((acc, item) => acc + item.total, 0);
        let saldoNetoAnterior = gananciaBrutaAnterior - prestamoAnterior;
        if (saldoNetoAnterior < 0) { deudaCampanaAnterior = Math.abs(saldoNetoAnterior); }
    }

    let totalG = datos.reduce((acc, i) => acc + i.total, 0);
    let balanceResumen = [{
        "Campaña": campanaActiva,
        "Ingreso Bruto ($)": totalG,
        "Préstamos Campaña Actual ($)": prestamoCampana,
        "Deuda Arrastrada Pasada ($)": deudaCampanaAnterior,
        "Utilidad Neta Real ($)": totalG - prestamoCampana - deudaCampanaAnterior
    }];
    let wsBalance = XLSX.utils.json_to_sheet(balanceResumen);
    XLSX.utils.book_append_sheet(wb, wsBalance, `Resumen Financiero`);

    XLSX.writeFile(wb, `Reporte_Esparragos_${campanaActiva}.xlsx`);
}

/* =========================
   DESCARGA PDF DETALLADO DE CAMPAÑA
========================= */
async function descargarPDF(){
    if(datos.length === 0){ alert("No hay datos para generar el PDF"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFillColor(27, 67, 50); doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(64, 145, 108); doc.rect(0, 38, 210, 1.5, 'F');

    doc.setFont("Helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text("CAMPOS DORA GRACIELA", 14, 16);
    
    doc.setFont("Helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(183, 228, 199); 
    doc.text(`Reporte de Cierre — Campaña ${campanaActiva}`, 14, 23);

    let fechaActual = new Date().toLocaleString('es-PE', { hour12: false });
    doc.setFontSize(8.5); doc.setTextColor(233, 245, 237);
    doc.text(`Usuario: William Guiomar Andia De La Cruz`, 200, 14, { align: "right" });
    doc.text(`Fecha Emisión: ${fechaActual}`, 200, 20, { align: "right" });

    let y = 52;
    doc.setFont("Helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(27, 67, 50);
    doc.text(`RESUMEN HISTÓRICO DE CAMPAÑA: ${campanaActiva}`, 18, y);
    doc.setFillColor(45, 106, 79); doc.rect(14, y - 4, 2.5, 5.5, 'F');

    let totalJabas = 0, totalPesoNeto = 0, totalGanancia = 0;
    datos.forEach(item => { totalJabas += item.jabas; totalPesoNeto += item.pesoNeto; totalGanancia += item.total; });

    // Deuda anterior para reporte en PDF
    let deudaCampanaAnterior = 0;
    let codigosCampanas = Object.keys(baseDatosCampanas.lista).sort();
    let indiceActual = codigosCampanas.indexOf(campanaActiva);
    if (indiceActual > 0) {
        let codigoAnterior = codigosCampanas[indiceActual - 1];
        let registrosAnteriores = baseDatosCampanas.lista[codigoAnterior] || [];
        let prestamoAnterior = baseDatosCampanas.prestamos[codigoAnterior] || 0;
        let gananciaBrutaAnterior = registrosAnteriores.reduce((acc, item) => acc + item.total, 0);
        let saldoNetoAnterior = gananciaBrutaAnterior - prestamoAnterior;
        if (saldoNetoAnterior < 0) { deudaCampanaAnterior = Math.abs(saldoNetoAnterior); }
    }

    y += 4;
    doc.setFillColor(244, 249, 245); doc.setDrawColor(216, 235, 217);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setFontSize(7); doc.setTextColor(82, 121, 111);
    doc.text("TOTAL JABAS", 16, y + 5); 
    doc.text("PESO NETO TOTAL", 52, y + 5); 
    doc.text("TOTAL BRUTO LIQ.", 92, y + 5);
    doc.text("DEUDA CAMPAÑA ACT.", 130, y + 5);
    doc.text("DEUDA ANT. ARRASTRADA", 164, y + 5);

    doc.setFont("Helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(27, 67, 50);
    doc.text(`${totalJabas} un.`, 16, y + 13); 
    doc.text(`${totalPesoNeto.toFixed(2)} kg`, 52, y + 13); 
    doc.text(`$${totalGanancia.toFixed(2)}`, 92, y + 13);
    doc.text(`$${prestamoCampana.toFixed(2)}`, 130, y + 13);
    doc.text(`$${deudaCampanaAnterior.toFixed(2)}`, 164, y + 13);

    y += 28;
    doc.setFontSize(11); doc.setTextColor(27, 67, 50);
    doc.text(`UTILIDAD REAL ESTIMADA DE COSECHA: $${(totalGanancia - prestamoCampana - deudaCampanaAnterior).toFixed(2)}`, 14, y);

    y += 8;
    let filasDetalle = [];
    datos.forEach(item => {
        let numSem = parseInt(String(item.semana).replace(/\D/g, ""), 10);
        let semFormat = String(numSem).padStart(2, '0');
        filasDetalle.push([
            semFormat, String(item.dia).padStart(2, '0'), item.fecha,
            item.jabas, item.peso.toFixed(2), item.tara.toFixed(2), item.pesoNeto.toFixed(2),
            `$${item.precio.toFixed(2)}`, `$${item.total.toFixed(2)}`
        ]);
    });

    doc.autoTable({
        startY: y,
        head: [["Sem", "Día", "Fecha", "Jabas", "P. Bruto", "Tara", "P. Neto", "Precio", "Total ($)"]],
        body: filasDetalle,
        theme: "striped",
        headStyles: { fillColor: [45, 106, 79], textColor: [255, 255, 255], halign: "center" },
        bodyStyles: { halign: "center", fontSize: 8.5 },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
            doc.setFontSize(8); doc.setTextColor(113, 128, 150);
            doc.text(`Campos Dora Graciela — Campaña ${campanaActiva}`, 14, 287);
            doc.text("Página " + data.pageNumber, 196, 287, { align: "right" });
        }
    });

    doc.save(`Reporte_Campaña_${campanaActiva}.pdf`);
}

function cerrarSesion(){
    localStorage.removeItem("sesionActiva"); localStorage.removeItem("horaLogin");
    window.location.href = "login.html";
}
