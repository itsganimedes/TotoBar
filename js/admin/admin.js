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
import { db } from "../database/firebase_config.js";



const menuItems = document.querySelectorAll(".menu-item");
const sections = document.querySelectorAll(".section");
const title = document.getElementById("section-title");

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

function startAuthCheck() {
    bloquearUI();

    onAuthStateChanged(auth, async (user) => {
        
        if (!user) {
            console.log("No hay usuario logueado. Redirigiendo a index.html.");
            window.location.href = "index.html";
            return; // Detiene la ejecución
        }

        
        try {
            const userDocRef = doc(db, "users", user.uid);
            
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userRole = userData.rol;
                
                console.log(`Rol del usuario: ${userRole}`);

                // 5. Verificar si el rol NO es "admin"
                if (userRole !== "admin") {
                    console.warn("Acceso denegado: Rol insuficiente.");
                    alert("Acceso denegado. Solo los administradores pueden acceder a este panel.");
                    
                    // Opcional: Cerrar sesión antes de redirigir
                    // await signOut(auth); // Descomentar si quieres cerrar la sesión
                    
                    window.location.href = "index.html"; // Redirigir si no es admin
                    return;
                }

                desbloquearUI();

            } else {

                console.error("Documento de usuario no encontrado en Firestore. Acceso denegado.");
                window.location.href = "index.html";
            }

        } catch (error) {
            console.error("Error al obtener el rol del usuario:", error);
            alert("Error de verificación. Redirigiendo.");
            window.location.href = "index.html";
        }
    });
}


startAuthCheck();

menuItems.forEach(item => {
    item.addEventListener("click", () => {

        // Activar item
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        // Mostrar sección
        const sectionName = item.dataset.section;

        sections.forEach(sec => sec.classList.remove("visible"));
        document.getElementById(`section-${sectionName}`).classList.add("visible");

        // Cambiar título
        title.textContent = item.textContent.trim();
    });
});


// Logout (falta implementar Firebase)
document.getElementById("logout").addEventListener("click", () => {
    window.location.href = "index.html";
});



// Renderizar lista de mozos
async function cargarMozos() {
    const contenedor = document.getElementById("mozos-list");
    contenedor.innerHTML = "<p>Cargando...</p>";

    const snapshot = await getDocs(collection(db, "users"));

    contenedor.innerHTML = "";

    snapshot.forEach(docu => {
        const m = docu.data();

        const card = document.createElement("div");
        card.classList.add("mozo-card");

        card.innerHTML = `
            <div>
                <h3>${m.name}</h3>
                <p>Rol: ${m.rol}</p>
            </div>

            <div class="mozo-buttons">
                <button class="btn-edit" data-id="${docu.id}">Cambiar Rol</button>
                <button class="btn-delete" data-id="${docu.id}">Eliminar</button>
            </div>
        `;

        contenedor.appendChild(card);
    });

    activarBotonesMozos();
}

async function cambiarRol(id) {
    bloquearUI();
    try {
        const userDocRef = doc(db, "users", id);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            console.error("Usuario no encontrado.");
            return;
        }

        const currentRole = userSnap.data().rol;

        // Orden de roles
        const roles = ["mozo", "cocinero", "admin"];

        // Buscar índice del rol actual
        const currentIndex = roles.indexOf(currentRole);

        // Si no existe (raro), asignar mozo
        const nextIndex = currentIndex === -1 
            ? 0 
            : (currentIndex + 1) % roles.length;

        const newRole = roles[nextIndex];

        // Actualizar en Firestore
        await updateDoc(userDocRef, {
            rol: newRole
        });

        cargarMozos();

    } catch (error) {
        console.error("Error cambiando rol:", error);
        alert("No se pudo cambiar el rol.");
    } finally {
        desbloquearUI();
    }
}

// Activar botones de editar / borrar / alternar estado
function activarBotonesMozos() {

    // Editar
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            cambiarRol(id);
        });
    });

    // Borrar
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            if (!confirm("¿Eliminar este mozo?")) return;

            await deleteDoc(doc(db, "mozos", id));
            cargarMozos();
        });
    });
}

// Cargar mozos al entrar en la pestaña
document.querySelector('[data-section="mozos"]').addEventListener("click", cargarMozos);


// ===============================
//     CARGAR PRODUCTOS
// ===============================

async function cargarProductos() {
    const contenedor = document.getElementById("productos-list");
    contenedor.innerHTML = "<p>Cargando productos...</p>";

    try {
        const snapshot = await getDocs(collection(db, "productos"));

        contenedor.innerHTML = ""; // limpiar

        if (snapshot.empty) {
            contenedor.innerHTML = "<p>No hay productos cargados.</p>";
            return;
        }

        snapshot.forEach(docu => {
            const p = docu.data();

            const card = document.createElement("div");
            card.classList.add("producto-card");

            card.innerHTML = `
                <div class="prod-info">
                    <h3>${p.nombre}</h3>
                    <div class="prod-desc">
                        <p>💲 Precio: <b>$${p.precio}</b></p>
                        <p>📦 Stock: <b>${p.stock}</b></p>
                    </div>
                </div>

                <div class="prod-buttons">
                    <button class="btn-edit-producto" data-id="${docu.id}">Editar</button>
                    <button class="btn-delete-producto" data-id="${docu.id}">Eliminar</button>
                </div>
            `;

            contenedor.appendChild(card);
        });

        activarBotonesProductos();

    } catch (err) {
        console.error("Error cargando productos:", err);
        contenedor.innerHTML = "<p>Error al cargar los productos.</p>";
    }
}

function activarBotonesProductos() {
    // Editar
    document.querySelectorAll(".btn-edit-producto").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            // Redirigir a página de edición (si querés)
            window.location.href = `/TotoBar/editProducto.html?id=${id}`;
        });
    });

    // Borrar
    document.querySelectorAll(".btn-delete-producto").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            if (!confirm("¿Eliminar este producto?")) return;

            await deleteDoc(doc(db, "productos", id));
            cargarProductos();
        });
    });
}

document.querySelector('[data-section="productos"]').addEventListener("click", cargarProductos);

startAuthCheck();
cargarProductos();