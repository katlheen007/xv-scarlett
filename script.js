/* =========================================================
   CONFIGURACIÓN · edita aquí textos, horas y enlaces
   (no hace falta tocar nada más abajo)
   ========================================================= */
const CONFIG = {
  // Fecha y hora de la fiesta (hora de Bolivia, UTC-4)
  fiesta: "2026-11-21T17:00:00-04:00",

  // Enlaces
  mapa: "https://maps.app.goo.gl/uKtrRXvYjokXnkhy9",
  album: "https://photos.app.goo.gl/p58cJnuvvJHUD8wDA",


  // Textos
  textos: {
    portadaFrase: "Esta noche, detrás de cada antifaz, comienza una historia.",
    fraseApertura:
      "Bajo un cielo vestido de estrellas y con el corazón lleno de sueños, comienza la noche en la que dejo atrás una etapa para abrirle las puertas a todo lo que está por venir.",
    madre: "Jaive Imgard Ramil Condemayta",
    padre: "Fidel Flores Jiménez (†)",
    invitacion: "Tienen el honor de invitarles al baile de quinceaños de su hija",
    quinceanera: "Claire Scarlett Flores Ramil",
    fechaTexto: "Sábado 21 de noviembre",
    hora: "17:00",
    lugar: "Salón de Eventos “Bonanza”",
    ciudad: "Ciudad de El Alto",
    vestimenta: "Cóctel",
    vestimentaNota: "Se sugiere el uso de antifaz",
    fotosTexto:
      "Ayúdanos a guardar los recuerdos de esta noche: sube aquí tus fotos y vídeos de la fiesta.",
    cierre:
      "Para celebrar esta nueva etapa de su vida en una noche de misterio y elegancia victoriana, donde entre antifaces y velas descubriremos juntos la magia de sus quince años.",
    despedida: "¡Te esperamos!",
  },

  // Tarjeta cuando el enlace no trae un código válido
  invitadoPorDefecto: "Invitado especial",
};

/* =========================================================
   A partir de aquí, la lógica de la invitación
   ========================================================= */
