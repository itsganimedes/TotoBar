import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "../database/firebase_config.js";

const statsList = document.getElementById("stats-list");

const statTotal = document.getElementById("stat-total");
const statMesas = document.getElementById("stat-mesas");
const statPromedio = document.getElementById("stat-promedio");
const statPago = document.getElementById("stat-pago");

const pagoEfectivo = document.getElementById("pago-Efectivo");
const pagoDebito = document.getElementById("pago-Debito");
const pagoCredito = document.getElementById("pago-Credito");
const pagoMP = document.getElementById("pago-Mercadopago");

const statTotalGen = document.getElementById("stat-total-gen");
const statMesasGen = document.getElementById("stat-mesas-gen");
const statPromGen = document.getElementById("stat-promedio-gen");
const statPagoGen = document.getElementById("stat-pago-gen");

const pagoEfectivoGen = document.getElementById("pago-Efectivo-gen");
const pagoDebitoGen = document.getElementById("pago-Debito-gen");
const pagoCreditoGen = document.getElementById("pago-Credito-gen");
const pagoMPGen = document.getElementById("pago-Mercadopago-gen");


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
        Debito: 0,
        Credito: 0,
        Mercadopago: 0
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
    pagoDebito.textContent = `$${pagos.Debito}`;
    pagoCredito.textContent = `$${pagos.Credito}`;
    pagoMP.textContent = `$${pagos.Mercadopago}`;

});

onSnapshot(
    doc(db, "estadisticas_generales", "resumen"),
    snap => {
        if (!snap.exists()) return;

        const d = snap.data();

        statTotalGen.textContent = `$${d.totalFacturado}`;
        statMesasGen.textContent = d.mesasCerradas;
        statPromGen.textContent = d.mesasCerradas
            ? `$${Math.round(d.totalFacturado / d.mesasCerradas)}`
            : "$0";

        const topPago = Object.entries(d.pagos)
            .sort((a, b) => b[1] - a[1])[0];

        statPagoGen.textContent = topPago ? topPago[0] : "–";

        pagoEfectivoGen.textContent = `$${d.pagos.Efectivo}`;
        pagoDebitoGen.textContent = `$${d.pagos.Debito}`;
        pagoCreditoGen.textContent = `$${d.pagos.Credito}`;
        pagoMPGen.textContent = `$${d.pagos.Mercadopago}`;
    }
);
