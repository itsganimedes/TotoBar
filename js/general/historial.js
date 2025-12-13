import { db } from "../database/firebase_config.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../database/firebase_config.js";

const lista = document.getElementById("listaComandas");

// Query: solo entregadas, ordenadas por fecha (más nuevas arriba)
const q = query(
    collection(db, "comandas"),
    where("estado", "==", "entregado"),
    orderBy("fecha", "desc")
);

onSnapshot(q, (snapshot) => {
    lista.innerHTML = "";

    if (snapshot.empty) {
        lista.innerHTML = "<p>No hay pedidos entregados aún.</p>";
        return;
    }

    snapshot.forEach(docu => {
        const data = docu.data();

        const fecha = data.fecha
            ? data.fecha.toDate().toLocaleString("es-AR")
            : "—";

        const card = document.createElement("div");
        card.className = "comanda-card";

        card.innerHTML = `
            <h3>Comanda #${data.numero}</h3>

            <p><strong>Mesa:</strong> ${data.mesa}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Mozo:</strong> ${data.mozo}</p>

            <div class="productos">
                ${data.productos.map(p => `
                    <div class="producto">
                        ${p.nombre} x${p.cantidad}
                        <span>$${p.subtotal}</span>
                    </div>
                `).join("")}
            </div>

            <div class="total">
                Total: $${data.total}
            </div>
        `;

        lista.appendChild(card);
    });
});
