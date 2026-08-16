const megaParent = document.querySelector(".mega-parent");
const megaMenu = document.querySelector(".mega-menu");

let timeout;

megaParent.addEventListener("mouseenter", () => {
    clearTimeout(timeout);
    megaMenu.classList.add("show");
    megaParent.classList.add("active");
});

megaParent.addEventListener("mouseleave", () => {
    timeout = setTimeout(() => {
        megaMenu.classList.remove("show");
        megaParent.classList.remove("active");
    }, 200);
});

// Scroll-based Navbar Interaction
const navbar = document.getElementById("navbar") || document.querySelector(".navbar");

if (navbar) {
    const handleScroll = () => {
        if (window.scrollY > 70) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
}




