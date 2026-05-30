/* =========================
   VALIDAR SESIÓN CON TIEMPO
========================= */
let sesionActiva = localStorage.getItem("sesionActiva");
let horaLogin = localStorage.getItem("horaLogin");
let tiempoActual = Date.now();
let tiempoLimite = 600000; // 10 minutos

if(
    sesionActiva !== "true" ||
    !horaLogin ||
    (tiempoActual - horaLogin > tiempoLimite)
){
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

/* =========================
   VARIABLES GLOBALES
========================= */
let datos = JSON.parse(localStorage.getItem("esparragos")) || [];
let indiceEdicion = -1;
let miGrafico = null; 
let ordenAscendente = true; 

document.addEventListener("DOMContentLoaded", function(){
    let c = document.getElementById("contadorVisitas");
    if(c) c.textContent = visitas;
    
    mostrarDatos();
    sugerirSiguienteDia();
});

/* =========================
   Sugerencia Automática de Día y Semana
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

    let registro = {
        semana, dia, fecha, jabas, peso, tara, pesoNeto, total, precio
    };

    if(indiceEdicion >= 0){
        datos[indiceEdicion] = registro;
        indiceEdicion = -1;
        document.getElementById("btnGuardar").textContent = "Agregar Registro";
    }else{
        datos.push(registro);
    }

    guardarDatos();
    mostrarDatos();
    limpiarCampos();
    sugerirSiguienteDia();
}

function mostrarDatos(){
    let tbody = document.querySelector("#tabla tbody");
    if(!tbody) return;
    
    tbody.innerHTML = "";

    let totalJabas = 0;
    let totalPeso = 0;
    let totalGanado = 0;

    datos.forEach((item, index)=>{
        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;

        tbody.innerHTML += `
        <tr>
            <td><strong>Semana ${item.semana}</strong></td>
            <td>Día ${item.dia}</td>
            <td>${item.fecha}</td>
            <td>${item.jabas}</td>
            <td>${item.peso.toFixed(2)}</td>
            <td>${item.tara.toFixed(2)}</td>
            <td style="color:#2d6a4f; font-weight:bold;">${item.pesoNeto.toFixed(2)}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td style="color:#1b4332; font-weight:bold;">$${item.total.toFixed(2)}</td>
            <td>
                <button onclick="editarFila(${index})">✏️</button>
                <button class="eliminar" onclick="eliminarFila(${index})">🗑️</button>
            </td>
        </tr>`;
    });

    document.getElementById("totalJabas").textContent = totalJabas;
    document.getElementById("totalPeso").textContent = totalPeso.toFixed(2) + " kg";
    document.getElementById("totalGanado").textContent = "$" + totalGanado.toFixed(2);

    mostrarResumenSemanal();
    actualizarGrafico(); 
}

function editarFila(index){
    let item = datos[index];

    document.getElementById("semana").value = item.semana;
    document.getElementById("dia").value = item.dia;
    document.getElementById("fecha").value = item.fecha;
    document.getElementById("jabas").value = item.jabas;
    document.getElementById("peso").value = item.peso;
    document.getElementById("precio").value = item.precio;

    indiceEdicion = index;
    document.getElementById("btnGuardar").textContent = "Guardar Cambios";
    document.getElementById("semana").focus();
}

function eliminarFila(index){
    if(confirm("¿Está seguro de que desea eliminar este registro de cosecha?")){
        datos.splice(index, 1);
        guardarDatos();
        mostrarDatos();
        sugerirSiguienteDia();
    }
}

/* =========================
   Ordenar Tabla Interactivamente
========================= */
function ordenarTabla(criterio) {
    ordenAscendente = !ordenAscendente;
    
    datos.sort((a, b) => {
        let valA = a[criterio];
        let valB = b[criterio];
        
        if (criterio === 'semana' || criterio === 'total') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
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
        if(!resumen[item.semana]){
            resumen[item.semana] = { jabas: 0, peso: 0, total: 0 };
        }
        resumen[item.semana].jabas += item.jabas;
        resumen[item.semana].peso += item.pesoNeto;
        resumen[item.semana].total += item.total;
    });
    return resumen;
}

function mostrarResumenSemanal(){
    let contenedor = document.getElementById("resumenSemanal");
    if(!contenedor) return;

    let resumen = obtenerResumenPorSemanas();
    let html = "";

    for(let semana in resumen){
        html += `
        <div class="card" style="border-top: 4px solid #2d6a4f;">
            <h3>Semana ${semana}</h3>
            <p>📦 Jabas: <strong>${resumen[semana].jabas}</strong></p>
            <p>⚖️ Peso Neto: <strong>${resumen[semana].peso.toFixed(2)} kg</strong></p>
            <p>💰 Ganancia: <strong style="color:#2d6a4f;">$${resumen[semana].total.toFixed(2)}</strong></p>
        </div>`;
    }

    contenedor.innerHTML = html || "<p style='color:gray; padding:10px;'>No hay registros ingresados todavía.</p>";
}

/* =========================
   Creación de Gráficos con Chart.js
========================= */
function actualizarGrafico() {
    let ctx = document.getElementById('graficoSemanas');
    if (!ctx) return;

    let resumen = obtenerResumenPorSemanas();
    let semanasLabels = Object.keys(resumen).map(s => "Semana " + s);
    let gananciasData = Object.values(resumen).map(r => r.total.toFixed(2));

    if (miGrafico) {
        miGrafico.destroy(); 
    }

    miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: semanasLabels,
            datasets: [{
                label: 'Ganancias de Campaña ($)',
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
    localStorage.setItem("esparragos", JSON.stringify(datos));
}

function limpiarCampos(){
    document.getElementById("semana").value = "";
    document.getElementById("dia").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("jabas").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("precio").value = "";
}

/* =========================
   Exportación a Excel Real .xlsx (Corregido y Redondeado)
========================= */
function exportarExcel(){
    if(datos.length === 0){
        alert("No hay datos para exportar");
        return;
    }

    let wb = XLSX.utils.book_new();

    // Mapeo limpio para forzar columnas reales y dos decimales
    let mapearDatos = (lista) => lista.map(item => ({
        "Semana": "Semana " + item.semana,
        "Día": "Día " + item.dia,
        "Fecha": item.fecha,
        "Jabas": item.jabas,
        "Peso Bruto (kg)": parseFloat(item.peso.toFixed(2)),
        "Tara (kg)": parseFloat(item.tara.toFixed(2)),
        "Peso Neto (kg)": parseFloat(item.pesoNeto.toFixed(2)),
        "Precio ($)": parseFloat(item.precio.toFixed(2)),
        "Total ($)": parseFloat(item.total.toFixed(2))
    }));

    // 1. Hoja General
    let wsGeneral = XLSX.utils.json_to_sheet(mapearDatos(datos));
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Historial General");

    // 2. Hojas por Semana
    let resumenSemanas = obtenerResumenPorSemanas();
    for (let numSemana in resumenSemanas) {
        let datosFiltrados = datos.filter(item => parseInt(item.semana) === parseInt(numSemana));
        let wsSemana = XLSX.utils.json_to_sheet(mapearDatos(datosFiltrados));
        XLSX.utils.book_append_sheet(wb, wsSemana, `Semana ${numSemana}`);
    }

    XLSX.writeFile(wb, "Reporte_Campos_Dora_Graciela.xlsx");
}

/* =========================
   Generación de PDF Profesional
========================= */
async function descargarPDF(){
    if(datos.length === 0){
        alert("No hay datos para generar el PDF");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(27, 67, 50); 
    doc.text("CAMPOS DORA GRACIELA", 14, 15);
    
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text("Sistema Integral de Control de Espárragos", 14, 22);

    let fechaActual = new Date().toLocaleString('es-PE');
    let usuarioActivo = "William Guiomar Andia De La Cruz"; 

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${fechaActual}`, 14, 29);
    doc.text(`Generado por: ${usuarioActivo}`, 14, 34);

    let filas = [];
    datos.forEach(item=>{
        filas.push([
            `Semana ${item.semana}`, `Día ${item.dia}`, item.fecha, item.jabas,
            item.peso.toFixed(2), item.tara.toFixed(2),
            item.pesoNeto.toFixed(2), `$${item.precio.toFixed(2)}`,
            `$${item.total.toFixed(2)}`
        ]);
    });

    doc.autoTable({
        startY: 38,
        head: [["Semana", "Día", "Fecha", "Jabas", "P. Bruto", "Tara", "P. Neto", "Precio", "Total"]],
        body: filas,
        theme: "striped",
        headStyles: { fillColor: [45, 106, 79] } 
    });

    let resumen = obtenerResumenPorSemanas();
    let totalJabas=0, totalPeso=0, totalGanado=0;

    datos.forEach(item=>{
        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;
    });

    let y = doc.lastAutoTable.finalY + 12;

    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("RESUMEN DE RENDIMIENTO SEMANAL", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    for(let semana in resumen){
        doc.text(
            `• Semana ${semana}: Jabas Totales: ${resumen[semana].jabas} | Peso Neto Acumulado: ${resumen[semana].peso.toFixed(2)} kg | Ganancia: $${resumen[semana].total.toFixed(2)}`,
            14, y
        );
        y += 7;
    }

    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("BALANCE TOTAL DE CAMPAÑA", 14, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total de Jabas Acopiadas: ${totalJabas} un.`, 14, y); y += 7;
    doc.text(`Total Peso Neto Despachado: ${totalPeso.toFixed(2)} kg`, 14, y); y += 7;
    doc.setFont("Helvetica", "bold");
    doc.text(`MONTO TOTAL LIQUIDADO: $${totalGanado.toFixed(2)} USD`, 14, y);

    doc.save("Reporte_Profesional_Esparragos.pdf");
}

function cerrarSesion(){
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("horaLogin");
    window.location.href = "login.html";
}
