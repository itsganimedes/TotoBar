let hamburger = document.querySelector(".hamburger");
let actions = document.querySelector(".actions");

hamburger.addEventListener("click", () => {
    actions.classList.toggle("oculto_mobile");
    hamburger.classList.toggle("h_active");
})