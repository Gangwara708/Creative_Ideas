/* Moshwa — apne cards (local + GitHub publish), PIN lock, home-screen install.
   Ye file app.js se pehle load hoti hai; S, go, esc, toast, seeded… wahi se aate hain. */

/* ---------- Custom cards ---------- */
const CUSTOM_KINDS = { romance: 'Romance', truth: 'Truth', dare: 'Dare', ldr: 'Call Dare', never: 'Never Have I Ever', wyr: 'Would You Rather',
  date: 'Fantasy Date', pos: 'Kamasutra / Position', theatre: 'Fantasy Theatre', poke: 'Poke message' };
const BASE = {};
let remoteCards = [];
const cardKey = c => c.k + '|' + (c.c || '') + '|' + c.t;
const validCard = c => !!c && typeof c === 'object' && !!CUSTOM_KINDS[c.k] && typeof c.t === 'string' && !!c.t.trim() && c.t.length <= 400 &&
  (c.k === 'poke' ? Array.isArray(POKES[c.c]) : [1, 2, 3, 4, 5].includes(c.l)) && (c.s === undefined || (Number.isInteger(c.s) && c.s > 0 && c.s <= 3600));
function dedupe(list) {
  const seen = new Set();
  return list.filter(c => validCard(c) && !seen.has(cardKey(c)) && seen.add(cardKey(c)));
}
const allCustom = () => dedupe(remoteCards.concat(S.mine || []));
function applyCustom() {
  if (!BASE.d) { BASE.d = {}; BASE.p = {}; for (const k in DECKS) BASE.d[k] = DECKS[k].slice(); for (const k in POKES) BASE.p[k] = POKES[k].slice(); }
  for (const k in DECKS) { DECKS[k].length = 0; DECKS[k].push(...BASE.d[k]); }
  for (const k in POKES) { POKES[k].length = 0; POKES[k].push(...BASE.p[k]); }
  allCustom().forEach(c => { if (c.k === 'poke') POKES[c.c].push(c.t); else DECKS[c.k].push(c.s ? [c.l, c.t, c.s] : [c.l, c.t]); });
  Object.keys(bags).forEach(k => delete bags[k]);
}
async function loadRemote() {
  try {
    const r = await fetch('custom.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    remoteCards = dedupe((await r.json()).cards || []);
    S.mine = (S.mine || []).filter(c => !(c.pub && remoteCards.some(x => cardKey(x) === cardKey(c))));
    save(); applyCustom();
  } catch (e) { /* offline: local cards hi chalenge */ }
}

/* GitHub: custom.json ko repo me commit karta hai. Token sirf is phone ke browser me rehta hai. */
function ghCfg() {
  const g = S.gh || {}, h = location.hostname, parts = location.pathname.split('/').filter(x => x && !x.includes('.'));
  const pages = h.endsWith('.github.io');
  return { token: g.token || '', owner: pages ? h.split('.')[0] : 'gangwara708', repo: pages && parts[0] ? parts[0] : 'Creative_Ideas',
    branch: g.branch || 'claude/roleplay-fantasies-game-hu3peq', path: (pages ? parts.slice(1).concat('custom.json').join('/') : 'moshwa/custom.json') };
}
const ghErr = s => s === 401 ? 'Token galat hai ya expire ho gaya.' : s === 403 ? 'Token ko is repo pe likhne ki permission nahi hai (Contents: Read and write chahiye).'
  : s === 404 || s === 422 ? 'Repo ya branch nahi mila — branch ka naam check karo.' : 'GitHub error ' + s + '. Thodi der me try karo.';
async function ghCommit(mutate, message) {
  const g = ghCfg(), api = `https://api.github.com/repos/${g.owner}/${g.repo}/contents/${g.path}`;
  const H = { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github+json' };
  for (let n = 0; n < 2; n++) {
    const r = await fetch(api + '?ref=' + encodeURIComponent(g.branch) + '&t=' + Date.now(), { headers: H, cache: 'no-store' });
    let sha, cards = [];
    if (r.status === 200) {
      const j = await r.json(); sha = j.sha;
      try { cards = JSON.parse(decodeURIComponent(escape(atob(j.content.replace(/\s/g, ''))))).cards || []; } catch (e) {}
    } else if (r.status !== 404) throw new Error(ghErr(r.status));
    cards = dedupe(mutate(dedupe(cards)));
    const body = { message, branch: g.branch, content: btoa(unescape(encodeURIComponent(JSON.stringify({ cards }, null, 1) + '\n'))) };
    if (sha) body.sha = sha;
    const w = await fetch(api, { method: 'PUT', headers: H, body: JSON.stringify(body) });
    if (w.ok) { remoteCards = cards; return; }
    if (w.status !== 409) throw new Error(ghErr(w.status));
  }
  throw new Error('Kisi aur ne abhi-abhi change kiya — dobara try karo.');
}

let cr = null;
function creator() {
  if (!cr) cr = { k: 'dare', l: S.max, c: Object.keys(POKES)[0], t: '', s: '' };
  const list = allCustom(), isRemote = c => remoteCards.some(x => cardKey(x) === cardKey(c));
  const opt = (o, sel) => Object.keys(o).map(k => `<option value="${esc(k)}" ${k === sel ? 'selected' : ''}>${esc(o[k])}</option>`).join('');
  app.innerHTML = `<p class="mute">Apna card likho — kisi bhi section me. Sirf is phone pe rakh sakte ho, ya website pe publish karo toh dono ke phones pe aa jaayega.</p>
    <label>Section</label><select id="ck">${opt(CUSTOM_KINDS, cr.k)}</select>
    ${cr.k === 'poke' ? `<label>Category</label><select id="cc">${opt(Object.fromEntries(Object.keys(POKES).map(k => [k, k])), cr.c)}</select>`
      : `<label>Level</label><div class="chips">${[1, 2, 3, 4, 5].map(l => `<button class="chip ${cr.l === l ? 'on' : ''}" data-cl="${l}">${LEVELS[l]}</button>`).join('')}</div>`}
    <label>Card ka text</label><textarea id="ctx" rows="4" maxlength="400" placeholder="Jaise: {o} ki aankhon pe patti baandho aur…">${esc(cr.t)}</textarea>
    ${cr.k === 'poke' ? '' : `<p class="mute">{p} = jiski turn hai, {o} = partner — naam apne aap bhar jaate hain.</p>
    <label>Timer (seconds, optional)</label><input type="number" id="cs" min="0" max="3600" inputmode="numeric" value="${esc(cr.s)}" placeholder="jaise 60">`}
    ${cr.err ? `<div class="box">${esc(cr.err)}</div>` : ''}
    ${cr.step ? `<label>Commit message</label><input type="text" id="cm" maxlength="100" value="${esc(cr.msg)}">
      <div class="row"><button class="btn" id="cb">Cancel</button><button class="btn p" id="cgo" ${cr.busy ? 'disabled' : ''}>${cr.busy ? 'Push ho raha hai…' : 'Commit & push 🚀'}</button></div>`
      : `<div class="row"><button class="btn" id="cl">📱 Sirf is phone pe</button><button class="btn p" id="cp">🚀 Website pe publish</button></div>`}
    <div class="row"><button class="btn" id="cg">⚙ GitHub publish setup ${ghCfg().token ? '✓' : ''}</button></div>
    <h2>Tumhare cards (${list.length})</h2>
    <ul class="list">${list.map((c, i) => `<li>${isRemote(c) || c.pub ? '🌐' : '📱'} <b>${esc(CUSTOM_KINDS[c.k])}</b>${c.k === 'poke' ? '' : ' · ' + LEVELS[c.l]}<br>${esc(c.t)}<button class="x" data-x="${i}" aria-label="Hatao">✕</button></li>`).join('') || '<li class="mute">Abhi koi custom card nahi.</li>'}</ul>
    <p class="mute">🌐 = website pe (dono ke liye) · 📱 = sirf is phone pe. Publish ke 1–2 minute baad partner ke phone pe app dobara kholne se card aa jaata hai.</p>`;
  const tx = document.getElementById('ctx'); tx.oninput = () => { cr.t = tx.value; };
  document.getElementById('ck').onchange = e => { cr.k = e.target.value; cr.step = null; show(); };
  const cc = document.getElementById('cc'); if (cc) cc.onchange = () => { cr.c = cc.value; };
  const cs = document.getElementById('cs'); if (cs) cs.oninput = () => { cr.s = cs.value; };
  app.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => { cr.l = +b.dataset.cl; show(); });
  document.getElementById('cg').onclick = () => go(ghSetup, 'GitHub Setup');
  const build = () => {
    const t = cr.t.trim(), s = parseInt(cr.s, 10);
    const c = cr.k === 'poke' ? { k: 'poke', c: cr.c, t } : Object.assign({ k: cr.k, l: cr.l, t }, s > 0 ? { s: Math.min(s, 3600) } : {});
    if (!validCard(c)) { tx.focus(); return null; }
    return c;
  };
  const keep = (c, pub) => { S.mine = dedupe((S.mine || []).concat([Object.assign({}, c, pub ? { pub: 1 } : {})])); save(); applyCustom(); cr.t = ''; cr.s = ''; cr.step = null; cr.err = ''; };
  if (cr.step) {
    document.getElementById('cm').oninput = e => { cr.msg = e.target.value; };
    document.getElementById('cb').onclick = () => { cr.step = null; cr.err = ''; show(); };
    document.getElementById('cgo').onclick = async () => {
      const c = build(); if (!c) return;
      cr.busy = true; cr.err = ''; show();
      try { await ghCommit(cards => cards.concat([c]), cr.msg.trim() || 'Add custom card'); keep(c, true); toast('Push ho gaya ✓ 1–2 minute me website pe live'); }
      catch (e) { cr.err = e.message === 'Failed to fetch' ? 'Internet nahi hai — card abhi publish nahi hua.' : e.message; }
      cr.busy = false; show();
    };
  } else {
    document.getElementById('cl').onclick = () => { const c = build(); if (c) { keep(c, false); toast('Is phone pe save ho gaya ✓'); show(); } };
    document.getElementById('cp').onclick = () => {
      const c = build(); if (!c) return;
      if (!ghCfg().token) return go(ghSetup, 'GitHub Setup');
      cr.step = 1; cr.msg = `Add ${CUSTOM_KINDS[c.k]} card: ${c.t.slice(0, 40)}`; show();
    };
  }
  app.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
    const c = list[+b.dataset.x];
    if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Pakka?'; return; }
    if (isRemote(c)) {
      if (!ghCfg().token) return go(ghSetup, 'GitHub Setup');
      b.textContent = '…';
      try { await ghCommit(cards => cards.filter(x => cardKey(x) !== cardKey(c)), `Remove ${CUSTOM_KINDS[c.k]} card: ${c.t.slice(0, 40)}`); }
      catch (e) { cr.err = e.message; return show(); }
    }
    S.mine = (S.mine || []).filter(x => cardKey(x) !== cardKey(c)); save(); applyCustom(); show();
  });
}
function ghSetup() {
  const g = ghCfg();
  app.innerHTML = `<p class="mute">Ek baar ka setup. Iske baad app se bana har card seedha <b>${esc(g.owner)}/${esc(g.repo)}</b> repo me commit hota hai aur website pe aa jaata hai.</p>
    <div class="box"><b>Token kaise banaye</b><ul>
      <li>GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token</li>
      <li>Repository access: <b>Only select repositories</b> → ${esc(g.repo)}</li>
      <li>Permissions → Repository permissions → <b>Contents: Read and write</b></li>
      <li>Generate karke token copy karo aur neeche paste karo</li></ul></div>
    <label>GitHub token</label><input type="password" id="gt" value="${esc(g.token)}" placeholder="github_pat_…" autocomplete="off">
    <label>Branch (jis se website host hoti hai)</label><input type="text" id="gb" value="${esc(g.branch)}">
    <div id="gm"></div>
    <div class="row"><button class="btn p" id="gs">Save & test</button></div>
    ${g.token ? '<div class="row"><button class="btn" id="gx">Token is phone se hatao</button></div>' : ''}
    <p class="mute">Token sirf is phone ke browser me save hota hai aur sirf GitHub ko bheja jaata hai. Isse sirf is ek repo ki files badli ja sakti hain. Partner ko bhi publish karna ho toh unke phone pe bhi yahi token daalo.</p>`;
  const msg = t => { document.getElementById('gm').innerHTML = `<div class="box">${esc(t)}</div>`; };
  document.getElementById('gs').onclick = async () => {
    S.gh = { token: document.getElementById('gt').value.trim(), branch: document.getElementById('gb').value.trim() }; save();
    const c = ghCfg(); if (!c.token) return msg('Token khaali hai.');
    msg('Check ho raha hai…');
    try {
      const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/branches/${encodeURIComponent(c.branch)}`, { headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' } });
      msg(r.ok ? 'Sab theek ✓ Ab wapas jaake card publish karo.' : ghErr(r.status));
    } catch (e) { msg('Internet nahi hai — baad me test karo.'); }
  };
  const gx = document.getElementById('gx'); if (gx) gx.onclick = () => { delete S.gh; save(); show(); };
}

/* ---------- PIN lock ---------- */
const pinHash = p => { const r = seeded('moshwa-pin|' + p); return [r(), r()].map(x => Math.floor(x * 4294967295).toString(36)).join(''); };
function lock() {
  if (!S.pin || document.getElementById('lock')) return;
  const el = document.createElement('div'); el.id = 'lock';
  let v = '';
  const draw = bad => {
    el.innerHTML = `<div class="lk"><div class="lt">🔒</div><p>${bad ? 'Galat PIN' : 'PIN daalo'}</p>
      <div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < v.length ? 'f' : ''}"></i>`).join('')}</div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div></div>`;
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => press(b.dataset.k));
  };
  const press = k => {
    if (k === '⌫') v = v.slice(0, -1); else if (/^\d$/.test(k) && v.length < 4) v += k; else return;
    if (v.length === 4) { if (pinHash(v) === S.pin) { document.removeEventListener('keydown', key); return el.remove(); } v = ''; return draw(true); }
    draw();
  };
  const key = e => press(e.key === 'Backspace' ? '⌫' : e.key);
  document.addEventListener('keydown', key);
  draw(); document.body.appendChild(el);
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 60000) lock();
});

