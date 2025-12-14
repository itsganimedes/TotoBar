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

    try{

        const nombre = document.getElementById("nombreProducto").value.trim();
        const categoria = document.getElementById("categoria").value;
        const stock = parseInt(document.getElementById("stockProducto").value);
        const precio = parseInt(document.getElementById("precioProducto").value);

        if (!nombre || isNaN(stock) || isNaN(precio)) {
            let errorp = document.querySelector(".error");
            errorp.classList.remove("oculto");
            setTimeout(() => {
                errorp?.classList.add("oculto");
            }, 3000); // 3000 ms = 3 segundos

            return;
        }

        bloquearUI();

        try {
            await addDoc(collection(db, "productos"), {
                nombre,
                categoria,
                stock,
                precio,
                estado: 'Disponible', 
                creado: serverTimestamp()
            });

            alert("Producto añadido correctamente!");

            // Limpiar
            form.reset();

        } catch (error) {
            console.error("Error al añadir producto:", error);
            alert("Hubo un error al guardar.");
        } finally {
            desbloquearUI();
        }

    } catch {}
});
