const eyeStage = document.querySelector(".eye-stage");
const eyes = Array.from(document.querySelectorAll(".eye"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const MAX_IRIS_X = 15;
const MAX_IRIS_Y = 9;
const FOLLOW_STRENGTH = 0.82;
const SMOOTHING = 0.16;

let pointerFrame = null;
let pointerInside = false;

const irisState = eyes.map((eye) => ({
  eye,
  iris: eye.querySelector(".iris-system"),
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
}));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateTargets(clientX, clientY) {
  if (prefersReducedMotion.matches) return;

  for (const state of irisState) {
    const rect = state.eye.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = clamp((clientX - centerX) / (rect.width / 2), -1, 1);
    const normalizedY = clamp((clientY - centerY) / (rect.height / 2), -1, 1);

    state.targetX = normalizedX * MAX_IRIS_X * FOLLOW_STRENGTH;
    state.targetY = normalizedY * MAX_IRIS_Y * FOLLOW_STRENGTH;
  }

  startAnimation();
}

function resetTargets() {
  for (const state of irisState) {
    state.targetX = 0;
    state.targetY = 0;
  }
  startAnimation();
}

function animateIrises() {
  let moving = false;

  for (const state of irisState) {
    const dx = state.targetX - state.currentX;
    const dy = state.targetY - state.currentY;

    state.currentX += dx * SMOOTHING;
    state.currentY += dy * SMOOTHING;

    if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
      moving = true;
    } else {
      state.currentX = state.targetX;
      state.currentY = state.targetY;
    }

    state.iris.setAttribute(
      "transform",
      `translate(${state.currentX.toFixed(2)} ${state.currentY.toFixed(2)})`
    );
  }

  pointerFrame = moving ? requestAnimationFrame(animateIrises) : null;
}

function startAnimation() {
  if (pointerFrame === null) {
    pointerFrame = requestAnimationFrame(animateIrises);
  }
}

function handlePointerMove(event) {
  pointerInside = true;
  updateTargets(event.clientX, event.clientY);
}

function handleTouchStart(event) {
  if (event.pointerType !== "touch") return;
  pointerInside = true;
  updateTargets(event.clientX, event.clientY);
}

function handleTouchEnd(event) {
  if (event.pointerType !== "touch") return;
  resetPointer();
}

function resetPointer() {
  pointerInside = false;
  resetTargets();
}

eyeStage.addEventListener("pointermove", handlePointerMove);
eyeStage.addEventListener("pointerdown", handleTouchStart);
eyeStage.addEventListener("pointerup", handleTouchEnd);
eyeStage.addEventListener("pointercancel", handleTouchEnd);
eyeStage.addEventListener("pointerleave", resetPointer);
window.addEventListener("blur", resetPointer);

window.addEventListener("resize", () => {
  if (pointerInside) resetTargets();
});

prefersReducedMotion.addEventListener("change", () => {
  if (prefersReducedMotion.matches) resetTargets();
});

window.addEventListener("pagehide", () => {
  if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
});


// Keep each blink overlay anchored to its own eye, including the stacked mobile layout.
const leftEye = document.querySelector(".eye-left");
const rightEye = document.querySelector(".eye-right");
const leftBlinkLid = document.querySelector(".blink-lid-left");
const rightBlinkLid = document.querySelector(".blink-lid-right");

if (leftEye && leftBlinkLid) leftEye.prepend(leftBlinkLid);
if (rightEye && rightBlinkLid) rightEye.prepend(rightBlinkLid);

const blinkLids = Array.from(document.querySelectorAll(".blink-lid"));
const BLINK_MIN_DELAY = 2600;
const BLINK_MAX_DELAY = 5200;
const BLINK_DURATION = 220;
let blinkTimer = null;
let blinkEndTimer = null;

function scheduleBlink() {
  if (prefersReducedMotion.matches || document.hidden) return;

  const delay = BLINK_MIN_DELAY + Math.random() * (BLINK_MAX_DELAY - BLINK_MIN_DELAY);
  blinkTimer = window.setTimeout(() => {
    if (prefersReducedMotion.matches || document.hidden) {
      scheduleBlink();
      return;
    }

    eyeStage.classList.add("is-blinking");
    blinkEndTimer = window.setTimeout(() => {
      eyeStage.classList.remove("is-blinking");
      blinkEndTimer = null;
      scheduleBlink();
    }, BLINK_DURATION);
  }, delay);
}

function stopBlinking() {
  if (blinkTimer !== null) {
    window.clearTimeout(blinkTimer);
    blinkTimer = null;
  }

  if (blinkEndTimer !== null) {
    window.clearTimeout(blinkEndTimer);
    blinkEndTimer = null;
  }

  eyeStage.classList.remove("is-blinking");
}

function triggerBlink() {
  if (prefersReducedMotion.matches || document.hidden) return;

  stopBlinking();
  eyeStage.classList.add("is-blinking");
  blinkEndTimer = window.setTimeout(() => {
    eyeStage.classList.remove("is-blinking");
    blinkEndTimer = null;
    scheduleBlink();
  }, BLINK_DURATION);
}

function refreshBlinking() {
  stopBlinking();
  if (!prefersReducedMotion.matches && !document.hidden) scheduleBlink();
}

eyeStage.addEventListener("click", triggerBlink);

prefersReducedMotion.addEventListener("change", refreshBlinking);
document.addEventListener("visibilitychange", refreshBlinking);
window.addEventListener("pagehide", stopBlinking);
refreshBlinking();
