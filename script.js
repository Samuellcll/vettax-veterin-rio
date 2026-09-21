const botaoMenu = document.querySelector(".menu-botao");
const menu = document.querySelector(".menu");
const modal = document.querySelector("#modal-analise");
const botaoFechar = document.querySelector("#modal-fechar");
const botaoAnalisar = document.querySelector("#modal-analisar");
const campoTelefone = document.querySelector('input[name="telefone"]');
const formulario = document.querySelector(".formulario");
const avisoFormulario = document.querySelector(".formulario-aviso");

function fecharMenu() {
  botaoMenu.classList.remove("ativo");
  menu.classList.remove("aberto");
  document.body.classList.remove("menu-aberto");
  botaoMenu.setAttribute("aria-expanded", "false");
}

botaoMenu.addEventListener("click", () => {
  const menuAberto = menu.classList.toggle("aberto");
  botaoMenu.classList.toggle("ativo", menuAberto);
  document.body.classList.toggle("menu-aberto", menuAberto);
  botaoMenu.setAttribute("aria-expanded", String(menuAberto));
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", fecharMenu);
});

document.querySelectorAll(".acordeao-item button").forEach((botao) => {
  botao.addEventListener("click", () => {
    const itemAtual = botao.closest(".acordeao-item");
    const estavaAberto = itemAtual.classList.contains("aberto");

    document.querySelectorAll(".acordeao-item").forEach((item) => {
      item.classList.remove("aberto");
      item.querySelector("button").setAttribute("aria-expanded", "false");
      item.querySelector("button b").textContent = "+";
    });

    if (!estavaAberto) {
      itemAtual.classList.add("aberto");
      botao.setAttribute("aria-expanded", "true");
      botao.querySelector("b").textContent = "−";
    }
  });
});

campoTelefone.addEventListener("input", (evento) => {
  const numeros = evento.target.value.replace(/\D/g, "").slice(0, 11);
  let telefone = numeros;

  if (numeros.length > 2) {
    telefone = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length > 7) {
    telefone = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  evento.target.value = telefone;
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }

  avisoFormulario.textContent = "Mensagem enviada! Em breve, um especialista entrará em contato.";
  avisoFormulario.classList.add("visivel");
  formulario.reset();
});

// Nesta visita o modal só pode aparecer uma vez.
// Qualquer tentativa posterior (timer, scroll ou outro evento) é ignorada.
let modalJaApareceu = false;
const temporizadorModal = setTimeout(abrirModal, 5000);

function abrirModal() {
  if (modalJaApareceu) {
    return;
  }

  modalJaApareceu = true;
  modal.classList.add("aberto");
  document.body.classList.add("sem-rolagem");
  botaoFechar.focus();
}

function concluirFechamentoModal() {
  if (!modal.classList.contains("fechando")) {
    return;
  }

  modal.classList.remove("aberto", "fechando");
  document.body.classList.remove("sem-rolagem");
}

function fecharModal() {
  if (!modal.classList.contains("aberto") || modal.classList.contains("fechando")) {
    return;
  }

  // Depois de fechar, a visita já usou a única exibição permitida.
  // O timer é cancelado para nenhum novo disparo (tempo ou scroll) reabrir o modal.
  modalJaApareceu = true;
  clearTimeout(temporizadorModal);
  modal.classList.add("fechando");

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduzirMovimento) {
    concluirFechamentoModal();
    return;
  }

  const aoTerminarSaida = (evento) => {
    if (evento.target !== modal) {
      return;
    }

    modal.removeEventListener("animationend", aoTerminarSaida);
    concluirFechamentoModal();
  };

  modal.addEventListener("animationend", aoTerminarSaida);
  window.setTimeout(concluirFechamentoModal, 360);
}

botaoFechar.addEventListener("click", fecharModal);
botaoAnalisar.addEventListener("click", fecharModal);

