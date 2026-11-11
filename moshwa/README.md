# 🌙 Moshwa ❤️

A private, phone-first party game for two adults (18+). No accounts, no server —
names, safe word and scores stay in the browser's local storage.

| Mode | What it does |
| --- | --- |
| 🎭 Roleplay Time Machine | Random scene from the past, present or future, with roles, a twist and a secret mission each |
| 💘 Fantasy Match | Each player votes privately; only mutual yes/maybe items are revealed |
| 🔥 Slow Burn | Truth/dare cards that climb one heat level every 4 cards |
| 🎲 Truth or Dare | Classic, with timers and a score |
| 🎯 Tease Dice | Action + place + duration |
| 📲 Poke | Teasing texts and coupons to send over WhatsApp |
| 🌍 Long Distance | Sync Play (same room code → same cards on both phones), sealed message links, remote Fantasy Match by link, video-call dares, a daily question, a meet-up countdown, a 7-day tease challenge, link-passed story builder, date-locked time capsules, a shared bucket list, and a Live Room that connects the two phones directly (WebRTC via PeerJS) for synced cards and poke buzzes |
| 💞 Romance | Husband-and-wife romantic tasks at every level — lipstick marks, wedding rituals, long kisses |
| 📜 Kamasutra Deck | Positions from easy to advanced, with timers |
| 🎬 Fantasy Theatre | Imagination-only story prompts to narrate to each other |
| 🙈 / ⚖️ / 🌹 | Never Have I Ever, Would You Rather, Fantasy Dates |

Five heat levels (Flirty → Spicy → Wild → Dark → Ultra) can be picked on any game screen; tick "Sirf isi level ke cards" to jump straight to one level. Every card
can be skipped, and the safe word is shown on every screen.

**Add your own cards:** use ✍️ Apne Cards in the app. Cards can stay on one phone, or be
published: with a fine-grained GitHub token (Contents: read/write on this repo only) the app
commits them to `custom.json` with your commit message, and every phone picks them up on next load.
You can also edit the lists in `data.js` directly.

**Moshwa Cloud (no more links):** in 🌍 Long Distance → ☁️ Moshwa Cloud, enter the same GitHub token
and the same couple code on both phones. Bucket list, story, capsules, sealed messages, pokes,
Fantasy Match votes, the tease challenge, countdown and names then sync automatically, even when
the other phone is offline. The data is AES-GCM encrypted with a key derived from the couple code
and stored on the `moshwa-data` branch, so the repository only ever holds ciphertext.

**Privacy:** optional 4-digit PIN lock (Settings). **Install:** the site is a PWA — add it to the
home screen and it works offline after the first load.

**Run:** open `index.html`, or serve the repo root and visit `/moshwa/`.
