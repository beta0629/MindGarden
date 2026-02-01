document.addEventListener('DOMContentLoaded', () => {

    // Reveal on Scroll Initialization
    const revealElements = document.querySelectorAll('.reveal-item');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Unobserve after revealing if you want it to happen only once
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled-nav');
        } else {
            navbar.classList.remove('scrolled-nav');
        }
    });

    // Mobile Menu Toggle (Simple)
    const menuBtn = document.getElementById('menu-btn');
    // Actual menu implementation would go here (e.g. toggling a hidden div)
    // For this landing page demo, we'll just log or alert
    menuBtn.addEventListener('click', () => {
        console.log("Menu clicked - To be implemented for mobile overlay");
    });
});
