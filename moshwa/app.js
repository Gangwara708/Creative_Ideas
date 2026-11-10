/* Moshwa — game logic. Sab kuch isi phone pe rehta hai (localStorage), koi server nahi. */
const app = document.getElementById('app');
const S = Object.assign({ names: ['King', 'Queen'], safe: 'Red', max: 2, only: false, score: [0, 0], ready: false },
  JSON.parse(localStorage.getItem('moshwa') || '{}'));
const save = () => localStorage.setItem('moshwa', JSON.stringify(S));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = a => a[Math.floor(Math.random() * a.length)];
let turn = Math.random() < 0.5 ? 0 : 1, timer = null, stack = [];

/* shuffle-bag: jab tak deck khatam na ho, card repeat nahi hota */
const bags = {};
function draw(key, pool) {
  if (!bags[key] || !bags[key].length) bags[key] = pool.slice().sort(() => Math.random() - 0.5);
  return bags[key].pop();
}
const fill = (t, p = turn) => esc(t).replace(/\{p\}/g, `<b>${esc(S.names[p])}</b>`).replace(/\{o\}/g, `<b>${esc(S.names[1 - p])}</b>`);

function go(view, title) {
  clearInterval(timer);
  stack.push([view, title]);
  show();
}
function show() {
  const [view, title] = stack[stack.length - 1];
  document.getElementById('title').textContent = title || 'Moshwa ❤️';
  document.getElementById('back').style.visibility = stack.length > 1 ? 'visible' : 'hidden';
  document.getElementById('safe').innerHTML = S.ready ? `Safe word: <b>${esc(S.safe)}</b> — bolte hi sab ruk jaata hai.` : '';
  app.innerHTML = '';
  view();
  window.scrollTo(0, 0);
}
document.getElementById('back').onclick = () => { if (stack.length > 1) { clearInterval(timer); stack.pop(); show(); } };
document.getElementById('gear').onclick = () => go(settings, 'Settings');

const levelChips = () => `<div class="chips">${[1, 2, 3, 4, 5].map(l =>
  `<button class="chip ${S.max === l ? 'on' : ''}" data-lvl="${l}">${LEVELS[l]}</button>`).join('')}</div>
  <label class="only"><input type="checkbox" id="only" ${S.only ? 'checked' : ''}> Sirf isi level ke cards (seedha ${LEVELS[S.max]})</label>`;
function bindChips() {
  const o = document.getElementById('only');
  if (o) o.onchange = () => { S.only = o.checked; save(); Object.keys(bags).forEach(k => delete bags[k]); card = null; show(); };
  app.querySelectorAll('[data-lvl]').forEach(b => b.onclick = () => { S.max = +b.dataset.lvl; save(); card = null; Object.keys(bags).forEach(k => delete bags[k]); show(); });
}
const scoreRow = () => `<div class="score"><span>${esc(S.names[0])}: <b>${S.score[0]}</b></span><span>${esc(S.names[1])}: <b>${S.score[1]}</b></span></div>`;

