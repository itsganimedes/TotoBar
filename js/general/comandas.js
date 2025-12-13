import { db } from "../database/firebase_config.js";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc, 
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ejemplo de cómo se integraría usando Firebase Auth listener
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../database/firebase_config.js"; // Asume que exportas 'auth'

onAuthStateChanged(auth, (user) => {
    if (user) {
        inicializarComanda(user);
        
        cargarProductos();

    } else {
        window.location.href = "login.html";
    }
});

// Función para obtener y formatear la fecha/hora actual
function obtenerFechaActual() {
    const now = new Date();
    
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

    const fecha = now.toLocaleDateString('es-ES', dateOptions);
    const hora = now.toLocaleTimeString('es-ES', timeOptions);

    return `${fecha} ${hora}`;
}

async function inicializarComanda(user) {
    // 1. Mostrar Fecha y Hora
    document.getElementById("fechaHora").textContent = obtenerFechaActual();
    
    // 2. Obtener Nombre del Mozo (Usuario Autenticado)
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Asume que el documento tiene un campo 'name'
            document.getElementById("mozo").textContent = userData.name || "Mozo Desconocido";
        } else {
            console.warn("Documento de usuario no encontrado, usando nombre predeterminado.");
            document.getElementById("mozo").textContent = "Mozo (No registrado)";
        }
    } catch (error) {
        console.error("Error al cargar datos del mozo:", error);
        document.getElementById("mozo").textContent = "Error de Carga";
    }

    // 3. Obtener Número de Comanda
    // Usamos la función de solo lectura que ya definimos.
    // Esto actualizará el campo #numeroComanda con el valor correcto.
    await obtenerNumeroComandaActual(); 
}

// ELEMENTOS
const numeroComandaInput = document.getElementById("numeroComanda");
const productoSelect = document.getElementById("productoSelect");
const cantidadInput = document.getElementById("cantidadProducto");
const listaProductosDiv = document.getElementById("listaProductos");
const totalSpan = document.getElementById("total");
const formComanda = document.getElementById("formComanda");

let productosAgregados = [];
let total = 0;

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

// =============================================================
// 1. Cargar productos desde Firebase
// =============================================================
async function cargarProductos() {
    const querySnapshot = await getDocs(collection(db, "productos"));

    querySnapshot.forEach((docu) => {
        const data = docu.data();
        const option = document.createElement("option");
        option.value = docu.id;
        option.textContent = `${data.nombre} ($${data.precio})`;
        option.dataset.precio = data.precio;
        productoSelect.appendChild(option);
    });
}

// =============================================================
// 2. Obtener número de comanda autoincremental
// =============================================================
async function obtenerNumeroComandaActual() {
    const ref = doc(db, "config", "contadorComandas");
    const snap = await getDoc(ref);
    
    let numeroComanda = 1;

    if (snap.exists()) {
        numeroComanda = snap.data().ultimo || 1; 
    } else {
        // Si no existe, lo creamos con 1
        await setDoc(ref, { ultimo: 1 });
    }
    
    // Muestra el número **actual** para esta nueva comanda
    numeroComandaInput.value = numeroComanda;
    numeroComandaInput.textContent = "#" + numeroComanda;
    return numeroComanda;
}


obtenerNumeroComandaActual();


async function incrementarNumeroComanda(numeroActual) {
    const ref = doc(db, "config", "contadorComandas");
    const nuevoNumero = numeroActual + 1;
    await updateDoc(ref, { ultimo: nuevoNumero });
    return nuevoNumero;
}

// =============================================================
// 3. Agregar productos a la comanda
// =============================================================
document.getElementById("btnAgregarProducto").addEventListener("click", () => {

    bloquearUI();

    try{
        const idProd = productoSelect.value;
        if (!idProd) return alert("Selecciona un producto");

        const precio = parseInt(
            productoSelect.options[productoSelect.selectedIndex].dataset.precio
        );

        const nombre = productoSelect.options[productoSelect.selectedIndex].textContent;
        const cantidad = parseInt(cantidadInput.value);
        const subtotal = precio * cantidad;

        productosAgregados.push({
            id: idProd,
            nombre,
            precio,
            cantidad,
            subtotal
        });

        total += subtotal;
        totalSpan.textContent = total;

        renderProductos();
    } catch (error) {
        console.log("Error: " + error)
    } finally {
        desbloquearUI();
    }
});

// Renderizar la lista
function renderProductos() {
    listaProductosDiv.innerHTML = "";

    productosAgregados.forEach((p, index) => {
        const div = document.createElement("div");
        div.classList.add("producto-item");
        div.innerHTML = `
            <p>${p.nombre} x${p.cantidad} — $${p.subtotal}</p>
            <button data-index="${index}" class="btn-remove">❌</button>
        `;
        listaProductosDiv.appendChild(div);
    });

    document.querySelectorAll(".btn-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            total -= productosAgregados[index].subtotal;
            productosAgregados.splice(index, 1);
            totalSpan.textContent = total;
            renderProductos();
        });
    });
}


// =============================================================
// 4. Guardar comanda en Firestore
// =============================================================
formComanda.addEventListener("submit", async (e) => {
    e.preventDefault();

    const numero = parseInt(numeroComandaInput.value); 
    
    // Si el input está vacío o no es un número, salimos (solución al NaN)
    if (isNaN(numero) || numero < 1) { 
        console.error("Número de comanda inválido: ", numero);
        alert("Error: El número de comanda es inválido. Intenta recargar la página.");
        return;
    }

    const mesa = document.getElementById("mesa").value;
    const formaPago = document.getElementById("formaPago").value;
    const mozo = document.getElementById("mozo").textContent.trim();

    if (!mesa || !formaPago || productosAgregados.length === 0) {
        let errorp = document.querySelector(".error");
        errorp.style.display = "block";
        return;
    }

    bloquearUI();

    try {
        await addDoc(collection(db, "comandas"), {
            numero,
            mesa,
            mozo,
            formaPago,
            productos: productosAgregados,
            total,
            estado: "pendiente",
            fecha: serverTimestamp()
        });

        // Actualizar stock
        for (let p of productosAgregados) {
            const ref = doc(db, "productos", p.id);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const stockActual = snap.data().stock;
                await updateDoc(ref, {
                    stock: stockActual - p.cantidad
                });
            }
        }

        await incrementarNumeroComanda(numero);

        alert("Comanda guardada!");
        formComanda.reset();
        productosAgregados = [];
        total = 0;
        totalSpan.textContent = 0;
        obtenerNumeroComandaActual();
        renderProductos();
        numeroComandaInput.value = numero;
        document.querySelector(".error").style.display = "none";

    } catch (error) {
        console.error(error);
        alert("Error al guardar la comanda");
    } finally {
        desbloquearUI();
    }
});

function calcularTotal(arr) {
    return arr.reduce((acc, item) => acc + item.subtotal, 0);
}