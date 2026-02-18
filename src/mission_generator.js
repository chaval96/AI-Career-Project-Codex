import { randomUUID } from 'node:crypto';

function mission(title, expectedTimeMin, skillTargets) {
  return {
    mission_id: randomUUID(),
    title,
    expected_time_min: expectedTimeMin,
    skill_targets: skillTargets
  };
}

export function generateStarterMissions(topClusters, timePerWeekHours = 8) {
  const primary = topClusters[0] ?? 'software_engineering';
  const weeklyMinutes = Math.max(120, Math.round(timePerWeekHours * 60));

  return [
    mission(`Complete one ${primary} micro-test and review reliability`, Math.round(weeklyMinutes * 0.25), [
      'problem_solving',
      'decision_quality'
    ]),
    mission(`Publish one evidence artifact aligned to ${primary}`, Math.round(weeklyMinutes * 0.35), [
      'execution',
      'communication'
    ]),
    mission('Run weekly check-in and resolve one blocker', Math.round(weeklyMinutes * 0.15), ['self_management']),
    mission('Review market intel deltas and adjust mission order', Math.round(weeklyMinutes * 0.25), [
      'market_awareness'
    ])
  ];
}
