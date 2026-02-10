// =====================
// 1) Canciones J-Pop
// =====================

const canciones = [
  "YOASOBI – Idol",
  "LiSA – Gurenge",
  "Aimer – Zankyou Sanka",
  "Perfume – Polyrhythm",
  "Hikaru Utada – First Love",
  "King Gnu – Hakujitsu",
  "Official髭男dism – Pretender",
  "BABYMETAL – Gimme Chocolate!!",
  "RADWIMPS – Zenzenzense",
  "Eve – Kaikai Kitan"
];

const segmentos = {
  N: "Nuevo en J-Pop",
  A: "Fan de anime",
  I: "Fan de idols",
  C: "Oyente casual",
  H: "Fan hardcore"
};

const contextos = {
  E: "¿Cuál recomendarías para empezar con J-Pop?",
  A: "¿Cuál es mejor para animarse?",
  R: "¿Cuál escucharías en repeat?",
  M: "¿Cuál representa mejor el J-Pop moderno?"
};

// =====================
// 2) Elo
// =====================

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "jpopmash_state_v1";

function defaultState() {
  const buckets = {};
  for (const s in segmentos) {
    for (const c in contextos) {
      const key = `${s}__${c}`;
      buckets[key] = {};
      canciones.forEach(song => buckets[key][song] = RATING_INICIAL);
    }
  }
  return { buckets };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function expectedScore(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner) {
  const ra = bucket[a];
  const rb = bucket[b];

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - eb);
}

function randomPair() {
  let a = canciones[Math.floor(Math.random() * canciones.length)];
  let b = a;
  while (b === a) {
    b = canciones[Math.floor(Math.random() * canciones.length)];
  }
  return [a, b];
}

function topN(bucket) {
  return Object.entries(bucket)
    .map(([song, rating]) => ({ song, rating }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
}

// =====================
// 3) UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const questionEl = document.getElementById("question");
const topBox = document.getElementById("topBox");

let currentA, currentB;

function fillSelect(select, data) {
  for (const k in data) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = data[k];
    select.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

function newDuel() {
  [currentA, currentB] = randomPair();
  labelA.textContent = currentA;
  labelB.textContent = currentB;
  questionEl.textContent = contextos[contextSelect.value];
}

function vote(winner) {
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  updateElo(state.buckets[key], currentA, currentB, winner);
  saveState();
  renderTop();
  newDuel();
}

function renderTop() {
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  const rows = topN(state.buckets[key]);

  topBox.innerHTML = rows.map((r, i) => `
    <div class="toprow">
      <div><b>${i + 1}.</b> ${r.song}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

document.getElementById("btnA").onclick = () => vote("A");
document.getElementById("btnB").onclick = () => vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;
document.getElementById("btnReset").onclick = () => {
  if (confirm("¿Borrar todos los votos y rankings?")) {
    state = defaultState();
    saveState();
    renderTop();
    newDuel();
  }
};

newDuel();
renderTop();
