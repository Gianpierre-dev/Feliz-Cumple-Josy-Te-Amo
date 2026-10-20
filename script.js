(() => {
  "use strict";

  const sobre = document.getElementById("sobre");
  const sello = document.getElementById("sello");
  const escenaSobre = document.getElementById("escena-sobre");
  const escenaCarta = document.getElementById("escena-carta");
  const audio = document.getElementById("audio");
  const botonMusica = document.getElementById("musica");
  const capaGlobos = document.getElementById("globos");
  const capaParticulas = document.getElementById("particulas");
  const pastel = document.getElementById("pastel");
  const tortaHint = document.getElementById("torta-hint");
  const visor = document.getElementById("visor");
  const visorImagen = document.getElementById("visor-imagen");
  const visorParticulas = document.getElementById("visor-particulas");

  const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEMORA_APERTURA_MS = 1700;
  const DEMORA_SALIDA_SOBRE_MS = 700;

  const COLORES_GLOBOS = ["#cdb8ea", "#f7c9da", "#e697b6", "#b39ddb", "#fff0f6", "#dcc9f2"];
  const CONJUNTOS_PARTICULAS = {
    mixto: {
      simbolos: ["♥", "♥", "♥", "✦", "✿", "♡"],
      colores: ["#e06c9f", "#8f74c2", "#ff8fb8", "#a98ad6", "#d94f8a"],
    },
    corazones: {
      simbolos: ["♥", "♥", "♡", "💗", "♥", "💖"],
      colores: ["#e06c9f", "#d94f8a", "#ff8fb8", "#c2185b"],
    },
    estrellas: {
      simbolos: ["✦", "★", "✧", "⭐", "✦", "🌟"],
      colores: ["#8f74c2", "#f2c14e", "#a98ad6", "#ffd166"],
    },
    flores: {
      simbolos: ["✿", "❀", "🌸", "🌷", "✿", "🌼"],
      colores: ["#e06c9f", "#ff8fb8", "#a98ad6", "#f06292"],
    },
    mariposas: {
      simbolos: ["🦋", "🦋", "✧", "🦋", "♡"],
      colores: ["#8f74c2", "#64b5f6", "#a98ad6"],
    },
    monos: {
      simbolos: ["🎀", "🎀", "♡", "🎀", "✦"],
      colores: ["#e06c9f", "#ff8fb8", "#d94f8a"],
    },
    confeti: {
      simbolos: ["●", "■", "▲", "✨", "💜", "●", "🎉"],
      colores: ["#e06c9f", "#8f74c2", "#f2c14e", "#64b5f6", "#ff8fb8"],
    },
  };

  let cartaAbierta = false;
  let velaApagada = false;

  function aleatorio(minimo, maximo) {
    return Math.random() * (maximo - minimo) + minimo;
  }

  function centroDe(elemento) {
    const caja = elemento.getBoundingClientRect();
    return { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
  }

  /* ---------- Globos y partículas ---------- */

  function lanzarGlobos(cantidad) {
    // Con "reducir movimiento" activo se lanzan menos globos, pero el momento no desaparece.
    const total = prefiereMenosMovimiento ? Math.ceil(cantidad / 2) : cantidad;

    for (let indice = 0; indice < total; indice++) {
      const globo = document.createElement("span");
      globo.className = "globo";
      globo.style.setProperty("--x", `${aleatorio(4, 92)}%`);
      globo.style.setProperty("--t", `${aleatorio(7, 11)}s`);
      globo.style.setProperty("--d", `${aleatorio(0, 2.4)}s`);
      globo.style.setProperty("--s", aleatorio(0.7, 1.15).toFixed(2));
      globo.style.setProperty("--c", COLORES_GLOBOS[indice % COLORES_GLOBOS.length]);

      const cuerpo = document.createElement("span");
      cuerpo.className = "globo__cuerpo";
      cuerpo.style.animationDelay = `${aleatorio(-2.5, 0)}s`;
      globo.appendChild(cuerpo);

      globo.addEventListener("animationend", (evento) => {
        if (evento.target === globo) globo.remove();
      });
      capaGlobos.appendChild(globo);
    }
  }

  function estallarParticulas(x, y, cantidad, nombreConjunto = "mixto", capa = capaParticulas) {
    const conjunto = CONJUNTOS_PARTICULAS[nombreConjunto] || CONJUNTOS_PARTICULAS.mixto;
    const total = prefiereMenosMovimiento ? Math.ceil(cantidad * 0.6) : cantidad;

    for (let indice = 0; indice < total; indice++) {
      const particula = document.createElement("span");
      particula.className = "particula";
      particula.textContent = conjunto.simbolos[indice % conjunto.simbolos.length];

      const angulo = aleatorio(0, Math.PI * 2);
      const distancia = aleatorio(70, 200);
      particula.style.setProperty("--px", `${x}px`);
      particula.style.setProperty("--py", `${y}px`);
      particula.style.setProperty("--dx", `${Math.cos(angulo) * distancia}px`);
      particula.style.setProperty("--dy", `${Math.sin(angulo) * distancia - 70}px`);
      particula.style.setProperty("--r", `${aleatorio(-200, 200)}deg`);
      particula.style.setProperty("--ps", `${aleatorio(1.1, 2.4)}rem`);
      particula.style.setProperty("--pc", conjunto.colores[indice % conjunto.colores.length]);

      particula.addEventListener("animationend", () => particula.remove());
      capa.appendChild(particula);
    }
  }

  /* ---------- Música ---------- */

  function actualizarBotonMusica() {
    const reproduciendo = !audio.paused;
    botonMusica.classList.toggle("musica--pausada", !reproduciendo);
    botonMusica.setAttribute("aria-pressed", String(reproduciendo));
    botonMusica.setAttribute("aria-label", reproduciendo ? "Pausar la música" : "Reproducir la música");
  }

  function reproducirMusica() {
    const intento = audio.play();
    if (intento && typeof intento.then === "function") {
      intento.then(actualizarBotonMusica).catch(actualizarBotonMusica);
      return;
    }
    actualizarBotonMusica();
  }

  function alternarMusica() {
    if (audio.paused) {
      reproducirMusica();
      return;
    }
    audio.pause();
    actualizarBotonMusica();
  }

  /* ---------- Revelado al hacer scroll ---------- */

  function revelarAlScroll() {
    const elementos = document.querySelectorAll("[data-revelar]");

    if (!("IntersectionObserver" in window)) {
      elementos.forEach((elemento) => elemento.classList.add("revelado"));
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("revelado");
          observador.unobserve(entrada.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    elementos.forEach((elemento) => observador.observe(elemento));
  }

  /* ---------- Sobre y carta ---------- */

  function mostrarCarta() {
    escenaSobre.classList.add("escena--saliendo");
    escenaCarta.hidden = false;
    botonMusica.hidden = false;
    document.body.classList.remove("en-sobre");
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => escenaCarta.classList.add("escena--visible"));
    });

    window.setTimeout(() => {
      escenaSobre.hidden = true;
    }, DEMORA_SALIDA_SOBRE_MS);

    revelarAlScroll();
  }

  function abrirSobre() {
    if (cartaAbierta) return;
    cartaAbierta = true;

    sobre.classList.add("sobre--abierto");
    // La reproducción debe iniciarse dentro del gesto del usuario para que el móvil la permita.
    reproducirMusica();

    const centro = centroDe(sello);
    estallarParticulas(centro.x, centro.y, 30);
    lanzarGlobos(14);

    window.setTimeout(mostrarCarta, DEMORA_APERTURA_MS);
  }

  /* ---------- Torta ---------- */

  function soplarVela() {
    if (velaApagada) return;
    velaApagada = true;

    pastel.classList.add("pastel--apagada");
    pastel.setAttribute("aria-label", "Velita apagada");

    const centro = centroDe(pastel.querySelector(".pastel__llama"));
    estallarParticulas(centro.x, centro.y, 34);
    lanzarGlobos(18);

    tortaHint.textContent = "¡Que se cumpla todo lo que deseaste!";
    tortaHint.classList.add("torta__hint--cumplido");
  }

  /* ---------- Deseos ---------- */

  function tocarDeseo(boton) {
    const centro = centroDe(boton.querySelector(".deseo__icono"));
    estallarParticulas(centro.x, centro.y, 24, boton.dataset.particulas);

    boton.classList.remove("deseo__boton--pop");
    void boton.offsetWidth; // Reinicia la animación si se toca varias veces seguidas.
    boton.classList.add("deseo__boton--pop");

    if (typeof navigator.vibrate === "function") navigator.vibrate(25);
  }

  /* ---------- Visor de fotos ---------- */

  function corazonesEnVisor(x, y) {
    estallarParticulas(x, y, 26, "corazones", visorParticulas);
  }

  function abrirVisor(boton) {
    if (typeof visor.showModal !== "function") return;
    const imagen = boton.querySelector("img");
    visorImagen.src = imagen.currentSrc || imagen.src;
    visorImagen.alt = imagen.alt;
    visor.showModal();

    // La foto se centra en la pantalla, así que los corazones salen del centro del viewport.
    requestAnimationFrame(() => corazonesEnVisor(window.innerWidth / 2, window.innerHeight / 2));
  }

  function manejarClickVisor(evento) {
    if (evento.target === visor || evento.target.closest(".visor__cerrar")) {
      visor.close();
      return;
    }
    if (evento.target === visorImagen) {
      corazonesEnVisor(evento.clientX, evento.clientY);
    }
  }

  /* ---------- Inicio ---------- */

  document.body.classList.add("en-sobre");
  sobre.addEventListener("click", abrirSobre);
  botonMusica.addEventListener("click", alternarMusica);
  audio.addEventListener("play", actualizarBotonMusica);
  audio.addEventListener("pause", actualizarBotonMusica);
  pastel.addEventListener("click", soplarVela);
  visor.addEventListener("click", manejarClickVisor);
  document.querySelectorAll(".foto__boton").forEach((boton) => {
    boton.addEventListener("click", () => abrirVisor(boton));
  });
  document.querySelectorAll(".deseo__boton").forEach((boton) => {
    boton.addEventListener("click", () => tocarDeseo(boton));
  });
})();
