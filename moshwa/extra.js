/* Moshwa — long-distance extras: bucket list, time capsule, 7-din tease, story builder, live room.
   Ye file app.js se pehle load hoti hai; saare helpers (S, go, esc, wa, link…) app.js me hain. */
const iso = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const daysTo = s => Math.round((new Date(s + 'T00:00') - new Date(iso() + 'T00:00')) / 864e5);
const whoChips = () => `<div class="chips">${[0, 1].map(i => `<button class="chip ${pkFrom === i ? 'on' : ''}" data-f="${i}">${esc(S.names[i])}</button>`).join('')}</div>`;
const bindWho = () => app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { pkFrom = +b.dataset.f; show(); });
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ---------- Bucket list ---------- */
function bucket() {
  const B = recs('b:').sort((a, b) => (a.c || 0) - (b.c || 0));
  app.innerHTML = `<p class="mute">Door rehte hue jodte raho — fantasies, dates, positions, jagah. Milne pe ek-ek tick karo.${cloudOn() ? ' ☁️ Dono phones pe apne aap sync hota hai.' : ''}</p>
    <div class="row"><input type="text" id="bi" maxlength="120" placeholder="Milne pe kya karna hai?"><button class="btn p" id="ba" style="flex:0 0 70px">Add</button></div>
    <ul class="list">${B.map(x => `<li class="${x.d ? 'done' : ''}"><label class="tick"><input type="checkbox" data-i="${esc(x.key)}" ${x.d ? 'checked' : ''}><span>${esc(x.t)}</span></label><button class="x" data-x="${esc(x.key)}" aria-label="Hatao">✕</button></li>`).join('') || '<li class="mute">Abhi khaali hai. Pehli wish jodo 👆</li>'}</ul>
    <p class="mute">${B.filter(x => x.d).length} / ${B.length} pure hue</p>
    ${cloudOn() ? '' : `<div class="row"><button class="btn" id="bs" ${B.length ? '' : 'disabled'}>List partner ko bhejo (link)</button></div>
    <p class="mute">Link ke bina sync chahiye toh Long Distance me ☁️ Moshwa Cloud on karo.</p>`}`;
  const add = () => { const v = document.getElementById('bi').value.trim(); if (v && !B.some(x => x.t === v)) put('b:' + rid(), { t: v, d: 0, c: Date.now() }); show(); };
  document.getElementById('ba').onclick = add;
  document.getElementById('bi').onkeydown = e => { if (e.key === 'Enter') add(); };
  app.querySelectorAll('[data-i]').forEach(c => c.onchange = () => { const x = rec(c.dataset.i); if (x) put(c.dataset.i, { t: x.t, c: x.c, d: c.checked ? 1 : 0 }); show(); });
  app.querySelectorAll('[data-x]').forEach(c => c.onclick = () => { del(c.dataset.x); show(); });
  const bs = document.getElementById('bs'); if (bs) bs.onclick = () => wa('📝 Humari Moshwa bucket list — kholo aur apni wishes jodo: ' + link('b', { l: B.map(x => x.t) }));
}