modal.addEventListener("click", (evento) => {
  if (evento.target === modal) {
    fecharModal();
  }
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharModal();
    fecharMenu();
    // Escape também recolhe o player flutuante, se estiver aberto.
    fecharVideoFlutuante();
  }
});

/* -------------------------------------------------------
   Vídeo flutuante (canto inferior direito)
   Fluxo:
   1) Começa como bolinha circular com prévia muda e em loop.
   2) Clique na bolinha → expande para player vertical.
   3) No modo expandido: pausar/reproduzir e fechar.
   4) O áudio nunca inicia sozinho (sempre muted no começo).
------------------------------------------------------- */

const videoFlutuante = document.querySelector("#video-flutuante");
const videoBotaoAbrir = document.querySelector(".video-flutuante-abrir");
const videoBotaoFechar = document.querySelector(".video-flutuante-fechar");
const videoBotaoPlay = document.querySelector(".video-flutuante-play");
const videoBotaoSom = document.querySelector(".video-flutuante-som");
const videoMidia = document.querySelector(".video-flutuante-midia");
const iconePlay = videoBotaoPlay.querySelector(".icone-play");
const iconePause = videoBotaoPlay.querySelector(".icone-pause");
const iconeMudo = videoBotaoSom.querySelector(".icone-mudo");
const iconeAlto = videoBotaoSom.querySelector(".icone-alto");

// Atualiza os ícones do botão de play/pause conforme o estado do vídeo.
function atualizarIconesVideo() {
  const estaPausado = videoMidia.paused;
  iconePlay.hidden = !estaPausado;
  iconePause.hidden = estaPausado;
  videoBotaoPlay.setAttribute(
    "aria-label",
    estaPausado ? "Reproduzir vídeo" : "Pausar vídeo"
  );
}

/* -------------------------------------------------------
   INÍCIO — botão de som (🔇 / 🔊)
   O vídeo sempre começa mudo. Só no player expandido o
   usuário pode ligar o áudio. Ao recolher, volta a mudo.
------------------------------------------------------- */

// Sincroniza o ícone 🔇/🔊 e o aria-label com videoMidia.muted.
function atualizarIconeSomVideo() {
  const estaMudo = videoMidia.muted;
  iconeMudo.hidden = !estaMudo;
  iconeAlto.hidden = estaMudo;
  videoBotaoSom.setAttribute(
    "aria-label",
    estaMudo ? "Ativar som" : "Desativar som"
  );
}

// Liga ou desliga o áudio só enquanto o player está expandido.
function alternarSomVideo() {
  videoMidia.muted = !videoMidia.muted;
  atualizarIconeSomVideo();
}

/* -------------------------------------------------------
   FIM — botão de som (🔇 / 🔊)
------------------------------------------------------- */

// Expande a bolinha para o player vertical e mostra os controles.
function abrirVideoFlutuante() {
  videoFlutuante.classList.add("aberto");
  videoBotaoAbrir.setAttribute("aria-expanded", "true");
  videoBotaoFechar.hidden = false;
  videoBotaoPlay.hidden = false;
  videoBotaoSom.hidden = false;

  // Mantém mudo ao expandir: o som não inicia automaticamente.
  videoMidia.muted = true;
  videoMidia.play().catch(() => {
    // Alguns navegadores bloqueiam autoplay; o usuário ainda pode tocar no play.
  });
  atualizarIconesVideo();
  atualizarIconeSomVideo();

  // Cancela snap pendente e reaplica a âncora: o crescimento fica para dentro da tela.
  snapPendenteVideo = false;
  videoFlutuante.removeEventListener("transitionend", aoTerminarSnapVideo);
  requestAnimationFrame(() => aplicarAncoraCanto(cantoAtualVideo));
}

