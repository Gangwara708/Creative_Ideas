# 💡 Creative Ideas

Independent projects, each self-contained in its own directory.

| Project | What it is |
| --- | --- |
| 🧭 [**Consultancy Website**](consultancy-website/) | A complete, deploy-ready career & education consultancy website (22 pages, zero dependencies) plus A–Z documentation for registering and launching the business behind it |
| 🎮 [Browser games](#-original-browser-games) | Original 3D games built with Three.js |

---

## 🎮 Original Browser Games

A collection of **original, fully free 3D browser games** built with
[Three.js](https://threejs.org/). No installs, no accounts, no paywalls —
every feature in every game is unlocked, because these are built from
scratch as their own games.

All 3D models are generated procedurally in code; there are no third-party
game assets anywhere in this repo.

| Game | Genre | Play |
| --- | --- | --- |
| 🏏 [**Super Over Cricket 3D**](cricket-3d/) | Cricket — bat an innings, then defend it against an AI chase | `cricket-3d/index.html` |
| 🏎️ [**Highway Rush 3D**](highway-rush-3d/) | Endless arcade driving — traffic, near misses, nitro, high scores | `highway-rush-3d/index.html` |

## ▶️ Quick start

Serve the repo root and pick a game:

```bash
python3 -m http.server 8000
# then open:
#   http://localhost:8000/cricket-3d/
#   http://localhost:8000/highway-rush-3d/
```

Or just double-click either game's `index.html` (internet needed the first
time so the Three.js library can load from a CDN).

Each game has its own README with controls, rules, and tuning tips.
