/* Moshwa — shared store + Moshwa Cloud.
   Bucket list, story, capsules, messages, fantasy votes, tease aur countdown sab "records" me rehte hain.
   Cloud on ho toh records encrypt hoke GitHub repo ki `moshwa-data` branch me jaate hain aur dono phones
   apne aap sync hote hain. Ye file sabse pehle load hoti hai; S, go, esc, toast, ghCfg… baad ki files me hain. */

const DATA_BRANCH = 'moshwa-data', DATA_PATH = 'state.json', MONTH = 30 * 864e5;
const R = () => (S.recs = S.recs || {});
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const me = () => (S.cloud && S.cloud.me === 1 ? 1 : 0);
const rec = key => { const x = R()[key]; return x && !x.del ? x : null; };
const recs = prefix => { const r = R(); return Object.keys(r).filter(k => k.startsWith(prefix) && !r[k].del).map(k => Object.assign({ key: k }, r[k])); };
function put(key, val) {
  const old = R()[key];
  R()[key] = Object.assign({}, val, { ts: Math.max(Date.now(), old ? old.ts + 1 : 0) });
  save(); cloudSoon();
}
const del = key => put(key, { del: 1 });
const meetDate = () => (rec('meet') || {}).d || '';
const expired = (k, x) => (x.del || k.startsWith('m:') || k.startsWith('r:')) && x.ts < Date.now() - MONTH;

/* purane (link wale) data ko ek baar records me le aao */
function migrate() {
  if (S.mig1) return;
  (S.bucket || []).forEach((x, i) => put('b:' + rid(), { t: x.t, d: x.d ? 1 : 0, c: Date.now() + i }));
  (S.caps || []).forEach(c => put('c:' + rid(), { t: c.t, f: c.f, d: c.d, from: -1 }));
  ((S.story || {}).l || []).forEach((x, i) => put('y:0:' + rid(), { w: x[0], t: x[1], n: i }));
  if (S.tease) { put('t7', { start: S.tease.start }); (S.tease.done || []).forEach((v, i) => { if (v) put(`t7d:${S.tease.start}:${i}:${me()}`, { v: 1 }); }); }
  if (S.meet) put('meet', { d: S.meet });
  ['bucket', 'caps', 'story', 'tease', 'meet'].forEach(k => delete S[k]);
  S.mig1 = 1; save();
}

