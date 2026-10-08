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
  if (event.pointerType === "touch") return;
  pointerInside = true;
  updateTargets(event.clientX, event.clientY);
}

function resetPointer() {
  pointerInside = false;
  resetTargets();
}

eyeStage.addEventListener("pointermove", handlePointerMove);
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
