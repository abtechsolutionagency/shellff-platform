export interface ColorStop {
  position: number;
  hue: number;
  saturation: number;
  lightness: number;
}

const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

function normalize(value: number): number {
  return ((value % 1) + 1) % 1;
}

export function createAuroraStops(seed = 0.37912, count = 12): ColorStop[] {
  if (count <= 0) {
    throw new Error('Aurora stops require at least one color stop.');
  }

  let cursor = normalize(seed);
  const stops: ColorStop[] = [];

  for (let index = 0; index < count; index += 1) {
    cursor = normalize(cursor + GOLDEN_RATIO_CONJUGATE);
    const position = Number((index / (count - 1 || 1)).toFixed(6));
    const hue = Number((cursor * 360).toFixed(3));
    const saturation = Number(((0.45 + cursor * 0.35) * 100).toFixed(3));
    const lightness = Number(((0.35 + (1 - cursor) * 0.25) * 100).toFixed(3));

    stops.push({ position, hue, saturation, lightness });
  }

  return stops;
}

export function toCssGradient(stops: ColorStop[]): string {
  const segments = stops
    .map((stop) => {
      const { position, hue, saturation, lightness } = stop;
      return `hsl(${hue} ${saturation}% ${lightness}%) ${(position * 100).toFixed(2)}%`;
    })
    .join(', ');

  return `linear-gradient(120deg, ${segments})`;
}