// Recolhe o player de volta para a bolinha, sem alterar o restante do site.
function fecharVideoFlutuante() {
  if (!videoFlutuante.classList.contains("aberto")) {
    return;
  }

  videoFlutuante.classList.remove("aberto");
  videoBotaoAbrir.setAttribute("aria-expanded", "false");
  videoBotaoFechar.hidden = true;
  videoBotaoPlay.hidden = true;
  videoBotaoSom.hidden = true;

  // Na bolinha, a prévia continua muda e em loop.
  videoMidia.muted = true;
  videoMidia.play().catch(() => {});
  atualizarIconesVideo();
  atualizarIconeSomVideo();

  // Cancela snap pendente e reaplica a âncora do canto atual.
  snapPendenteVideo = false;
  videoFlutuante.removeEventListener("transitionend", aoTerminarSnapVideo);
  requestAnimationFrame(() => aplicarAncoraCanto(cantoAtualVideo));
}

// Alterna entre pausar e reproduzir no modo expandido.
function alternarPlayPauseVideo() {
  if (videoMidia.paused) {
    videoMidia.play().catch(() => {});
  } else {
    videoMidia.pause();
  }
  atualizarIconesVideo();
}

// Prévia inicial: bolinha circular, sem som e em loop.
videoMidia.muted = true;
videoMidia.defaultMuted = true;
videoMidia.loop = true;
videoMidia.playsInline = true;
videoMidia.setAttribute("playsinline", "");
videoMidia.setAttribute("webkit-playsinline", "");

// Garante o carregamento do arquivo e tenta iniciar a prévia assim que houver dados.
function iniciarPreviaVideo() {
  videoMidia.muted = true;
  videoMidia.play().catch(() => {
    // Se o navegador bloquear a prévia, a bolinha ainda abre o player ao clicar.
  });
}

if (videoMidia.readyState >= 2) {
  iniciarPreviaVideo();
} else {
  videoMidia.addEventListener("loadeddata", iniciarPreviaVideo, { once: true });
  videoMidia.load();
}
// Clique na bolinha: só abre se ainda estiver recolhida.
// Depois de um arrasto real (> 6px), o click residual é ignorado.
videoBotaoAbrir.addEventListener("click", (evento) => {
  if (arrastoRecenteVideo) {
    evento.preventDefault();
    evento.stopPropagation();
    return;
  }

  if (!videoFlutuante.classList.contains("aberto")) {
    abrirVideoFlutuante();
  }
});

videoBotaoFechar.addEventListener("click", fecharVideoFlutuante);
videoBotaoPlay.addEventListener("click", alternarPlayPauseVideo);
videoBotaoSom.addEventListener("click", alternarSomVideo);

// Mantém o ícone sincronizado se o vídeo pausar/reproduzir por outros motivos.
videoMidia.addEventListener("play", atualizarIconesVideo);
videoMidia.addEventListener("pause", atualizarIconesVideo);

/* =======================================================
   INÍCIO — lógica de arrastar (#video-flutuante)
   Mouse e toque via Pointer Events.
   Mantém o widget dentro da área visível da tela.

   Clique vs arrasto:
   - movimento ≤ 6px → clique/toque → abre o vídeo
   - movimento > 6px → arrasto livre (left/top) → não abre
   - ao soltar → snap to corner + âncora do canto
   - após o arrasto, o próximo clique volta a funcionar

   Âncoras (para expandir/recolher crescer para dentro):
   - superior esquerdo → left + top
   - superior direito  → right + top
   - inferior esquerdo → left + bottom
   - inferior direito  → right + bottom
   ======================================================= */

let arrastandoVideo = false;
let arrastoRecenteVideo = false;
let pontoInicialX = 0;
let pontoInicialY = 0;
let origemLeft = 0;
let origemTop = 0;
let snapPendenteVideo = false;
const LIMITE_ARRASTO_PX = 6; // abaixo disso, conta como clique (não como arrasto)
const MARGEM_CANTO = 16; // margem ao encaixar nos cantos da viewport

// Canto inicial = posição padrão do CSS (inferior direito).
let cantoAtualVideo = "inferior-direito";

