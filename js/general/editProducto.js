import { db } from "../database/firebase_config.js";
import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";




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



// ===============================
//   OBTENER ID DESDE LA URL
// ===============================
const params = new URLSearchParams(window.location.search);
const productoID = params.get("id");

if (!productoID) {
    alert("ID del producto no encontrado.");
    window.location.href = "admin.html";
}

// Inputs
const nombreInput = document.getElementById("nombreProducto");
const stockInput = document.getElementById("stockProducto");
const precioInput = document.getElementById("precioProducto");
const form = document.getElementById("formProducto");
const loader = document.getElementById("global-loader");
const errorMsg = document.getElementById("errorMsg");


// ===============================
//       CARGAR PRODUCTO
// ===============================
async function cargarProducto() {
    bloquearUI();
    try {
        const ref = doc(db, "productos", productoID);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            alert("Producto no encontrado.");
            window.location.href = "admin.html";
            return;
        }

        const p = snapshot.data();

        nombreInput.value = p.nombre;
        stockInput.value = p.stock;
        precioInput.value = p.precio;

    } catch (err) {
        console.error("Error al cargar producto:", err);
        alert("Error cargando producto.");
        window.location.href = "admin.html";
    } finally {
        desbloquearUI();
    }
}

cargarProducto();


// ===============================
//        GUARDAR CAMBIOS
// ===============================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const stock = parseInt(stockInput.value);
    const precio = parseInt(precioInput.value);

    if (!nombre || isNaN(stock) || isNaN(precio)) {
        errorMsg.classList.remove("oculto");
        return;
    }

    errorMsg.classList.add("oculto");
    loader.style.display = "flex";

    try {
        const ref = doc(db, "productos", productoID);
        await updateDoc(ref, {
            nombre,
            stock,
            precio
        });

        loader.style.display = "none";
        alert("Cambios guardados correctamente.");
        window.location.href = "admin.html";

    } catch (err) {
        console.error("Error actualizando producto:", err);
        loader.style.display = "none";
        alert("Error al guardar los cambios.");
    }
});
