// 1. Controle do Menu Mobile
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
const menuIconOpen = document.getElementById("menu-icon-open");
const menuIconClose = document.getElementById("menu-icon-close");

mobileMenuButton.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
  menuIconOpen.classList.toggle("hidden");
  menuIconClose.classList.toggle("hidden");
});

// 2. Controle das Tabs de Conteúdos
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

const showContent = (target) => {
  // Oculta todos os conteúdos
  tabContents.forEach((content) => {
    content.classList.add("hidden");
  });
  // Remove o estilo ativo de todos os botões
  tabButtons.forEach((button) => {
    button.classList.remove(
      "active-tab-button",
      "border-primary-neon",
      "text-primary-neon"
    );
    button.classList.add("border-transparent", "text-secondary-gray");
  });

  // Mostra o conteúdo alvo
  const targetContent = document.querySelector(`[data-content="${target}"]`);
  if (targetContent) {
    targetContent.classList.remove("hidden");
  }

  // Ativa o botão correto
  const targetButton = document.querySelector(`[data-target="${target}"]`);
  if (targetButton) {
    targetButton.classList.add(
      "active-tab-button",
      "border-primary-neon",
      "text-primary-neon"
    );
    targetButton.classList.remove("border-transparent", "text-secondary-gray");
  }
};

// Event Listeners para os botões
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-target");
    showContent(target);

    // Rolagem suave para o topo da seção de conteúdo ao clicar no tab (opcional, para UX)
    document.getElementById("conteudos").scrollIntoView({ behavior: "smooth" });
  });
});

// Event Listeners para os links internos do menu desktop (para garantir o scroll suave e a abertura do tab)
const dropdownLinks = document.querySelectorAll("#conteudos-links-desktop a");
dropdownLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute("href").substring(1); // Ex: conteudos-java
    const targetId = sectionId.split("-")[1]; // Ex: java

    showContent(targetId);

    // Força o scroll suave para a seção principal de conteúdo
    document.getElementById("conteudos").scrollIntoView({ behavior: "smooth" });
  });
});

// Event Listeners para os links internos do menu mobile
const mobileLinks = document.querySelectorAll("#mobile-menu a");
mobileLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");

    // Se for um link de conteúdo específico (#conteudos-...), abre o tab correto
    if (href.startsWith("#conteudos-")) {
      const targetId = href.substring(11); // Ex: java, csharp
      showContent(targetId);
    }

    // Garante que o scroll aconteça após o fechamento do menu
    setTimeout(() => {
      document
        .querySelector(href.split("-")[0])
        .scrollIntoView({ behavior: "smooth" });
    }, 100);
  });
});

// Inicializa o primeiro tab (Java & Backend)
document.addEventListener("DOMContentLoaded", () => {
  showContent("java");
});