/* ---------- Time capsule ---------- */
let capText = '';
function capsule() {
  const my = me(), on = cloudOn(), all = recs('c:').sort((a, b) => a.d < b.d ? -1 : 1);
  const C = all.filter(c => c.from !== my || !on), sentN = on ? all.filter(c => c.from === my).length : 0;
  const m = meetDate(), def = m && daysTo(m) > 0 ? m : iso(new Date(Date.now() + 864e5));
  app.innerHTML = `<p class="mute">Aaj likho, par capsule sirf tay date ko khulega.${on ? ' ☁️ Seedha partner ke phone pe pahunchta hai.' : ' Likhne wala:'}</p>${on ? '' : whoChips()}
    <textarea id="ct" rows="5" maxlength="800" placeholder="Future wale partner ke liye letter, fantasy ya promise…">${esc(capText)}</textarea>
    <label>Kab khule?</label><input type="date" id="cdt" value="${def}" min="${iso()}">
    <div class="row"><button class="btn p" id="cw">${on ? '⏳ Capsule bhejo' : '⏳ Capsule WhatsApp karo'}</button></div>
    ${on ? `<p class="mute">Tumne ${sentN} capsule bheje hain jo partner ke paas hain.</p>` : ''}
    <h2>Mile hue capsules</h2>
    <ul class="list">${C.map(c => { const n = daysTo(c.d); return n > 0
      ? `<li>🔒 <b>${esc(c.f)}</b> ka capsule — ${n} din baad khulega (${esc(c.d)})</li>`
      : `<li class="hot">💌 <b>${esc(c.f)}</b> ka capsule (${esc(c.d)}) — tap karke padho<br><span class="secret">${esc(c.t)}</span><button class="x" data-x="${esc(c.key)}" aria-label="Hatao">✕</button></li>`; }).join('') || '<li class="mute">Abhi koi capsule nahi aaya.</li>'}</ul>`;
  bindWho();
  const tx = document.getElementById('ct'); tx.oninput = () => { capText = tx.value; };
  app.querySelectorAll('.secret').forEach(x => x.onclick = () => x.classList.toggle('show'));
  app.querySelectorAll('[data-x]').forEach(c => c.onclick = () => { del(c.dataset.x); show(); });
  document.getElementById('cw').onclick = () => {
    const d = document.getElementById('cdt').value, t = capText.trim();
    if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return tx.focus();
    if (on) { put('c:' + rid(), { t, f: S.names[my], d, from: my }); capText = ''; toast(`Capsule bhej diya ✓ ${d} ko khulega`); return show(); }
    wa(`⏳ Tumhare liye ek Moshwa time capsule — ${d} ko khulega. Link sambhal ke rakhna: ` + link('c', { t, f: S.names[pkFrom], d }));
  };
}

/* ---------- 7-din tease challenge ---------- */
const TEASE7 = [
  ["Ek purani photo bhejo aur batao us din tum kya soch rahe the.", "Sirf collarbone tak ki ek photo bhejo. Caption: '7 din'."],
  ["3 cheezein likh ke bhejo jo tum milte hi karna chahte ho.", "30-second ka whisper voice note: milne ki pehli raat ka plan."],
  ["Aaj raat call pe ek gaana saath suno — aankhen band.", "Aaj partner tumhara outfit choose karega. Pehen ke photo bhejo."],
  ["Ek chhoti love letter likho aur Sealed Message se bhejo.", "Aaj koi touch nahi — khud ko bhi nahi. Partner ko batao kitna mushkil hai."],
  ["Fantasy Match khelo aur milne ke liye ek match choose karo.", "Fantasy Theatre ka ek scene voice note me narrate karke bhejo."],
  ["Milne wale din ka pura plan banao — kya pehnoge, kaha jaoge.", "Call pe Call Dares ke 5 cards khelo — par finish mana hai. Ruko."],
  ["Aaj sirf ek message: 'kal'. Baaki sab aankhon se.", "Aakhri raat: ek Time Capsule likho jo kal milne ke baad khule. Aur aaj bhi — ruko."],
];
function tease() {
  const T = rec('t7'), m = meetDate(), canMeet = m && daysTo(m) >= 1, my = me(), on = cloudOn();
  if (!T || !T.start) {
    app.innerHTML = `<div class="card"><div class="big">7 din, 7 tasks.<br>Har din thoda aur.</div><p class="mute">Har din ek naya task khulta hai — dono karte ho. Level ${LEVELS[S.max]} ke hisaab se tasks soft ya hot honge.</p></div>
      <div class="row"><button class="btn p" id="t0">Aaj se shuru</button></div>
      ${canMeet ? '<div class="row"><button class="btn g" id="tm">Mulaqat se 7 din pehle shuru</button></div>' : '<p class="mute">Tip: Long Distance me mulaqat ki date daal do toh challenge theek milne se 7 din pehle shuru ho sakta hai.</p>'}`;
    document.getElementById('t0').onclick = () => { put('t7', { start: iso() }); show(); };
    if (canMeet) document.getElementById('tm').onclick = () => { put('t7', { start: iso(new Date(new Date(m + 'T00:00') - 7 * 864e5)) }); show(); };
    return;
  }
  const day = 1 - daysTo(T.start), hot = S.max >= 3 ? 1 : 0, done = (i, w) => !!rec(`t7d:${T.start}:${i}:${w}`);
  app.innerHTML = `<p class="mute">${day < 1 ? `Challenge ${-day + 1} din me shuru hoga (${esc(T.start)}).` : day > 7 ? 'Challenge pura! 🎉' : `Aaj din ${day} / 7`}${on ? ' · ☁️ partner ke ticks bhi dikhte hain.' : ' · Dono phones pe same din shuru karo.'}</p>
    <ul class="list">${TEASE7.map((t, i) => i + 1 > day
      ? `<li class="mute">🔒 Din ${i + 1}</li>`
      : `<li class="${i + 1 === day ? 'hot' : ''} ${done(i, my) ? 'done' : ''}"><label class="tick"><input type="checkbox" data-i="${i}" ${done(i, my) ? 'checked' : ''}><span><b>Din ${i + 1}:</b> ${esc(t[hot])}</span></label>${on ? `<div class="mute">${esc(S.names[1 - my])}: ${done(i, 1 - my) ? '✓ kar liya' : 'abhi baaki'}</div>` : ''}</li>`).join('')}</ul>
    <div class="row">${on ? '' : '<button class="btn" id="tw">Aaj ka proof WhatsApp karo</button>'}<button class="btn" id="tr">Reset</button></div>`;
  app.querySelectorAll('[data-i]').forEach(c => c.onchange = () => { const k = `t7d:${T.start}:${c.dataset.i}:${my}`; if (c.checked) put(k, { v: 1 }); else del(k); show(); });
  const tw = document.getElementById('tw'); if (tw) tw.onclick = () => wa(`🔥 Moshwa 7-din challenge — din ${Math.max(1, Math.min(7, day))} done ✓ `);
  document.getElementById('tr').onclick = e => { if (e.target.dataset.sure) { del('t7'); show(); } else { e.target.dataset.sure = 1; e.target.textContent = 'Pakka? Dobara dabao'; } };
}

