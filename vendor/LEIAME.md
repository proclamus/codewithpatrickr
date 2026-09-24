# vendor/

Bibliotecas baixadas e versionadas no repositório de propósito.

**Por quê:** a CSP da home usa `script-src 'self'`, que bloqueia script de CDN.
Servindo do próprio domínio, a política continua fechada e nada precisa ser afrouxado.
Também remove dependência de terceiro em runtime — se o CDN cair, o site não cai.

| arquivo | versão | licença |
|---|---|---|
| gsap.min.js | 3.15.0 | GSAP Standard "no charge" — https://gsap.com/standard-license |
| ScrollTrigger.min.js | 3.15.0 | idem (plugins gratuitos desde a aquisição pela Webflow) |
| lenis.min.js | 1.3.26 | MIT — https://github.com/darkroomengineering/lenis |

Para atualizar, baixe a nova versão, rode a suíte de testes e suba o `?v=` em index.html.
