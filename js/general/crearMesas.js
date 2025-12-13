import { db } from "../database/firebase_config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function crearMesas() {
    for (let i = 1; i <= 15; i++) {
        await setDoc(doc(db, "mesas", String(i)), {
            numero: i,
            estado: "cerrada",
            total: 0,
            productos: [],
            mozo: null
        });
        console.log(`Mesa ${i} creada`);
    }
}

crearMesas();
