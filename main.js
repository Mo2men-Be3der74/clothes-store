const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const navbar = document.getElementById("navbar");


hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("open");

    const icon = hamburger.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-times");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
    navMenu.classList.remove("open");

    const icon = hamburger.querySelector("i");
    icon.classList.add("fa-bars");
    icon.classList.remove("fa-times");
});
});