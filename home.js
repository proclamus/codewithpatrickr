/* Home — comportamentos mínimos. Arquivo externo para a CSP manter script-src 'self'. */
(function () {
    'use strict';

    // Sombra no header ao rolar
    var topo = document.querySelector('.topo');
    var onScroll = function () { topo.classList.toggle('rolou', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Menu mobile (hambúrguer)
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('menu');
    if (btn && menu) {
        var fechar = function () {
            btn.setAttribute('aria-expanded', 'false');
            menu.classList.remove('aberto');
            document.body.classList.remove('sem-scroll');
        };
        btn.addEventListener('click', function () {
            var aberto = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!aberto));
            menu.classList.toggle('aberto', !aberto);
            document.body.classList.toggle('sem-scroll', !aberto);
        });
        menu.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
        window.matchMedia('(min-width: 861px)').addEventListener('change', fechar);
    }

    // Fade-in das seções ao entrar na tela
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visivel'); });
    }
})();
