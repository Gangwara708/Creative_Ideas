# 🌙 Moshwa ❤️

A private, phone-first game for two adults (18+): roleplay, fantasies, dares and
long-distance play in one installable web app. No accounts and no server — names,
safe word, scores and lists stay in each phone's browser.

**Play:** open [`moshwa/`](moshwa/) — on GitHub Pages that is
`https://<user>.github.io/Creative_Ideas/moshwa/`.

## What's inside

| Section | What it does |
| --- | --- |
| 🎭 Roleplay Time Machine | Random scene from the past, present or future, with roles, a twist and a secret mission each |
| 💘 Fantasy Match | Each player votes privately; only mutual yes/maybe items are revealed (same phone or by link) |
| 🔥 Slow Burn · 🎲 Truth or Dare | Timed cards with a score; Slow Burn climbs a heat level every 4 cards |
| 🎯 Tease Dice | Action + place + duration |
| 📜 Kamasutra Deck | Positions from easy to advanced, with timers |
| 🎬 Fantasy Theatre | Imagination-only story prompts to narrate to each other |
| 🙈 ⚖️ 🌹 | Never Have I Ever, Would You Rather, Fantasy Dates |
| 📲 Poke | Teasing texts and coupons to send over WhatsApp |
| 🌍 Long Distance | Live Room (phones connect directly for synced cards and poke buzzes), Sync Play, sealed message links, video-call dares, daily question, countdown, 7-day tease challenge, story builder, time capsules, bucket list |
| ✍️ Apne Cards | Write your own cards and publish them to this repo from inside the app |

Five heat levels — Flirty, Spicy, Wild, Dark, Ultra — can be chosen on any game
screen. Every card can be skipped and the safe word is shown on every screen.

## Deploy

1. Repo **Settings → Pages → Deploy from a branch**, pick the branch that holds
   this code and folder `/ (root)`, then Save.
2. Open `https://<user>.github.io/Creative_Ideas/moshwa/` on both phones.
3. Optional: add it to the home screen (it is a PWA and works offline after the
   first load) and set a PIN in ⚙ Settings.

A Pages site is public to anyone who has the link. Search engines are told not
to index it, and the PIN only locks the screen on a phone.

## Publishing cards from the app

✍️ Apne Cards can commit new cards to [`moshwa/custom.json`](moshwa/custom.json)
with your own commit message. It needs a fine-grained GitHub token limited to
this repository with **Contents: Read and write**; the token is stored only in
that phone's browser. Built-in cards live in [`moshwa/data.js`](moshwa/data.js).

More detail: [`moshwa/README.md`](moshwa/README.md).
