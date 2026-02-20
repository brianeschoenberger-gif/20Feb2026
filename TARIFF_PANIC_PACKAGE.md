1) PRODUCT.md

# Tariff Panic — Product Brief

## Goal / Target Player
- **Goal:** Deliver a 2–3 minute, high-pressure logistics arcade game where players sort containers correctly under changing tariff rules.
- **Target player:** Casual browser players (13+) who like fast decision games and score chasing.

## Core Loop
- Read current tariff rule banner.
- Drag incoming containers from queue to one of 3 lanes: **Domestic / Import / Hold**.
- Gain points for correct routing; avoid penalties for mistakes, delays, and overflow.
- Adapt instantly when emergency tariff events temporarily change best routing behavior.

## MVP Scope (One-Day Realistic)
- Single screen game (HUD + queue + 3 drop lanes).
- Mouse drag-and-drop containers.
- 3 container types with simple labels/colors.
- Timer-based run (90 seconds).
- Lightweight tariff event system (one active event at a time, clear on-screen text).
- Score + strikes + game over / end screen + restart.
- Basic juice (small flashes, lane highlight, quick feedback text).

## Non-Goals
- No campaign/story mode.
- No multiplayer, no account/save, no backend.
- No political satire or policy simulation depth.
- No complex economy systems or procedural map.
- No art/audio pipeline dependency (shapes/UI only).

## Success Criteria
- First-time player understands objective in <15 seconds.
- Game is playable instantly by opening `index.html`.
- At least 1 meaningful “rule flip” moment every 20–30 seconds.
- Most play sessions end with “just one more run” score-chase feel.

---

2) Vertical Slice Plan (Milestone 0 and Milestone 1)

## Milestone 0 — Definition of “Playable”
- You can complete a full 90-second run with:
  - spawning containers,
  - drag/drop routing into 3 lanes,
  - active tariff events changing scoring logic,
  - visible score + strikes + timer,
  - end screen and restart.
- Core loop is fun and readable without tutorial text beyond short labels.

## Milestone 0 — Exact Features (Minimal but Fun)
- **Core board:** Queue area + 3 lane drop zones (`Domestic`, `Import`, `Hold`).
- **Containers:**
  - Types: `Electronics`, `Food`, `Machinery`.
  - Each has base value and urgency timer.
- **Routing rules:**
  - Default preferred lane per type.
  - Correct drop = points; wrong drop = strike/point loss.
- **Tariff events (simple):**
  - One active modifier at a time.
  - Examples: “Import surcharge: Import lane penalties doubled”, “Emergency exemption: Food to Import now valid”.
  - Event duration + clear countdown.
- **Pressure systems:**
  - Queue cap (overflow penalty).
  - Per-container urgency decay (late handling penalty).
- **Session flow:**
  - 90s timer.
  - 3 strikes = immediate fail OR timer reaches 0 = score summary.
  - Restart button.
- **UX:**
  - Big labels, high contrast, lane highlighting on drag hover.
  - Short feedback text: `+20 Correct`, `-1 Strike`, `Late!`.

## Milestone 1 — Moves Here
- Combo multiplier for consecutive correct drops.
- More event variety + event preview ticker.
- Difficulty tuning screen (easy/normal/hard).
- Sound effects + richer screen shake/juice polish.
- Better onboarding overlay (15-second quick tutorial).
- Local best score persistence (`localStorage`).

## Explicitly Deferred
- Story mode / narrative dialogues.
- Mobile touch optimization.
- Accessibility pass beyond basic contrast.
- Analytics, leaderboard, cloud save.
- Procedural balancing tools.

---

3) Game Design Spec

## Game Premise
In a fast-moving trade terminal, you are the shift coordinator during sudden tariff policy shocks. Containers arrive nonstop, and you must route each one to the best lane before deadlines and rule changes cause penalties. The challenge is logistical speed and adaptation, not political commentary.

## Controls
- **Mouse-only required:**
  - Click/hold container from queue.
  - Drag onto lane drop zone.
  - Release to assign.
