export function scoreAssessmentEvents(events) {
  const eventCount = events.length;
  const overall = Math.min(1, 0.35 + eventCount * 0.03);

  return {
    overall: Number(overall.toFixed(2)),
    subscores: {
      reasoning: Number(Math.min(1, overall * 0.95).toFixed(2)),
      debugging: Number(Math.min(1, overall * 1.02).toFixed(2)),
      communication: Number(Math.max(0.2, overall * 0.88).toFixed(2))
    }
  };
}

export function buildAssessmentResultFromAttempt(attempt) {
  const scores = scoreAssessmentEvents(attempt.events ?? []);
  const reliability = Number(Math.min(1, 0.6 + (attempt.events ?? []).length * 0.02).toFixed(2));

  return {
    attempt_id: attempt.attempt_id,
    scores,
    reliability,
    evidence_items_created: Math.max(1, Math.round(scores.overall * 4)),
    model_delta_summary: [
      `Reasoning signal ${scores.subscores.reasoning >= 0.6 ? 'improved' : 'needs more evidence'}.`,
      `Communication signal ${scores.subscores.communication >= 0.55 ? 'stable' : 'uncertain'}.`
    ]
  };
}
