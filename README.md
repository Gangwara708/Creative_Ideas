# 🏏 Super Over Cricket 3D

An **original**, fully free 3D cricket game you can play right in your browser.
No installs, no accounts, **no paywalls** — every feature is unlocked because
this is built from scratch as its own game (not a copy of any commercial title).

Built with [Three.js](https://threejs.org/) for real-time 3D.

---

## ▶️ How to play

**Option A — just open it**
Double-click `index.html`. (Needs an internet connection the first time so the
Three.js library can load from a CDN.)

**Option B — local server (recommended, no quirks)**

```bash
cd Creative_Ideas
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

## 🎮 Controls

| Action | Key / Input |
| --- | --- |
| Bowl the ball | `SPACE` or click / tap |
| Time your shot | `SPACE` / click as the ball arrives |
| Aim the shot | `←` / `→` (a moving meter shows your aim) |
| Loft it (go aerial) | hold `↑` |
| Keep it along the ground | `↓` |
| Bowl in the chase | the **Bowl** button or `SPACE` |

**Timing is everything.** Hit the swing just before the ball reaches the bat:
- *Perfect* timing → maximum power, find the gaps or clear the rope for six.
- *Good* timing → solid runs.
- *Mistimed* → an edge that might carry to a fielder.
- *Miss* → the ball can crash into your stumps. Bowled!

## 🏆 Match flow

1. **Pick a format** — Super Over (1 over), Power Blast (2 overs), or Slog Fest (5 overs).
2. **You bat first** and set a target.
3. **Innings break**, then **you bowl** while the AI rivals chase your total.
4. A winner is decided — by runs or by wickets.

## ✨ Features

- Real-time **3D stadium**: striped outfield, boundary rope, 30-yard ring, stands.
- **Timing + aim batting** with grounded and lofted shots.
- **Ball physics**: pace, bounce, swing drift, gravity, rolling friction.
- **Fielding**: catches in the deep, run-outs of momentum, bowled dismissals with
  flying bails.
- **Two innings** with a full chase and a real result.
- **Three match formats**, live scoreboard, ball-by-ball over tracker, and big
  shot call-outs.
- 100% original assets — all geometry is generated procedurally in code.

## 📁 Project structure

```
Creative_Ideas/
├── index.html          # entry point + start menu + HUD
├── css/style.css       # all UI styling
└── js/
    ├── config.js       # gameplay tuning constants (easy to tweak)
    ├── scene.js        # builds the 3D stadium, players, ball
    ├── ui.js           # scoreboard, call-outs, overlays
    ├── game.js         # state machine, physics, scoring, AI chase
    └── main.js         # bootstrap / menu wiring
```

## 🔧 Tweaking the game

Open `js/config.js` — bowling speed, gravity, timing windows, catch difficulty,
AI skill, default overs/wickets are all there. Change a number, refresh, play.

---

### A note on originality

This project is **not** a clone of any commercial cricket game and contains none
of their code, art, names, or branding. It's a clean-room, original game made to
be free and open for everyone to learn from and build on.
