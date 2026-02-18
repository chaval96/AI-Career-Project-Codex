import { computeCvSignals } from './cv_intelligence.js';
import { buildExplanationArtifact } from './explanations.js';
import { rankRoleClusters } from './market_seed.js';
import { generateStarterMissions } from './mission_generator.js';
import { buildScenarioForecasts } from './scenario_engine.js';

function normalizeScenarioNames(input) {
  const fallback = ['safe', 'aggressive', 'pivot'];
  if (!Array.isArray(input) || input.length === 0) {
    return fallback;
  }
  return input.filter((name) => typeof name === 'string' && name.length > 0);
}

export function buildBlueprint(blueprintId, payload, generatedAt) {
  const targetRoles = Array.isArray(payload.target_roles) ? payload.target_roles : ['software_engineering'];
  const scenarios = normalizeScenarioNames(payload.scenarios);

  const cvSignals = computeCvSignals(Array.isArray(payload.resume_items) ? payload.resume_items : []);
  const rankedClusters = rankRoleClusters(targetRoles, cvSignals.adaptability_index);
  const topClusters = rankedClusters.slice(0, 3).map((item) => item.cluster);
  const primaryMarket = rankedClusters[0]?.market ?? {
    demand_index: 0.7,
    salary_mid: 135000,
    skill_premium: 0.55,
    saturation: 0.45
  };

  const baseScore = Math.round(
    Math.min(
      95,
      46
      + rankedClusters[0]?.score * 40
      + cvSignals.career_velocity * 10
      + cvSignals.role_complexity_growth * 8
    )
  );
  const measuredSkillsPct = Number(Math.min(0.85, 0.28 + cvSignals.adaptability_index * 0.4).toFixed(2));
  const inferredSkillsPct = Number(Math.max(0, 1 - measuredSkillsPct).toFixed(2));
  const missions = generateStarterMissions(topClusters, payload?.constraints?.time_per_week_hours ?? 8);

  const scenarioForecasts = buildScenarioForecasts(scenarios, baseScore, missions, primaryMarket.demand_index);
  const drivers = [
    'Evidence-weighted skill depth',
    'Role adjacency strength',
    'Career velocity and complexity growth',
    'Weekly execution capacity',
    'Regional demand and salary momentum'
  ];
  const risks = [
    'Evidence coverage incomplete for some core skills',
    'Market saturation varies by sub-specialization',
    'Execution variance can widen transition timelines'
  ];

  return {
    blueprint_id: blueprintId,
    generated_at: generatedAt,
    top_role_clusters: topClusters,
    drivers,
    risks,
    identity_model: {
      cis: {
        cis_mean: baseScore,
        cis_p50: Math.max(0, baseScore - 3),
        cis_p90: Math.min(100, baseScore + 7),
        drivers,
        risks
      },
      evidence_coverage: {
        measured_skills_pct: measuredSkillsPct,
        inferred_skills_pct: inferredSkillsPct,
        behavioral_pct: Number(Math.min(1, 0.2 + cvSignals.career_velocity * 0.5).toFixed(2)),
        motivation_pct: 0.65
      }
    },
    scenarios: scenarioForecasts,
    execution_plan: {
      horizon_weeks: 12,
      missions
    },
    next_three_actions: missions.slice(0, 3),
    explanation_artifact: buildExplanationArtifact({
      region: payload.region,
      constraints: payload.constraints ?? {},
      profileSignals: cvSignals,
      marketSignals: primaryMarket,
      topClusters
    })
  };
}
