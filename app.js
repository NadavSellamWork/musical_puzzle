(() => {
  const $ = (id) => document.getElementById(id);
  const PIECES = window.PIECES || [];

  // ------------------------------------------------------------------
  // Background decorations
  // ------------------------------------------------------------------
  const glyphs = ["♪", "♫", "♩", "♬", "𝄞"];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 24 + Math.random() * 40 + "px";
    s.style.animationDuration = 16 + Math.random() * 18 + "s";
    s.style.animationDelay = -Math.random() * 30 + "s";
    $("floaters").appendChild(s);
  }
  // Piano keys along the bottom (black keys follow the 2-3 pattern)
  const hasBlack = [1, 1, 0, 1, 1, 1, 0]; // after C D (E) F G A (B)
  for (let i = 0; i < 40; i++) {
    const w = document.createElement("div");
    w.className = "w";
    if (hasBlack[i % 7]) { const b = document.createElement("div"); b.className = "b"; w.appendChild(b); }
    $("keys").appendChild(w);
  }

  // ------------------------------------------------------------------
  // Audio
  // ------------------------------------------------------------------
  let ctx = null;
  const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

  // A small built-in tune (Ode to Joy) so the site works with no audio files.
  async function makeDemo(seconds) {
    const sr = 44100, beat = 0.5;
    const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }; // from A4
    const tune = "E E F G G F E D C C D E E. D/2 D2 E E F G G F E D C C D E D. C/2 C2".split(" ");
    const off = new OfflineAudioContext(1, sr * seconds, sr);
    let t = 0;
    for (const tok of tune) {
      const m = tok.match(/^([A-G])(\.?)(?:\/(\d))?(\d)?$/);
      let beats = 1;
      if (m[2]) beats = 1.5; if (m[3]) beats = 0.5; if (m[4]) beats = +m[4];
      const f = 440 * Math.pow(2, semis[m[1]] / 12);
      const o = off.createOscillator(), g = off.createGain();
      o.type = "triangle"; o.frequency.value = f;
      const d = beats * beat;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .03);
      g.gain.exponentialRampToValueAtTime(.001, t + d * .95);
      o.connect(g).connect(off.destination); o.start(t); o.stop(t + d);
      t += d;
      if (t >= seconds) break;
    }
    return off.startRendering();
  }

  async function loadBuffer(piece) {
    if (!piece.file) return makeDemo(piece.length + piece.start);
    const res = await fetch(piece.file);
    if (!res.ok) throw new Error("missing " + piece.file);
    return audio().decodeAudioData(await res.arrayBuffer());
  }

  // ------------------------------------------------------------------
  // Home screen
  // ------------------------------------------------------------------
  PIECES.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "tile";
    b.innerHTML = `<span class="em">${p.emoji || "🎵"}</span><span class="t"></span><span class="c"></span>`;
    b.querySelector(".t").textContent = p.title;
    b.querySelector(".c").textContent = p.composer || "";
    b.onclick = () => openPiece(i);
    $("pieceGrid").appendChild(b);
  });

  // ------------------------------------------------------------------
  // Puzzle state
  // ------------------------------------------------------------------
  let piece = null, buffer = null, n = 0, sliceLen = 7;
  let order = [];            // order[position] = original slice index
  let sources = [], timers = [];
  let dragFrom = null;

  const board = $("board"), msg = $("message");
  const say = (t, win) => { msg.textContent = t; msg.classList.toggle("win", !!win); };

  async function openPiece(i) {
    stopAll();
    piece = PIECES[i]; buffer = null;
    $("home").hidden = true; $("game").hidden = false;
    $("gameTitle").textContent = piece.title;
    $("gameComposer").textContent = piece.composer || "";
    board.innerHTML = "";
    say("Loading the music…");
    window.scrollTo(0, 0);
    try {
      buffer = await loadBuffer(piece);
    } catch (e) {
      console.error(e);
      say(`😕 Couldn't find "${piece.file}". Put the audio file in the audio folder (see README), and open the site through a web server.`);
      return;
    }
    newGame();
  }

  function layout() {
    sliceLen = piece.slice || 7;
    const start = Math.min(piece.start, Math.max(0, buffer.duration - 1));
    const total = Math.min(piece.length, buffer.duration - start);
    n = Math.max(2, Math.floor(total / sliceLen));
    return start;
  }
  function sliceInfo(k) {
    const start = Math.min(piece.start, Math.max(0, buffer.duration - 1));
    return { from: start + k * sliceLen, len: sliceLen };
  }

  function newGame() {
    layout();
    order = [...Array(n).keys()];
    do { for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
    while (order.every((v, i) => v === i));
    render();
    say("Click a piece to hear it. Drag the pieces around to put the music in order.");
  }

  const hue = (k) => Math.round(20 + (k / Math.max(1, n - 1)) * 300);

  function drawWave(canvas, k) {
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext("2d"); g.scale(dpr, dpr);
    const { from, len } = sliceInfo(k);
    const data = buffer.getChannelData(0), sr = buffer.sampleRate;
    const s0 = Math.floor(from * sr), count = Math.floor(len * sr);
    const bars = 24, step = Math.floor(count / bars) || 1, bw = W / bars;
    g.fillStyle = $("colorHint").checked ? `hsl(${hue(k)} 65% 48%)` : "#b98a3e";
    for (let b = 0; b < bars; b++) {
      let peak = 0;
      for (let i = 0; i < step; i += 16) peak = Math.max(peak, Math.abs(data[s0 + b * step + i] || 0));
      const h = Math.max(3, Math.min(1, peak * 1.6) * (H - 8));
      g.beginPath(); g.roundRect(b * bw + 1.5, (H - h) / 2, bw - 3, h, 3); g.fill();
    }
  }

  function render() {
    board.innerHTML = "";
    order.forEach((k, pos) => {
      const c = document.createElement("div");
      c.className = "card"; c.draggable = true; c.dataset.pos = pos; c.dataset.k = k;
      c.innerHTML = `<canvas></canvas>`;
      c.tabIndex = 0; c.setAttribute("role", "button"); c.setAttribute("aria-label", "Puzzle piece, click to listen");
      c.onclick = () => toggleOne(pos);
      c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOne(pos); } };
      c.ondragstart = (e) => { dragFrom = pos; c.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", pos); };
      c.ondragend = () => { c.classList.remove("dragging"); document.querySelectorAll(".over").forEach(x => x.classList.remove("over")); };
      c.ondragover = (e) => { e.preventDefault(); c.classList.add("over"); };
      c.ondragleave = () => c.classList.remove("over");
      c.ondrop = (e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, pos); dragFrom = null; };
      board.appendChild(c);
    });
    board.querySelectorAll("canvas").forEach((cv, pos) => drawWave(cv, order[pos]));
  }

  function move(from, to) {
    if (to < 0 || to >= n || from === to) return;
    stopAll();
    const [x] = order.splice(from, 1);
    order.splice(to, 0, x);
    render();
    say("Nice! Press ▶ Play in this order to hear how it sounds now.");
  }

  // ------------------------------------------------------------------
  // Playback
  // ------------------------------------------------------------------
  function stopAll() {
    timers.forEach(clearTimeout); timers = [];
    sources.forEach((s) => { try { s.stop(); } catch {} });
    sources = [];
    document.querySelectorAll(".card.playing").forEach((c) => c.classList.remove("playing"));
  }

  // Schedule slices (by position) back to back; returns total duration.
  function schedule(positions) {
    const ac = audio(); ac.resume();
    let t = ac.currentTime + 0.08;
    const cards = [...board.children];
    positions.forEach((pos) => {
      const { from, len } = sliceInfo(order[pos]);
      const src = ac.createBufferSource(), g = ac.createGain();
      src.buffer = buffer; src.connect(g).connect(ac.destination);
      const fade = 0.02;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + fade);
      g.gain.setValueAtTime(1, t + len - fade);
      g.gain.linearRampToValueAtTime(0, t + len);
      src.start(t, from, len);
      sources.push(src);
      const delay = (t - ac.currentTime) * 1000;
      timers.push(setTimeout(() => {
        document.querySelectorAll(".card.playing").forEach((c) => c.classList.remove("playing"));
        cards[pos]?.classList.add("playing");
      }, delay));
      t += len;
    });
    timers.push(setTimeout(() => document.querySelectorAll(".card.playing").forEach((c) => c.classList.remove("playing")), (t - ac.currentTime) * 1000));
  }

  function toggleOne(pos) {
    const was = board.children[pos].classList.contains("playing");
    stopAll();
    if (!was) schedule([pos]);
  }

  $("playAll").onclick = () => { if (!buffer) return; stopAll(); schedule([...Array(n).keys()]); };
  $("stopBtn").onclick = stopAll;
  $("shuffleBtn").onclick = () => { if (buffer) { stopAll(); newGame(); } };
  $("colorHint").onchange = () => { if (buffer) render(); };
  $("backBtn").onclick = () => { stopAll(); $("game").hidden = true; $("home").hidden = false; };

  // ------------------------------------------------------------------
  // Checking & celebrating
  // ------------------------------------------------------------------
  $("checkBtn").onclick = () => {
    if (!buffer) return;
    stopAll();
    const cards = [...board.children];
    let right = 0;
    cards.forEach((c, pos) => {
      c.classList.remove("right", "wrong"); c.querySelector(".badge")?.remove();
      void c.offsetWidth; // restart animation
      if (order[pos] === pos) { right++; c.classList.add("right"); c.insertAdjacentHTML("beforeend", '<span class="badge">✅</span>'); }
      else c.classList.add("wrong");
    });
    if (right === n) { say("🎉 Wonderful! You put it all in the right order!", true); celebrate(); }
    else say(`${right} of ${n} are in the right place. Keep listening — you're getting close!`);
    setTimeout(() => cards.forEach((c) => c.classList.remove("wrong")), 700);
  };

  function celebrate() {
    const box = $("confetti"), bits = ["🎵", "🎶", "♪", "♫", "🌸", "⭐"];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("span");
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.fontSize = 22 + Math.random() * 26 + "px";
      s.style.animationDelay = Math.random() * 1.2 + "s";
      box.appendChild(s);
      setTimeout(() => s.remove(), 5000);
    }
  }
})();
