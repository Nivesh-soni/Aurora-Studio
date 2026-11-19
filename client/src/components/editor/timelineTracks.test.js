import assert from "node:assert/strict";
import test from "node:test";
import {
  findAvailableTrack,
  getClipGroup,
  getTrackGroup,
  normalizeClipTracks,
} from "./timelineTracks.js";

test("shapes and emoji stickers use a separate elements lane", () => {
  assert.equal(getClipGroup({ kind: "shape" }), "elements");
  assert.equal(getClipGroup({ kind: "text", isEmoji: true }), "elements");
  assert.equal(getClipGroup({ kind: "text" }), "text");
  assert.equal(getTrackGroup("shape-1"), "elements");
});

test("legacy shape clips normalize away from text tracks", () => {
  const clips = normalizeClipTracks([
    { id: "shape", kind: "shape", track: "text-1", start: 0, duration: 5 },
    { id: "emoji", kind: "text", isEmoji: true, track: "text-1", start: 0, duration: 5 },
    { id: "text", kind: "text", track: "text-1", start: 0, duration: 5 },
  ]);

  assert.equal(clips[0].track, "elements-1");
  assert.equal(clips[1].track, "elements-2");
  assert.equal(clips[2].track, "text-1");
});

test("overlapping clip timing moves to the next available lane", () => {
  const clips = [
    { id: "previous", track: "media-1", start: 0, duration: 2 },
    { id: "selected", track: "media-1", start: 2, duration: 3 },
    { id: "next", track: "media-1", start: 5, duration: 2 },
    { id: "other-track", track: "media-2", start: 2, duration: 8 },
  ];

  assert.equal(findAvailableTrack(clips, "media", 2, 8, "selected", "media-1"), "media-3");
  assert.equal(findAvailableTrack(clips, "media", 2, 3, "selected", "media-1"), "media-1");
});