/* ---------- Home-screen install ---------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});

function extraSettings() {
  return `<div class="box"><b>🔒 PIN lock</b> — ${S.pin ? 'chalu hai' : 'band hai'}
      <p class="mute">App kholne pe, aur 1 minute bahar rehne ke baad, 4-digit PIN maanga jaayega.</p>
      <input type="password" id="pin" inputmode="numeric" maxlength="4" placeholder="Naya 4-digit PIN" autocomplete="off">
      <div class="row"><button class="btn" id="ps">${S.pin ? 'PIN badlo' : 'PIN lagao'}</button>${S.pin ? '<button class="btn" id="px">PIN hatao</button>' : ''}</div>
      <p class="mute">PIN bhool gaye toh browser me is site ka data clear karna padega (scores aur lists bhi mit jaayengi).</p></div>
    <div class="box"><b>📲 Home screen pe lagao</b>
      <p class="mute">App ki tarah icon se khulega, aur ek baar khulne ke baad bina internet ke bhi chalega.</p>
      ${installEvt ? '<div class="row"><button class="btn g" id="ins">Install karo</button></div>' : '<ul><li><b>Android (Chrome):</b> ⋮ menu → "Add to Home screen" / "Install app"</li><li><b>iPhone (Safari):</b> Share button → "Add to Home Screen"</li></ul>'}</div>`;
}
function bindExtraSettings() {
  document.getElementById('ps').onclick = () => {
    const v = document.getElementById('pin').value;
    if (!/^\d{4}$/.test(v)) return toast('PIN me theek 4 digits hone chahiye');
    S.pin = pinHash(v); save(); toast('PIN lag gaya ✓'); show();
  };
  const px = document.getElementById('px'); if (px) px.onclick = () => { delete S.pin; save(); toast('PIN hat gaya'); show(); };
  const ins = document.getElementById('ins'); if (ins) ins.onclick = () => { installEvt.prompt(); installEvt = null; };
}
