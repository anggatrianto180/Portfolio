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
            const isOpen = mobileMenu.classList.toggle('open');
            // update accessibility attributes
            mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            mobileMenuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Close mobile menu when a nav link is clicked
        mobileMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Tahun di footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Populate contact email dynamically and add copy button behavior
    const contactEmailLink = document.getElementById('contact-email-link');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    const EMAIL = 'triantoangga180@gmail.com';
    if (contactEmailLink) {
        contactEmailLink.textContent = EMAIL;
        contactEmailLink.setAttribute('href', 'mailto:' + EMAIL);
    }
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(EMAIL);
                if (copyFeedback) {
                    copyFeedback.classList.remove('hidden');
                    setTimeout(() => copyFeedback.classList.add('hidden'), 1800);
                }
            } catch (e) {
                // fallback: select and prompt
                const ta = document.createElement('textarea');
                ta.value = EMAIL;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); if (copyFeedback) { copyFeedback.classList.remove('hidden'); setTimeout(() => copyFeedback.classList.add('hidden'), 1800); } } catch (err) {}
                document.body.removeChild(ta);
            }
        });
    }

    // Extract certificate lines from Resume.pdf and inject into Work Experience
    async function addCertificatesFromResume() {
        if (!window.pdfjsLib) return;
        try {
            const url = '/Resume.pdf';
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(it => it.str).join(' ');
                fullText += '\n' + pageText;
            }

            // Find lines that look like certifications (contains cert/certificate/certified/sertifikat)
            const lines = fullText.split(/\r?\n|\.|;|\u2022/).map(s => s.trim()).filter(Boolean);
            const certCandidates = [];
            const regex = /certif|certificat|certified|sertifikat|istqb|aws certified|oracle certified|microsoft certified/i;
            for (const ln of lines) {
                if (regex.test(ln) && ln.length > 5 && ln.length < 180) {
                    // clean up redundant whitespace
                    const clean = ln.replace(/\s+/g, ' ').trim();
                    if (!certCandidates.includes(clean)) certCandidates.push(clean);
                }
            }

            const workSection = document.getElementById('pengalaman');
            if (!workSection) return;

            const container = document.createElement('div');
            container.className = 'max-w-3xl mx-auto mt-8';
            if (certCandidates.length) {
                const html = ['<div class="bg-white dark:bg-[#0f1724] p-6 rounded-xl shadow-lg">', '<h3 class="text-xl font-bold mb-3">Certifications</h3>', '<ul class="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">'];
                certCandidates.forEach(c => { html.push('<li>' + c + '</li>'); });
                html.push('</ul></div>');
                container.innerHTML = html.join('\n');
            } else {
                container.innerHTML = '<div class="bg-white dark:bg-[#0f1724] p-4 rounded-xl shadow-sm text-slate-600 dark:text-slate-400">No certifications found in Resume.pdf (or they are formatted differently). You can add them manually.</div>';
            }
            // Insert after the header inside workSection
            workSection.appendChild(container);
        } catch (e) {
            // silently fail
            console.warn('Certificate extraction failed', e);
        }
    }

    // Try to add certificates (non-blocking)
    addCertificatesFromResume();

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
