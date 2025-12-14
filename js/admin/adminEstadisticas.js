import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../database/firebase_config.js";

const statsList = document.getElementById("stats-list");

const statTotal = document.getElementById("stat-total");
const statMesas = document.getElementById("stat-mesas");
const statPromedio = document.getElementById("stat-promedio");
const statPago = document.getElementById("stat-pago");

const pagoEfectivo = document.getElementById("pago-Efectivo");
const pagoDebito = document.getElementById("pago-debito");
const pagoCredito = document.getElementById("pago-credito");
const pagoMP = document.getElementById("pago-mercadopago");


const q = query(
    collection(db, "estadisticas"),
    orderBy("fecha", "desc")
);

onSnapshot(q, snap => {
    statsList.innerHTML = "";

    let totalFacturado = 0;
    let mesas = 0;
    let pagos = {
        Efectivo: 0,
        debito: 0,
        credito: 0,
        mercadopago: 0
    };


    snap.forEach(docu => {
        const e = docu.data();
        mesas++;
        totalFacturado += e.total;

        pagos[e.formaPago] += e.total;

        pagos[e.formaPago] = (pagos[e.formaPago] || 0);

        const fecha = e.fecha?.toDate().toLocaleString("es-AR") ?? "";

        statsList.innerHTML += `
            <tr>
                <td>${fecha}</td>
                <td>${e.mesa}</td>
                <td>${e.mozo ?? "-"}</td>
                <td>${e.formaPago}</td>
                <td>$${e.total}</td>
            </tr>
        `;
    });

    statTotal.textContent = `$${totalFacturado}`;
    statMesas.textContent = mesas;
    statPromedio.textContent = mesas
        ? `$${Math.round(totalFacturado / mesas)}`
        : "$0";

    const topPago = Object.entries(pagos)
        .sort((a, b) => b[1] - a[1])[0];

    statPago.textContent = topPago ? topPago[0] : "–";

    pagoEfectivo.textContent = `$${pagos.Efectivo}`;
    pagoDebito.textContent = `$${pagos.debito}`;
    pagoCredito.textContent = `$${pagos.credito}`;
    pagoMP.textContent = `$${pagos.mercadopago}`;

});