- **Optional keyboard shortcuts:**
  - `1` = send selected/oldest queue container to Domestic.
  - `2` = send to Import.
  - `3` = send to Hold.
  - `R` = restart on end screen.

## Systems

### Containers
- Types (M0 fixed):
  - `Electronics`: base +20, urgency 10s, default lane `Import`.
  - `Food`: base +15, urgency 8s, default lane `Domestic`.
  - `Machinery`: base +25, urgency 12s, default lane `Import`.
- Display fields on each container tile:
  - Type label
  - Remaining urgency bar/time
  - Tiny value number

### Lanes
- **Domestic:** Best for local-cleared goods.
- **Import:** Best for normal import flow.
- **Hold:** Safe fallback; low reward but avoids worst penalties.
- Drop resolution rule (M0):
  - Correct lane => full base points.
  - Hold when not required => small points (+5).
  - Wrong active lane => penalty (-10) + 1 strike.

### Tariff Events (Simple + Readable)
- One event active at once.
- Events spawn every 18–24 seconds, last 10–14 seconds.
- M0 event list:
  1. **Import Surcharge:** any container dropped in Import gives -10 extra.
  2. **Food Exemption:** Food in Import counts as correct (+15).
  3. **Inspection Backlog:** Hold lane gives 0 (instead of +5) and urgency drains 25% faster globally.
  4. **Domestic Fast-Track:** Domestic correct bonus +10.
- Event banner at top with name + short rule text + countdown.

### Scoring
- Start score at 0.
- Correct route: base points (plus event modifiers).
- Hold fallback: +5 unless event overrides.
- Late penalty (if urgency expires before drop): -8 and 1 strike, container removed.
- Queue overflow penalty: when queue > max (e.g., 7), oldest auto-fails: -12 and 1 strike.

### Penalties / Fail States
- **Strikes:** start at 0, max 3.
- Gain strike for wrong route, late container expiry, overflow auto-fail.
- **End conditions:**
  - 3 strikes => immediate fail screen.
  - or timer reaches 0 => run complete screen.

## Difficulty Ramp (First 90 Seconds)
- **0–15s:** Spawn every 2.4s, no event active, 2 container types only (Food/Electronics).
- **15–30s:** Spawn every 2.0s, introduce Machinery, first event at ~20s.
- **30–45s:** Spawn every 1.8s, urgency reduced by 10% globally.
- **45–60s:** Spawn every 1.6s, second event, queue max effectively tighter due to pace.
- **60–75s:** Spawn every 1.4s, event duration slightly longer, more mixed types.
- **75–90s:** Spawn every 1.25s, final event window + high pressure until end.

## UX Readability Rules
- Font: system sans (`Arial`, `Helvetica`, `sans-serif`).
- Use large labels (>=18px on lane titles, >=16px HUD stats).
- Color coding:
  - Domestic lane: blue tone.
  - Import lane: orange tone.
  - Hold lane: gray tone.
  - Danger/penalty: red accents.
- Always show:
  - Timer (top-left), Score (top-center), Strikes (top-right), Event banner (top bar).
- Containers must show urgency bar with green→yellow→red transition.
- Drag-hover lane border thickens and glows.

## Juice Ideas (Optional to Implement)
- Tiny screen shake on strike.
- Quick white flash + `+points` pop text on correct drop.
- Soft red pulse on urgency expiry.
- Combo text (`3x Clean Routing`) for streaks (M1 if time).
- Simple generated beep tones with Web Audio (optional M1).

---

4) Technical Plan

## Rendering Approach: **DOM-based** (Chosen)
- **Why DOM:** Faster one-day implementation for drag/drop readability, easy lane highlighting, easy text-heavy UI updates, no canvas hit-testing complexity.

## File Structure
- `index.html` — HUD, board layout, end modal, script/style links.
- `style.css` — layout, color system, lane/container styling, feedback animations.
- `game.js` — state, spawn logic, event logic, drag/drop handlers, update loop, render updates.

