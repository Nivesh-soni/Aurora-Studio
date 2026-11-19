import assert from "node:assert/strict";
import test from "node:test";
import { getEdgeResizeTransform } from "./transformMath.js";

const initialTransform = {
  initialX: 50,
  initialY: 50,
  initialScaleX: 1,
  initialScaleY: 1,
  initialWidth: 200,
  initialHeight: 100,
  rotation: 0,
  stageWidth: 1000,
  stageHeight: 1000,
};

test("horizontal edges resize width only and keep the opposite edge anchored", () => {
  const right = getEdgeResizeTransform({
    ...initialTransform,
    edge: "right",
    pointerDeltaX: 40,
    pointerDeltaY: 0,
  });
  const left = getEdgeResizeTransform({
    ...initialTransform,
    edge: "left",
    pointerDeltaX: -40,
    pointerDeltaY: 0,
  });

  assert.equal(right.scaleX, 1.2);
  assert.equal(right.scaleY, 1);
  assert.equal(right.x, 52);
  assert.equal(left.scaleX, 1.2);
  assert.equal(left.scaleY, 1);
  assert.equal(left.x, 48);
});

test("vertical edges resize height only and keep the opposite edge anchored", () => {
  const result = getEdgeResizeTransform({
    ...initialTransform,
    edge: "top",
    pointerDeltaX: 0,
    pointerDeltaY: -30,
  });
  const bottom = getEdgeResizeTransform({
    ...initialTransform,
    edge: "bottom",
    pointerDeltaX: 0,
    pointerDeltaY: 30,
  });

  assert.equal(result.scaleX, 1);
  assert.equal(result.scaleY, 1.3);
  assert.equal(result.x, 50);
  assert.equal(result.y, 48.5);
  assert.equal(bottom.scaleX, 1);
  assert.equal(bottom.scaleY, 1.3);
  assert.equal(bottom.y, 51.5);
});

test("edge resizing follows the selected edge after rotation", () => {
  const result = getEdgeResizeTransform({
    ...initialTransform,
    edge: "top",
    pointerDeltaX: 30,
    pointerDeltaY: 0,
    rotation: 90,
  });

  assert.equal(result.scaleX, 1);
  assert.equal(result.scaleY, 1.3);
  assert.equal(result.y, 50);
});
