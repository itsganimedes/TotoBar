import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../database/firebase_config.js"; //

export async function logoutUser() {
    try {
        await signOut(auth);
        
        alert("Sesión cerrada exitosamente.");
        
        window.location.href = 'login.html'; 

    } catch (error) {
        // Manejo de errores
        console.error("Error al cerrar la sesión:", error.message);
        alert("Hubo un problema al cerrar la sesión. Inténtalo de nuevo.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    const btnLogout = document.getElementById('btnLogout');
    
    if (btnLogout) {
        btnLogout.addEventListener('click', logoutUser);
    } else {
        console.warn("Advertencia: El elemento con ID 'btnLogout' no fue encontrado en el DOM.");
    }

});