function startTimer(btn, secs) {
  clearInterval(timer);
  let left = secs;
  btn.textContent = `⏱ ${left}s`;
  timer = setInterval(() => {
    left--;
    btn.textContent = left > 0 ? `⏱ ${left}s` : '⏰ Time up!';
    if (left <= 0) { clearInterval(timer); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
  }, 1000);
}

/* ---------- Setup / Settings ---------- */
function settings() {
  app.innerHTML = `
    <h2>${S.ready ? 'Settings' : 'Welcome 🌙'}</h2>
    <p class="mute">Sirf tum dono ke liye. Sab kuch isi device pe save hota hai — kahin upload nahi hota.</p>
    <label>Player 1</label><input type="text" id="n0" maxlength="20" value="${esc(S.names[0])}">
    <label>Player 2</label><input type="text" id="n1" maxlength="20" value="${esc(S.names[1])}">
    <label>Safe word (bolte hi game turant ruk jaata hai)</label><input type="text" id="sw" maxlength="20" value="${esc(S.safe)}">
    <label>Kitna heat chahiye? (kabhi bhi badal sakte ho)</label>${levelChips()}
    <div class="box"><b>3 rules jo har game pe laagu hain</b><ul>
      <li>Koi bhi card <b>Skip</b> kar sakte ho — bina wajah bataye.</li>
      <li>🟢 Green = aur · 🟡 Yellow = dheere · 🔴 Safe word = full stop.</li>
      <li>Dark / Ultra level se pehle limits pe 2 minute baat kar lo. Baad me cuddle zaroori. ❤️</li>
    </ul></div>
    <div class="row"><button class="btn p" id="ok">${S.ready ? 'Save' : "Let's play"}</button></div>
    ${S.ready ? '<div class="row"><button class="btn" id="rs">Score reset karo</button></div>' : ''}`;
  bindChips();
  const read = () => {
    S.names = [0, 1].map(i => document.getElementById('n' + i).value.trim() || 'Player ' + (i + 1));
    S.safe = document.getElementById('sw').value.trim() || 'Red';
  };
  app.querySelectorAll('input[type=text]').forEach(i => i.onchange = () => { read(); save(); });
  document.getElementById('ok').onclick = () => { read(); S.ready = true; save(); stack = []; go(home); };
  const rs = document.getElementById('rs');
  if (rs) rs.onclick = () => { S.score = [0, 0]; save(); rs.textContent = 'Reset ho gaya ✓'; };
}

/* ---------- Home ---------- */
const MENU = [
  ['🎭', 'Roleplay Time Machine', 'Raja-Rani se 2080 ke android tak — role, scene, twist', () => go(roleplay, 'Roleplay')],
  ['💘', 'Fantasy Match', 'Alag-alag vote karo, sirf common fantasies khulengi', () => go(matchIntro, 'Fantasy Match')],
  ['🔥', 'Slow Burn', 'Foreplay game — har 4 card pe heat badhti hai', () => { burnN = 0; card = null; go(burn, 'Slow Burn'); }],
  ['🎲', 'Truth or Dare', 'Sach bolo ya kar ke dikhao', () => { card = null; go(tod, 'Truth or Dare'); }],
  ['🎯', 'Tease Dice', 'Kya + kaha + kitni der', () => go(dice, 'Tease Dice')],
  ['📲', 'Poke', 'Din me partner ko chhedne wale texts & coupons', () => go(poke, 'Poke')],
  ['📜', 'Kamasutra Deck', 'Nayi positions — classic se advanced tak', () => deck('pos', 'Kamasutra Deck', 'Position')],
  ['🎬', 'Fantasy Theatre', 'Kahaniyan narrate karo — sweet se MFM / cuck tak, sirf imagination', () => deck('theatre', 'Fantasy Theatre', 'Sirf fantasy')],
  ['🙈', 'Never Have I Ever', 'Jisne kiya hai wo sip le ya ek kapda utaare', () => deck('never', 'Never Have I Ever', 'Maine kabhi…')],
  ['⚖️', 'Would You Rather', 'Dono jawab do, phir wajah batao', () => deck('wyr', 'Would You Rather', 'Ye ya wo?')],
  ['🌹', 'Fantasy Dates', 'Real life me karne wale date ideas', () => deck('date', 'Fantasy Dates', 'Date idea')],
];
function home() {
  app.innerHTML = `<h2>Moshwa <span style="color:var(--rose)">❤️</span></h2>
    <p class="mute">Aaj raat kya khelna hai? Level: ${LEVELS[S.max]} (⚙ se badlo)</p>
    <div class="grid">${MENU.map((m, i) => `<button class="tile" data-i="${i}"><span class="em">${m[0]}</span><b>${m[1]}</b><span class="d">${m[2]}</span></button>`).join('')}</div>`;
  app.querySelectorAll('.tile').forEach(t => t.onclick = MENU[+t.dataset.i][3]);
}

/* ---------- Truth or Dare / Slow Burn ---------- */
let card = null, burnN = 0;
function cardView(c, kind, onDone) {
  const pts = c[0];
  app.innerHTML = `
    <p class="turn">Turn: <b>${esc(S.names[turn])}</b></p>
    <div class="card"><div class="tag">${kind} · ${LEVELS[c[0]]}</div><div class="big">${fill(c[1])}</div></div>
    ${c[2] ? `<div class="row"><button class="btn g" id="tm">⏱ Timer start (${c[2]}s)</button></div>` : ''}
    <div class="row"><button class="btn" id="skip">Skip</button><button class="btn p" id="done">Done ✓ +${pts}</button></div>
    ${scoreRow()}`;
  if (c[2]) document.getElementById('tm').onclick = e => startTimer(e.target, c[2]);
  const next = got => { clearInterval(timer); if (got) { S.score[turn] += pts; save(); } turn = 1 - turn; onDone(); };
  document.getElementById('done').onclick = () => next(true);
  document.getElementById('skip').onclick = () => next(false);
}
const pick = (kind, max, exact) => {
  exact = exact || S.only;
  let pool = DECKS[kind].filter(c => c[0] === max);
  if (!exact || !pool.length) pool = DECKS[kind].filter(c => c[0] <= max);
  if (!pool.length) pool = DECKS[kind];
  return draw(kind + max + (exact ? 'x' : ''), pool);
};
function tod() {
  if (card) return cardView(card.c, card.k, () => { card = null; show(); });
  app.innerHTML = `<p class="turn">Turn: <b>${esc(S.names[turn])}</b></p>${levelChips()}
    <div class="card"><div class="big">Truth ya Dare?</div></div>
    <div class="row"><button class="btn g" data-k="truth">Truth</button><button class="btn p" data-k="dare">Dare</button></div>
    <div class="row"><button class="btn" data-k="any">🎲 Kismat pe chhodo</button></div>${scoreRow()}`;
  bindChips();
  app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k === 'any' ? rnd(['truth', 'dare']) : b.dataset.k;
    card = { c: pick(k, S.max), k: k === 'truth' ? 'Truth' : 'Dare' };
    show();
  });
}
function burn() {
  const lvl = S.only ? S.max : Math.min(S.max, 1 + Math.floor(burnN / 4));
  if (!card) {
    const k = burnN % 4 === 0 ? 'truth' : 'dare';
    card = { c: pick(k, lvl, true), k: k === 'truth' ? 'Truth' : 'Dare' };
  }
  cardView(card.c, card.k, () => { card = null; burnN++; show(); });
  app.insertAdjacentHTML('afterbegin',
    `<p class="mute" style="text-align:center">Stage ${lvl} / ${S.max} · card ${burnN + 1}</p><div class="bar"><i style="width:${Math.min(100, (burnN + 1) / (S.max * 4) * 100)}%"></i></div>`);
}

