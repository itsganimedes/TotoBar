import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../database/firebase_config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    doc
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

/**
 * Verifica si el usuario está autenticado.
 * Si no lo está, redirige a la página de login.
 *
 * @param {string} loginPage - Ruta del login (default: 'login.html')
 */
export function checkAuth(loginPage = 'login.html') {
    onAuthStateChanged(auth, async (user) => {

        if (user) {
            console.log("[Auth] Usuario activo:", user.email);
            document.getElementById("btnLogin").classList.add("oculto");
            document.getElementById("btnLogout").classList.remove("oculto");
            return;
        }

        console.warn("[Auth] Usuario no logueado");

        document.getElementById("btnLogin").classList.remove("oculto");
        document.getElementById("btnLogout").classList.add("oculto");

        const currentPage = window.location.pathname.split("/").pop();

        // Evitar redirección si ya estamos en login.html
        if (currentPage === loginPage) return;

        // Redirigir sin alert (más profesional)
        window.location.href = loginPage;
    });
}

// Auto-ejecución al importar el módulo
checkAuth();
