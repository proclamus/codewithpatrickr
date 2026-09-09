// Compartilhado por todas as páginas de projeto.
// Externo (e não inline) para permitir uma CSP com script-src 'self'.

// Revela as seções conforme entram na viewport
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Sombra no header ao rolar
const header = document.getElementById('header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10));

// Lightbox das capturas de tela
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
document.querySelectorAll('.shot img').forEach(img => {
    img.parentElement.addEventListener('click', () => {
        lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('open');
    });
});
function closeLb() { lb.classList.remove('open'); lbImg.src = ''; }
document.getElementById('lightbox-close').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
