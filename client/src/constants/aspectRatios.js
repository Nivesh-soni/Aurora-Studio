export const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape", width: 16, height: 9 },
  { value: "9:16", label: "Portrait", width: 9, height: 16 },
  { value: "1:1", label: "Square", width: 1, height: 1 },
  { value: "4:3", label: "Classic", width: 4, height: 3 },
  { value: "21:9", label: "Ultrawide", width: 21, height: 9 },
];

export const DEFAULT_ASPECT_RATIO = "16:9";

export const getAspectRatioStyle = (aspectRatio = DEFAULT_ASPECT_RATIO) => {
  const [width, height] = aspectRatio.split(":").map(Number);
  return width > 0 && height > 0 ? `${width} / ${height}` : "16 / 9";
};
