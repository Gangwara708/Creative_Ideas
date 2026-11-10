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
  ['🌍', 'Long Distance', 'Door ho? Sync play, sealed links, call dares, countdown', () => go(ldr, 'Long Distance')],
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
const poolFor = (kind, max, exact) => {
  let pool = DECKS[kind].filter(c => c[0] === max);
  if (!exact || !pool.length) pool = DECKS[kind].filter(c => c[0] <= max);
  return pool.length ? pool : DECKS[kind];
};
const pick = (kind, max, exact) => {
  exact = exact || S.only;
  return draw(kind + max + (exact ? 'x' : ''), poolFor(kind, max, exact));
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
    <div class="row"><button class="btn p" id="st">${esc(S.names[0])} se shuru (ek hi phone)</button></div>
    <div class="row"><button class="btn g" id="rm">🌍 Long distance — link se khelo</button></div>
    <p class="mute">Link wale mode me tum yaha vote karke link bhejte ho; partner apne phone pe vote karta hai aur matches wahi khulte hain.</p>`;
  document.getElementById('st').onclick = () => { fm = { who: 0, i: 0, a: [[], []] }; stack.pop(); go(matchVote, 'Fantasy Match'); };
  document.getElementById('rm').onclick = () => { fm = { who: 0, i: 0, a: [[], []], remote: true }; stack.pop(); go(matchVote, 'Fantasy Match'); };
}
function matchVote() {
  if (fm.i >= FANTASIES.length) {
    if (fm.who === 0 && fm.remote) {
      const url = link('m', { a: fm.a[0].join('') });
      app.innerHTML = `<div class="card"><div class="big">Tumhare votes seal ho gaye 🔒</div><p class="mute">Ye link partner ko bhejo. Wo vote karenge toh matches unke phone pe khulenge — phir wo result tumhe bhej sakte hain.</p></div>
        <div class="row"><button class="btn p" id="wa">WhatsApp pe link bhejo</button></div><div class="row"><button class="btn" id="cp">Link copy karo</button></div>`;
      document.getElementById('wa').onclick = () => wa('💘 Moshwa Fantasy Match — maine vote kar diya, ab tumhari baari: ' + url);
      document.getElementById('cp').onclick = e => copy(url, e.target);
      return;
    }
    if (fm.who === 0) {
      app.innerHTML = `<div class="card"><div class="big">Ho gaya ✓<br>Ab phone <b>${esc(S.names[1])}</b> ko do.</div><p class="mute">Jawab chhup gaye hain.</p></div>
        <div class="row"><button class="btn p" id="st">Mai ${esc(S.names[1])} hu — start</button></div>`;
      document.getElementById('st').onclick = () => { fm.who = 1; fm.i = 0; show(); };
      return;
    }
    return matchResult();
  }
  app.innerHTML = `<p class="turn"><b>${fm.remote ? 'Tumhare votes' : esc(S.names[fm.who])}</b> — sirf tum dekho 👀</p>
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
    ${fm.remote ? '<div class="row"><button class="btn p" id="sh">Result partner ko WhatsApp karo</button></div>' : ''}
    <div class="row"><button class="btn" id="ag">Dobara khelo</button></div>`;
  if (fm.remote) document.getElementById('sh').onclick = () => wa('💘 Humare Moshwa matches:\n' + hot.map(f => '🔥 ' + f).concat(maybe.map(f => '🤔 ' + f)).join('\n'));
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
  document.getElementById('wa').onclick = () => wa(pkMsg);
  document.getElementById('cp').onclick = e => {
    const done = () => { e.target.textContent = 'Copied ✓'; };
    if (navigator.clipboard) navigator.clipboard.writeText(pkMsg).then(done, () => { e.target.textContent = 'Copy nahi hua — text select karke copy karo'; });
    else e.target.textContent = 'Text select karke copy karo';
  };
}

/* ---------- Long Distance ---------- */
const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } };
const link = (k, o) => location.href.split('#')[0] + '#' + k + '=' + b64(o);
const wa = text => window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
function copy(text, btn) {
  const no = () => { btn.textContent = 'Copy nahi hua — share button use karo'; };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied ✓'; }, no); else no();
}
/* same seed => same order on both phones, bina server ke */
function seeded(str) {
  let h = 1779033703;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
function seededShuffle(arr, seed) {
  const r = seeded(seed), a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

function ldr() {
  let cd = 'Agli mulaqat ki date daalo 👇';
  if (S.meet) {
    const days = Math.ceil((new Date(S.meet + 'T00:00') - new Date()) / 864e5);
    cd = days > 0 ? `<b style="font-size:34px;color:var(--rose)">${days}</b> din baaki — phir saath ❤️` : 'Aaj ka din aa gaya! Phone rakho aur gale lago. ❤️';
  }
  const q = seededShuffle(DECKS.truth.filter(c => c[0] <= Math.min(S.max, 3)), 'q' + today())[0][1]
    .replace(/\{o\}/g, 'partner').replace(/\{p\}/g, 'tum');
  app.innerHTML = `
    <div class="card" style="min-height:0"><div class="tag">Countdown</div><div class="big">${cd}</div>
      <input type="date" id="meet" value="${esc(S.meet || '')}" style="margin-top:12px"></div>
    <div class="card" style="min-height:0"><div class="tag">Aaj ka sawaal · dono phones pe same</div><div class="big">${esc(q)}</div></div>
    <div class="row"><button class="btn" id="qa">Apna jawab WhatsApp karo</button></div>
    <div class="grid">
      <button class="tile" id="t1"><span class="em">📞</span><b>Sync Play</b><span class="d">Call pe same code daalo — dono ko same card dikhega</span></button>
      <button class="tile" id="t2"><span class="em">💌</span><b>Sealed Message</b><span class="d">Dare ya secret ko link me band karke bhejo</span></button>
      <button class="tile" id="t3"><span class="em">💘</span><b>Remote Fantasy Match</b><span class="d">Alag phones pe vote, link se match</span></button>
      <button class="tile" id="t4"><span class="em">📲</span><b>Poke</b><span class="d">Din bhar ke teasing texts</span></button>
    </div>`;
  document.getElementById('meet').onchange = e => { S.meet = e.target.value; save(); show(); };
  document.getElementById('qa').onclick = () => wa('❓ Aaj ka Moshwa sawaal: ' + q + '\n\nMera jawab: ');
  document.getElementById('t1').onclick = () => go(sync, 'Sync Play');
  document.getElementById('t2').onclick = () => { sealText = ''; go(seal, 'Sealed Message'); };
  document.getElementById('t3').onclick = () => go(matchIntro, 'Fantasy Match');
  document.getElementById('t4').onclick = () => go(poke, 'Poke');
}

const SYNC_DECKS = { ldr: '📞 Call Dares', truth: 'Truth', dare: 'Dare', wyr: 'Ye ya Wo', never: 'Never', theatre: 'Theatre' };
let sy = { kind: 'ldr', i: 0 };
function sync() {
  const code = (S.code || '').trim().toLowerCase();
  const pool = seededShuffle(poolFor(sy.kind, S.max, S.only), [code, sy.kind, S.max, S.only].join('|'));
  const c = pool[sy.i % pool.length];
  app.innerHTML = `
    <label>Room code — dono same likho (jaise: moshwa-saturday)</label>
    <input type="text" id="code" maxlength="30" value="${esc(S.code || '')}" placeholder="koi bhi secret word">
    <div class="chips">${Object.keys(SYNC_DECKS).map(k => `<button class="chip ${sy.kind === k ? 'on' : ''}" data-sk="${k}">${SYNC_DECKS[k]}</button>`).join('')}</div>
    ${levelChips()}
    ${code ? `<p class="turn">Card <b>#${sy.i + 1}</b> — partner se confirm karo number same hai</p>
      <div class="card"><div class="tag">${SYNC_DECKS[sy.kind]} · ${LEVELS[c[0]]}</div><div class="big">${fill(c[1], sy.i % 2)}</div></div>
      ${c[2] ? `<div class="row"><button class="btn g" id="tm">⏱ Timer start (${c[2]}s)</button></div>` : ''}
      <div class="row"><button class="btn" id="pv" ${sy.i ? '' : 'disabled'}>← Pichla</button><button class="btn p" id="nx">Next →</button></div>`
      : '<div class="box">Code daalo toh cards khulenge. Call pe "3-2-1 Next" bolke saath me aage badho.</div>'}
    <p class="mute">Same card ke liye dono phones pe code, deck aur level same hone chahiye — aur ⚙ Settings me Player 1 / Player 2 ka order bhi.</p>`;
  bindChips();
  document.getElementById('code').onchange = e => { S.code = e.target.value; save(); sy.i = 0; show(); };
  app.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { sy.kind = b.dataset.sk; sy.i = 0; show(); });
  app.querySelectorAll('[data-lvl], #only').forEach(b => b.addEventListener(b.id ? 'change' : 'click', () => { sy.i = 0; }, true));
  if (!code) return;
  if (c[2]) document.getElementById('tm').onclick = e => startTimer(e.target, c[2]);
  document.getElementById('nx').onclick = () => { clearInterval(timer); sy.i++; show(); };
  document.getElementById('pv').onclick = () => { clearInterval(timer); sy.i--; show(); };
}

let sealText = '';
function seal() {
  const from = S.names[pkFrom], plain = t => t.replace(/\{p\}/g, 'Tum').replace(/\{o\}/g, from);
  app.innerHTML = `<p class="mute">Jo likhoge wo ek link me band ho jaayega. Partner link kholega, tap karega, tab dikhega. Bhejne wala:</p>
    <div class="chips">${[0, 1].map(i => `<button class="chip ${pkFrom === i ? 'on' : ''}" data-f="${i}">${esc(S.names[i])}</button>`).join('')}</div>
    <textarea id="tx" rows="5" maxlength="600" placeholder="Apna dare, secret, order ya fantasy likho…">${esc(sealText)}</textarea>
    <div class="chips"><button class="chip" data-r="dare">🎲 Random dare</button><button class="chip" data-r="truth">🎲 Random truth</button><button class="chip" data-r="ldr">🎲 Call dare</button><button class="chip" data-r="theatre">🎲 Fantasy scene</button></div>
    <p class="mute">Random cards ka level: ${LEVELS[S.max]} (⚙ se badlo)</p>
    <div class="row"><button class="btn p" id="wa">💌 Seal karke WhatsApp karo</button></div><div class="row"><button class="btn" id="cp">Link copy karo</button></div>`;
  const tx = document.getElementById('tx');
  tx.oninput = () => { sealText = tx.value; };
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { pkFrom = +b.dataset.f; show(); });
  app.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { sealText = tx.value = plain(pick(b.dataset.r, S.max)[1]); });
  const url = () => sealText.trim() ? link('s', { t: sealText.trim(), f: from }) : (tx.focus(), null);
  document.getElementById('wa').onclick = () => { const u = url(); if (u) wa('💌 Tumhare liye ek sealed Moshwa message hai. Akele me kholna: ' + u); };
  document.getElementById('cp').onclick = e => { const u = url(); if (u) copy(u, e.target); };
}
function sealed(msg) {
  return () => {
    app.innerHTML = `<p class="turn"><b>${esc(msg.f || 'Partner')}</b> ne tumhare liye kuch bheja hai 💌</p>
      <div class="card"><div class="tag">Akele ho? Tab tap karo</div><div class="big secret">${esc(msg.t)}</div></div>
      <div class="row"><button class="btn" id="rp">Jawab WhatsApp karo</button><button class="btn p" id="bk">Badla lo 😈</button></div>`;
    app.querySelector('.secret').onclick = e => e.currentTarget.classList.add('show');
    document.getElementById('rp').onclick = () => wa('💌 Tumhara sealed message khol liya… ');
    document.getElementById('bk').onclick = () => { sealText = ''; go(seal, 'Sealed Message'); };
  };
}

/* ---------- boot ---------- */
if (S.ready) go(home); else go(settings, 'Moshwa ❤️');
function route() {
  const m = location.hash.match(/^#([sm])=(.+)$/), o = m && unb64(m[2]);
  if (!o) return;
  history.replaceState(null, '', location.href.split('#')[0]);
  if (m[1] === 's' && typeof o.t === 'string') go(sealed({ t: o.t.slice(0, 600), f: String(o.f || '').slice(0, 20) }), 'Sealed Message');
  if (m[1] === 'm' && typeof o.a === 'string' && o.a.length === FANTASIES.length && /^[012]+$/.test(o.a)) {
    fm = { who: 1, i: 0, a: [o.a.split('').map(Number), []], remote: true };
    go(matchVote, 'Fantasy Match');
  }
}
route();
window.addEventListener('hashchange', route);
