export function buildExplanationArtifact({ region, constraints, profileSignals, marketSignals, topClusters }) {
  return {
    assumptions: {
      region,
      constraints: constraints ?? {},
      profile_signals: profileSignals,
      market_signals: marketSignals
    },
    top_drivers: [
      `Role adjacency and evidence depth in ${topClusters[0] ?? 'primary cluster'}`,
      'Weekly effort availability and execution consistency',
      'Market demand and skill premium from local seed dataset'
    ],
    top_risks: [
      'Some skills are currently inferred, not measured',
      'Transition speed depends on mission completion consistency',
      'Market saturation can shift by region and quarter'
    ],
    uncertainty_notes: [
      'Confidence improves with additional micro-tests and check-ins.',
      'Forecast ranges are scenario bands, not deterministic outcomes.'
    ]
  };
}
