// js/account/auth.js
import { auth } from "../database/firebase_config.js";
import {
    signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const errorText = document.getElementById("errorText");

function showError(msg) {
    errorText.textContent = msg;
    errorText.style.display = "block";
}

function hideError() {
    errorText.style.display = "none";
}

btnLogin.addEventListener("click", async () => {
    hideError();

    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;

    if (!email) return showError("Ingresá tu email.");
    if (!pass) return showError("Ingresá tu contraseña.");

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    try {
        await signInWithEmailAndPassword(auth, email, pass);

        // Login OK → Ir al panel
        window.location.href = "../../index.html";

    } catch (error) {
        console.error(error);

        if (error.code === "auth/invalid-credential") {
            showError("Email o contraseña incorrectos.");
        } else if (error.code === "auth/too-many-requests") {
            showError("Demasiados intentos. Probá más tarde.");
        } else {
            showError("Error al iniciar sesión.");
        }
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
    }
});