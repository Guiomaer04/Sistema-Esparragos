/* =========================
   VALIDAR SESIÓN CON TIEMPO
========================= */

let sesionActiva =
    localStorage.getItem("sesionActiva");

let horaLogin =
    localStorage.getItem("horaLogin");

let tiempoActual =
    Date.now();

// 10 minutos = 600000 milisegundos
let tiempoLimite = 600000;

if(
    sesionActiva !== "true" ||
    !horaLogin ||
    (tiempoActual - horaLogin > tiempoLimite)
){
    // cerrar sesión automáticamente
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("horaLogin");

    window.location.href = "login.html";
}

/* =========================
   CONTADOR DE VISITAS
========================= */

let visitas =
    localStorage.getItem("contadorVisitas") || 0;

visitas++;

localStorage.setItem(
    "contadorVisitas",
    visitas
);

document.addEventListener(
    "DOMContentLoaded",
    function(){

        document.getElementById(
            "contadorVisitas"
        ).textContent = visitas;

    }
);

/* =========================
   DATOS
========================= */

let datos =
    JSON.parse(
        localStorage.getItem("esparragos")
    ) || [];

mostrarDatos();

/* =========================
   AGREGAR FILA
========================= */

function agregarFila(){

    let semana =
        document.getElementById("semana").value;

    let dia =
        document.getElementById("dia").value;

    let fecha =
        document.getElementById("fecha").value;

    let jabas =
        parseInt(
            document.getElementById("jabas").value
        );

    let peso =
        parseFloat(
            document.getElementById("peso").value
        );

    let precio =
        parseFloat(
            document.getElementById("precio").value
        );

    if(
        !semana ||
        !dia ||
        !fecha ||
        !jabas ||
        !peso ||
        !precio
    ){
        alert("Complete todos los campos");
        return;
    }

    let tara = jabas * 1.60;
    let pesoNeto = peso - tara;
    let total = pesoNeto * precio;

    let registro = {
        semana,
        dia,
        fecha,
        jabas,
        peso,
        tara,
        pesoNeto,
        precio,
        total
    };

    datos.push(registro);

    guardarDatos();
    mostrarDatos();
    limpiarCampos();
}

/* =========================
   MOSTRAR DATOS
========================= */

function mostrarDatos(){

    let tbody =
        document.querySelector("#tabla tbody");

    tbody.innerHTML = "";

    let totalJabas = 0;
    let totalPeso = 0;
    let totalGanado = 0;

    datos.forEach((item, index) => {

        totalJabas += item.jabas;
        totalPeso += item.pesoNeto;
        totalGanado += item.total;

        tbody.innerHTML += `
            <tr>
                <td>${item.semana}</td>
                <td>${item.dia}</td>
                <td>${item.fecha}</td>
                <td>${item.jabas}</td>
                <td>${item.peso.toFixed(2)}</td>
                <td>${item.tara.toFixed(2)}</td>
                <td>${item.pesoNeto.toFixed(2)}</td>
                <td>${item.precio.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
                <td>
                    <button
                        class="eliminar"
                        onclick="eliminarFila(${index})">
                        X
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById(
        "totalJabas"
    ).textContent = totalJabas;

    document.getElementById(
        "totalPeso"
    ).textContent =
        totalPeso.toFixed(2) + " kg";

    document.getElementById(
        "totalGanado"
    ).textContent =
        "$" + totalGanado.toFixed(2);
}

/* =========================
   ELIMINAR FILA
========================= */

function eliminarFila(index){

    datos.splice(index, 1);

    guardarDatos();
    mostrarDatos();
}

/* =========================
   GUARDAR DATOS
========================= */

function guardarDatos(){

    localStorage.setItem(
        "esparragos",
        JSON.stringify(datos)
    );
}

/* =========================
   LIMPIAR CAMPOS
========================= */

function limpiarCampos(){

    document.getElementById("semana").value = "";
    document.getElementById("dia").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("jabas").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("precio").value = "";
}

/* =========================
   DESCARGAR PDF
========================= */

async function descargarPDF(){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(
        "Sistema de Control de Espárragos",
        14,
        15
    );

    // Crear filas
    let filas = [];

    datos.forEach((item) => {

        filas.push([
            item.semana,
            item.dia,
            item.fecha,
            item.jabas,
            item.peso.toFixed(2),
            item.tara.toFixed(2),
            item.pesoNeto.toFixed(2),
            item.precio.toFixed(2),
            item.total.toFixed(2)
        ]);

    });

    // Tabla tipo Excel
    doc.autoTable({

        startY: 25,

        head: [[
            "Semana",
            "Día",
            "Fecha",
            "Jabas",
            "Peso Bruto",
            "Tara",
            "Peso Neto",
            "Precio",
            "Total"
        ]],

        body: filas,

        theme: "grid",

        styles: {
            fontSize: 8,
            cellPadding: 2
        },

        headStyles: {
            fillColor: [45, 106, 79]
        }

    });

    // Descargar
    doc.save(
        "reporte_esparragos.pdf"
    );
}

/* =========================
   CERRAR SESIÓN
========================= */

function cerrarSesion(){

    localStorage.removeItem(
        "sesionActiva"
    );

    localStorage.removeItem(
        "horaLogin"
    );

    window.location.href = "login.html";
}
