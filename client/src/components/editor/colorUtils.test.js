import assert from "node:assert/strict";
import test from "node:test";
import { getHexHue, setHexHue } from "./colorUtils.js";

test("hue changes preserve saturation and lightness for chromatic colors", () => {
  assert.equal(getHexHue("#ff0000"), 0);
  assert.equal(setHexHue("#ff0000", 120), "#00ff00");
});

test("hue changes make black and white colors adjustable", () => {
  assert.equal(setHexHue("#000000", 240), "#0000ff");
  assert.equal(setHexHue("#ffffff", 240), "#0000ff");
});
