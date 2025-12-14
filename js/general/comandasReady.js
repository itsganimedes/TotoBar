import { db } from "../database/firebase_config.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const avisos = document.getElementById("avisosListos");

function bloquearUI() {
        document.getElementById("global-loader").style.display = "flex";
        console.log("obtenido");

        // Desactivar todos los botones
        document.querySelectorAll("button").forEach(btn => {
            btn.disabled = true;
        });
    }

    function desbloquearUI() {
        document.getElementById("global-loader").style.display = "none";

        // Reactivar botones
        document.querySelectorAll("button").forEach(btn => {
            btn.disabled = false;
        });
    }

let primeraVez = false;

const notificadas = new Set();
const audio = new Audio("/TotoBar/sounds/notification.mp3");
audio.volume = 0.8;

// Cache de comandas en memoria
let comandasCache = [];

// Escuchar órdenes listas
const q = query(
    collection(db, "comandas"),
    where("estado", "==", "listo")
);

onSnapshot(q, (snapshot) => {
    comandasCache = []; // limpiar cache

    snapshot.forEach((docu) => {
        const data = docu.data();

        if (primeraVez)
        {

            if (!notificadas.has(docu.id)) {
                notificadas.add(docu.id);

                // Sonido y vibración
                audio.play().catch(() => {});
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
        }

        comandasCache.push({
            id: docu.id,
            ...data
        });
        
    });

    renderAvisos();

    primeraVez = true;
});

// 🔁 Render UI de avisos
function renderAvisos() {
    avisos.innerHTML = "";

    comandasCache.forEach((data) => {
        const div = document.createElement("div");
        div.className = "aviso-card";

        div.innerHTML = `
            <div class="aviso-content">
                <h3>Orden #${data.numero} lista 🔔</h3>
                <p class="time">⏱️ ${tiempoTranscurrido(data.fecha)}</p>
                <p><strong>Mesa:</strong> ${data.mesa}</p>
                <p><strong>Total:</strong> $${data.total}</p>
                <button class="btn-2" data-id="${data.id}">Finalizar</button>
            </div>
        `;

        avisos.appendChild(div);
    });

    activarBotonesFinalizar();
}

// 🔄 Botones de finalizar orden
function activarBotonesFinalizar() {
    document.querySelectorAll(".btn-2").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            const ok = confirm("¿Confirmar que la orden fue retirada de cocina?");
            if (!ok) return;

            bloquearUI();

            try {
                await updateDoc(doc(db, "comandas", id), {
                    estado: "entregado"
                });
            } catch (err) {
                console.error("Error al finalizar comanda:", err);
                alert("No se pudo finalizar la orden.");
            } finally {
                desbloquearUI();
            }
        };
    });
}

// ⏱️ Función para mostrar tiempo transcurrido
function tiempoTranscurrido(fecha) {
    const ahora = Date.now();
    const diff = Math.floor((ahora - fecha.toMillis()) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    return `${Math.floor(diff / 3600)} h`;
}

// ⏱️ Actualizar tiempos cada 30 segundos
setInterval(() => {
    renderAvisos();
}, 30000);
