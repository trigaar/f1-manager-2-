export type LapModifiers = {
  weatherMultiplier?: number;
  flagMultiplier?: number;
  raceCraftPenalty?: number;
  lapPerformanceModifier?: number;
  baseLapReference?: number;
};

/**
 * A safe replacement for clampNumber that never returns NaN/undefined.
 * - If the provided value is not a finite number, this returns the provided reference fallback (or 90).
 * - Ensures return is within [min, max].
 */
export function safeClampNumber(value: unknown, reference = 90, min = 40, max = 400): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const ref = Number(reference);
    return Number.isFinite(ref) ? Math.max(min, Math.min(max, ref)) : Math.max(min, Math.min(max, 90));
  }
  return Math.max(min, Math.min(max, num));
}

/**
 * Compute a safe lap time based on a raw baseLapTime and several optional modifiers.
 * This function is intentionally defensive:
 * - It tolerates NaN/undefined baseLapTime and falls back to baseLapReference or 90.
 * - It applies multipliers / penalties if present, then rounds to 3 decimals and clamps to sensible bounds.
 */
export function computeSafeLapTime(
  rawBaseLapTime: unknown,
  modifiers: LapModifiers = {}
): number {
  const baseRef = modifiers.baseLapReference ?? 90;
  // Turn raw value into a finite number or fallback
  let base = Number(rawBaseLapTime);
  if (!Number.isFinite(base)) {
    base = Number(baseRef);
    if (!Number.isFinite(base)) base = 90;
  }

  // Apply multipliers/penalties defensively
  if (Number.isFinite(modifiers.weatherMultiplier ?? NaN)) {
    base *= Number(modifiers.weatherMultiplier);
  }
  if (Number.isFinite(modifiers.flagMultiplier ?? NaN)) {
    base *= Number(modifiers.flagMultiplier);
  }
  if (Number.isFinite(modifiers.raceCraftPenalty ?? NaN)) {
    base += Number(modifiers.raceCraftPenalty);
  }
  if (Number.isFinite(modifiers.lapPerformanceModifier ?? NaN)) {
    base += Number(modifiers.lapPerformanceModifier);
  }

  // Round to 3 decimals
  const rounded = Number.parseFloat(base.toFixed(3));
  // Final safe clamp
  return safeClampNumber(rounded, baseRef, 40, 400);
}
