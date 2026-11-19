const normalizeHexColor = (color) => (
  /^#[\da-f]{6}$/i.test(color || "") ? color : "#000000"
);

export function getHexHue(color) {
  const hex = normalizeHexColor(color);
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;

  if (delta === 0) return 0;
  if (maximum === red) return Math.round((60 * (((green - blue) / delta) % 6) + 360) % 360);
  if (maximum === green) return Math.round(60 * ((blue - red) / delta + 2));
  return Math.round(60 * ((red - green) / delta + 4));
}

export function setHexHue(color, hue) {
  const hex = normalizeHexColor(color);
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;
  const delta = maximum - minimum;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const nextSaturation = saturation === 0 ? 1 : saturation;
  const nextLightness = lightness === 0 || lightness === 1 ? 0.5 : lightness;
  const normalizedHue = ((Number(hue) % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * nextLightness - 1)) * nextSaturation;
  const hueSection = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const [baseRed, baseGreen, baseBlue] = hueSection < 1
    ? [chroma, secondary, 0]
    : hueSection < 2
      ? [secondary, chroma, 0]
      : hueSection < 3
        ? [0, chroma, secondary]
        : hueSection < 4
          ? [0, secondary, chroma]
          : hueSection < 5
            ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const offset = nextLightness - chroma / 2;
  const toHex = (value) => Math.round((value + offset) * 255).toString(16).padStart(2, "0");

  return `#${toHex(baseRed)}${toHex(baseGreen)}${toHex(baseBlue)}`;
}
