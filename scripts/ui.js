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

    // Theme (dark / light) handling
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    function isSystemDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function applyTheme(mode) {
        const sunPath = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z" />';
        const moonPath = '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />';
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
            if (themeIcon) themeIcon.innerHTML = moonPath;
            if (themeToggle) { themeToggle.setAttribute('aria-pressed', 'true'); themeToggle.setAttribute('aria-label','Switch to light theme'); }
        } else {
            document.documentElement.classList.remove('dark');
            if (themeIcon) themeIcon.innerHTML = sunPath;
            if (themeToggle) { themeToggle.setAttribute('aria-pressed', 'false'); themeToggle.setAttribute('aria-label','Switch to dark theme'); }
        }
    }

    // Initialize theme: localStorage -> system -> default light
    try {
        const stored = localStorage.getItem('theme');
        if (stored) {
            applyTheme(stored);
        } else if (isSystemDark()) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    } catch (e) {
        // localStorage may be unavailable in some contexts
        applyTheme(isSystemDark() ? 'dark' : 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            const next = isDark ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

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
