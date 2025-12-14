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
import { arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

    productoSelect.innerHTML = "";

    querySnapshot.forEach((docu) => {
        const data = docu.data();
        const option = document.createElement("option");

        option.value = docu.id;
        option.textContent = `${data.nombre} ($${data.precio})`;
        option.dataset.precio = data.precio;

        if (data.estado === "No disponible") {
            option.disabled = true;
            option.textContent += " — No disponible";
        }

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
            <p>✔ ${p.nombre} x${p.cantidad} — $${p.subtotal}</p>
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
// GUARDAR COMANDA
// =============================================================
formComanda.addEventListener("submit", async (e) => {
    e.preventDefault();

    const numero = parseInt(numeroComandaInput.value);
    if (isNaN(numero) || numero < 1) {
        alert("Número de comanda inválido");
        return;
    }

    const mesaId = document.getElementById("mesa").value;
    const mozo = document.getElementById("mozo").textContent.trim();

    if (!mesaId || productosAgregados.length === 0) {
        const errorp = document.querySelector(".error");
        errorp.classList.remove("oculto");
        setTimeout(() => errorp.classList.add("oculto"), 3000);
        return;
    }

    bloquearUI();

    try {
        const mesaRef = doc(db, "mesas", mesaId);
        const mesaSnap = await getDoc(mesaRef);

        if (!mesaSnap.exists()) {
            alert("Mesa inexistente");
            return;
        }

        const mesaData = mesaSnap.data();

        // 🚫 Si la mesa está cerrada → se abre automáticamente
        if (mesaData.estado === "cerrada") {
            await updateDoc(mesaRef, {
                estado: "abierta",
                mozo,
                total: 0,
                productos: [],
                abiertaEn: serverTimestamp()
            });
        }

        // ================================
        // VALIDACIÓN BACKEND DE PRODUCTOS
        // ================================
        for (const p of productosAgregados) {
            const productoRef = doc(db, "productos", p.id);
            const productoSnap = await getDoc(productoRef);

            if (!productoSnap.exists()) {
                alert(`El producto "${p.nombre}" no existe`);
                desbloquearUI();
                return;
            }

            const productoData = productoSnap.data();

            // 🚫 Producto no disponible
            if (productoData.estado === "No disponible") {
                alert(`"${productoData.nombre}" no está disponible`);
                desbloquearUI();
                return;
            }

            // 🚫 Stock insuficiente COMENTADO PARA NO MOLESTAR CON STOCK 
            // if (productoData.stock < p.cantidad) {
            //     alert(`Stock insuficiente de "${productoData.nombre}"`);
            //     desbloquearUI();
            //     return;
            // }
        }


        // 🧾 Guardar comanda
        await addDoc(collection(db, "comandas"), {
            numero,
            mesa: mesaData.numero,
            mozo,
            productos: productosAgregados,
            total,
            estado: "pendiente",
            fecha: serverTimestamp()
        });

        // ➕ Sumar a la mesa
        await updateDoc(mesaRef, {
            productos: arrayUnion(...productosAgregados),
            total: (mesaData.total || 0) + total,
            ultimaActualizacion: serverTimestamp()
        });

        // 📦 Actualizar stock
        for (const p of productosAgregados) {
            const ref = doc(db, "productos", p.id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                await updateDoc(ref, {
                    stock: snap.data().stock - p.cantidad
                });
            }
        }

        await incrementarNumeroComanda(numero);

        // 🔄 Reset UI
        alert("Comanda guardada");
        formComanda.reset();
        productosAgregados = [];
        total = 0;
        totalSpan.textContent = 0;
        obtenerNumeroComandaActual();
        renderProductos();

    } catch (err) {
        console.error(err);
        alert("Error al guardar comanda");
    } finally {
        desbloquearUI();
    }
});


function calcularTotal(arr) {
    return arr.reduce((acc, item) => acc + item.subtotal, 0);
}




const modal = document.getElementById("modalProductos");

const productosGridComidas = document.getElementById("productosGridComidas");
const productosGridBebidas = document.getElementById("productosGridBebidas");
const productosGridPostres = document.getElementById("productosGridPostres");
const productosGridOtros = document.getElementById("productosGridOtros");

const btnAbrirModal = document.getElementById("btnAbrirModal");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnAgregarAlCarrito = document.getElementById("btnAgregarAlCarrito");

let productosSeleccionados = {}; // {id: {nombre, precio, cantidad}}

// Abrir modal
btnAbrirModal.addEventListener("click", async () => {
    modal.classList.remove("oculto");
    document.body.style.overflow = "hidden";
    await cargarProductosModal();
});

// Cerrar modal
btnCerrarModal.addEventListener("click", () => {
    modal.classList.add("oculto");
    document.body.style.overflow = "auto";
});


// Cargar productos en el modal
async function cargarProductosModal() {
    const querySnapshot = await getDocs(collection(db, "productos"));

    productosGridComidas.innerHTML = "<p style='border-bottom: 1px solid #ff3c00; padding-bottom: 0.5rem;'>🍔 Comidas</p>";
    productosGridBebidas.innerHTML = "<p style='border-bottom: 1px solid #ff3c00; padding-bottom: 0.5rem;'>🍹 Bebidas</p>";
    productosGridPostres.innerHTML = "<p style='border-bottom: 1px solid #ff3c00; padding-bottom: 0.5rem;'>🥞 Postres</p>";
    productosGridOtros.innerHTML = "<p style='border-bottom: 1px solid #ff3c00; padding-bottom: 0.5rem;'>🍱 Otros</p>";  
    
    querySnapshot.forEach(docu => {
        const data = docu.data();
        const card = document.createElement("div");
        const noDisponible = data.estado === "No disponible";
        card.classList.add("producto-card");

        card.classList.toggle("no-disponible", noDisponible);
        
        card.innerHTML = `
            <span style="
                ${noDisponible ? "text-decoration: line-through; color: #999;" : ""}
            ">
                ${data.nombre} ($${data.precio})
            </span>

            <div>
                <button 
                    class="menos" 
                    data-id="${docu.id}"
                    ${noDisponible ? "disabled" : ""}
                >-</button>

                <span id="cant-${docu.id}">0</span>

                <button 
                    class="mas" 
                    data-id="${docu.id}" 
                    data-nombre="${data.nombre}" 
                    data-precio="${data.precio}"
                    ${noDisponible ? "disabled" : ""}
                >+</button>
            </div>
        `;

        
        

        if (data.categoria == "bebidas") { productosGridBebidas.appendChild(card); }
        if (data.categoria == "comidas") { productosGridComidas.appendChild(card); }
        if (data.categoria == "postres") { productosGridPostres.appendChild(card); }
        if (data.categoria == "otros") { productosGridOtros.appendChild(card); }
    });

    // Eventos de botones + y -
    document.querySelectorAll(".mas").forEach(btn => {
        btn.addEventListener("click", () => {

            if (btn.disabled) return;

            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            const precio = parseInt(btn.dataset.precio);

            if (!productosSeleccionados[id]) {
                productosSeleccionados[id] = {nombre, precio, cantidad: 0};
            }

            productosSeleccionados[id].cantidad++;
            document.getElementById(`cant-${id}`).textContent = productosSeleccionados[id].cantidad;
        });
    });

    document.querySelectorAll(".menos").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;
            const id = btn.dataset.id;
            if (productosSeleccionados[id] && productosSeleccionados[id].cantidad > 0) {
                productosSeleccionados[id].cantidad--;
                document.getElementById(`cant-${id}`).textContent = productosSeleccionados[id].cantidad;
            }
        });
    });
}

// Agregar al carrito
btnAgregarAlCarrito.addEventListener("click", () => {
    for (let id in productosSeleccionados) {
        const p = productosSeleccionados[id];
        if (p.cantidad > 0) {
            productosAgregados.push({
                id,
                nombre: p.nombre,
                precio: p.precio,
                cantidad: p.cantidad,
                subtotal: p.precio * p.cantidad
            });
        }
    }

    total = calcularTotal(productosAgregados);
    totalSpan.textContent = total;
    renderProductos();

    // Limpiar selección y cerrar modal
    productosSeleccionados = {};
    modal.classList.add("oculto");
    document.querySelectorAll("#productosGrid span[id^='cant-']").forEach(span => span.textContent = 0);

    document.body.style.overflow = "auto";
});
