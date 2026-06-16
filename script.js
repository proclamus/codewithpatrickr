(function () {
    'use strict';

    const header  = document.getElementById('header');
    const hamburger = document.getElementById('hamburger');
    const drawer    = document.getElementById('nav-drawer');
    const overlay   = document.getElementById('nav-overlay');
    const drawerClose = document.getElementById('drawer-close');

    // ── Header scroll shadow ──────────────────────────────────────
    window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // ── Mobile drawer ─────────────────────────────────────────────
    function openDrawer() {
        drawer.classList.add('active');
        overlay.classList.add('active');
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
        drawer.classList.contains('active') ? closeDrawer() : openDrawer();
    });
    overlay.addEventListener('click', closeDrawer);
    drawerClose.addEventListener('click', closeDrawer);
    document.querySelectorAll('.drawer-link').forEach(function (link) {
        link.addEventListener('click', closeDrawer);
    });

    // ── Tab system ────────────────────────────────────────────────
    var tabBtns   = document.querySelectorAll('.tab-btn');
    var tabPanels = document.querySelectorAll('.tab-panel');

    function activateTab(target) {
        tabBtns.forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.target === target);
        });
        tabPanels.forEach(function (panel) {
            panel.classList.toggle('active', panel.dataset.content === target);
        });
    }

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            activateTab(btn.dataset.target);
        });
    });

    // ── Scroll reveal ─────────────────────────────────────────────
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
        revealObserver.observe(el);
    });

    // ── Smooth scroll with header offset ─────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            var offset = header.offsetHeight;
            var top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    });

    // ── Active nav link highlight on scroll ───────────────────────
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        var scrollY = window.scrollY + header.offsetHeight + 50;
        sections.forEach(function (section) {
            var top    = section.offsetTop;
            var bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                var id = section.getAttribute('id');
                navLinks.forEach(function (link) {
                    link.classList.toggle('active-nav', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

})();