## State Model (Single Object)
```js
const state = {
  running: false,
  timeLeft: 90,
  score: 0,
  strikes: 0,
  maxStrikes: 3,

  containers: [
    // { id, type, baseValue, defaultLane, urgencyMax, urgencyLeft, spawnedAt }
  ],

  lanes: {
    domestic: { id: 'domestic' },
    import: { id: 'import' },
    hold: { id: 'hold' }
  },

  queueMax: 7,
  spawnTimer: 0,
  spawnInterval: 2.4,

  activeEvent: null,
  eventTimer: 0,
  nextEventIn: 20,

  feedback: [], // transient messages
  difficultyPhase: 0,
  lastTimestamp: 0
};
```

## Main Update Loop Design
- Use `requestAnimationFrame(update)`.
- Compute `dt` from timestamp.
- If running:
  - decrement `timeLeft`.
  - update difficulty by elapsed time buckets.
  - update spawn timer and spawn containers.
  - update event timers and spawn/expire events.
  - decrement urgency for all containers.
  - resolve expired/overflow penalties.
  - call `render()`.
- End game when `strikes >= maxStrikes` or `timeLeft <= 0`.

## Event Spawn Timing Logic
- `nextEventIn` counts down.
- When <= 0 and no active event:
  - choose random event from pool.
  - set `activeEvent`, `eventTimer = random(10..14)`.
- While active:
  - decrement `eventTimer`.
  - clear event when timer <= 0.
  - set `nextEventIn = random(18..24)`.

## Drag-and-Drop Approach
- Native HTML5 drag/drop on container DOM elements:
  - `draggable=true`
  - `dragstart` sets container id in `dataTransfer`.
- Lane zones listen for:
  - `dragover` (preventDefault + hover class)
  - `dragleave` (remove hover class)
  - `drop` (extract id, call `handleDrop(containerId, laneId)`).

## Collision / Lane Drop Detection
- DOM-native drop target detection (no manual collision math).
- Lane id derived from dataset (`data-lane="domestic"`, etc.).
- Validate only known lane ids; ignore invalid drops.

## UI Layout Plan
- **Top HUD bar:** timer | score | strikes.
- **Below HUD:** active event banner.
- **Main area split:**
  - Left: queue stack (incoming containers).
  - Right: three vertical lane boxes.
- **Bottom/right overlay:** transient feedback text.
- **End modal:** final score + restart button.

## Pseudocode

### init()
```text
build initial state values
cache DOM refs
bind drag/drop + restart + optional keyboard
state.running = true
state.lastTimestamp = performance.now()
requestAnimationFrame(update)
```

### spawnContainer()
```text
pick type from allowed types by current phase
create container object with id/type/value/urgency/defaultLane
push into state.containers
if containers.length > queueMax:
  remove oldest
  apply overflow penalty (score -= 12, strikes += 1)
  feedback("Overflow! -1 strike")
```

### spawnTariffEvent()
```text
choose random event definition
state.activeEvent = event
state.eventTimer = random duration (10..14)
feedback("Event: " + event.name)
```

### update(timestamp)
```text
dt = (timestamp - lastTimestamp)/1000
lastTimestamp = timestamp
if !running return

timeLeft -= dt
updateDifficultyFromElapsedTime()

spawnTimer += dt
if spawnTimer >= spawnInterval:
  spawnTimer = 0
  spawnContainer()

if activeEvent:
  eventTimer -= dt
  if eventTimer <= 0:
    activeEvent = null
    nextEventIn = random(18..24)
else:
  nextEventIn -= dt
  if nextEventIn <= 0:
    spawnTariffEvent()

for each container:
  urgencyLeft -= dt * urgencyModifierFromEvent
  if urgencyLeft <= 0:
    remove container
    apply late penalty

if strikes >= maxStrikes or timeLeft <= 0:
  endGame()
else:
  render()
  requestAnimationFrame(update)
```

### render()
```text
update HUD text (timer/score/strikes)
update event banner (name/rule/countdown or "No active event")
rebuild queue DOM from state.containers
for each container element:
  set urgency bar width/color
  set draggable attrs and data-id
render/remove transient feedback messages
```

