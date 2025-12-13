// js/account/signin.js
import { auth } from "../database/firebase_config.js";
import { db } from "../database/firebase_config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    setDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const btn = document.getElementById("btnRegister");
const errorP = document.getElementById("error");

function showError(msg) {
    errorP.textContent = msg;
    errorP.style.display = "block";
}

function hideError() {
    errorP.style.display = "none";
}

btn.addEventListener("click", async () => {
    hideError();

    const name = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;

    if (!name) return showError("Ingresá un nombre válido.");
    if (!email || !email.includes("@")) return showError("Ingresá un email válido.");
    if (password.length < 6) return showError("La contraseña debe tener al menos 6 caracteres.");

    btn.disabled = true;
    btn.textContent = "Registrando...";

    try {
        // Crear usuario en Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Setear nombre visible del usuario
        await updateProfile(cred.user, { displayName: name });

        // Guardar perfil en Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            name,
            email,
            rol: "mozo", // rol por defecto
            createdAt: serverTimestamp()
        });

        // Redirigir
        window.location.href = "../index.html";

    } catch (error) {
        console.error(error);

        if (error.code === "auth/email-already-in-use") {
            showError("Ese email ya está registrado.");
        } else if (error.code === "auth/weak-password") {
            showError("La contraseña es demasiado débil.");
        } else {
            showError(error.message || "Error al registrar.");
        }

    } finally {
        btn.disabled = false;
        btn.textContent = "Registrar";
    }
});
