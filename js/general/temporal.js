import { db } from "../database/firebase_config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// async function crearMesas() {
//     for (let i = 1; i <= 15; i++) {
//         await setDoc(doc(db, "mesas", String(i)), {
//             numero: i,
//             estado: "cerrada",
//             total: 0,
//             productos: [],
//             mozo: null
//         });
//         console.log(`Mesa ${i} creada`);
//     }
// }

// crearMesas();

asegurarEstadisticasGenerales();

async function asegurarEstadisticasGenerales() {
    const ref = doc(db, "estadisticas_generales", "resumen");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            totalFacturado: 0,
            mesasCerradas: 0,
            pagos: {
                Efectivo: 0,
                Debito: 0,
                Credito: 0,
                Mercadopago: 0
            }
        });
    }

    console.log("hecho");
}
