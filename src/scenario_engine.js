const SCENARIO_RISKS = {
  safe: ['Risk of slower compensation growth', 'Potential under-positioning for stretch roles'],
  aggressive: ['Higher workload and burnout risk', 'Greater downside if market cools'],
  pivot: ['Longer transition runway', 'Higher uncertainty in early outcomes']
};

export function buildScenarioForecasts(scenarioNames, cisMean, missions, marketSignal = 0.65) {
  return scenarioNames.map((name) => {
    const multiplier = name === 'aggressive' ? 1.15 : name === 'pivot' ? 1.05 : 1;
    const timeMid = Math.max(3, Math.round((10 - cisMean / 15) * multiplier * (1.1 - marketSignal * 0.2)));
    const earningsMid = Math.round(65000 + cisMean * 900 * multiplier * (0.9 + marketSignal * 0.3));

    return {
      name,
      time_to_transition_months: {
        p10: Math.max(1, timeMid - 2),
        p50: timeMid,
        p90: timeMid + 3
      },
      earnings_3yr: {
        p10: Math.max(40000, earningsMid - 20000),
        p50: earningsMid,
        p90: earningsMid + 30000
      },
      plan: {
        mission_count: missions.length,
        first_missions: missions.slice(0, 3)
      },
      risks: SCENARIO_RISKS[name] ?? []
    };
  });
}
