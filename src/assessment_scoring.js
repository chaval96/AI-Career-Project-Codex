function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mean(numbers, fallback = 0.5) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return fallback;
  }
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return total / numbers.length;
}

function ratingToScore(value) {
  if (typeof value !== 'number') {
    return null;
  }
  return clamp(value / 5, 0, 1);
}

function pickDimensionScores(events) {
  const reasoning = [];
  const execution = [];
  const communication = [];

  for (const event of events) {
    const payload = event?.data;
    if (!payload || typeof payload !== 'object') {
      continue;
    }

    const score = ratingToScore(payload.rating);
    if (score === null) {
      continue;
    }

    const dimension = typeof payload.dimension === 'string' ? payload.dimension : '';
    if (dimension === 'reasoning') {
      reasoning.push(score);
    } else if (dimension === 'execution') {
      execution.push(score);
    } else if (dimension === 'communication') {
      communication.push(score);
    }
  }

  return {
    reasoning: mean(reasoning),
    execution: mean(execution),
    communication: mean(communication)
  };
}

export function scoreAssessmentEvents(events) {
  const eventCount = events.length;
  const dimScores = pickDimensionScores(events);
  const fallbackOverall = clamp(0.35 + eventCount * 0.03, 0.35, 0.92);
  const measuredOverall = mean([dimScores.reasoning, dimScores.execution, dimScores.communication], fallbackOverall);

  const overall = Number(measuredOverall.toFixed(2));
  return {
    overall,
    subscores: {
      reasoning: Number(dimScores.reasoning.toFixed(2)),
      debugging: Number(dimScores.execution.toFixed(2)),
      communication: Number(dimScores.communication.toFixed(2))
    }
  };
}

export function buildAssessmentResultFromAttempt(attempt) {
  const scores = scoreAssessmentEvents(attempt.events ?? []);
  const reliability = Number(
    Math.min(
      1,
      0.55
      + (attempt.events ?? []).length * 0.03
      + (scores.overall >= 0.7 ? 0.08 : 0)
    ).toFixed(2)
  );

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