/* ---------- Story builder ---------- */
let stText = '';
const storyId = () => (rec('ysid') || {}).v || '0';
const storyLines = () => recs(`y:${storyId()}:`).sort((a, b) => a.n - b.n || a.ts - b.ts);
function story() {
  const L = storyLines(), on = cloudOn(), my = on ? me() : pkFrom;
  app.innerHTML = `<p class="mute">Ek line tum, ek line partner — kahani badhti jaayegi.${on ? ' ☁️ Har line seedha partner ke phone pe dikhti hai.' : ' Har baar link wapas bhejo.'}</p>
    <ul class="list">${L.map(x => `<li><b>${esc(x.w)}:</b> ${esc(x.t)}</li>`).join('') || '<li class="mute">Kahani abhi shuru nahi hui. Pehli line likho ya 🎲 starter lo.</li>'}</ul>
    ${on ? '' : whoChips()}
    <textarea id="sx" rows="3" maxlength="300" placeholder="Agli line…">${esc(stText)}</textarea>
    <div class="chips"><button class="chip" id="sr">🎲 Starter scene</button></div>
    <div class="row"><button class="btn p" id="sw">${on ? 'Line jodo' : 'Line jodo & link bhejo'}</button></div>
    <div class="row"><button class="btn" id="sn">Nayi kahani</button></div>`;
  bindWho();
  const tx = document.getElementById('sx'); tx.oninput = () => { stText = tx.value; };
  document.getElementById('sr').onclick = () => { stText = tx.value = pick('theatre', S.max)[1].replace(/\{p\}/g, S.names[my]).replace(/\{o\}/g, S.names[1 - my]); };
  document.getElementById('sw').onclick = () => {
    if (!stText.trim()) return tx.focus();
    if (L.length >= 40) return toast('Kahani 40 lines ki ho gayi — nayi shuru karo.');
    put(`y:${storyId()}:${rid()}`, { w: S.names[my], t: stText.trim().slice(0, 300), n: L.length }); stText = ''; show();
    if (!on) wa('📖 Humari Moshwa kahani me nayi line — ab tumhari baari: ' + link('y', { l: storyLines().map(x => [x.w, x.t]) }));
  };
  document.getElementById('sn').onclick = e => { if (e.target.dataset.sure) { put('ysid', { v: rid() }); show(); } else { e.target.dataset.sure = 1; e.target.textContent = 'Purani hat jaayegi — dobara dabao'; } };
}

