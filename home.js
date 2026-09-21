/* Home — movimento e comportamentos. Arquivo externo para a CSP manter script-src 'self'.
   Regra: uma entrada orquestrada no hero; depois só revelação ao rolar e resposta a ação.
   Tudo respeita prefers-reduced-motion. */
(function () {
    'use strict';

    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raiz = document.documentElement;
    // Só com o JS rodando o CSS esconde o que vai ser revelado. Sem JS (ou com JS velho em cache), tudo aparece.
    if (!reduz) raiz.classList.add('js');

    /* ── 1. Entrada do hero: espera a fonte pra não "pular" ── */
    var entrar = function () { raiz.classList.add('entrou'); };
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(entrar);
        setTimeout(entrar, 1200); // fallback se a fonte demorar
    } else { entrar(); }

    /* ── 2. Topo: sombra ao rolar ── */
    var topo = document.querySelector('.topo');
    var onScroll = function () { topo.classList.toggle('rolou', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── 3. Menu mobile (hambúrguer) ── */
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

    /* ── 4. Revelação ao rolar (seções e grades escalonadas) ── */
    var alvos = document.querySelectorAll('.reveal, .escalona');
    if (reduz || !('IntersectionObserver' in window)) {
        alvos.forEach(function (el) { el.classList.add('visivel'); });
    } else {
        var io = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
        alvos.forEach(function (el) { io.observe(el); });
    }

    /* ── 5. Contadores dos dados (10%, 73 mi, 88%) ── */
    var nums = document.querySelectorAll('.dado-num[data-alvo]');
    var contar = function (el) {
        var alvo = parseFloat(el.getAttribute('data-alvo'));
        var sufixo = el.getAttribute('data-sufixo') || '';
        var dur = 1400, ini = null;
        var passo = function (t) {
            if (!ini) ini = t;
            var p = Math.min((t - ini) / dur, 1);
            var e = 1 - Math.pow(1 - p, 3);           // ease-out cúbico
            el.textContent = Math.round(alvo * e) + sufixo;
            if (p < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
    };
    if (nums.length) {
        if (reduz || !('IntersectionObserver' in window)) {
            nums.forEach(function (el) { el.textContent = el.getAttribute('data-alvo') + (el.getAttribute('data-sufixo') || ''); });
        } else {
            var ioNum = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (en) {
                    if (en.isIntersecting) { contar(en.target); ioNum.unobserve(en.target); }
                });
            }, { threshold: 0.5 });
            nums.forEach(function (el) { ioNum.observe(el); });
        }
    }

    /* ── 6. Barra fixa do celular: aparece depois que o hero sai da tela ── */
    var barra = document.querySelector('.barra-fixa');
    var hero = document.querySelector('.hero');
    if (barra && hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            barra.classList.toggle('mostra', !entradas[0].isIntersecting);
        }, { threshold: 0.15 }).observe(hero);
    } else if (barra) { barra.classList.add('mostra'); }

    /* ── 7. Celular do hero: paralaxe leve, só no desktop e sem reduced-motion ── */
    var fone = document.querySelector('.hero-mobile');
    if (fone && !reduz && window.matchMedia('(min-width: 861px)').matches) {
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var y = Math.min(window.scrollY, 600) * 0.06;
                fone.style.transform = 'translateY(calc(-50% + ' + y.toFixed(1) + 'px))';
                ticking = false;
            });
        }, { passive: true });
    }

})();
