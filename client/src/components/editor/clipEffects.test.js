import assert from "node:assert/strict";
import test from "node:test";
import { getClipAnimationStyle, getClipTransitionStyle } from "./clipEffects.js";

test("shape clips can use directional animations", () => {
  const clip = {
    kind: "shape",
    start: 4,
    duration: 2,
    animation: { type: "slide-left", duration: 1 },
  };

  assert.equal(getClipAnimationStyle(clip, 4.5).transform, "translateX(-24px)");
});

test("shape clips can use zoom-out transitions", () => {
  const clip = {
    kind: "shape",
    start: 4,
    duration: 2,
    transition: { type: "zoom-out", duration: 1, placement: "in" },
  };

  assert.equal(getClipTransitionStyle(clip, 4.5).transform, "scale(1.1)");
});

test("slide transitions respect their selected edge and timing", () => {
  const clip = {
    kind: "shape",
    start: 4,
    duration: 2,
    transition: { type: "slide-up", duration: 1, placement: "in" },
  };

  assert.equal(getClipTransitionStyle(clip, 4.25).transform, "translateY(75%)");
});
