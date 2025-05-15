import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function valueUpdater(updaterOrValue, ref) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue;
}

export function calculateBPM(
  startTime,
  endTime,
  startBPM,
  endBPM,
  currentTime = Date.now()
) {
  const totalDuration = endTime - startTime;
  const elapsedDuration = currentTime - startTime;
  const progress = Math.min(Math.max(elapsedDuration / totalDuration, 0), 1);
  return startBPM + (endBPM - startBPM) * progress;
}