const ANCORAS_CANTO = {
  "superior-esquerdo": { horizontal: "left", vertical: "top" },
  "superior-direito": { horizontal: "right", vertical: "top" },
  "inferior-esquerdo": { horizontal: "left", vertical: "bottom" },
  "inferior-direito": { horizontal: "right", vertical: "bottom" },
};

// Durante o drag, trabalha só com left/top (posição absoluta livre).
function prepararPosicaoArraste() {
  const retangulo = videoFlutuante.getBoundingClientRect();
  videoFlutuante.style.left = `${retangulo.left}px`;
  videoFlutuante.style.top = `${retangulo.top}px`;
  videoFlutuante.style.right = "auto";
  videoFlutuante.style.bottom = "auto";
}

// Posições left/top dos 4 cantos para o tamanho atual do widget.
function obterCantosVideo() {
  const retangulo = videoFlutuante.getBoundingClientRect();
  const maxLeft = Math.max(
    MARGEM_CANTO,
    window.innerWidth - retangulo.width - MARGEM_CANTO
  );
  const maxTop = Math.max(
    MARGEM_CANTO,
    window.innerHeight - retangulo.height - MARGEM_CANTO
  );

  return [
    { id: "superior-esquerdo", left: MARGEM_CANTO, top: MARGEM_CANTO },
    { id: "superior-direito", left: maxLeft, top: MARGEM_CANTO },
    { id: "inferior-esquerdo", left: MARGEM_CANTO, top: maxTop },
    { id: "inferior-direito", left: maxLeft, top: maxTop },
  ];
}

// Impede o widget de sair da viewport durante o arrasto livre.
function limitarPosicaoVideo() {
  const retangulo = videoFlutuante.getBoundingClientRect();
  const maxLeft = window.innerWidth - retangulo.width - MARGEM_CANTO;
  const maxTop = window.innerHeight - retangulo.height - MARGEM_CANTO;

  const left = Math.min(
    Math.max(MARGEM_CANTO, parseFloat(videoFlutuante.style.left)),
    Math.max(MARGEM_CANTO, maxLeft)
  );
  const top = Math.min(
    Math.max(MARGEM_CANTO, parseFloat(videoFlutuante.style.top)),
    Math.max(MARGEM_CANTO, maxTop)
  );

  videoFlutuante.style.left = `${left}px`;
  videoFlutuante.style.top = `${top}px`;
}

// Fixa o canto com a âncora correta (right/left + top/bottom).
// Assim, ao mudar width/height, o widget cresce para dentro da tela.
function aplicarAncoraCanto(canto) {
  const ancora = ANCORAS_CANTO[canto];
  if (!ancora) {
    return;
  }

  cantoAtualVideo = canto;
  snapPendenteVideo = false;

  if (ancora.horizontal === "left") {
    videoFlutuante.style.left = `${MARGEM_CANTO}px`;
    videoFlutuante.style.right = "auto";
  } else {
    videoFlutuante.style.right = `${MARGEM_CANTO}px`;
    videoFlutuante.style.left = "auto";
  }

  if (ancora.vertical === "top") {
    videoFlutuante.style.top = `${MARGEM_CANTO}px`;
    videoFlutuante.style.bottom = "auto";
  } else {
    videoFlutuante.style.bottom = `${MARGEM_CANTO}px`;
    videoFlutuante.style.top = "auto";
  }
}

// Depois da animação left/top do snap, troca para a âncora do canto.
function aoTerminarSnapVideo(evento) {
  if (evento.target !== videoFlutuante) {
    return;
  }

  if (evento.propertyName !== "left" && evento.propertyName !== "top") {
    return;
  }

  if (!snapPendenteVideo) {
    return;
  }

  videoFlutuante.removeEventListener("transitionend", aoTerminarSnapVideo);
  aplicarAncoraCanto(cantoAtualVideo);
}