/* ---------- Live room (phone-to-phone, WebRTC via PeerJS) ---------- */
let lr = null;
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const loadPeer = () => new Promise((res, rej) => {
  if (window.Peer) return res();
  const s = document.createElement('script'); s.src = PEER_SRC; s.onload = res; s.onerror = rej; document.head.appendChild(s);
});
function lrClose() { if (lr) { try { lr.peer && lr.peer.destroy(); } catch (e) {} lr = null; } }
function live() {
  if (!lr) lr = { status: 'idle', kind: 'ldr', i: 0, max: S.max, only: !!S.only };
  onLeave = lrClose;
  lrDraw();
}
function lrSend(o) { if (lr && lr.conn && lr.conn.open) lr.conn.send(o); }
const lrState = () => lrSend({ t: 'state', kind: lr.kind, i: lr.i, max: lr.max, only: lr.only });
function lrFail(msg) { if (!lr) return; try { lr.peer && lr.peer.destroy(); } catch (e) {} lr.peer = lr.conn = null; lr.host = lr.guest = false; lr.status = 'idle'; lr.err = msg; lrDraw(); }
function lrBind(L, c) {
  L.conn = c;
  c.on('open', () => { if (lr !== L) return; L.status = 'on'; lrSend({ t: 'hello', n: L.me }); if (L.host) lrState(); lrDraw(); });
  c.on('data', d => { if (lr === L) lrData(d); });
  c.on('close', () => { if (lr === L && L.status === 'on') { L.status = 'lost'; lrDraw(); } });
}
async function lrConnect() {
  const code = (S.code || '').trim().toLowerCase();
  if (!code) return;
  const L = lr; L.err = ''; L.status = 'load'; L.me = S.names[pkFrom]; lrDraw();
  try { await loadPeer(); } catch (e) { return lr === L && lrFail('Live library load nahi hui — internet check karo.'); }
  if (lr !== L) return;
  const r = seeded('room|' + code), id = 'moshwa-' + [r(), r(), r()].map(x => Math.floor(x * 4294967295).toString(36)).join('');
  const asGuest = () => {
    L.guest = true;
    const g = L.peer = new Peer();
    g.on('open', () => { if (lr === L) lrBind(L, g.connect(id, { reliable: true })); });
    g.on('error', e => { if (lr === L) lrFail(e.type === 'peer-unavailable' ? 'Partner abhi room me nahi hai. Dono same code daal ke Connect dabao.' : 'Connection nahi bana (' + e.type + '). Dobara try karo.'); });
  };
  const h = L.peer = new Peer(id);
  L.status = 'wait'; lrDraw();
  h.on('open', () => { if (lr === L) { L.host = true; lrDraw(); } });
  h.on('connection', c => { if (lr !== L) return; if (L.conn && L.conn.open) return c.close(); lrBind(L, c); });
  h.on('error', e => {
    if (lr !== L) return;
    if (e.type === 'unavailable-id' && !L.host && !L.guest) { try { h.destroy(); } catch (x) {} asGuest(); }
    else if (!L.guest) lrFail('Connection nahi bana (' + e.type + '). Dobara try karo.');
  });
}
function lrData(d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hello') lr.other = String(d.n || 'Partner').slice(0, 20);
  if (d.t === 'state' && SYNC_DECKS[d.kind] && Number.isInteger(d.i) && d.i >= 0 && [1, 2, 3, 4, 5].includes(d.max)) { lr.kind = d.kind; lr.i = d.i; lr.max = d.max; lr.only = !!d.only; clearInterval(timer); }
  if (d.t === 'act') toast((lr.other || 'Partner') + ': ' + (d.v === 'done' ? 'Done ✓' : 'Skip'));
  if (d.t === 'buzz') lrBuzz(String(d.m || '💓').slice(0, 40));
  lrDraw();
}
function lrBuzz(m) {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
  document.body.classList.remove('buzz'); void document.body.offsetWidth; document.body.classList.add('buzz');
  try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 660; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.25); } catch (e) {}
  toast((lr.other || 'Partner') + ' ne poke kiya ' + m);
}
function lrDraw() {
  if (!lr || stack[stack.length - 1][0] !== live) return;
  if (lr.status === 'idle') {
    app.innerHTML = `<p class="mute">Dono same code daal ke Connect dabao. Phir ek ke Next dabate hi dusre ka card bhi badlega, aur Poke buzz seedha partner ke phone pe bajega.</p>
      <label>Room code</label><input type="text" id="code" maxlength="30" value="${esc(S.code || '')}" placeholder="koi bhi secret word">
      <label>Mai hu</label>${whoChips()}
      ${lr.err ? `<div class="box">${esc(lr.err)}</div>` : ''}
      <div class="row"><button class="btn p" id="go">Connect</button></div>
      <p class="mute">Live Room ke liye dono ka page khula hona chahiye. Connection seedha dono phones ke beech banta hai; sirf jodne ke liye ek public PeerJS server use hota hai, jise room ka ek scrambled ID dikhta hai — cards ya messages nahi.</p>`;
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { pkFrom = +b.dataset.f; lrDraw(); });
    document.getElementById('code').onchange = e => { S.code = e.target.value; save(); };
    document.getElementById('go').onclick = () => { S.code = document.getElementById('code').value; save(); lrConnect(); };
    return;
  }
  if (lr.status !== 'on') {
    app.innerHTML = `<div class="card"><div class="big">${{ load: 'Load ho raha hai…', wait: lr.host ? 'Room khula hai — partner ka intezaar ⏳' : 'Room dhundh rahe hain…', lost: 'Partner disconnect ho gaya 💔' }[lr.status]}</div>
      <p class="mute">Partner ko bolo wahi code daal ke Connect dabaye.</p></div><div class="row"><button class="btn" id="cx">${lr.status === 'lost' ? 'Dobara connect' : 'Cancel'}</button></div>`;
    document.getElementById('cx').onclick = () => lrFail('');
    return;
  }
  const names = lr.host ? [lr.me, lr.other || 'Partner'] : [lr.other || 'Partner', lr.me];
  const code = (S.code || '').trim().toLowerCase();
  const pool = seededShuffle(poolFor(lr.kind, lr.max, lr.only), [code, lr.kind, lr.max, lr.only].join('|'));
  const c = pool[lr.i % pool.length], p = lr.i % 2;
  const txt = esc(c[1]).replace(/\{p\}/g, `<b>${esc(names[p])}</b>`).replace(/\{o\}/g, `<b>${esc(names[1 - p])}</b>`);
  app.innerHTML = `<p class="turn">🟢 Live with <b>${esc(lr.other || 'Partner')}</b> · card #${lr.i + 1}</p>
    <div class="chips">${Object.keys(SYNC_DECKS).map(k => `<button class="chip ${lr.kind === k ? 'on' : ''}" data-sk="${k}">${SYNC_DECKS[k]}</button>`).join('')}</div>
    <div class="chips">${[1, 2, 3, 4, 5].map(l => `<button class="chip ${lr.max === l ? 'on' : ''}" data-ll="${l}">${LEVELS[l]}</button>`).join('')}</div>
    <label class="only"><input type="checkbox" id="lo" ${lr.only ? 'checked' : ''}> Sirf isi level ke cards</label>
    <div class="card"><div class="tag">${SYNC_DECKS[lr.kind]}${VDECKS[lr.kind] ? '' : ' · ' + LEVELS[c[0]]}</div><div class="big">${txt}</div></div>
    ${c[2] ? `<div class="row"><button class="btn g" id="tm">⏱ Timer start (${c[2]}s)</button></div>` : ''}
    <div class="row"><button class="btn" id="sk">Skip</button><button class="btn p" id="dn">Done ✓</button></div>
    <div class="row">${['💓 Poke', '😘', '🔥', '😈 Abhi'].map(m => `<button class="btn" data-bz="${m}">${m}</button>`).join('')}</div>`;
  const set = f => { f(); clearInterval(timer); lrState(); lrDraw(); };
  app.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => set(() => { lr.kind = b.dataset.sk; lr.i = 0; }));
  app.querySelectorAll('[data-ll]').forEach(b => b.onclick = () => set(() => { lr.max = +b.dataset.ll; lr.i = 0; }));
  document.getElementById('lo').onchange = e => set(() => { lr.only = e.target.checked; lr.i = 0; });
  if (c[2]) document.getElementById('tm').onclick = e => startTimer(e.target, c[2]);
  const act = v => { lrSend({ t: 'act', v }); set(() => { lr.i++; }); };
  document.getElementById('dn').onclick = () => act('done');
  document.getElementById('sk').onclick = () => act('skip');
  app.querySelectorAll('[data-bz]').forEach(b => b.onclick = () => { lrSend({ t: 'buzz', m: b.dataset.bz }); b.textContent = 'Bheja ✓'; setTimeout(() => { if (b.isConnected) b.textContent = b.dataset.bz; }, 1200); });
}