### handleDrop(containerId, laneId)
```text
find container by id; if missing return
resolve scoring outcome:
  determine effective correct lanes under active event
  apply points/penalties/strikes
remove container from queue
push feedback message
optional tiny animation on lane
```

### endGame()
```text
state.running = false
show modal with result:
  if strikes >= maxStrikes => "Terminal Shutdown"
  else => "Shift Complete"
show final score
enable restart
```

---

5) Codex Implementation Prompt (Milestone 0 only)

Build a small browser game called **Tariff Panic** using **vanilla HTML/CSS/JavaScript** only.

Create these files:
- `index.html`
- `style.css`
- `game.js`

Implement **Milestone 0 only** with no extra features.

## Milestone 0 requirements
- Single-screen arcade logistics game.
- 90-second run timer.
- Queue of draggable containers.
- Three drop lanes: `Domestic`, `Import`, `Hold`.
- Container types:
  - Electronics (base +20, default Import, urgency 10s)
  - Food (base +15, default Domestic, urgency 8s)
  - Machinery (base +25, default Import, urgency 12s)
- Drag/drop rules:
  - Correct default lane = base points.
  - Hold = +5 (fallback).
  - Wrong lane = -10 and +1 strike.
- Penalties:
  - Urgency expiry: remove container, -8 and +1 strike.
  - Queue overflow (>7): oldest container removed, -12 and +1 strike.
- Fail/end conditions:
  - 3 strikes = immediate game over.
  - Timer hits 0 = end run.
  - Show end modal with final score and restart button.

## Tariff event system (simple, readable)
- Only one active event at a time.
- Event appears every 18–24s, lasts 10–14s.
- Implement these events:
  1. Import Surcharge: any drop in Import gets extra -10.
  2. Food Exemption: Food dropped in Import counts as correct (+15).
  3. Inspection Backlog: Hold gives 0 instead of +5; urgency drains 25% faster.
  4. Domestic Fast-Track: correct Domestic drops gain +10 bonus.
- Always show active event name, short description, and countdown.

## Difficulty ramp across 90s
- 0–15s spawn every 2.4s (Food + Electronics only)
- 15–30s spawn every 2.0s (add Machinery)
- 30–45s spawn every 1.8s
- 45–60s spawn every 1.6s
- 60–75s spawn every 1.4s
- 75–90s spawn every 1.25s

## UI/UX constraints
- High-contrast readable UI, no external assets.
- HUD must show: timer, score, strikes.
- Event banner at top.
- Queue area + 3 lane boxes.
- Lane highlight on drag hover.
- Container urgency bar with green/yellow/red states.
- Short floating feedback text for scoring/penalties.

## Technical constraints
- No frameworks, no external libraries, no backend.
- Game must run by opening `index.html` directly.
- Keep code clean and heavily commented.
- Keep functions small and readable.
- Use a single central state object.
- Use `requestAnimationFrame` update loop.
- Use native HTML5 drag-and-drop APIs.

## Deliverables in your response
- Brief explanation of architecture.
- Simple manual test checklist.
- Summary of changed files.

Important constraints:
- Do not add extra features beyond Milestone 0.
- Keep code modular and readable.
- If a feature is ambiguous, choose the simplest implementation that preserves fun.
- Make the game playable immediately after opening index.html.
- End by listing:
  1) files created/changed
  2) how to run
  3) what remains for Milestone 1

---

6) Manual Playtest Checklist (10 checks)

1. Open `index.html`; confirm game starts without console errors.
2. Confirm HUD shows timer (90), score (0), strikes (0/3).
3. Drag a container to its default lane; verify positive points and feedback text.
4. Drag a container to wrong non-hold lane; verify -10 and +1 strike.
5. Drag any container to Hold; verify +5 (or 0 during Inspection Backlog).
6. Let one container expire; verify it disappears and applies -8 + strike.
7. Force queue overflow (>7); verify oldest auto-removes with overflow penalty.
8. Wait for tariff event; verify banner text + countdown + rule effect applies.
9. Continue until 3 strikes; verify immediate end modal and restart works.
10. Play to timer end (without 3 strikes); verify run-complete end modal and final score shown.
