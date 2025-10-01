export interface BeatSlice {
  timestamp: number;
  amplitude: number;
}

function lcg(seed: number): () => number {
  let state = Math.floor(seed * 233280) % 233280;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function generateBeatSlices(durationMs = 4000, density = 64, seed = 0.731): BeatSlice[] {
  if (durationMs <= 0) {
    throw new Error('Duration must be positive.');
  }

  const random = lcg(seed);
  const slices: BeatSlice[] = [];
  const interval = durationMs / density;

  for (let index = 0; index <= density; index += 1) {
    const timestamp = Number((index * interval).toFixed(3));
    const amplitude = Number((0.35 + random() * 0.6).toFixed(4));
    slices.push({ timestamp, amplitude });
  }

  return slices;
}

export function summarizeEnergy(slices: BeatSlice[]): number {
  return Number(
    slices
      .reduce((total, slice) => total + slice.amplitude * slice.amplitude, 0)
      .toFixed(6),
  );
}
