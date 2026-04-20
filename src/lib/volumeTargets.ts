import { BASE_VOLUME_TARGETS_180LB_INTERMEDIATE, EXPERIENCE_MULTIPLIERS } from '@/src/constants';
import type { UserProfile } from '@/src/types';

/**
 * Compute personalized weekly volume targets for a user.
 * Formula: base_target × (bodyweight_lb / 180) × experience_multiplier
 * Per-muscle overrides in profile.volumeTargetOverrides take precedence over the formula.
 *
 * @param profile The user's profile (or partial). Falls back to intermediate 180lb defaults.
 * @returns Map of muscle group → target volume in lbs moved per week.
 */
export function computeVolumeTargets(
  profile?: Partial<UserProfile> | null
): Record<string, number> {
  // Parse bodyweight from profile. Fall back to 180lb.
  const bodyweightRaw = profile?.weight;
  let bodyweight = 180;
  if (typeof bodyweightRaw === 'number' && bodyweightRaw > 0) {
    bodyweight = bodyweightRaw;
  } else if (typeof bodyweightRaw === 'string') {
    const parsed = parseFloat(bodyweightRaw);
    if (!isNaN(parsed) && parsed > 0) bodyweight = parsed;
  }
  // Clamp to a sane range
  if (bodyweight < 80) bodyweight = 80;
  if (bodyweight > 400) bodyweight = 400;

  // Parse height from profile (default to 5'10" / 70 inches)
  const heightRaw = profile?.height;
  let heightInches = 70;
  if (typeof heightRaw === 'number' && heightRaw > 0) {
    heightInches = heightRaw;
  } else if (typeof heightRaw === 'string') {
    if (heightRaw.includes("'")) {
      // Parse "5'10" format
      const [ft, inRaw] = heightRaw.split("'");
      heightInches = (parseInt(ft) * 12) + (parseInt(inRaw) || 0);
    } else {
      // Parse raw string number
      const parsed = parseFloat(heightRaw);
      if (!isNaN(parsed) && parsed > 0) heightInches = parsed;
    }
  }
  // Clamp to sane human limits (4ft to 8ft)
  if (heightInches < 48) heightInches = 48;
  if (heightInches > 96) heightInches = 96;

  const heightScale = 70 / heightInches;
  const experience = profile?.trainingExperience || 'intermediate';
  const expMultiplier = EXPERIENCE_MULTIPLIERS[experience] ?? 1.0;
  const bwScale = bodyweight / 180;

  const result: Record<string, number> = {};
  const overrides = profile?.volumeTargetOverrides || {};

  Object.entries(BASE_VOLUME_TARGETS_180LB_INTERMEDIATE).forEach(([muscle, base]) => {
    if (muscle in overrides && overrides[muscle] > 0) {
      // User-set override wins
      result[muscle] = Math.round(overrides[muscle]);
    } else {
      // NEW FORMULA: Base * BW * Height * Experience
      result[muscle] = Math.round(base * bwScale * heightScale * expMultiplier);
    }
  });

  return result;
}