(function () {
  const $ = (s) => document.querySelector(s);
  document.body.classList.add("cerrado");

  // --- Textos ---
  document.querySelectorAll("[data-texto]").forEach((el) => {
    const v = CONFIG.textos[el.dataset.texto];
    if (v != null) el.textContent = v;
  });

  // --- Enlaces ---
  $("#botonMapa").href = CONFIG.mapa;
  const album = $("#botonAlbum");
  if (CONFIG.album) album.href = CONFIG.album;
  else { album.textContent = "Álbum disponible muy pronto"; album.classList.add("inactivo"); }

  // --- Invitado (?i=codigo) ---
  // invitados.json solo guarda una "huella" de cada código, así nadie puede sacar los códigos.
  const codigo = (new URLSearchParams(location.search).get("i") || "").trim().toLowerCase();
  const nombreEl = $("#tarjetaNombre");
  const pasesEl = $("#tarjetaPases");
  nombreEl.textContent = CONFIG.invitadoPorDefecto;
  async function huella(txt) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
  }
  if (codigo && window.crypto && crypto.subtle) {
    Promise.all([fetch("invitados.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})), huella(codigo)])
      .then(([lista, h]) => {
        const inv = lista[h];
        if (!inv) return;
        const nombre = inv.nombre || CONFIG.invitadoPorDefecto;
        const n = Number(inv.pases) || 0;
        const cupo = n ? `${n} ${n === 1 ? "persona" : "personas"}` : "";
        nombreEl.textContent = nombre;
        pasesEl.textContent = cupo;
        mostrarPase(nombre, n);
      })
      .catch(() => {});
  }

  // --- Pase de entrada con QR ---
  function mostrarPase(nombre, n) {
    if (typeof qrcode !== "function") return;
    $("#paseNombre").textContent = nombre;
    $("#paseCupo").textContent = n ? `Válido para ${n} ${n === 1 ? "persona" : "personas"}` : "";
    const qr = qrcode(0, "M");
    qr.addData(location.origin + location.pathname + "?i=" + codigo);
    qr.make();
    $("#paseQR").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    $("#seccionPase").hidden = false;
  }

  // --- Música ---
  const audio = $("#audio");
  const botonMusica = $("#musica");
  let hayMusica = true;
  audio.addEventListener("error", () => { hayMusica = false; botonMusica.hidden = true; });
  botonMusica.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  audio.addEventListener("play", () => { botonMusica.classList.remove("pausada"); botonMusica.setAttribute("aria-label", "Pausar música"); });
  audio.addEventListener("pause", () => { botonMusica.classList.add("pausada"); botonMusica.setAttribute("aria-label", "Reanudar música"); });
  // Pausar si el invitado cambia de app
  document.addEventListener("visibilitychange", () => { if (document.hidden && !audio.paused) { audio.pause(); audio.dataset.auto = "1"; } else if (!document.hidden && audio.dataset.auto) { delete audio.dataset.auto; audio.play().catch(() => {}); } });

  // --- Abrir el libro ---
  const libro = $("#libro");
  const portada = $("#portada");
  const invitacion = $("#invitacion");
  let abierto = false;
  function abrir() {
    if (abierto) return;
    abierto = true;
    libro.classList.add("abierto");
    if (hayMusica) {
      audio.volume = 0.8;
      audio.play().then(() => { botonMusica.hidden = false; }).catch(() => {});
    }
    setTimeout(() => {
      invitacion.hidden = false;
      document.body.classList.remove("cerrado");
      window.scrollTo(0, 0);
      portada.classList.add("desvanecer");
      requestAnimationFrame(() => invitacion.classList.add("visible"));
      observarSecciones();
    }, 1300);
    setTimeout(() => portada.remove(), 2500);
  }
  $("#abrir").addEventListener("click", abrir);
  $(".escena").addEventListener("click", abrir);

  // --- Aparición de secciones al hacer scroll ---
  function observarSecciones() {
    const secciones = document.querySelectorAll(".seccion");
    if (!("IntersectionObserver" in window)) { secciones.forEach((s) => s.classList.add("revelada")); return; }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("revelada"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    secciones.forEach((s) => io.observe(s));
  }

  // --- Cuenta regresiva ---
  const objetivo = new Date(CONFIG.fiesta).getTime();
  const dos = (n) => String(n).padStart(2, "0");
  function tic() {
    const falta = objetivo - Date.now();
    if (falta <= 0) {
      $("#cuenta").hidden = true;
      $("#cuentaFin").hidden = false;
      return true;
    }
    const s = Math.floor(falta / 1000);
    $("#cDias").textContent = Math.floor(s / 86400);
    $("#cHoras").textContent = dos(Math.floor((s % 86400) / 3600));
    $("#cMin").textContent = dos(Math.floor((s % 3600) / 60));
    $("#cSeg").textContent = dos(s % 60);
    return false;
  }
  if (!tic()) { const t = setInterval(() => { if (tic()) clearInterval(t); }, 1000); }

  // --- Partículas doradas y destellos de vela ---
  const canvas = $("#particulas");
  const ctx = canvas.getContext("2d");
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, dpr, puntos = [];
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
  }
  function nuevo(inicio) {
    return {
      x: Math.random() * W,
      y: inicio ? Math.random() * H : H + 10,
      r: (Math.random() * 1.6 + 0.5) * dpr,
      vy: (Math.random() * 0.25 + 0.08) * dpr,
      vx: (Math.random() - 0.5) * 0.15 * dpr,
      fase: Math.random() * Math.PI * 2,
      vel: Math.random() * 0.02 + 0.008,
    };
  }
  medir();
  addEventListener("resize", medir);
  const cantidad = innerWidth < 500 ? 38 : 60;
  for (let i = 0; i < cantidad; i++) puntos.push(nuevo(true));
  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    for (const p of puntos) {
      p.y -= p.vy; p.x += p.vx + Math.sin(p.fase) * 0.15 * dpr; p.fase += p.vel;
      if (p.y < -10) Object.assign(p, nuevo(false));
      const brillo = 0.35 + 0.65 * Math.abs(Math.sin(p.fase));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(243,221,155,${0.9 * brillo})`);
      g.addColorStop(0.4, `rgba(201,162,74,${0.35 * brillo})`);
      g.addColorStop(1, "rgba(201,162,74,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
    }
    if (!reducir) requestAnimationFrame(dibujar);
  }
  dibujar();
})();
