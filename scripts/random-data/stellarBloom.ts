export interface BloomPoint {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

function halton(index: number, base: number): number {
  let result = 0;
  let f = 1 / base;
  let i = index;

  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }

  return result;
}

export function createBloomGrid(points = 48): BloomPoint[] {
  if (points <= 0) {
    throw new Error('Bloom grid requires at least one point.');
  }

  const grid: BloomPoint[] = [];

  for (let index = 1; index <= points; index += 1) {
    const x = Number(halton(index, 2).toFixed(6));
    const y = Number(halton(index, 3).toFixed(6));
    const radius = Number((0.012 + (index % 5) * 0.0045).toFixed(6));
    const intensity = Number(((0.5 + ((index * 37) % 17) / 34) * 0.8).toFixed(6));
    grid.push({ x, y, radius, intensity });
  }

  return grid;
}

export function calculateCentroid(points: BloomPoint[]): { x: number; y: number } {
  if (points.length === 0) {
    throw new Error('Cannot compute centroid of an empty bloom grid.');
  }

  const sum = points.reduce(
    (accumulator, point) => {
      accumulator.x += point.x * point.intensity;
      accumulator.y += point.y * point.intensity;
      accumulator.intensity += point.intensity;
      return accumulator;
    },
    { x: 0, y: 0, intensity: 0 },
  );

  return {
    x: Number((sum.x / sum.intensity).toFixed(6)),
    y: Number((sum.y / sum.intensity).toFixed(6)),
  };
}
