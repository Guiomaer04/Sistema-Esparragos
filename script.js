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
   DATOS GLOBAL
========================= */
let datos = JSON.parse(localStorage.getItem("esparragos")) || [];
let indiceEdicion = -1;

// SOLUCIÓN AL ERROR: Ejecutar cuando el HTML esté completamente construido
document.addEventListener("DOMContentLoaded", function(){
    let c = document.getElementById("contadorVisitas");
    if(c) c.textContent = visitas;
    
    mostrarDatos();
});

function agregarFila(){
    let semana = document.getElementById("semana").value;
    let dia = document.getElementById("dia").value;
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
        semana, dia, fecha, jabas, peso, tara, pesoNeto, precio, total
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
}

function mostrarDatos(){
    let tbody = document.querySelector("#tabla tbody");
    if(!tbody) return; // Validación de seguridad
    
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
            <td><strong>${item.semana}</strong></td>
            <td>${item.dia}</td>
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
    }
}

function mostrarResumenSemanal(){
    let contenedor = document.getElementById("resumenSemanal");
    if(!contenedor) return;

    let resumen = {};
    
    datos.forEach(item=>{
        if(!resumen[item.semana]){
            resumen[item.semana] = { jabas: 0, peso: 0, total: 0 };
        }
        resumen[item.semana].jabas += item.jabas;
        resumen[item.semana].peso += item.pesoNeto;
        resumen[item.semana].total += item.total;
    });

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

function exportarExcel(){
    if(datos.length === 0){
        alert("No hay datos para exportar");
        return;
    }
    let csv = "Semana,Dia,Fecha,Jabas,Peso Bruto,Tara,Peso Neto,Precio,Total\n";
    let resumen = {};

    datos.forEach(item=>{
        csv += `${item.semana},${item.dia},${item.fecha},${item.jabas},${item.peso},${item.tara},${item.pesoNeto},${item.precio},${item.total}\n`;

        if(!resumen[item.semana]){
            resumen[item.semana] = {jabas:0, peso:0, total:0};
        }
        resumen[item.semana].jabas += item.jabas;
        resumen[item.semana].peso += item.pesoNeto;
        resumen[item.semana].total += item.total;
    });

    csv += "\nRESUMEN POR SEMANAS\n";
    for(let semana in resumen){
        csv += `Semana ${semana},${resumen[semana].jabas},${resumen[semana].peso.toFixed(2)},${resumen[semana].total.toFixed(2)}\n`;
    }

    let tj=0, tp=0, tg=0;
    datos.forEach(item=>{
        tj += item.jabas;
        tp += item.pesoNeto;
        tg += item.total;
    });

    csv += "\nRESUMEN GENERAL\n";
    csv += `Total Jabas,${tj}\n`;
    csv += `Total Peso Neto,${tp.toFixed(2)}\n`;
    csv += `Total Ganado,${tg.toFixed(2)}\n`;

    let blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_campaña_esparragos.csv";
    link.click();
}

async function descargarPDF(){
    if(datos.length === 0){
        alert("No hay datos para generar el PDF");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(27, 67, 50);
    doc.text("Sistema de Control de Espárragos", 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Campas Dora Graciela - Reporte de Campaña", 14, 22);

    let filas = [];
    datos.forEach(item=>{
        filas.push([
            item.semana, item.dia, item.fecha, item.jabas,
            item.peso.toFixed(2), item.tara.toFixed(2),
            item.pesoNeto.toFixed(2), `$${item.precio.toFixed(2)}`,
            `$${item.total.toFixed(2)}`
        ]);
    });

    doc.autoTable({
        startY: 28,
        head: [["Semana", "Día", "Fecha", "Jabas", "P. Bruto", "Tara", "P. Neto", "Precio", "Total"]],
        body: filas,
        theme: "striped",
        headStyles: { fillColor: [45, 106, 79] }
    });

    let resumen = {};
    let totalJabas=0, totalPeso=0, totalGanado=0;

    datos.forEach(item=>{
        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;

        if(!resumen[item.semana]){
            resumen[item.semana] = {jabas:0, peso:0, total:0};
        }
        resumen[item.semana].jabas += item.jabas;
        resumen[item.semana].peso += item.pesoNeto;
        resumen[item.semana].total += item.total;
    });

    let y = doc.lastAutoTable.finalY + 12;

    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("RESUMEN POR SEMANAS", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    for(let semana in resumen){
        doc.text(
            `Semana ${semana}: Jabas ${resumen[semana].jabas} | Peso Neto: ${resumen[semana].peso.toFixed(2)} kg | Ganancia: $${resumen[semana].total.toFixed(2)}`,
            14, y
        );
        y += 7;
    }

    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("RESUMEN GENERAL DE CAMPAÑA", 14, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total de Jabas acopiadas: ${totalJabas}`, 14, y); y += 7;
    doc.text(`Total Peso Neto despachado: ${totalPeso.toFixed(2)} kg`, 14, y); y += 7;
    doc.text(`Total Ganado en la campaña: $${totalGanado.toFixed(2)}`, 14, y);

    doc.save("reporte_esparragos.pdf");
}

function cerrarSesion(){
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("horaLogin");
    window.location.href = "login.html";
}
