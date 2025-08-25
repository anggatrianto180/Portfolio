document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi VanillaTilt (pastikan library sudah dimuat di HTML)
    if (window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll(".project-card"), {
            max: 15, speed: 400, glare: true, "max-glare": 0.5,
        });
    }

    // Menu mobile
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Tahun di footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Efek mengetik (typewriter)
    const typewriterElement = document.getElementById('typewriter');
    const textToType = "Angga Trianto";
    if (typewriterElement) {
        let index = 0;
        function type() {
            if (index < textToType.length) {
                typewriterElement.textContent += textToType.charAt(index);
                index++;
                setTimeout(type, 150);
            }
        }
        type();
    }

    // Animasi & nav active saat scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    if (sections.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href').substring(1) === entry.target.id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: [0.1, 0.6] });
        sections.forEach(section => observer.observe(section));
    }
});
