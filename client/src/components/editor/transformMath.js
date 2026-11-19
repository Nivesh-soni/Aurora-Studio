const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function getEdgeResizeTransform({
  edge,
  pointerDeltaX,
  pointerDeltaY,
  initialX,
  initialY,
  initialScaleX,
  initialScaleY,
  initialWidth,
  initialHeight,
  rotation,
  stageWidth,
  stageHeight,
}) {
  const radians = (rotation * Math.PI) / 180;
  const localX = pointerDeltaX * Math.cos(radians) + pointerDeltaY * Math.sin(radians);
  const localY = -pointerDeltaX * Math.sin(radians) + pointerDeltaY * Math.cos(radians);
  const horizontalEdge = edge === "left" || edge === "right" ? edge : null;
  const verticalEdge = edge === "top" || edge === "bottom" ? edge : null;
  const widthChange = horizontalEdge === "right" ? localX : horizontalEdge === "left" ? -localX : 0;
  const heightChange = verticalEdge === "bottom" ? localY : verticalEdge === "top" ? -localY : 0;
  const scaleX = clamp(initialScaleX + widthChange / initialWidth, 0.1, 5);
  const scaleY = clamp(initialScaleY + heightChange / initialHeight, 0.1, 5);
  const actualWidthChange = (scaleX - initialScaleX) * initialWidth;
  const actualHeightChange = (scaleY - initialScaleY) * initialHeight;
  const localCenterX = horizontalEdge === "right" ? actualWidthChange / 2 : horizontalEdge === "left" ? -actualWidthChange / 2 : 0;
  const localCenterY = verticalEdge === "bottom" ? actualHeightChange / 2 : verticalEdge === "top" ? -actualHeightChange / 2 : 0;
  const centerX = localCenterX * Math.cos(radians) - localCenterY * Math.sin(radians);
  const centerY = localCenterX * Math.sin(radians) + localCenterY * Math.cos(radians);

  return {
    scaleX,
    scaleY,
    x: clamp(initialX + (centerX / stageWidth) * 100, 0, 100),
    y: clamp(initialY + (centerY / stageHeight) * 100, 0, 100),
  };
}
