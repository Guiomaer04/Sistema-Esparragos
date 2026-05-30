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
        document.getElementById("btnGuardar").innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Registro';
    }else{
        datos.push(registro);
    }

    guardarDatos();
    mostrarDatos();
    limpiarCampos();
    sugerirSiguienteDia();
}

/* ==========================================================================
   ACTUALIZADO: LOGICA DE FILTRADO Y CARGA DE TABLAS RESPONSIVAS
   ========================================================================== */
function actualizarSelectFiltroSemanas() {
    let select = document.getElementById("filtroSemana");
    if(!select) return;
    
    let valorSeleccionado = select.value;
    select.innerHTML = '<option value="todos">Mostrar Todas</option>';
    
    let semanasUnicas = [...new Set(datos.map(item => item.semana))].sort((a,b)=>a-b);
    semanasUnicas.forEach(sem => {
        select.innerHTML += `<option value="${sem}">Semana ${sem}</option>`;
    });
    
    select.value = valorSeleccionado;
}

function filtrarYMostrar() {
    let filtroSem = document.getElementById("filtroSemana").value;
    let fechaInicio = document.getElementById("filtroFechaInicio").value;
    let fechaFin = document.getElementById("filtroFechaFin").value;

    let datosFiltrados = datos.filter(item => {
        let cumpleSemana = (filtroSem === "todos" || parseInt(item.semana) === parseInt(filtroSem));
        
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
    
    // El resumen general siempre cuenta los globales de campaña
    let totalJabas = 0;
    let totalPeso = 0;
    let totalGanado = 0;

    datos.forEach((item)=>{
        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;
    });

    document.getElementById("totalJabas").textContent = totalJabas;
    document.getElementById("totalPeso").textContent = totalPeso.toFixed(2) + " kg";
    document.getElementById("totalGanado").textContent = "$" + totalGanado.toFixed(2);

    mostrarResumenSemanal();
    actualizarGrafico(); 
}

function renderizarTablaHTML(listaParaMostrar) {
    let tbody = document.querySelector("#tabla tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    listaParaMostrar.forEach((item)=>{
        // Se encuentra el índice real en el array maestro original 'datos' para editar/eliminar correctamente
        let indexReal = datos.findIndex(d => d === item);

        // data-label sirve para que el CSS identifique la celda en pantallas móviles
        tbody.innerHTML += `
        <tr>
            <td data-label="Semana"><strong>Semana ${item.semana}</strong></td>
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
    let item = datos[index];

    document.getElementById("semana").value = item.semana;
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
        <div class="card" style="border-top: 4px solid #2d6a4f; display:block;">
            <h3 style="color:#2d6a4f; font-weight:bold; margin-bottom:8px;">Semana ${semana}</h3>
            <p style="margin:4px 0;">📦 Jabas: <strong>${resumen[semana].jabas}</strong></p>
            <p style="margin:4px 0;">⚖️ Peso Neto: <strong>${resumen[semana].peso.toFixed(2)} kg</strong></p>
            <p style="margin:4px 0;">💰 Ganancia: <strong style="color:#2d6a4f;">$${resumen[semana].total.toFixed(2)}</strong></p>
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

/* ==========================================================================
   NUEVA FUNCIONALIDAD: EXPORTAR E IMPORTAR COPIAS DE SEGURIDAD (BACKUP JSON)
   ========================================================================== */
function exportarBackup() {
    if(datos.length === 0) {
        alert("No hay información registrada para exportar.");
        return;
    }
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datos, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    let fechaFichero = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `Backup_Esparragos_${fechaFichero}.json`);
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
            let datosParseados = JSON.parse(e.target.result);
            if (Array.isArray(datosParseados)) {
                if(confirm(`Se han encontrado ${datosParseados.length} registros. ¿Deseas sobreescribir tu base de datos actual con esta copia?`)){
                    datos = datosParseados;
                    guardarDatos();
                    mostrarDatos();
                    sugerirSiguienteDia();
                    alert("Copia de seguridad restaurada correctamente.");
                }
            } else {
                alert("El archivo cargado no contiene un formato de respaldo válido.");
            }
        } catch (err) {
            alert("Error al leer el archivo. Asegúrate de subir el archivo .json correcto.");
        }
    };
    lector.readAsText(file);
    event.target.value = ''; // Resetear el selector de ficheros
}

/* =========================
   Exportación a Excel Real .xlsx
========================= */
function exportarExcel(){
    if(datos.length === 0){
        alert("No hay datos para exportar");
        return;
    }

    let wb = XLSX.utils.book_new();

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

    let wsGeneral = XLSX.utils.json_to_sheet(mapearDatos(datos));
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Historial General");

    let resumenSemanas = obtenerResumenPorSemanas();
    for (let numSemana in resumenSemanas) {
        let datosFiltrados = datos.filter(item => parseInt(item.semana) === parseInt(numSemana));
        let wsSemana = XLSX.utils.json_to_sheet(mapearDatos(datosFiltrados));
        XLSX.utils.book_append_sheet(wb, wsSemana, `Semana ${numSemana}`);
    }

    XLSX.writeFile(wb, "Reporte_Campos_Dora_Graciela.xlsx");
}

/* =========================
   Generación de PDF Profesional (Diseño Ejecutivo)
========================= */
async function descargarPDF(){
    if(datos.length === 0){
        alert("No hay datos para generar el PDF");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFillColor(27, 67, 50); 
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setFillColor(64, 145, 108); 
    doc.rect(0, 38, 210, 1.5, 'F');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("CAMPOS DORA GRACIELA", 14, 16);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(183, 228, 199); 
    doc.text("Sistema Integral de Control de Espárragos", 14, 23);

    let fechaActual = new Date().toLocaleString('es-PE', { hour12: false });
    doc.setFontSize(8.5);
    doc.setTextColor(233, 245, 237);
    doc.text(`Usuario: William Guiomar Andia De La Cruz`, 200, 14, { align: "right" });
    doc.text(`Fecha Emisión: ${fechaActual}`, 200, 20, { align: "right" });
    doc.text(`País: Perú`, 200, 26, { align: "right" });

    let y = 52;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(27, 67, 50);
    doc.text("BALANCE CONSOLIDADO DE CAMPAÑA", 18, y);
    
    doc.setFillColor(45, 106, 79);
    doc.rect(14, y - 4, 2.5, 5.5, 'F');

    let resumenSemanas = obtenerResumenPorSemanas();
    let totalSemanas = Object.keys(resumenSemanas).length;
    let totalJabas = 0, totalPesoNeto = 0, totalGanancia = 0;
    
    datos.forEach(item => {
        totalJabas += item.jabas;
        totalPesoNeto += item.pesoNeto;
        totalGanancia += item.total;
    });

    y += 4;
    doc.setFillColor(244, 249, 245);
    doc.setDrawColor(216, 235, 217);
    doc.roundedRect(14, y, 182, 18, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(82, 121, 111);
    doc.text("SEMANAS", 20, y + 5);
    doc.text("TOTAL JABAS", 65, y + 5);
    doc.text("PESO NETO TOTAL", 110, y + 5);
    doc.text("TOTAL LIQUIDADO", 155, y + 5);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(27, 67, 50);
    doc.text(`${totalSemanas} Semanas`, 20, y + 12);
    doc.text(`${totalJabas} un.`, 65, y + 12);
    doc.text(`${totalPesoNeto.toFixed(2)} kg`, 110, y + 12);
    doc.text(`$${totalGanancia.toFixed(2)}`, 155, y + 12);

    y += 30;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(27, 67, 50);
    doc.text("RESUMEN CONSOLIDADO POR SEMANA", 18, y);
    doc.setFillColor(45, 106, 79);
    doc.rect(14, y - 4, 2.5, 5.5, 'F');

    let filasResumen = [];
    for(let sem in resumenSemanas){
        filasResumen.push([
            `Semana ${sem.padStart(2, '0')}`,
            `${resumenSemanas[sem].jabas} un.`,
            `${resumenSemanas[sem].peso.toFixed(2)} kg`,
            `$${resumenSemanas[sem].total.toFixed(2)}`
        ]);
    }

    doc.autoTable({
        startY: y + 4,
        head: [["Semana", "Jabas Totales", "Peso Neto Acumulado", "Ganancia Total (USD)"]],
        body: filasResumen,
        theme: "striped",
        headStyles: { fillColor: [45, 106, 79], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        bodyStyles: { halign: "center", fontSize: 9 },
        columnStyles: {
            0: { fontStyle: "bold" },
            3: { fontStyle: "bold", textColor: [27, 67, 50] }
        },
        margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 12;
    if (y > 240) { doc.addPage(); y = 20; } 

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(27, 67, 50);
    doc.text("HISTORIAL DETALLADO DE ENVÍO DIARIO", 18, y);
    doc.setFillColor(45, 106, 79);
    doc.rect(14, y - 4, 2.5, 5.5, 'F');

    let filasDetalle = [];
    datos.forEach(item => {
        filasDetalle.push([
            String(item.semana).padStart(2, '0'),
            String(item.dia).padStart(2, '0'),
            item.fecha,
            item.jabas,
            item.peso.toFixed(2),
            item.tara.toFixed(2),
            item.pesoNeto.toFixed(2),
            `$${item.precio.toFixed(2)}`,
            `$${item.total.toFixed(2)}`
        ]);
    });

    doc.autoTable({
        startY: y + 4,
        head: [["Sem", "Día", "Fecha", "Jabas", "P. Bruto", "Tara", "P. Neto", "Precio", "Total ($)"]],
        body: filasDetalle,
        theme: "striped",
        headStyles: { fillColor: [45, 106, 79], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        bodyStyles: { halign: "center", fontSize: 8.5 },
        columnStyles: {
            6: { fontStyle: "bold", textColor: [45, 106, 79] }, 
            8: { fontStyle: "bold", textColor: [27, 67, 50] }  
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(113, 128, 150);
            doc.text("Campos Dora Graciela — Sistema de Control de Espárragos", 14, 287);
            doc.text("Página " + data.pageNumber, 196, 287, { align: "right" });
        }
    });

    doc.save("Reporte_Profesional_Esparragos.pdf");
}

function cerrarSesion(){
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("horaLogin");
    window.location.href = "login.html";
}
