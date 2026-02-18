function monthsBetween(startIso, endIso) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  const diff = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  return Math.max(1, diff);
}

export function computeCareerVelocity(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0.2;
  }

  const totalMonths = items.reduce((sum, item) => sum + monthsBetween(item.start_date, item.end_date), 0);
  const transitions = Math.max(0, items.length - 1);
  return Number(Math.min(1, 0.25 + transitions / Math.max(12, totalMonths)).toFixed(2));
}

export function computeComplexityGrowthProxy(items) {
  const score = Math.min(1, 0.3 + items.length * 0.08);
  return Number(score.toFixed(2));
}

export function computeCvSignals(items) {
  return {
    career_velocity: computeCareerVelocity(items),
    role_complexity_growth: computeComplexityGrowthProxy(items),
    adaptability_index: Number(Math.min(1, 0.35 + items.length * 0.07).toFixed(2))
  };
}
