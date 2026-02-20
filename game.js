// Tariff Panic - Milestone 1 implementation using a single central game state.
(() => {
  const GAME_LENGTH = 90;
  const MAX_STRIKES = 3;
  const BEST_SCORE_KEY = "tariff-panic-best-score";

  const DIFFICULTY = {
    easy: { spawnScale: 1.2, urgencyDrain: 0.85, overflowLimit: 8, eventGapScale: 1.12 },
    normal: { spawnScale: 1, urgencyDrain: 1, overflowLimit: 7, eventGapScale: 1 },
    hard: { spawnScale: 0.82, urgencyDrain: 1.2, overflowLimit: 6, eventGapScale: 0.82 }
  };

  const CONTAINER_TYPES = {
    Electronics: { base: 20, urgency: 10, defaultLane: "Import" },
    Food: { base: 15, urgency: 8, defaultLane: "Domestic" },
    Machinery: { base: 25, urgency: 12, defaultLane: "Import" }
  };

  const EVENTS = [
    {
      id: "import-surcharge",
      name: "Import Surcharge",
      description: "Any drop in Import gets an extra -10 penalty.",
      onResolve: ({ lane }) => ({ points: lane === "Import" ? -10 : 0 })
    },
    {
      id: "food-exemption",
      name: "Food Exemption",
      description: "Food dropped in Import counts as correct (+15).",
      onResolve: ({ lane, container }) => {
        if (container.type === "Food" && lane === "Import") {
          return { forceCorrect: true, points: 15, skipDefaultCorrectPoints: true };
        }
        return { points: 0 };
      }
    },
    {
      id: "inspection-backlog",
      name: "Inspection Backlog",
      description: "Hold gives 0 points; urgency drains 25% faster.",
      onResolve: ({ lane }) => ({ points: lane === "Hold" ? -5 : 0 })
    },
    {
      id: "domestic-fast-track",
      name: "Domestic Fast-Track",
      description: "Correct Domestic drops gain +10 bonus.",
      onResolve: ({ lane, container, isCorrectByDefault }) => {
        const correctDomestic = lane === "Domestic" && isCorrectByDefault && container.defaultLane === "Domestic";
        return { points: correctDomestic ? 10 : 0 };
      }
    },
    {
      id: "priority-machinery",
      name: "Priority Machinery",
      description: "Machinery correctly routed earns +12.",
      onResolve: ({ container, isCorrectByDefault }) => ({ points: container.type === "Machinery" && isCorrectByDefault ? 12 : 0 })
    },
    {
      id: "domestic-audit",
      name: "Domestic Audit",
      description: "Wrong Domestic routing costs -5 extra.",
      onResolve: ({ lane, isCorrectByDefault }) => ({ points: lane === "Domestic" && !isCorrectByDefault ? -5 : 0 })
    }
  ];

  const dom = {
    app: document.querySelector(".app"),
    timer: document.getElementById("timer"),
    score: document.getElementById("score"),
    strikes: document.getElementById("strikes"),
    combo: document.getElementById("combo"),
    bestScore: document.getElementById("best-score"),
    queue: document.getElementById("queue"),
    eventBanner: document.getElementById("event-banner"),
    eventName: document.querySelector(".event-name"),
    eventRule: document.querySelector(".event-rule"),
    eventTime: document.querySelector(".event-time"),
    eventTicker: document.getElementById("event-ticker"),
    lanes: document.querySelectorAll(".lane"),
    feedbackLayer: document.getElementById("feedback-layer"),
    endModal: document.getElementById("end-modal"),
    endTitle: document.getElementById("end-title"),
    endMessage: document.getElementById("end-message"),
    restartBtn: document.getElementById("restart-btn"),
    difficultySelect: document.getElementById("difficulty-select"),
    tutorialOverlay: document.getElementById("tutorial-overlay"),
    startBtn: document.getElementById("start-btn")
  };

  const state = {
    running: false,
    score: 0,
    strikes: 0,
    timeLeft: GAME_LENGTH,
    containers: [],
    nextContainerId: 1,
    spawnTimer: 0,
    spawnInterval: 2.4,
    activeEvent: null,
    nextEventPreview: EVENTS[0],
    eventTimeLeft: 0,
    nextEventIn: randomRange(18, 24),
    lastTimestamp: 0,
    draggedContainerId: null,
    combo: 0,
    bestScore: Number(localStorage.getItem(BEST_SCORE_KEY)) || 0,
    difficulty: "normal",
    audioCtx: null,
    tutorialTimer: null
  };

  function init() {
    bindLaneDnD();
    bindKeyboardShortcuts();
    dom.restartBtn.addEventListener("click", restart);
    dom.startBtn.addEventListener("click", beginShift);
    dom.difficultySelect.addEventListener("change", () => {
      state.difficulty = dom.difficultySelect.value;
      if (!state.running) {
        resetState();
        render();
      }
    });
    showTutorial();
  }

  function showTutorial() {
    let count = 15;
    dom.startBtn.textContent = `Start Shift (${count})`;
    state.tutorialTimer = setInterval(() => {
      count -= 1;
      dom.startBtn.textContent = count > 0 ? `Start Shift (${count})` : "Start Shift";
      if (count <= 0) {
        beginShift();
      }
    }, 1000);
  }

  function beginShift() {
    if (state.tutorialTimer) {
      clearInterval(state.tutorialTimer);
      state.tutorialTimer = null;
    }
    dom.tutorialOverlay.classList.add("hidden");
    startGame();
  }

  function startGame() {
    resetState();
    state.running = true;
    state.lastTimestamp = performance.now();
    render();
    requestAnimationFrame(update);
  }

  function resetState() {
    state.score = 0;
    state.strikes = 0;
    state.combo = 0;
    state.timeLeft = GAME_LENGTH;
    state.containers = [];
    state.nextContainerId = 1;
    state.spawnTimer = 0;
    state.spawnInterval = 2.4;
    state.activeEvent = null;
    state.nextEventPreview = randomEvent();
    state.eventTimeLeft = 0;
    state.nextEventIn = scaledRange(18, 24);
    state.draggedContainerId = null;
    dom.endModal.classList.add("hidden");
    dom.feedbackLayer.innerHTML = "";
  }

  function update(timestamp) {
    if (!state.running) return;

    const dt = Math.min(0.1, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;
    state.timeLeft = Math.max(0, state.timeLeft - dt);

    updateDifficulty();
    handleSpawning(dt);
    handleEvents(dt);
    handleUrgency(dt);

    if (state.strikes >= MAX_STRIKES || state.timeLeft <= 0) {
      endGame();
      return;
    }

    render();
    requestAnimationFrame(update);
  }

  function updateDifficulty() {
    const elapsed = GAME_LENGTH - state.timeLeft;
    const scale = DIFFICULTY[state.difficulty].spawnScale;

    if (elapsed < 15) state.spawnInterval = 2.4 * scale;
    else if (elapsed < 30) state.spawnInterval = 2.0 * scale;
    else if (elapsed < 45) state.spawnInterval = 1.8 * scale;
    else if (elapsed < 60) state.spawnInterval = 1.6 * scale;
    else if (elapsed < 75) state.spawnInterval = 1.4 * scale;
    else state.spawnInterval = 1.25 * scale;
  }

  function handleSpawning(dt) {
    state.spawnTimer += dt;
    while (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer -= state.spawnInterval;
      spawnContainer();
    }
  }

  function spawnContainer() {
    const elapsed = GAME_LENGTH - state.timeLeft;
    const types = elapsed < 15 ? ["Food", "Electronics"] : ["Food", "Electronics", "Machinery"];
    const type = types[Math.floor(Math.random() * types.length)];
    const template = CONTAINER_TYPES[type];

    state.containers.push({
      id: state.nextContainerId++,
      type,
      baseValue: template.base,
      urgencyMax: template.urgency,
      urgencyLeft: template.urgency,
      defaultLane: template.defaultLane
    });

    if (state.containers.length > DIFFICULTY[state.difficulty].overflowLimit) {
      state.containers.shift();
      applyPenalty(-12, 1, "Overflow! -12, +1 strike");
    }
  }

  function handleEvents(dt) {
    if (state.activeEvent) {
      state.eventTimeLeft -= dt;
      if (state.eventTimeLeft <= 0) {
        state.activeEvent = null;
        state.nextEventPreview = randomEvent();
        state.nextEventIn = scaledRange(16, 22);
      }
      return;
    }

    state.nextEventIn -= dt;
    if (state.nextEventIn <= 0) {
      state.activeEvent = state.nextEventPreview;
      state.eventTimeLeft = randomRange(10, 14);
      state.nextEventPreview = randomEvent();
      pushFeedback(`Event: ${state.activeEvent.name}`, "good");
      playTone(720, 0.08);
    }
  }

  function handleUrgency(dt) {
    const eventDrain = state.activeEvent?.id === "inspection-backlog" ? 1.25 : 1;
    const difficultyDrain = DIFFICULTY[state.difficulty].urgencyDrain;
    const drainMultiplier = eventDrain * difficultyDrain;

    for (let i = state.containers.length - 1; i >= 0; i--) {
      const container = state.containers[i];
      container.urgencyLeft -= dt * drainMultiplier;
      if (container.urgencyLeft <= 0) {
        state.containers.splice(i, 1);
        applyPenalty(-8, 1, `${container.type} expired! -8, +1 strike`);
      }
    }
  }

  function resolveDrop(containerId, lane) {
    if (!state.running) return;

    const index = state.containers.findIndex((item) => item.id === containerId);
    if (index === -1) return;

    const container = state.containers[index];
    const isCorrectByDefault = lane === container.defaultLane;

    let points = 0;
    let strikeGain = 0;
    let countsAsCorrect = false;

    if (lane === "Hold") {
      points += 5;
      state.combo = 0;
      pushFeedback("Hold fallback +5", "good");
    } else if (isCorrectByDefault) {
      points += container.baseValue;
      countsAsCorrect = true;
      pushFeedback(`+${container.baseValue} Correct`, "good");
    } else {
      points -= 10;
      strikeGain += 1;
      state.combo = 0;
      pushFeedback("Wrong lane -10, +1 strike", "bad");
    }

    const eventEffect = state.activeEvent?.onResolve?.({ lane, container, isCorrectByDefault }) || {};

    if (eventEffect.forceCorrect) {
      countsAsCorrect = true;
      if (!isCorrectByDefault) {
        points += 10;
        strikeGain = Math.max(0, strikeGain - 1);
      }
      if (eventEffect.skipDefaultCorrectPoints) {
        points -= container.baseValue;
      }
      pushFeedback("Exemption applied", "good");
    }

    if (typeof eventEffect.points === "number" && eventEffect.points !== 0) {
      points += eventEffect.points;
      pushFeedback(`${eventEffect.points > 0 ? "+" : ""}${eventEffect.points} ${state.activeEvent.name}`, eventEffect.points > 0 ? "good" : "bad");
    }

    if (countsAsCorrect) {
      state.combo += 1;
      const comboMultiplier = 1 + Math.min(4, Math.floor(state.combo / 3)) * 0.25;
      if (comboMultiplier > 1) {
        const comboBonus = Math.round(points * (comboMultiplier - 1));
        points += comboBonus;
        pushFeedback(`Combo x${comboMultiplier.toFixed(2)} +${comboBonus}`, "good");
      }
      triggerJuice("good");
      playTone(920, 0.06);
    } else {
      triggerJuice("bad");
      playTone(220, 0.09);
    }

    state.score += points;
    state.strikes += strikeGain;
    state.containers.splice(index, 1);

    if (state.strikes >= MAX_STRIKES) {
      endGame();
      return;
    }

    render();
  }

  function applyPenalty(scoreDelta, strikeDelta, message) {
    state.score += scoreDelta;
    state.strikes += strikeDelta;
    state.combo = 0;
    pushFeedback(message, "bad");
    triggerJuice("bad");
    playTone(180, 0.1);
  }

  function endGame() {
    state.running = false;
    updateBestScore();
    render();

    if (state.strikes >= MAX_STRIKES) {
      dom.endTitle.textContent = "Terminal Shutdown";
      dom.endMessage.textContent = `3 strikes reached. Final Score: ${Math.round(state.score)}`;
    } else {
      dom.endTitle.textContent = "Shift Complete";
      dom.endMessage.textContent = `Time elapsed. Final Score: ${Math.round(state.score)}`;
    }

    dom.endModal.classList.remove("hidden");
  }

  function updateBestScore() {
    const rounded = Math.round(state.score);
    if (rounded > state.bestScore) {
      state.bestScore = rounded;
      localStorage.setItem(BEST_SCORE_KEY, String(state.bestScore));
      pushFeedback("New best score!", "good");
    }
  }

  function restart() {
    startGame();
  }

  function bindKeyboardShortcuts() {
    window.addEventListener("keydown", (event) => {
      if (!state.running) {
        if (event.key.toLowerCase() === "r") restart();
        return;
      }

      if (state.containers.length === 0) return;
      const oldest = state.containers[0];
      if (event.key === "1") resolveDrop(oldest.id, "Domestic");
      if (event.key === "2") resolveDrop(oldest.id, "Import");
      if (event.key === "3") resolveDrop(oldest.id, "Hold");
    });
  }

  function bindLaneDnD() {
    dom.lanes.forEach((laneEl) => {
      laneEl.addEventListener("dragover", (event) => {
        event.preventDefault();
        laneEl.classList.add("hover");
      });

      laneEl.addEventListener("dragleave", () => {
        laneEl.classList.remove("hover");
      });

      laneEl.addEventListener("drop", (event) => {
        event.preventDefault();
        laneEl.classList.remove("hover");
        const idFromData = Number(event.dataTransfer.getData("text/plain"));
        const id = Number.isFinite(idFromData) ? idFromData : state.draggedContainerId;
        if (id) {
          resolveDrop(id, laneEl.dataset.lane);
        }
      });
    });
  }

  function pushFeedback(text, tone) {
    const node = document.createElement("div");
    node.className = `feedback ${tone || "good"}`;
    node.textContent = text;
    dom.feedbackLayer.appendChild(node);
    setTimeout(() => node.remove(), 1400);
  }

  function triggerJuice(type) {
    if (type === "good") {
      dom.eventBanner.classList.add("flash");
      setTimeout(() => dom.eventBanner.classList.remove("flash"), 180);
      return;
    }

    dom.app.classList.add("shake");
    setTimeout(() => dom.app.classList.remove("shake"), 220);
  }

  function render() {
    dom.timer.textContent = Math.ceil(state.timeLeft);
    dom.score.textContent = Math.round(state.score);
    dom.strikes.textContent = `${state.strikes}/${MAX_STRIKES}`;
    dom.combo.textContent = `x${Math.max(1, state.combo)}`;
    dom.bestScore.textContent = state.bestScore;

    renderEventBanner();
    renderTicker();
    renderQueue();
  }

  function renderEventBanner() {
    if (!state.activeEvent) {
      dom.eventBanner.classList.add("inactive");
      dom.eventName.textContent = "No Active Event";
      dom.eventRule.textContent = "Normal operations in effect.";
      dom.eventTime.textContent = `Next in ${Math.max(0, Math.ceil(state.nextEventIn))}s`;
      return;
    }

    dom.eventBanner.classList.remove("inactive");
    dom.eventName.textContent = state.activeEvent.name;
    dom.eventRule.textContent = state.activeEvent.description;
    dom.eventTime.textContent = `${Math.max(0, Math.ceil(state.eventTimeLeft))}s left`;
  }

  function renderTicker() {
    if (state.activeEvent) {
      dom.eventTicker.textContent = `Upcoming: ${state.nextEventPreview.name} in queue`;
      return;
    }

    dom.eventTicker.textContent = `Upcoming: ${state.nextEventPreview.name} in ${Math.max(0, Math.ceil(state.nextEventIn))}s`;
  }

  function renderQueue() {
    dom.queue.innerHTML = "";

    for (const container of state.containers) {
      const card = document.createElement("article");
      card.className = `container-card type-${container.type.toLowerCase()}`;
      card.draggable = true;

      card.addEventListener("dragstart", (event) => {
        state.draggedContainerId = container.id;
        event.dataTransfer.setData("text/plain", String(container.id));
      });

      card.innerHTML = `
        <div class="container-title">
          <span>${container.type}</span>
          <span>+${container.baseValue}</span>
        </div>
        <div class="container-meta">
          <span>Default: ${container.defaultLane}</span>
          <span>${Math.max(0, container.urgencyLeft).toFixed(1)}s</span>
        </div>
        <div class="urgency-bar">
          <div class="urgency-fill"></div>
        </div>
      `;

      const urgencyFill = card.querySelector(".urgency-fill");
      const ratio = Math.max(0, container.urgencyLeft / container.urgencyMax);
      urgencyFill.style.width = `${ratio * 100}%`;
      urgencyFill.classList.toggle("mid", ratio <= 0.55 && ratio > 0.25);
      urgencyFill.classList.toggle("low", ratio <= 0.25);

      dom.queue.appendChild(card);
    }
  }

  function playTone(frequency, duration) {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return;
    }

    if (!state.audioCtx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new Context();
    }

    const oscillator = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "triangle";
    gain.gain.value = 0.02;

    oscillator.connect(gain);
    gain.connect(state.audioCtx.destination);

    const now = state.audioCtx.currentTime;
    oscillator.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.stop(now + duration);
  }

  function randomEvent() {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function scaledRange(min, max) {
    const scale = DIFFICULTY[state.difficulty].eventGapScale;
    return randomRange(min, max) * scale;
  }

  init();
})();
