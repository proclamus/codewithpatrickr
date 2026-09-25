/* Home — movimento e comportamentos. Arquivo externo para a CSP manter script-src 'self'.

   Três camadas, cada uma funcionando sozinha:
     1. sem JS nenhum  → a página aparece inteira, estática (o CSS só esconde sob .js)
     2. só este arquivo → entrada do hero por CSS, revelação por IntersectionObserver
     3. + GSAP e Lenis  → o hero vira linha do tempo e o scroll ganha inércia

   Se o GSAP ou o Lenis não carregarem, a camada 2 assume e nada quebra.
   Tudo desligado em prefers-reduced-motion. */
(function () {
    'use strict';

    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raiz = document.documentElement;
    // Só com o JS rodando o CSS esconde o que vai ser revelado. Sem JS (ou com JS velho em cache), tudo aparece.
    if (!reduz) raiz.classList.add('js');

    var temGsap = !reduz && typeof window.gsap !== 'undefined';
    var temLenis = !reduz && typeof window.Lenis !== 'undefined';
    if (temGsap) raiz.classList.add('gsap');

    /* ── 1. Scroll com inércia (Lenis) ──────────────────────────────
       Só a roda do mouse e o teclado passam pelo Lenis. O toque continua
       nativo, que no celular é mais rápido e não briga com o navegador. */
    var lenis = null;
    if (temLenis) {
        lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });

        if (temGsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            lenis.on('scroll', window.ScrollTrigger.update);
            window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
            window.gsap.ticker.lagSmoothing(0);
        } else {
            requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
        }

        // Âncoras do menu: quem rola agora é o Lenis, não o navegador
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var alvo = document.querySelector(a.getAttribute('href'));
            if (!alvo) return;
            e.preventDefault();
            var topoH = parseFloat(getComputedStyle(raiz).getPropertyValue('--topo-h')) || 68;
            // posicao absoluta em vez de passar o elemento: o offset do Lenis
            // entrava em dobro e a secao parava 84px baixo demais
            var y = alvo.getBoundingClientRect().top + window.scrollY - (topoH + 16);
            lenis.scrollTo(y);
        });
    }

    /* ── 2. Entrada do hero ───────────────────────────────────────── */
    var entrar = function () { raiz.classList.add('entrou'); };

    if (temGsap) {
        var gsap = window.gsap;
        // estado inicial no próprio GSAP, pra não depender da ordem de carga do CSS
        gsap.set('.hero .linha', { yPercent: 115 });
        gsap.set(['.hero-sub', '.hero-ctas', '.hero-nota'], { opacity: 0, y: 18 });
        gsap.set('.hero-visual', { opacity: 0, y: 26 });
        gsap.set('.hero mark', { backgroundSize: '0% 100%' });

        var abrir = function () {
            raiz.classList.add('entrou');
            gsap.timeline({ defaults: { ease: 'power3.out' } })
                .to('.hero .linha', { yPercent: 0, duration: 0.95, stagger: 0.075 })
                .to('.hero-visual', { opacity: 1, y: 0, duration: 1.1 }, 0.25)
                .to('.hero mark', { backgroundSize: '100% 100%', duration: 0.65, stagger: 0.1 }, 0.55)
                .to('.hero-sub', { opacity: 1, y: 0, duration: 0.6 }, 0.5)
                .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.6 }, 0.62)
                .to('.hero-nota', { opacity: 1, y: 0, duration: 0.6 }, 0.74);
        };
        // espera a fonte: com a métrica errada as linhas entram e depois pulam
        if (document.fonts && document.fonts.ready) {
            var jaAbriu = false;
            var abrirUmaVez = function () { if (!jaAbriu) { jaAbriu = true; abrir(); } };
            document.fonts.ready.then(abrirUmaVez);
            setTimeout(abrirUmaVez, 1200);
        } else { abrir(); }
    } else if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(entrar);
        setTimeout(entrar, 1200);
    } else { entrar(); }

    /* ── 3. Topo: sombra ao rolar ─────────────────────────────────── */
    var topo = document.querySelector('.topo');
    var onScroll = function () { topo.classList.toggle('rolou', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── 4. Menu mobile (hambúrguer) ──────────────────────────────── */
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('menu');
    if (btn && menu) {
        var fechar = function () {
            btn.setAttribute('aria-expanded', 'false');
            menu.classList.remove('aberto');
            document.body.classList.remove('sem-scroll');
            if (lenis) lenis.start();
        };
        btn.addEventListener('click', function () {
            var aberto = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!aberto));
            menu.classList.toggle('aberto', !aberto);
            document.body.classList.toggle('sem-scroll', !aberto);
            if (lenis) { if (aberto) lenis.start(); else lenis.stop(); }
        });
        menu.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
        window.matchMedia('(min-width: 861px)').addEventListener('change', fechar);
    }

    /* ── 5. Revelação ao rolar (seções e grades escalonadas) ──────── */
    var alvos = document.querySelectorAll('.reveal, .escalona');
    if (reduz || !('IntersectionObserver' in window)) {
        alvos.forEach(function (el) { el.classList.add('visivel'); el.classList.add('assentou'); });
    } else {
        var io = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) {
                if (en.isIntersecting) {
                    var el = en.target;
                    el.classList.add('visivel');
                    io.unobserve(el);
                    // entrada terminou: zera o atraso escalonado, senao ele
                    // continuaria atrasando o hover de cada cartão
                    setTimeout(function () { el.classList.add('assentou'); }, 1400);
                }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
        alvos.forEach(function (el) { io.observe(el); });
    }

    /* ── 6. Contadores dos dados (10%, 73 mi, 88%) ────────────────── */
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

    /* ── 7. Barra fixa do celular: aparece depois que o hero sai ──── */
    var barra = document.querySelector('.barra-fixa');
    var hero = document.querySelector('.hero');
    if (barra && hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            barra.classList.toggle('mostra', !entradas[0].isIntersecting);
        }, { threshold: 0.15 }).observe(hero);
    } else if (barra) { barra.classList.add('mostra'); }

    /* ── 8. Interação com o mouse e com o scroll ──────────────────
       Só com GSAP, só em ponteiro fino (mouse), nunca em reduced-motion.
       Quatro momentos escolhidos — não um efeito em cada elemento. */
    var ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (temGsap && !reduz && ponteiroFino) {
        var g = window.gsap;

        // 8a. O mockup do hero gira com o mouse e se expande ao chegar perto.
        //     O celular flutua num plano à frente (translateZ), então a rotação
        //     o separa do painel de verdade — não é sombra fingindo profundidade.
        var heroEl = document.querySelector('.hero');
        var palco = document.querySelector('.palco');
        var foneHero = document.querySelector('.hero-mobile');
        if (heroEl && palco && foneHero) {
            g.set(palco, { transformPerspective: 1100 });
            g.set(foneHero, { z: 45 });
            var girY = g.quickTo(palco, 'rotationY', { duration: 0.8, ease: 'power3' });
            var girX = g.quickTo(palco, 'rotationX', { duration: 0.8, ease: 'power3' });
            var desX = g.quickTo(palco, 'x', { duration: 0.9, ease: 'power3' });

            heroEl.addEventListener('mousemove', function (e) {
                var r = heroEl.getBoundingClientRect();
                var nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
                var ny = (e.clientY - r.top) / r.height - 0.5;
                girY(nx * 15); girX(ny * -11); desX(nx * -12);
            });
            heroEl.addEventListener('mouseleave', function () {
                girY(0); girX(0); desX(0);
            });

            // expandir: chegar perto do mockup aproxima o conjunto e afasta o celular
            var visual = document.querySelector('.hero-visual');
            visual.addEventListener('mouseenter', function () {
                g.to(palco, { scale: 1.035, duration: 0.6, ease: 'power3.out' });
                g.to(foneHero, { z: 110, duration: 0.7, ease: 'power3.out' });
            });
            visual.addEventListener('mouseleave', function () {
                g.to(palco, { scale: 1, duration: 0.6, ease: 'power3.out' });
                g.to(foneHero, { z: 45, duration: 0.7, ease: 'power3.out' });
            });
        }

        // 8b. Botão magnético: o CTA principal se inclina na direção do cursor.
        //     Com teto fixo em px — sem ele o botão andava 30px e cobria o link ao lado.
        var teto = function (v, max) { return Math.max(-max, Math.min(max, v)); };
        document.querySelectorAll('.btn-acao').forEach(function (b) {
            var bX = g.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
            var bY = g.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
            b.addEventListener('mousemove', function (e) {
                var r = b.getBoundingClientRect();
                bX(teto((e.clientX - (r.left + r.width / 2)) * 0.16, 9));
                bY(teto((e.clientY - (r.top + r.height / 2)) * 0.30, 5));
            });
            b.addEventListener('mouseleave', function () { bX(0); bY(0); });
        });

        // 8c. Sobre cada print, uma pílula "Ver o site" acompanha o cursor.
        var SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
        document.querySelectorAll('.case-img[data-rotulo]').forEach(function (img) {
            var pil = document.createElement('span');
            pil.className = 'case-cursor';
            pil.setAttribute('aria-hidden', 'true');
            pil.innerHTML = img.getAttribute('data-rotulo') + SETA;
            img.appendChild(pil);
            g.set(pil, { xPercent: -50, yPercent: -50, scale: 0.6 });
            var cX = g.quickTo(pil, 'x', { duration: 0.4, ease: 'power3' });
            var cY = g.quickTo(pil, 'y', { duration: 0.4, ease: 'power3' });
            img.addEventListener('mouseenter', function (e) {
                var r = img.getBoundingClientRect();
                g.set(pil, { x: e.clientX - r.left, y: e.clientY - r.top });
                g.to(pil, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' });
            });
            img.addEventListener('mousemove', function (e) {
                var r = img.getBoundingClientRect();
                cX(e.clientX - r.left); cY(e.clientY - r.top);
            });
            img.addEventListener('mouseleave', function () {
                g.to(pil, { opacity: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' });
            });
        });
    }

    // 8c-bis. Fio pontilhado ligando os passos, desenhado conforme a pessoa rola.
    //         Só no desktop, onde os cartões ficam em degrau e o fio faz sentido.
    if (temGsap && !reduz && window.ScrollTrigger && window.matchMedia('(min-width: 1024px)').matches) {
        var passos = document.querySelector('.passos');
        if (passos) {
            var NS = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'passos-fio');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('preserveAspectRatio', 'none');
            var linha = document.createElementNS(NS, 'polyline');
            svg.appendChild(linha);
            passos.insertBefore(svg, passos.firstChild);

            var redesenhar = function () {
                var base = passos.getBoundingClientRect();
                svg.setAttribute('viewBox', '0 0 ' + Math.round(base.width) + ' ' + Math.round(base.height));
                var pts = [];
                passos.querySelectorAll('li').forEach(function (li) {
                    var r = li.getBoundingClientRect();
                    pts.push(Math.round(r.left - base.left + r.width / 2) + ',' + Math.round(r.top - base.top + r.height / 2));
                });
                linha.setAttribute('points', pts.join(' '));
            };
            redesenhar();
            window.addEventListener('resize', redesenhar, { passive: true });

            // o fio se desenha da esquerda pra direita: clip em vez de dashoffset,
            // que estragaria o pontilhado
            window.gsap.fromTo(svg,
                { clipPath: 'inset(0 100% 0 0)' },
                { clipPath: 'inset(0 0% 0 0)', ease: 'none',
                  scrollTrigger: { trigger: passos, start: 'top 80%', end: 'bottom 70%', scrub: 0.5, onRefresh: redesenhar } });
        }
    }

    // 8d. O aviso honesto acende palavra por palavra, preso ao scroll.
    //     É o texto que mais constrói confiança — merece ser lido devagar.
    if (temGsap && !reduz && window.ScrollTrigger) {
        var aviso = document.querySelector('.dados-aviso');
        if (aviso) {
            var textos = [], w = document.createTreeWalker(aviso, NodeFilter.SHOW_TEXT), no;
            while ((no = w.nextNode())) textos.push(no);
            var palavras = [];
            textos.forEach(function (node) {
                var frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach(function (parte) {
                    if (!parte) return;
                    if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
                    var sp = document.createElement('span');
                    sp.className = 'pal'; sp.textContent = parte;
                    frag.appendChild(sp); palavras.push(sp);
                });
                node.parentNode.replaceChild(frag, node);
            });
            if (palavras.length) {
                window.gsap.fromTo(palavras, { opacity: 0.22 }, {
                    opacity: 1, ease: 'none', stagger: 0.6,
                    scrollTrigger: { trigger: aviso, start: 'top 85%', end: 'bottom 65%', scrub: 0.4 }
                });
            }
        }
    }

    /* ── 8e. No celular não existe mouse: quem move o mockup é o scroll ──
       A mesma inclinação 3D do desktop, só que dirigida pela rolagem, mais
       um balanço lento no celular da Delka pra puxar o olho no hero. */
    if (temGsap && !reduz && window.ScrollTrigger && window.matchMedia('(max-width: 860px)').matches) {
        var gm = window.gsap;
        var palcoCel = document.querySelector('.palco');
        var foneCel = document.querySelector('.hero-mobile');
        if (palcoCel) {
            gm.to(palcoCel, {
                rotationY: -11, rotationX: 7, scale: 1.04, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
            });
        }
        if (foneCel) {
            gm.to(foneCel, { y: 12, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        }
    }

    /* ── 9. Celular do hero: paralaxe amarrada ao scroll ──────────── */
    var fone = document.querySelector('.hero-mobile');
    var desktop = window.matchMedia('(min-width: 861px)').matches;
    if (fone && !reduz && desktop) {
        if (temGsap && window.ScrollTrigger) {
            window.gsap.to(fone, {
                y: 56, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
            });
        } else {
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
    }

})();
