export const TRACK_GROUPS = ["media", "audio", "text"];

export function getTrackGroup(track) {
  if (track === "video" || track === "image" || track?.startsWith("media-")) return "media";
  if (track === "audio" || track?.startsWith("audio-")) return "audio";
  if (track === "text" || track?.startsWith("text-")) return "text";
  return null;
}

export function getTrackNumber(track) {
  const match = track?.match(/-(\d+)$/);
  return match ? Number(match[1]) : 1;
}

export function makeTrackId(group, number) {
  return `${group}-${number}`;
}

export function normalizeClipTracks(clips) {
  const laneMaps = new Map(TRACK_GROUPS.map((group) => {
    const laneNumbers = [...new Set(clips
      .filter((clip) => getClipGroup(clip) === group)
      .map((clip) => getTrackNumber(clip.track)))]
      .sort((first, second) => first - second);
    return [group, new Map(laneNumbers.map((lane, index) => [lane, index + 1]))];
  }));
  const normalized = [];

  for (const clip of clips) {
    const group = getClipGroup(clip);
    const lane = laneMaps.get(group).get(getTrackNumber(clip.track)) || 1;
    const preferredTrack = makeTrackId(group, lane);
    const track = findAvailableTrack(normalized, group, clip.start, clip.duration, null, preferredTrack);
    normalized.push({ ...clip, track });
  }

  return normalized;
}

export function getClipGroup(clip) {
  if (clip.kind === "text") return "text";
  if (clip.kind === "audio") return "audio";
  return "media";
}

export function getTimelineTracks(clips) {
  return TRACK_GROUPS.flatMap((group) => {
    const lastNumber = clips.reduce((largest, clip) => (
      getTrackGroup(clip.track) === group
        ? Math.max(largest, getTrackNumber(clip.track))
        : largest
    ), 1);
    return Array.from({ length: lastNumber }, (_, index) => ({
      id: makeTrackId(group, index + 1),
      group,
      number: index + 1,
    }));
  });
}

export function findAvailableTrack(clips, group, start, duration, excludedClipId = null, preferredTrack = null) {
  const firstNumber = preferredTrack && getTrackGroup(preferredTrack) === group
    ? getTrackNumber(preferredTrack)
    : 1;
  const end = start + duration;

  for (let number = firstNumber; ; number += 1) {
    const trackId = makeTrackId(group, number);
    const hasOverlap = clips.some((clip) => {
      if (clip.id === excludedClipId || getTrackGroup(clip.track) !== group) return false;
      if (getTrackNumber(clip.track) !== number) return false;
      return start < clip.start + clip.duration && end > clip.start;
    });
    if (!hasOverlap) return trackId;
  }
}
