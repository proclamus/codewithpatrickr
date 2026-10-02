/* fundo-shader.js — fundo líquido em WebGL (ruído fractal) com as cores da marca, reagindo ao mouse.
 * WebGL puro, sem biblioteca (~4 KB). Nível 3.
 *
 * <section class="hero" style="position:relative; background:linear-gradient(135deg,#0F172A,#6366F1)">
 *   <canvas class="fundo-canvas" data-shader
 *           data-cores="#0F172A,#6366F1,#22D3EE"   (escura, média, destaque)
 *           data-velocidade="1" data-intensidade="2" aria-hidden="true"></canvas>
 *   ...
 * </section>
 * <script src="fundos/fundo-shader.js" defer></script>
 *
 * CSS: .fundo-canvas { position:absolute; inset:0; width:100%; height:100%; z-index:0; pointer-events:none;
 *                      opacity:0; transition:opacity 1.2s; }
 *      .fundo-canvas.pronto { opacity:1; }
 *
 * Performance:
 * - O gradiente CSS da seção é o "fallback" e o que aparece primeiro (LCP rápido); o canvas
 *   só começa depois do load e entra com fade.
 * - Renderiza em resolução reduzida (data-resolucao, padrão 0.6; 0.45 no celular) — o efeito é
 *   difuso, ninguém percebe, e a GPU agradece.
 * - Pausa fora da tela / aba oculta. prefers-reduced-motion: um quadro parado.
 * - Sem WebGL: fica só o gradiente CSS.
 */
(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform float u_tempo;',
    'uniform vec2 u_mouse;',
    'uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;',
    'uniform float u_intensidade;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float ruido(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * ruido(p); p *= 2.0; a *= 0.5; }',
    '  return v;',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  float aspecto = u_res.x / u_res.y;',
    '  vec2 p = vec2(uv.x * aspecto, uv.y) * 1.6;',
    '  vec2 m = vec2(u_mouse.x * aspecto, u_mouse.y) * 1.6;',
    '  float t = u_tempo * 0.06;',
    '  float perto = exp(-distance(p, m) * 1.8);',
    '  vec2 q = vec2(fbm(p + t), fbm(p - t + 4.0));',
    '  vec2 r = vec2(fbm(p + q * u_intensidade + vec2(1.7, 9.2) + t * 1.5),',
    '                fbm(p + q * u_intensidade + vec2(8.3, 2.8) - t));',
    '  float f = fbm(p + r * u_intensidade + (m - p) * 0.35 * perto);',
    '  vec3 cor = mix(u_c1, u_c2, smoothstep(0.15, 0.85, f));',
    '  cor = mix(cor, u_c3, smoothstep(0.55, 1.0, length(r) * f + perto * 0.25));',
    '  cor += (hash(gl_FragCoord.xy + u_tempo) - 0.5) * 0.025;', // granulado: evita "faixas" no degradê
    '  gl_FragColor = vec4(cor, 1.0);',
    '}'
  ].join('\n');

  function hexParaVec(hex) {
    var h = hex.trim().replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function compilar(gl, tipo, fonte) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function iniciar(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return; // sem WebGL: fica o gradiente CSS

    var prog = gl.createProgram();
    try {
      gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.error('[fundo-shader] falha ao compilar:', e);
      return;
    }
    gl.useProgram(prog);

    // Triângulo que cobre a tela inteira
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var u = {};
    ['u_res', 'u_tempo', 'u_mouse', 'u_c1', 'u_c2', 'u_c3', 'u_intensidade'].forEach(function (n) {
      u[n] = gl.getUniformLocation(prog, n);
    });

    var cores = (canvas.getAttribute('data-cores') || '#0F172A,#6366F1,#22D3EE').split(',');
    gl.uniform3fv(u.u_c1, hexParaVec(cores[0]));
    gl.uniform3fv(u.u_c2, hexParaVec(cores[1] || cores[0]));
    gl.uniform3fv(u.u_c3, hexParaVec(cores[2] || cores[1] || cores[0]));
    gl.uniform1f(u.u_intensidade, parseFloat(canvas.getAttribute('data-intensidade')) || 2);

    var velocidade = parseFloat(canvas.getAttribute('data-velocidade')) || 1;
    var escalaPadrao = window.innerWidth < 700 ? 0.45 : 0.6;
    var escala = parseFloat(canvas.getAttribute('data-resolucao')) || escalaPadrao;
    var mouse = { x: 0.5, y: 0.5 }, alvo = { x: 0.5, y: 0.5 };
    var visivel = true, rodando = false, tempo = Math.random() * 100, ultimo = 0;

    function dimensionar() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr * escala));
      canvas.height = Math.max(1, Math.round(r.height * dpr * escala));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.u_res, canvas.width, canvas.height);
    }

    function desenhar() {
      gl.uniform1f(u.u_tempo, tempo);
      gl.uniform2f(u.u_mouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function quadro(agora) {
      if (!visivel || document.hidden) { rodando = false; return; }
      var dt = ultimo ? Math.min((agora - ultimo) / 1000, 0.1) : 0;
      ultimo = agora;
      tempo += dt * velocidade;
      mouse.x += (alvo.x - mouse.x) * 0.05; // segue o mouse com atraso suave
      mouse.y += (alvo.y - mouse.y) * 0.05;
      desenhar();
      requestAnimationFrame(quadro);
    }
    function retomar() {
      if (reduzido || rodando || !visivel || document.hidden) return;
      rodando = true; ultimo = 0;
      requestAnimationFrame(quadro);
    }

    dimensionar();
    desenhar();
    canvas.classList.add('pronto');
    if (reduzido) return;

    new ResizeObserver(function () { dimensionar(); desenhar(); }).observe(canvas);
    new IntersectionObserver(function (itens) { visivel = itens[0].isIntersecting; retomar(); }).observe(canvas);
    document.addEventListener('visibilitychange', retomar);
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      alvo.x = (e.clientX - r.left) / r.width;
      alvo.y = 1 - (e.clientY - r.top) / r.height; // WebGL conta o y de baixo para cima
    }, { passive: true });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visivel = false; canvas.classList.remove('pronto'); });
    retomar();
  }

  function comecar() {
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-shader]'), iniciar);
  }
  if (document.readyState === 'complete') comecar();
  else window.addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(comecar); });
})();
