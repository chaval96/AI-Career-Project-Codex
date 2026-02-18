const MARKET_SEED = {
  software_engineering: { demand_index: 0.77, salary_mid: 146000, skill_premium: 0.62, saturation: 0.44 },
  data_analytics: { demand_index: 0.71, salary_mid: 132000, skill_premium: 0.58, saturation: 0.49 },
  product_strategy: { demand_index: 0.66, salary_mid: 141000, skill_premium: 0.51, saturation: 0.46 },
  engineering_management: { demand_index: 0.69, salary_mid: 168000, skill_premium: 0.56, saturation: 0.42 }
};

function scoreCluster(cluster, profileSignal) {
  const seed = MARKET_SEED[cluster] ?? MARKET_SEED.software_engineering;
  const score = seed.demand_index * 0.4 + seed.skill_premium * 0.35 + (1 - seed.saturation) * 0.25 + profileSignal * 0.15;
  return Number(Math.min(1, score).toFixed(3));
}

export function rankRoleClusters(candidates, profileSignal = 0.5) {
  const unique = Array.from(new Set(candidates));
  const ranked = unique
    .map((cluster) => ({ cluster, score: scoreCluster(cluster, profileSignal), market: MARKET_SEED[cluster] ?? MARKET_SEED.software_engineering }))
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export function marketSnapshotFor(cluster) {
  return MARKET_SEED[cluster] ?? MARKET_SEED.software_engineering;
}
