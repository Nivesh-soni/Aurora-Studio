export function getClipOpacity(clip, currentTime) {
  return getClipTransitionStyle(clip, currentTime).opacity;
}

const clampProgress = (value) => Math.max(0, Math.min(1, value));

export function getClipTransitionStyle(clip, currentTime) {
  const transition = clip.transition || {};
  const type = transition.type || "none";
  const duration = Math.max(
    0.1,
    Math.min(Number(transition.duration) || 0.5, clip.duration / 2),
  );
  const elapsed = currentTime - clip.start;
  const remaining = clip.start + clip.duration - currentTime;
  const placement = transition.placement || "in";
  const entering = placement !== "out" && elapsed >= 0 && elapsed < duration;
  const leaving = placement !== "in" && remaining >= 0 && remaining < duration;
  if (type === "none" || (!entering && !leaving))
    return { opacity: 1, transform: "" };

  const progress = entering
    ? clampProgress(elapsed / duration)
    : clampProgress(remaining / duration);
  const widthShare =
    (clip.kind === "text" ? 0.8 : 1) *
    Math.max(0.1, Number(clip.scale ?? 100) / 100);
  const offset = ((1 - progress) * 100) / widthShare;
  const scale = 0.8 + progress * 0.2;
  const direction = type === "slide-right" ? 1 : -1;

  return {
    opacity: type === "fade" ? progress : 1,
    transform:
      type === "slide-left" || type === "slide-right"
        ? `translateX(${offset * direction}%)`
        : type === "zoom"
          ? `scale(${scale})`
          : "",
  };
}

export function getClipAnimationStyle(clip, currentTime) {
  const animation = clip.animation || {};
  const type = animation.type || "none";
  const duration = Math.max(
    0.1,
    Math.min(Number(animation.duration) || 0.5, clip.duration),
  );
  const progress = clampProgress((currentTime - clip.start) / duration);
  const scale = 0.6 + progress * 0.4;

  return {
    opacity: type === "fade" ? progress : 1,
    transform:
      type === "slide-up"
        ? `translateY(${(1 - progress) * 48}px)`
        : type === "zoom"
          ? `scale(${scale})`
          : "",
  };
}

export function getClipFilter(clip) {
  const effects = clip.effects || {};
  const brightness = Math.max(
    0,
    Math.min(200, Number(effects.brightness ?? 100)),
  );
  const contrast = Math.max(0, Math.min(200, Number(effects.contrast ?? 100)));
  const saturation = Math.max(
    0,
    Math.min(200, Number(effects.saturation ?? 100)),
  );
  const blur = Math.max(0, Math.min(20, Number(effects.blur ?? 0)));
  return [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    `blur(${blur}px)`,
  ].join(" ");
}
