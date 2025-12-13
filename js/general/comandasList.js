import { db } from "../database/firebase_config.js";
import {
    collection,
    onSnapshot,
    updateDoc,
    doc,
    query,
    orderBy,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaComandas");

// Cache en memoria
let comandasCache = [];

// Estados posibles
const estados = ["pendiente", "preparación", "listo", "entregado"];

// Query
const q = query(
    collection(db, "comandas"),
    orderBy("fecha", "asc")
);

// 🔥 ESCUCHA EN TIEMPO REAL
onSnapshot(q, (snapshot) => {
    comandasCache = [];

    snapshot.forEach((docu) => {
        const data = docu.data();
        if (data.estado === "entregado") return;

        comandasCache.push({
            id: docu.id,
            ...data
        });
    });

    renderComandas();
});

// 🔁 RENDER UI
function renderComandas() {
    lista.innerHTML = "";

    comandasCache.forEach((data) => {

        const claseTiempo = obtenerClaseTiempo(data.fecha);

        const div = document.createElement("div");
        div.className = `comanda ${claseTiempo}`;

        div.innerHTML = `
            <h3>Orden #${data.numero}</h3>

            <p>
                <strong>Pedido:</strong>
                hace ${tiempoDesde(data.fecha)}
            </p>

            <p><strong>Mesa:</strong> ${data.mesa}</p>
            <p><strong>Mozo:</strong> ${data.mozo}</p>
            <p><strong>Total:</strong> $${data.total}</p>

            <p>
                <span class="estado ${data.estado}">
                    ${data.estado.toUpperCase()}
                </span>
            </p>

            <h4>Productos:</h4>
            <div class="productos">
                ${data.productos.map(p => `
                    <div class="producto-item">
                        ${p.nombre} x${p.cantidad} — $${p.subtotal}
                    </div>
                `).join("")}
            </div>

            <div class="estado-btn" data-id="${data.id}">
                Cambiar estado
            </div>
        `;

        lista.appendChild(div);
    });

    agregarEventosCambioEstado();
}

// ⏱️ ACTUALIZAR SOLO EL TIEMPO (cada 30s)
setInterval(() => {
    renderComandas();
}, 30000);

// 🔄 CAMBIAR ESTADO
function agregarEventosCambioEstado() {
    document.querySelectorAll(".estado-btn").forEach(btn => {
        btn.onclick = async () => {

            const id = btn.dataset.id;
            const ref = doc(db, "comandas", id);
            const snap = await getDoc(ref);

            let estadoActual = snap.data().estado || "pendiente";

            if (estadoActual === "listo") {
                const errorEl = document.querySelector(".errorCocina");
                errorEl?.classList.remove("oculto");

                setTimeout(() => {
                    errorEl?.classList.add("oculto");
                }, 3000); // 3000 ms = 3 segundos

                return;
            }

            let index = estados.indexOf(estadoActual);
            let siguiente = estados[index + 1] || estados[0];

            await updateDoc(ref, { estado: siguiente });
        };
    });
}

// ⏱️ TIEMPO DESDE CREACIÓN
function tiempoDesde(timestamp) {
    if (!timestamp) return "";

    const diff = Math.floor((Date.now() - timestamp.toMillis()) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    return `${Math.floor(diff / 3600)} h`;
}

// 🧠 UX POR TIEMPO
function minutosDesde(timestamp) {
    if (!timestamp) return 0;
    const fecha = timestamp.toDate();
    return Math.floor((Date.now() - fecha.getTime()) / 60000);
}

function obtenerClaseTiempo(timestamp) {
    const mins = minutosDesde(timestamp);

    if (mins > 25) return "critico";
    if (mins >= 15) return "warning";
    return "ok";
}