// Escolhe o canto mais próximo e encaixa com âncora correta.
function encaixarNoCantoMaisProximo() {
  const retangulo = videoFlutuante.getBoundingClientRect();
  const centroX = retangulo.left + retangulo.width / 2;
  const centroY = retangulo.top + retangulo.height / 2;

  let melhorCanto = obterCantosVideo()[0];
  let menorDistancia = Infinity;

  obterCantosVideo().forEach((canto) => {
    const cantoCentroX = canto.left + retangulo.width / 2;
    const cantoCentroY = canto.top + retangulo.height / 2;
    const distancia =
      (centroX - cantoCentroX) ** 2 + (centroY - cantoCentroY) ** 2;

    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhorCanto = canto;
    }
  });

  cantoAtualVideo = melhorCanto.id;

  const jaNoLugar =
    Math.abs(retangulo.left - melhorCanto.left) < 1 &&
    Math.abs(retangulo.top - melhorCanto.top) < 1;

  // Se já está no canto, aplica a âncora na hora (sem animar left/top).
  if (jaNoLugar) {
    aplicarAncoraCanto(cantoAtualVideo);
    return;
  }

  // 1) Anima até o canto ainda em left/top (movimento suave do snap).
  videoFlutuante.style.left = `${melhorCanto.left}px`;
  videoFlutuante.style.top = `${melhorCanto.top}px`;
  videoFlutuante.style.right = "auto";
  videoFlutuante.style.bottom = "auto";

  // 2) Ao fim da transição, converte para right/bottom (ou left/top) do canto.
  snapPendenteVideo = true;
  videoFlutuante.removeEventListener("transitionend", aoTerminarSnapVideo);
  videoFlutuante.addEventListener("transitionend", aoTerminarSnapVideo);
}

function iniciarArrasteVideo(evento) {
  // Fechar, play/pause e som continuam com o comportamento próprio.
  if (
    evento.target.closest(".video-flutuante-fechar") ||
    evento.target.closest(".video-flutuante-play") ||
    evento.target.closest(".video-flutuante-som")
  ) {
    return;
  }

  // Só botão esquerdo do mouse; toques/canetas passam direto.
  if (evento.pointerType === "mouse" && evento.button !== 0) {
    return;
  }

  // Cancela conversão de âncora pendente se o usuário voltar a arrastar.
  snapPendenteVideo = false;
  videoFlutuante.removeEventListener("transitionend", aoTerminarSnapVideo);

  // Ainda não é arrasto: só guarda o ponto inicial.
  arrastandoVideo = true;
  arrastoRecenteVideo = false;
  pontoInicialX = evento.clientX;
  pontoInicialY = evento.clientY;
}

function moverArrasteVideo(evento) {
  if (!arrastandoVideo) {
    return;
  }

  const deltaX = evento.clientX - pontoInicialX;
  const deltaY = evento.clientY - pontoInicialY;

  // Enquanto o movimento for pequeno, trata como possível clique (não move o widget).
  if (!arrastoRecenteVideo) {
    if (
      Math.abs(deltaX) <= LIMITE_ARRASTO_PX &&
      Math.abs(deltaY) <= LIMITE_ARRASTO_PX
    ) {
      return;
    }

    // Cruzou 6px: arrasto livre em left/top.
    arrastoRecenteVideo = true;
    prepararPosicaoArraste();
    origemLeft = parseFloat(videoFlutuante.style.left);
    origemTop = parseFloat(videoFlutuante.style.top);
    videoFlutuante.classList.add("arrastando");
    videoFlutuante.setPointerCapture(evento.pointerId);
  }

  videoFlutuante.style.left = `${origemLeft + deltaX}px`;
  videoFlutuante.style.top = `${origemTop + deltaY}px`;
  limitarPosicaoVideo();
}