/* ---------- Simple decks ---------- */
function deck(kind, title, tag) {
  let c = null;
  const view = () => {
    if (!c) c = pick(kind, S.max);
    app.innerHTML = `${levelChips()}
      <div class="card"><div class="tag">${tag} · ${LEVELS[c[0]]}</div><div class="big">${fill(c[1])}</div></div>
      ${c[2] ? `<div class="row"><button class="btn g" id="tm">⏱ Timer start (${c[2]}s)</button></div>` : ''}
      <div class="row"><button class="btn p" id="nx">Next →</button></div>`;
    bindChips();
    if (c[2]) document.getElementById('tm').onclick = e => startTimer(e.target, c[2]);
    document.getElementById('nx').onclick = () => { clearInterval(timer); c = null; show(); };
    app.querySelectorAll('[data-lvl], #only').forEach(b => b.addEventListener(b.id ? 'change' : 'click', () => { c = null; }, true));
  };
  go(view, title);
}

/* ---------- Tease Dice ---------- */
function dice() {
  const giver = turn, r = Object.keys(DICE).map(k => [k, rnd(DICE[k])]);
  app.innerHTML = `<p class="turn"><b>${esc(S.names[giver])}</b> karega/karegi → <b>${esc(S.names[1 - giver])}</b> pe</p>
    <div class="dice">${r.map(d => `<div class="die"><small>${d[0]}</small><b>${esc(d[1])}</b></div>`).join('')}</div>
    <div class="row"><button class="btn p" id="roll">🎲 Roll again (turn badlegi)</button></div>
    <p class="mute" style="text-align:center">Pasand nahi aaya? Re-roll karo, koi sawaal nahi.</p>`;
  document.getElementById('roll').onclick = () => { turn = 1 - turn; show(); };
}