/* ---------- Cloud engine ---------- */
const cloud = { status: 'off', err: '', head: null, sha: null, remote: {}, busy: false, again: false, t: null, key: null, keyFor: '', force: false };
const canCrypt = () => !!(window.crypto && crypto.subtle);
const cloudOn = () => !!(S.cloud && S.cloud.on && S.cloud.pass && canCrypt() && ghCfg().token);
const te = new TextEncoder(), td = new TextDecoder();
const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function ckey() {
  const g = ghCfg(), id = S.cloud.pass + '|' + g.owner + '/' + g.repo;
  if (cloud.key && cloud.keyFor === id) return cloud.key;
  const base = await crypto.subtle.importKey('raw', te.encode(S.cloud.pass), 'PBKDF2', false, ['deriveKey']);
  cloud.key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: te.encode('moshwa-cloud-v1|' + (g.owner + '/' + g.repo).toLowerCase()), iterations: 250000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  cloud.keyFor = id;
  return cloud.key;
}
async function encDoc(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await ckey(), te.encode(JSON.stringify(obj)));
  return JSON.stringify({ v: 1, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) });
}
async function decDoc(b64file) {
  try {
    const f = JSON.parse(atob(b64file.replace(/\s/g, '')));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(f.iv) }, await ckey(), fromB64(f.ct));
    return JSON.parse(td.decode(pt));
  } catch (e) { throw new Error('badpass'); }
}
function mergeRecs(remote) {
  const r = R(), changed = [];
  let ahead = false;
  for (const k in remote) {
    const x = remote[k];
    if (!x || typeof x !== 'object' || typeof x.ts !== 'number' || expired(k, x)) continue;
    if (!r[k] || r[k].ts < x.ts) { r[k] = x; changed.push(k); }
  }
  for (const k in r) if (!expired(k, r[k]) && (!remote[k] || remote[k].ts < r[k].ts)) ahead = true;
  return { changed, ahead };
}
function cloudSoon() { if (cloudOn()) { clearTimeout(cloud.t); cloud.t = setTimeout(cloudSync, 1200); } }
async function cloudSync() {
  if (!cloudOn()) { cloud.status = 'off'; return cloudBadge(); }
  if (cloud.busy) { cloud.again = true; return; }
  cloud.busy = true; clearTimeout(cloud.t);
  let changed = [];
  try {
    const g = ghCfg(), base = `https://api.github.com/repos/${g.owner}/${g.repo}`;
    const H = { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github+json' };
    const call = (path, method, body) => fetch(base + path, { method: method || 'GET', headers: H, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
    for (let n = 0; n < 3; n++) {
      const ref = await call(`/git/ref/heads/${DATA_BRANCH}?t=${Date.now()}`);
      let branch = true;
      if (ref.status === 404) { branch = false; cloud.head = cloud.sha = null; cloud.remote = {}; }
      else if (!ref.ok) throw new Error(ghErr(ref.status));
      else {
        const head = (await ref.json()).object.sha;
        if (head !== cloud.head) {
          const f = await call(`/contents/${DATA_PATH}?ref=${DATA_BRANCH}&t=${Date.now()}`);
          if (f.status === 404) { cloud.sha = null; cloud.remote = {}; }
          else if (!f.ok) throw new Error(ghErr(f.status));
          else {
            const j = await f.json(); cloud.sha = j.sha;
            try { cloud.remote = (await decDoc(j.content)).recs || {}; }
            catch (e) { if (!cloud.force) throw e; cloud.remote = {}; }
          }
          cloud.head = head;
        }
      }
      const m = mergeRecs(cloud.remote); changed = changed.concat(m.changed);
      if (!m.ahead) break;
      const out = {}, r = R();
      for (const k in r) if (!expired(k, r[k])) out[k] = r[k];
      const text = await encDoc({ recs: out });
      let w;
      if (branch) {
        const body = { message: 'sync', branch: DATA_BRANCH, content: btoa(text) };
        if (cloud.sha) body.sha = cloud.sha;
        w = await call(`/contents/${DATA_PATH}`, 'PUT', body);
        if (w.ok) { const j = await w.json(); cloud.sha = j.content.sha; cloud.head = j.commit.sha; }
      } else {
        /* pehli baar: sirf state file wali ek alag (orphan) branch banao */
        const tr = await call('/git/trees', 'POST', { tree: [{ path: DATA_PATH, mode: '100644', type: 'blob', content: text }] });
        if (!tr.ok) throw new Error(ghErr(tr.status));
        const cm = await call('/git/commits', 'POST', { message: 'Moshwa cloud data', tree: (await tr.json()).sha, parents: [] });
        if (!cm.ok) throw new Error(ghErr(cm.status));
        w = await call('/git/refs', 'POST', { ref: 'refs/heads/' + DATA_BRANCH, sha: (await cm.json()).sha });
        cloud.head = null;
      }
      if (w.ok) { cloud.remote = out; cloud.force = false; break; }
      if (w.status !== 409 && w.status !== 422) throw new Error(ghErr(w.status));
      cloud.head = null; /* kisi aur ne beech me likha — dobara padho aur merge karo */
    }
    cloud.status = 'ok'; cloud.err = '';
  } catch (e) {
    cloud.status = e.message === 'badpass' ? 'badpass' : 'err';
    cloud.err = e.message === 'badpass' ? 'Couple code partner ke code se match nahi karta.' : e.message === 'Failed to fetch' ? 'Internet nahi hai — wapas aate hi sync ho jaayega.' : e.message;
  }
  cloud.busy = false;
  if (changed.length) onRemote(changed);
  cloudBadge();
  if (cloud.again) { cloud.again = false; cloudSoon(); }
}
setInterval(() => { if (!document.hidden && cloudOn()) cloudSync(); }, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && cloudOn()) cloudSync(); });

const cloudBadgeText = () => !S.cloud || !S.cloud.on ? '' : ' · ☁️ ' + ({ ok: 'synced', err: 'ruka hua', badpass: 'code galat', off: 'band' }[cloud.status] || '…');
function cloudBadge() { const el = document.getElementById('cl'); if (el) el.textContent = cloudBadgeText(); }
function buzzFx() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
  document.body.classList.remove('buzz'); void document.body.offsetWidth; document.body.classList.add('buzz');
}
const unread = () => { const s = S.seen || {}; return recs('m:').filter(x => x.from !== me() && !s[x.key]).length; };
const LIVE_VIEWS = () => [home, ldr, bucket, capsule, story, tease, inbox, matchLive, cloudSetup];
let pendingDraw = false;
function onRemote(changed) {
  const n = rec('names');
  if (changed.includes('names') && n && Array.isArray(n.v) && n.v.length === 2) S.names = n.v.map(x => String(x).slice(0, 20) || 'Player');
  const s = S.seen || {};
  changed.filter(k => k.startsWith('m:')).forEach(k => {
    const x = rec(k);
    if (!x || x.from === me() || s[k]) return;
    if (x.k === 'p') buzzFx();
    toast(x.k === 'p' ? `${x.f || 'Partner'}: ${String(x.t).slice(0, 60)}` : `💌 ${x.f || 'Partner'} ne sealed message bheja — Inbox dekho`);
  });
  save();
  if (!stack.length || !LIVE_VIEWS().includes(stack[stack.length - 1][0])) return;
  const a = document.activeElement;
  if (a && app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox') { pendingDraw = true; return; }
  show();
}
document.addEventListener('focusout', () => { if (pendingDraw) setTimeout(() => { if (pendingDraw) { pendingDraw = false; show(); } }, 300); });

/* ---------- Cloud setup ---------- */
function cloudSetup() {
  const c = S.cloud || {}, tok = !!ghCfg().token;
  const st = !canCrypt() ? 'Ye browser / link encryption support nahi karta — website ko https link se kholo.'
    : !c.on ? 'Cloud abhi band hai.' : cloud.status === 'ok' ? '🟢 Sync chal raha hai.' : cloud.status === 'off' ? 'Shuru ho raha hai…' : '🔴 ' + cloud.err;
  app.innerHTML = `<p class="mute">Cloud on karo toh links ki zaroorat nahi: bucket list, story, capsules, sealed messages, pokes, Fantasy Match, 7-din tease, countdown aur naam — sab dono phones pe apne aap sync hote hain, chahe partner us waqt online ho ya nahi.</p>
    <div class="box">${esc(st)}</div>
    <div class="row"><button class="btn" id="gh">1. GitHub token ${tok ? '✓ laga hai' : '— pehle ye lagao'}</button></div>
    <label>2. Couple code — dono phones pe bilkul same (lamba rakho, jaise 4-5 shabd)</label>
    <input type="text" id="cp2" maxlength="80" value="${esc(c.pass || '')}" placeholder="jaise: neeli-chhatri-goa-2019-chai" autocomplete="off">
    <label>3. Is phone pe mai hu</label>
    <div class="chips">${[0, 1].map(i => `<button class="chip ${(c.me === 1 ? 1 : 0) === i ? 'on' : ''}" data-me="${i}">${esc(S.names[i])}</button>`).join('')}</div>
    <div class="row"><button class="btn p" id="con" ${tok && canCrypt() ? '' : 'disabled'}>${c.on ? 'Save & dobara sync' : 'Cloud on karo'}</button></div>
    ${c.on ? '<div class="row"><button class="btn" id="off">Is phone pe cloud band karo</button></div>' : ''}
    ${cloud.status === 'badpass' ? '<div class="row"><button class="btn" id="frc">Isi code se naya shuru karo (purana cloud data mit jaayega)</button></div>' : ''}
    <p class="mute">Data tumhare repo ki <b>${DATA_BRANCH}</b> branch me jaata hai, couple code se <b>encrypt</b> hoke — GitHub pe sirf ulta-seedha text dikhta hai, aur ye ki sync kab hua. Code hi chaabi hai: chhota ya aasaan code koi tod sakta hai, isliye lamba rakho aur kisi ko mat batao. Partner ke phone pe wahi token aur wahi code daalo, bas "mai hu" alag chuno.</p>`;
  let pick = c.me === 1 ? 1 : 0;
  document.getElementById('gh').onclick = () => go(ghSetup, 'GitHub Setup');
  app.querySelectorAll('[data-me]').forEach(b => b.onclick = () => { pick = +b.dataset.me; app.querySelectorAll('[data-me]').forEach(x => x.classList.toggle('on', x === b)); });
  document.getElementById('con').onclick = async e => {
    const pass = document.getElementById('cp2').value.trim();
    if (pass.length < 8) return toast('Couple code kam se kam 8 characters ka rakho');
    S.cloud = { on: 1, pass, me: pick }; pkFrom = pick; save();
    cloud.head = null; cloud.status = 'off'; e.target.textContent = 'Sync ho raha hai…'; e.target.disabled = true;
    await cloudSync();
    if (cloud.status === 'ok' && !rec('names')) { put('names', { v: S.names }); await cloudSync(); }
    show();
  };
  const off = document.getElementById('off'); if (off) off.onclick = () => { S.cloud.on = 0; save(); cloud.status = 'off'; show(); };
  const frc = document.getElementById('frc'); if (frc) frc.onclick = async e => {
    if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Pakka? Purana data wapas nahi aayega — dobara dabao'; return; }
    cloud.force = true; cloud.head = null; put('init', { v: 1 }); await cloudSync(); show();
  };
}

/* ---------- Inbox (seedhe bheje gaye messages) ---------- */
const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'abhi' : m < 60 ? m + ' min pehle' : m < 1440 ? Math.round(m / 60) + ' ghante pehle' : Math.round(m / 1440) + ' din pehle'; };
function sendMsg(k, t) { put('m:' + rid(), { from: me(), f: S.names[me()], k, t: String(t).slice(0, 600) }); toast('Partner ke Inbox me bhej diya ✓'); }
function markSeen(key) { (S.seen = S.seen || {})[key] = 1; if (!rec('r:' + key.slice(2))) put('r:' + key.slice(2), { v: 1 }); else save(); }
function inbox() {
  const my = me(), seen = S.seen = S.seen || {}, all = recs('m:').sort((a, b) => b.ts - a.ts);
  const inc = all.filter(x => x.from !== my), sent = all.filter(x => x.from === my);
  inc.filter(x => x.k === 'p' && !seen[x.key]).forEach(x => markSeen(x.key));
  const row = x => `<li class="${seen[x.key] ? '' : 'hot'}"><b>${esc(x.f || 'Partner')}</b> <span class="mute">· ${ago(x.ts)}</span><br>${x.k === 's'
    ? `<span class="secret ${seen[x.key] ? 'show' : ''}" data-s="${esc(x.key)}">${esc(x.t)}</span>` : esc(x.t)}<button class="x" data-x="${esc(x.key)}" aria-label="Hatao">✕</button></li>`;
  app.innerHTML = `${cloudOn() ? '' : '<div class="box">Seedhe messages ke liye pehle Moshwa Cloud on karo.</div><div class="row"><button class="btn p" id="cs">☁️ Cloud setup</button></div>'}
    <h2>Aaye hue</h2><p class="mute">Sealed message dhundhla rehta hai — akele ho tab tap karo.</p>
    <ul class="list">${inc.map(row).join('') || '<li class="mute">Abhi kuch nahi aaya.</li>'}</ul>
    <div class="row"><button class="btn p" id="nw">💌 Naya sealed message</button><button class="btn" id="pk">📲 Poke</button></div>
    <h2>Bheje hue</h2>
    <ul class="list">${sent.map(x => `<li><span class="mute">${ago(x.ts)} · ${rec('r:' + x.key.slice(2)) ? '👀 dekh liya' : 'abhi nahi dekha'}</span><br>${esc(x.t)}<button class="x" data-x="${esc(x.key)}" aria-label="Hatao">✕</button></li>`).join('') || '<li class="mute">Abhi kuch nahi bheja.</li>'}</ul>
    <p class="mute">Messages 30 din baad apne aap hat jaate hain.</p>`;
  const cs = document.getElementById('cs'); if (cs) cs.onclick = () => go(cloudSetup, 'Moshwa Cloud');
  app.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { x.classList.add('show'); if (!seen[x.dataset.s]) { markSeen(x.dataset.s); x.closest('li').classList.remove('hot'); } });
  app.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { del(b.dataset.x); show(); });
  document.getElementById('nw').onclick = () => { sealText = ''; go(seal, 'Sealed Message'); };
  document.getElementById('pk').onclick = () => go(poke, 'Poke');
}

