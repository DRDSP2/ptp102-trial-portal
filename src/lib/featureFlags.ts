/**
 * Feature flags for incremental Supabase data-layer migration.
 *
 * All flags default to `false`. The historical mock data layer
 * (src/lib/uibakeryDataMock.ts) remains the source of truth until a
 * flag is explicitly flipped on per-environment.
 *
 * Flags are read from Vite-inlined env vars (VITE_*) at build time.
 * To override at runtime in tests, set window.__FEATURE_FLAGS__ before
 * the module is imported.
 */

type FlagName =
  | 'patients'
  // Reserved for future migrations. Adding the names early keeps the
  // call-site shape stable; they all stay false until implemented.
  | 'treatments'
  | 'clinicalAssessments'
  | 'clinicalNotes'
  | 'labResults'
  | 'veterinarians';

type FlagMap = Record<FlagName, boolean>;

const FLAG_ENV_VAR: Record<FlagName, string> = {
  patients: 'VITE_USE_SUPABASE_PATIENTS',
  treatments: 'VITE_USE_SUPABASE_TREATMENTS',
  clinicalAssessments: 'VITE_USE_SUPABASE_CLINICAL_ASSESSMENTS',
  clinicalNotes: 'VITE_USE_SUPABASE_CLINICAL_NOTES',
  labResults: 'VITE_USE_SUPABASE_LAB_RESULTS',
  veterinarians: 'VITE_USE_SUPABASE_VETERINARIANS',
};

function parseBool(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

function readViteEnv(name: string): unknown {
  // import.meta.env is inlined by Vite at build time. In jsdom/node tests
  // it's still present (vitest shims it), but values may be undefined.
  try {
    return (import.meta.env as Record<string, unknown>)[name];
  } catch {
    return undefined;
  }
}

function readRuntimeOverride(name: FlagName): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  const overrides = (window as unknown as { __FEATURE_FLAGS__?: Partial<FlagMap> }).__FEATURE_FLAGS__;
  if (!overrides) return undefined;
  return overrides[name];
}

function computeFlags(): FlagMap {
  const out = {} as FlagMap;
  (Object.keys(FLAG_ENV_VAR) as FlagName[]).forEach((name) => {
    const override = readRuntimeOverride(name);
    if (typeof override === 'boolean') {
      out[name] = override;
      return;
    }
    out[name] = parseBool(readViteEnv(FLAG_ENV_VAR[name]));
  });
  return out;
}

export const flags: FlagMap = computeFlags();

/**
 * Test-only helper. Recomputes flags from current env / window overrides.
 * Do not call from app code.
 */
export function __recomputeFlagsForTests(): FlagMap {
  const next = computeFlags();
  (Object.keys(next) as FlagName[]).forEach((k) => {
    flags[k] = next[k];
  });
  return flags;
}

/**
 * Returns `real` when `flag` is enabled, otherwise `mock`. Both arguments
 * are evaluated lazily so the disabled side never runs.
 */
export function withFlag<T>(flag: boolean, real: () => T, mock: () => T): T {
  return flag ? real() : mock();
}
