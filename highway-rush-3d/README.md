# 🏎️ Highway Rush 3D

An **original**, fully free endless 3D driving game for the browser.
Weave through highway traffic, thread tight gaps for near-miss bonuses,
collect coins, ride the nitro, and chase your best score. No installs,
no accounts, **no paywalls**.

Built with [Three.js](https://threejs.org/) — all car, road, and city
geometry is generated procedurally in code (zero external assets).

---

## ▶️ How to play

**Option A — just open it**
Double-click `index.html`. (Needs internet the first time so Three.js can load from a CDN.)

**Option B — local server (recommended)**

```bash
cd highway-rush-3d
python3 -m http.server 8001
# open http://localhost:8001
```

## 🎮 Controls

| Action | Key / Input |
| --- | --- |
| Steer | `←` `→` or `A` `D` (touch: tap left/right half of screen) |
| Accelerate | `↑` or `W` |
| Brake | `↓` or `S` |
| Nitro boost | hold `SPACE` (or left `Shift`) |

## 🏁 How it works

- **Endless highway** — traffic spawns faster the longer you survive.
- **Near misses**: pass a car closely at high speed for **+150 points and a nitro refill**. Risk pays.
- **Coins** (+50 each) appear in rows down the lanes.
- **Damage**: head-on hits cost a third of your health; glancing scrapes cost less and slow you down. Health gone = run over.
- **Nitro** burns fast, regenerates slowly, and cranks the camera FOV for that speed rush.
- **High score** is saved in your browser (localStorage).

## 🌆 Graphics

The whole look is procedural, tuned for a cinematic dusk drive:

- **ACES filmic tone mapping** + sRGB output for film-like color.
- **Dusk sky dome** with a glowing low sun on the horizon.
- **Procedural textures** drawn on canvas at load: cracked asphalt with
  tire-wear tracks (and the texture *scrolls* with your speed), patchy
  grass, and building facades with randomly lit windows.
- **Real car bodies**: extruded side-profile silhouettes with metallic
  paint, reflective glass canopies, alloy rims, emissive head/taillights
  with glow, and a spoiler + exhaust tips on the player car.
- **Environment reflections** on paint, glass, and rims via a generated cubemap.
- **Working headlight beam** (a real spotlight) lighting the road ahead.
- **Street lamps** with glow and pooled light on the asphalt, plus guard rails.
- **Particles**: nitro flames from the exhausts, crash sparks, coin bursts.

## 🚗 Pick your ride

Four original paint jobs at the start screen — Blaze, Frostbite, Venom, and Neon. (Purely cosmetic… for now.)

## 📁 Project structure

```
highway-rush-3d/
├── index.html          # entry point + start menu + HUD
├── css/style.css       # all UI styling
└── js/
    ├── config.js       # tuning constants (speeds, damage, spawns…)
    ├── scene.js        # builds the highway, scenery, cars, coins
    ├── ui.js           # HUD, bonus pops, overlays
    ├── game.js         # driving physics, traffic, collisions, scoring
    └── main.js         # bootstrap / menu wiring
```

## 🔧 Tweaking

Everything lives in `js/config.js`: top speed, nitro burn rate, traffic
density ramp, crash damage, near-miss bonus, coin value. Change a number,
refresh, drive.

---

### A note on originality

This is **not** a clone of any commercial racing game and contains none of
their code, art, names, or branding — it's an original arcade driving game
in a familiar genre, free and open for everyone.