/* ---------- Roleplay Time Machine ---------- */
let rpEra = 'all', rp = null;
function roleplay() {
  if (!rp) {
    const s = draw('rp' + rpEra, SCENES.filter(x => rpEra === 'all' || x[0] === rpEra));
    const flip = Math.random() < 0.5;
    rp = { s, who: flip ? [1, 0] : [0, 1], twist: rnd(TWISTS), m: [rnd(MISSIONS), rnd(MISSIONS)] };
  }
  const { s, who, twist, m } = rp;
  app.innerHTML = `
    <div class="chips"><button class="chip ${rpEra === 'all' ? 'on' : ''}" data-era="all">✨ Sab</button>
      ${Object.keys(ERAS).map(e => `<button class="chip ${rpEra === e ? 'on' : ''}" data-era="${e}">${ERAS[e]}</button>`).join('')}</div>
    <div class="card"><div class="tag">${ERAS[s[0]]}</div><div class="big"><b>${esc(s[1])}</b></div><p>${esc(s[4])}</p></div>
    <ul class="list">
      <li><b>${esc(S.names[who[0]])}</b> → ${esc(s[2])}</li>
      <li><b>${esc(S.names[who[1]])}</b> → ${esc(s[3])}</li>
      <li class="hot">🌀 Twist: ${esc(twist)}</li>
      <li>🤫 ${esc(S.names[0])} ka secret mission (akele me tap karo):<br><span class="secret">${esc(m[0])}</span></li>
      <li>🤫 ${esc(S.names[1])} ka secret mission (akele me tap karo):<br><span class="secret">${esc(m[1])}</span></li>
    </ul>
    <div class="row"><button class="btn" id="sw">⇄ Roles swap</button><button class="btn p" id="nx">Naya scene</button></div>
    <p class="mute" style="text-align:center">Tip: character ke naam rakho, outfit/prop dhundo, aur scene ek knock se shuru karo.</p>`;
  app.querySelectorAll('[data-era]').forEach(b => b.onclick = () => { rpEra = b.dataset.era; rp = null; show(); });
  app.querySelectorAll('.secret').forEach(x => x.onclick = () => x.classList.toggle('show'));
  document.getElementById('sw').onclick = () => { rp.who.reverse(); show(); };
  document.getElementById('nx').onclick = () => { rp = null; show(); };
}