function finalizarArrasteVideo(evento) {
  if (!arrastandoVideo) {
    return;
  }

  const foiArrasto = arrastoRecenteVideo;

  arrastandoVideo = false;
  videoFlutuante.classList.remove("arrastando");

  if (videoFlutuante.hasPointerCapture(evento.pointerId)) {
    videoFlutuante.releasePointerCapture(evento.pointerId);
  }

  if (foiArrasto) {
    // Snap + conversão para a âncora do canto escolhido.
    encaixarNoCantoMaisProximo();
    setTimeout(() => {
      arrastoRecenteVideo = false;
    }, 0);
    return;
  }

  // Clique/toque sem arrasto (≤ 6px): abre o vídeo se ainda estiver fechado.
  if (!videoFlutuante.classList.contains("aberto")) {
    abrirVideoFlutuante();
  }
}

videoFlutuante.addEventListener("pointerdown", iniciarArrasteVideo);
videoFlutuante.addEventListener("pointermove", moverArrasteVideo);
videoFlutuante.addEventListener("pointerup", finalizarArrasteVideo);
videoFlutuante.addEventListener("pointercancel", finalizarArrasteVideo);

// No resize, mantém o mesmo canto com a âncora correta.
window.addEventListener("resize", () => aplicarAncoraCanto(cantoAtualVideo));

/* =======================================================
   FIM — lógica de arrastar (#video-flutuante)
   ======================================================= */

/* -------------------------------------------------------
   Presente flutuante: aparece uma vez aos ~35% da rolagem.
   ------------------------------------------------------- */

const presenteFlutuante = document.querySelector("#presente-flutuante");
const modalPresente = document.querySelector("#modal-presente");
const botaoFecharPresente = document.querySelector("#modal-presente-fechar");
const botaoCtaPresente = document.querySelector("#modal-presente-cta");
let presenteJaApareceu = false;

function progressoRolagemPagina() {
  const rolavel = document.documentElement.scrollHeight - window.innerHeight;

  if (rolavel <= 0) {
    return 0;
  }

  return window.scrollY / rolavel;
}

function mostrarPresenteFlutuante() {
  presenteFlutuante.classList.add("visivel");
  presenteFlutuante.setAttribute("aria-hidden", "false");
  presenteFlutuante.removeAttribute("tabindex");
}

function verificarAparicaoPresente() {
  if (presenteJaApareceu) {
    return;
  }

  if (progressoRolagemPagina() < 0.35) {
    return;
  }

  presenteJaApareceu = true;
  mostrarPresenteFlutuante();
  window.removeEventListener("scroll", verificarAparicaoPresente);
}

function concluirFechamentoModalPresente() {
  if (!modalPresente.classList.contains("fechando")) {
    return;
  }

  modalPresente.classList.remove("aberto", "fechando");
  document.body.classList.remove("sem-rolagem");
}

function abrirModalPresente() {
  if (modalPresente.classList.contains("aberto")) {
    return;
  }

  modalPresente.classList.add("aberto");
  document.body.classList.add("sem-rolagem");
  botaoFecharPresente.focus();
}

function fecharModalPresente() {
  if (!modalPresente.classList.contains("aberto") || modalPresente.classList.contains("fechando")) {
    return;
  }

  modalPresente.classList.add("fechando");

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduzirMovimento) {
    concluirFechamentoModalPresente();
    return;
  }

  const aoTerminarSaida = (evento) => {
    if (evento.target !== modalPresente) {
      return;
    }

    modalPresente.removeEventListener("animationend", aoTerminarSaida);
    concluirFechamentoModalPresente();
  };

  modalPresente.addEventListener("animationend", aoTerminarSaida);
  window.setTimeout(concluirFechamentoModalPresente, 360);
}

window.addEventListener("scroll", verificarAparicaoPresente, { passive: true });
verificarAparicaoPresente();

presenteFlutuante.addEventListener("click", abrirModalPresente);
botaoFecharPresente.addEventListener("click", fecharModalPresente);
botaoCtaPresente.addEventListener("click", fecharModalPresente);

modalPresente.addEventListener("click", (evento) => {
  if (evento.target === modalPresente) {
    fecharModalPresente();
  }
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharModalPresente();
  }
});
