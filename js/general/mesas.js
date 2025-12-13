import { onSnapshot,
    collection,
    query,
    where,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../database/firebase_config.js";
import { auth } from "../database/firebase_config.js";

const contenedor = document.getElementById("listaMesas");

let mesaSeleccionadaId = null;
let mesaSeleccionadaData = null;

const exito = document.querySelector(".exito");


const q = query(
    collection(db, "mesas"),
    where("estado", "==", "abierta")
);

onSnapshot(q, snap => {
    contenedor.innerHTML = "";

    if (snap.empty) {
        contenedor.innerHTML = "<p>No hay mesas abiertas</p>";
        return;
    }

    snap.forEach(docu => {
        const m = docu.data();
        const div = document.createElement("div");
        div.classList.add("mesa-card");

        // Render productos
        let productosHTML = "";
        m.productos?.forEach(p => {
            productosHTML += `<p>• ${p.nombre} x${p.cantidad}</p>`;
        });

        div.innerHTML = `
            <span class="estado-abierta">ABIERTA</span>

            <h3>Mesa ${m.numero}</h3>

            <div class="mesa-info">
                Mozo: <span>${m.mozo || "—"}</span>
            </div>

            <div class="mesa-total">
                Total: $${m.total}
            </div>

            <div class="mesa-productos">
                ${productosHTML || "<p>Sin productos</p>"}
            </div>

            <button class="btn-finalizar">Finalizar Mesa</button>

        `;

        const btn = div.querySelector(".btn-finalizar");

        btn.addEventListener("click", () => {
            abrirModalPago(docu.id, m);
        });

        contenedor.appendChild(div);
    });
});

function cerrarModalPago() {
    document.getElementById("modalPago").classList.add("oculto");
    document.body.style.overflow = "auto";
}

async function confirmarPago() {
    const formaPago = document.getElementById("formaPagoSelect").value;
    if (!formaPago) {
        document.querySelector(".error").classList.remove("oculto");
        setTimeout(() => {
                document.querySelector(".error").classList.add("oculto");
            }, 3000);
        return;
    }

    try {
        // 1️⃣ Guardar estadística
        await addDoc(collection(db, "estadisticas"), {
            mesa: mesaSeleccionadaData.numero,
            total: mesaSeleccionadaData.total,
            formaPago,
            mozo: mesaSeleccionadaData.mozo ?? null, 
            fecha: serverTimestamp()
        });

        await updateDoc(doc(db, "mesas", mesaSeleccionadaId), {
            estado: "cerrada",
            formaPago,
            cerradaEn: serverTimestamp(),
            total: 0,
            productos: [],
            mozo: null
        });

        cerrarModalPago();

        mostrarExito();


    } catch (error) {
        console.error(error);
        alert("Error al finalizar la mesa");
    }
}

function mostrarExito() {
    exito.classList.add("oculto");
    exito.classList.remove("mostrar");
    void exito.offsetWidth;
    exito.classList.add("mostrar");
    exito.classList.remove("oculto");
}


function abrirModalPago(mesaId, mesaData) {
    mesaSeleccionadaId = mesaId;
    mesaSeleccionadaData = mesaData;

    document.getElementById("modalMesaInfo").textContent =
        `Mesa ${mesaData.numero}`;

    document.getElementById("modalTotal").textContent = mesaData.total;

    document.getElementById("formaPagoSelect").value = "";

    document.getElementById("modalPago").classList.remove("oculto");
    document.body.style.overflow = "hidden";
}



document.querySelector(".btn-cancelar")
    .addEventListener("click", cerrarModalPago);

document.querySelector(".btn-confirmar")
    .addEventListener("click", confirmarPago);
