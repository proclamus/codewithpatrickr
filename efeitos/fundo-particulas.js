/* fundo-particulas.js — constelação de partículas que se conectam e fogem do mouse.
 * Canvas 2D, sem biblioteca. Nível 2.
 *
 * <section class="hero" style="position:relative">
 *   <canvas class="fundo-canvas" data-particulas data-cor="#C4A35A" data-densidade="1" aria-hidden="true"></canvas>
 *   ...
 * </section>
 * <script src="fundos/fundo-particulas.js" defer></script>
 *
 * CSS do canvas: .fundo-canvas { position:absolute; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; }
 *
 * - Quantidade proporcional à área (máx. 90) e menor no celular.
 * - Pausa fora da tela e com a aba em segundo plano.
 * - prefers-reduced-motion: desenha um quadro parado.
 */
(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hexParaRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  function iniciar(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var rgb = hexParaRgb(canvas.getAttribute('data-cor') || '#ffffff');
    var densidade = parseFloat(canvas.getAttribute('data-densidade')) || 1;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var largura = 0, altura = 0, pontos = [], visivel = true, rodando = false;
    var mouse = { x: -9999, y: -9999 };
    var DIST = 130, RAIO_MOUSE = 140;

    function dimensionar() {
      var r = canvas.getBoundingClientRect();
      largura = r.width; altura = r.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var celular = largura < 700;
      var total = Math.min(Math.round((largura * altura) / (celular ? 18000 : 12000) * densidade), 90);
      pontos = [];
      for (var i = 0; i < total; i++) {
        pontos.push({
          x: Math.random() * largura, y: Math.random() * altura,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.6 + 0.8
        });
      }
    }

    function desenhar() {
      ctx.clearRect(0, 0, largura, altura);
      for (var i = 0; i < pontos.length; i++) {
        var p = pontos[i];
        if (!reduzido) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < RAIO_MOUSE && d > 0) { p.x += (dx / d) * 1.5; p.y += (dy / d) * 1.5; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > largura) p.vx *= -1;
          if (p.y < 0 || p.y > altura) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',0.8)';
        ctx.fill();
        for (var j = i + 1; j < pontos.length; j++) {
          var q = pontos[j], ex = p.x - q.x, ey = p.y - q.y, e = ex * ex + ey * ey;
          if (e < DIST * DIST) {
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.35 * (1 - Math.sqrt(e) / DIST)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
    }

    function quadro() {
      if (!visivel || document.hidden) { rodando = false; return; }
      desenhar();
      requestAnimationFrame(quadro);
    }
    function retomar() {
      if (reduzido || rodando || !visivel || document.hidden) return;
      rodando = true;
      requestAnimationFrame(quadro);
    }

    dimensionar();
    desenhar();
    if (reduzido) return;

    new ResizeObserver(function () { dimensionar(); desenhar(); }).observe(canvas);
    new IntersectionObserver(function (itens) { visivel = itens[0].isIntersecting; retomar(); }).observe(canvas);
    document.addEventListener('visibilitychange', retomar);
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    retomar();
  }

  function comecar() {
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-particulas]'), iniciar);
  }
  // Depois do conteúdo principal pintar: não disputa com o LCP
  if (document.readyState === 'complete') comecar();
  else window.addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(comecar); });
})();