/* ---------- Fantasy Match ---------- */
let fm = null;
function matchIntro() {
  app.innerHTML = `<div class="card"><div class="big">Dono baari-baari, <b>akele me</b>, har fantasy pe vote karo.</div>
    <p class="mute">Sirf wahi dikhengi jinpe dono ne Haan / Shayad bola. Kisi ek ka bhi "Nahi" hamesha secret rehta hai — toh bina dare sach bolo.</p></div>
    <div class="row"><button class="btn p" id="st">${esc(S.names[0])} se shuru</button></div>`;
  document.getElementById('st').onclick = () => { fm = { who: 0, i: 0, a: [[], []] }; stack.pop(); go(matchVote, 'Fantasy Match'); };
}
function matchVote() {
  if (fm.i >= FANTASIES.length) {
    if (fm.who === 0) {
      app.innerHTML = `<div class="card"><div class="big">Ho gaya ✓<br>Ab phone <b>${esc(S.names[1])}</b> ko do.</div><p class="mute">Jawab chhup gaye hain.</p></div>
        <div class="row"><button class="btn p" id="st">Mai ${esc(S.names[1])} hu — start</button></div>`;
      document.getElementById('st').onclick = () => { fm.who = 1; fm.i = 0; show(); };
      return;
    }
    return matchResult();
  }
  app.innerHTML = `<p class="turn"><b>${esc(S.names[fm.who])}</b> — sirf tum dekho 👀</p>
    <div class="bar"><i style="width:${fm.i / FANTASIES.length * 100}%"></i></div>
    <div class="card"><div class="tag">${fm.i + 1} / ${FANTASIES.length}</div><div class="big">${esc(FANTASIES[fm.i])}</div></div>
    <div class="row"><button class="btn" data-v="0">Nahi</button><button class="btn g" data-v="1">Shayad</button><button class="btn p" data-v="2">Haan 🔥</button></div>`;
  app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { fm.a[fm.who][fm.i++] = +b.dataset.v; show(); });
}
function matchResult() {
  const hot = [], maybe = [];
  FANTASIES.forEach((f, i) => {
    const x = fm.a[0][i], y = fm.a[1][i];
    if (x === 2 && y === 2) hot.push(f); else if (x >= 1 && y >= 1) maybe.push(f);
  });
  app.innerHTML = `<h2>Tumhare matches 💘</h2>
    <p class="mute">${hot.length} pakke, ${maybe.length} explore karne layak. Baaki sab secret.</p>
    ${hot.length ? `<ul class="list">${hot.map(f => `<li class="hot">🔥 ${esc(f)}</li>`).join('')}</ul>` : ''}
    ${maybe.length ? `<ul class="list">${maybe.map(f => `<li>🤔 ${esc(f)}</li>`).join('')}</ul>` : ''}
    ${!hot.length && !maybe.length ? '<div class="box">Is baar koi match nahi — koi baat nahi. Mood badalta rehta hai, phir kabhi try karo.</div>' : ''}
    <div class="row"><button class="btn" id="ag">Dobara khelo</button></div>`;
  document.getElementById('ag').onclick = () => { stack.pop(); go(matchIntro, 'Fantasy Match'); };
}

/* ---------- Poke ---------- */
let pkCat = Object.keys(POKES)[0], pkMsg = null, pkFrom = 0;
function poke() {
  if (!pkMsg) pkMsg = draw('pk' + pkCat, POKES[pkCat]);
  app.innerHTML = `<p class="mute">Din me kabhi bhi partner ko ek chingari bhejo. Bhejne wala:</p>
    <div class="chips">${[0, 1].map(i => `<button class="chip ${pkFrom === i ? 'on' : ''}" data-f="${i}">${esc(S.names[i])}</button>`).join('')}</div>
    <div class="chips">${Object.keys(POKES).map(c => `<button class="chip ${pkCat === c ? 'on' : ''}" data-c="${esc(c)}">${c}</button>`).join('')}</div>
    <div class="card"><div class="tag">To: ${esc(S.names[1 - pkFrom])}</div><div class="big">${esc(pkMsg)}</div></div>
    <div class="row"><button class="btn" id="nx">Dusra dikhao</button><button class="btn p" id="wa">WhatsApp pe bhejo</button></div>
    <div class="row"><button class="btn" id="cp">Copy</button></div>`;
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { pkFrom = +b.dataset.f; show(); });
  app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { pkCat = b.dataset.c; pkMsg = null; show(); });
  document.getElementById('nx').onclick = () => { pkMsg = null; show(); };
  document.getElementById('wa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(pkMsg), '_blank', 'noopener');
  document.getElementById('cp').onclick = e => {
    const done = () => { e.target.textContent = 'Copied ✓'; };
    if (navigator.clipboard) navigator.clipboard.writeText(pkMsg).then(done, () => { e.target.textContent = 'Copy nahi hua — text select karke copy karo'; });
    else e.target.textContent = 'Text select karke copy karo';
  };
}

/* ---------- boot ---------- */
if (S.ready) go(home); else go(settings, 'Moshwa ❤️');