/* ---------- Fantasy Match, live ---------- */
function matchLive() {
  const my = me();
  if (!rec('fr')) put('fr', { v: rid() });
  const id = rec('fr').v, ok = x => x && typeof x.a === 'string' && x.a.length === FANTASIES.length && /^[012]+$/.test(x.a);
  const mine = rec(`f:${id}:${my}`), theirs = rec(`f:${id}:${1 - my}`), other = esc(S.names[1 - my]);
  const fresh = () => { put('fr', { v: rid() }); show(); };
  if (!ok(mine)) {
    app.innerHTML = `<div class="card"><div class="big">Dono apne-apne phone pe vote karo.</div>
      <p class="mute">${ok(theirs) ? `<b>${other}</b> vote kar chuke hain — ab tumhari baari.` : 'Jaise hi dono ke votes aa jaayenge, matches dono phones pe khul jaayenge.'} Kisi ka "Nahi" kabhi nahi dikhta.</p></div>
      <div class="row"><button class="btn p" id="st">Vote shuru karo</button></div>`;
    document.getElementById('st').onclick = () => { fm = { who: 0, i: 0, a: [[], []], live: id }; go(matchVote, 'Fantasy Match'); };
  } else if (!ok(theirs)) {
    app.innerHTML = `<div class="card"><div class="big">Tumhare votes pahunch gaye ✓<br>⏳ ${other} ka intezaar…</div><p class="mute">Ye screen khuli rakho ya baad me aao — unke vote karte hi matches yahi khul jaayenge.</p></div>
      <div class="row"><button class="btn" id="nr">Naya round shuru karo</button></div>`;
    document.getElementById('nr').onclick = fresh;
  } else {
    fm = { a: my === 0 ? [mine.a, theirs.a].map(s => s.split('').map(Number)) : [theirs.a, mine.a].map(s => s.split('').map(Number)), live: id };
    matchResult();
    const ag = document.getElementById('ag'); ag.textContent = 'Naya round'; ag.onclick = fresh;
  }
}
