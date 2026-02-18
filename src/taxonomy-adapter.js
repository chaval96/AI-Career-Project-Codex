import { analyzeResumeItems } from './profile_analyst.js';

export function enrichResumeWithTaxonomy(items) {
  const onetEnabled = String(process.env.ONET_ENABLED ?? 'false').toLowerCase() === 'true';
  const escoEnabled = String(process.env.ESCO_ENABLED ?? 'false').toLowerCase() === 'true';

  // MVP default keeps enrichment deterministic and local-seed based.
  if (!onetEnabled && !escoEnabled) {
    return analyzeResumeItems(items);
  }

  // External adapters can be plugged in here later without blocking onboarding.
  return analyzeResumeItems(items);
}
