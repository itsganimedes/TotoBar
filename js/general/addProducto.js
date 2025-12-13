// js/general/addProducto.js
import { db } from "../database/firebase_config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("formProducto");

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

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    bloquearUI();

    try{

        const nombre = document.getElementById("nombreProducto").value.trim();
        const stock = parseInt(document.getElementById("stockProducto").value);
        const precio = parseInt(document.getElementById("precioProducto").value);

        if (!nombre || isNaN(stock) || isNaN(precio)) {
            let errorp = document.querySelector(".error");
            errorp.style.display = "block";
            return;
        }

        try {
            await addDoc(collection(db, "productos"), {
                nombre,
                stock,
                precio,
                creado: serverTimestamp()
            });

            alert("Producto añadido correctamente!");

            // Limpiar
            form.reset();

        } catch (error) {
            console.error("Error al añadir producto:", error);
            alert("Hubo un error al guardar.");
        }

    } catch {

    } finally {
        desbloquearUI();
    }
});
