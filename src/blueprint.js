import { randomUUID } from 'node:crypto';

const SCENARIO_RISK = {
  safe: ["Risk of slower compensation growth", "Potential under-positioning for stretch roles"],
  aggressive: ["Higher workload and burnout risk", "Greater downside if market cools"],
  pivot: ["Longer transition runway", "Higher uncertainty in early outcomes"]
};

function createScenario(name, baseScore, weekMissions) {
  const multiplier = name === 'aggressive' ? 1.15 : name === 'pivot' ? 1.05 : 1;
  const timeMid = Math.max(3, Math.round((10 - baseScore / 15) * multiplier));
  const earningsMid = Math.round(65000 + baseScore * 900 * multiplier);

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
      mission_count: weekMissions.length,
      first_missions: weekMissions.slice(0, 3)
    },
    risks: SCENARIO_RISK[name] ?? []
  };
}

function buildMission(title, expectedTimeMin, skillTargets) {
  return {
    mission_id: randomUUID(),
    title,
    expected_time_min: expectedTimeMin,
    skill_targets: skillTargets
  };
}

export function buildBlueprint(blueprintId, payload, generatedAt) {
  const targetRoles = Array.isArray(payload.target_roles) ? payload.target_roles : [];
  const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : ['safe'];

  const baseScore = Math.min(92, 55 + targetRoles.length * 4 + payload.region.length % 11);
  const measuredSkillsPct = Math.min(0.85, 0.35 + targetRoles.length * 0.1);

  const missionTemplates = [
    buildMission('Run one targeted micro-test and review errors', 90, ['problem_solving']),
    buildMission('Publish one portfolio artifact tied to target role', 120, ['communication', 'domain_depth']),
    buildMission('Complete one role-aligned networking outreach', 45, ['market_alignment']),
    buildMission('Close one documented skill gap with focused study', 100, ['skill_compounding'])
  ];

  return {
    blueprint_id: blueprintId,
    generated_at: generatedAt,
    identity_model: {
      cis: {
        cis_mean: baseScore,
        cis_p50: Math.max(0, baseScore - 2),
        cis_p90: Math.min(100, baseScore + 6),
        drivers: [
          'Evidence-weighted skill depth',
          'Role adjacency strength',
          'Regional demand and salary momentum'
        ],
        risks: [
          'Evidence coverage incomplete for some core skills',
          'Market saturation varies by sub-specialization'
        ]
      },
      evidence_coverage: {
        measured_skills_pct: measuredSkillsPct,
        inferred_skills_pct: 1 - measuredSkillsPct,
        behavioral_pct: 0.4,
        motivation_pct: 0.7
      }
    },
    scenarios: scenarios.map((name) => createScenario(name, baseScore, missionTemplates)),
    execution_plan: {
      horizon_weeks: 12,
      missions: missionTemplates
    },
    explanation_artifact: {
      assumptions: {
        region: payload.region,
        constraints: payload.constraints ?? {}
      },
      top_drivers: [
        'Current evidence strength',
        'Target role gap size',
        'Weekly effort availability'
      ]
    }
  };
}
