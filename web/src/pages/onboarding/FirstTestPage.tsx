import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';
import { useOnboardingState } from '../../state/useOnboardingState';

type QuestionDimension = 'reasoning' | 'execution' | 'communication';

type QuestionOption = {
  id: string;
  label: string;
  rating: number;
};

type Question = {
  id: string;
  prompt: string;
  dimension: QuestionDimension;
  options: QuestionOption[];
};

type TestSession = {
  attempt_id: string;
  manifest?: {
    suggested_role_family?: string;
    suggestion_rationale?: string;
    expected_duration_min?: number;
  };
};

type ScoreShape = {
  overall?: number;
  subscores?: {
    reasoning?: number;
    debugging?: number;
    communication?: number;
  };
};

type StarterReport = {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  focusSkills: string[];
  materials: Array<{ title: string; url: string }>;
  nextActions: string[];
};

const questions: Question[] = [
  {
    id: 'problem_framing',
    prompt: 'You get an ambiguous assignment with unclear requirements. What do you do first?',
    dimension: 'reasoning',
    options: [
      { id: 'a', label: 'Break it into assumptions and clarify constraints with stakeholders.', rating: 5 },
      { id: 'b', label: 'Start building quickly and adapt later.', rating: 3 },
      { id: 'c', label: 'Wait for detailed instructions before moving.', rating: 2 },
      { id: 'd', label: 'Delegate without creating a structure.', rating: 1 }
    ]
  },
  {
    id: 'execution_speed',
    prompt: 'A weekly target slips because of blockers. How do you respond?',
    dimension: 'execution',
    options: [
      { id: 'a', label: 'Re-scope, unblock dependencies, and ship the highest-value slice.', rating: 5 },
      { id: 'b', label: 'Keep original scope even if delivery quality drops.', rating: 2 },
      { id: 'c', label: 'Pause completely until all blockers disappear.', rating: 1 },
      { id: 'd', label: 'Ship partial work without communicating trade-offs.', rating: 2 }
    ]
  },
  {
    id: 'communication',
    prompt: 'You disagree with a teammate on approach. What is your style?',
    dimension: 'communication',
    options: [
      { id: 'a', label: 'Explain trade-offs with evidence and align on decision criteria.', rating: 5 },
      { id: 'b', label: 'Push your idea without listening to alternatives.', rating: 1 },
      { id: 'c', label: 'Avoid the discussion to keep peace.', rating: 2 },
      { id: 'd', label: 'Escalate immediately without trying direct resolution.', rating: 2 }
    ]
  },
  {
    id: 'learning_loop',
    prompt: 'You failed an interview/project milestone. What next?',
    dimension: 'reasoning',
    options: [
      { id: 'a', label: 'Run a short retro, identify gaps, and schedule targeted practice.', rating: 5 },
      { id: 'b', label: 'Assume it was bad luck and move on unchanged.', rating: 2 },
      { id: 'c', label: 'Stop applying for a while.', rating: 1 },
      { id: 'd', label: 'Consume random content without a plan.', rating: 2 }
    ]
  },
  {
    id: 'career_execution',
    prompt: 'You have 6 hours this week for career growth. How do you allocate it?',
    dimension: 'execution',
    options: [
      { id: 'a', label: '2h learning, 2h portfolio evidence, 2h networking or applications.', rating: 5 },
      { id: 'b', label: 'Spend all 6h on passive content.', rating: 2 },
      { id: 'c', label: 'Do whichever task feels easiest each day.', rating: 2 },
      { id: 'd', label: 'Skip planning and decide at the end of the week.', rating: 1 }
    ]
  }
];

const resourceCatalog: Record<string, Array<{ title: string; url: string }>> = {
  software_engineering: [
    { title: 'Frontend, Backend, DevOps Roadmaps', url: 'https://roadmap.sh' },
    { title: 'freeCodeCamp Certifications', url: 'https://www.freecodecamp.org/learn' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }
  ],
  data_analytics: [
    { title: 'Kaggle Micro-Courses', url: 'https://www.kaggle.com/learn' },
    { title: 'Google Data Analytics (overview)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
    { title: 'SQLBolt (practice)', url: 'https://sqlbolt.com' }
  ],
  product_strategy: [
    { title: 'Product School Free Resources', url: 'https://productschool.com/resources' },
    { title: 'Lenny’s Newsletter Podcast Episodes', url: 'https://www.lennysnewsletter.com/podcast' },
    { title: 'Reforge Essays (free library)', url: 'https://www.reforge.com/blog' }
  ],
  cross_industry_transition: [
    { title: 'Career Change Guide (Indeed)', url: 'https://www.indeed.com/career-advice/finding-a-job/career-change' },
    { title: 'LinkedIn Learning Paths', url: 'https://www.linkedin.com/learning' },
    { title: 'The Muse Career Change Resources', url: 'https://www.themuse.com/advice/career-change' }
  ],
  career_advancement: [
    { title: 'Manager Tools Articles', url: 'https://www.manager-tools.com/all-content' },
    { title: 'MindTools Leadership Skills', url: 'https://www.mindtools.com/pages/main/newMN_LDR.htm' },
    { title: 'Toastmasters Communication Practice', url: 'https://www.toastmasters.org' }
  ]
};

function formatPercent(value: number | undefined): string {
  if (typeof value !== 'number') {
    return 'n/a';
  }
  return `${Math.round(value * 100)}%`;
}

function buildStarterReport({
  goalType,
  horizon,
  roleCluster,
  score,
  miniPlan
}: {
  goalType: string;
  horizon: number;
  roleCluster: string;
  score: ScoreShape;
  miniPlan: Array<{ title?: string }>;
}): StarterReport {
  const sub = score.subscores ?? {};
  const dimSummary = [
    { name: 'Reasoning', value: sub.reasoning ?? 0.5, skills: ['Problem framing', 'Decision quality', 'Root-cause analysis'] },
    { name: 'Execution', value: sub.debugging ?? 0.5, skills: ['Planning', 'Task scoping', 'Delivery cadence'] },
    { name: 'Communication', value: sub.communication ?? 0.5, skills: ['Stakeholder updates', 'Collaboration', 'Storytelling'] }
  ];

  const strengths = dimSummary
    .filter((item) => item.value >= 0.68)
    .map((item) => `${item.name} (${formatPercent(item.value)})`);
  const growthAreas = dimSummary
    .filter((item) => item.value < 0.68)
    .map((item) => `${item.name} (${formatPercent(item.value)})`);
  const focusSkills = dimSummary
    .filter((item) => item.value < 0.72)
    .flatMap((item) => item.skills)
    .slice(0, 6);

  const materials = resourceCatalog[roleCluster] ?? resourceCatalog.software_engineering;
  const nextActions = miniPlan.slice(0, 4).map((mission) => mission.title ?? 'Execute weekly mission');

  return {
    summary: `Target: ${goalType.replace('_', ' ')} in ${horizon} months. Your baseline score is ${formatPercent(score.overall)} with primary alignment to ${roleCluster.replaceAll('_', ' ')}.`,
    strengths: strengths.length > 0 ? strengths : ['Baseline signals captured; take another micro-test to confirm strengths.'],
    growthAreas: growthAreas.length > 0 ? growthAreas : ['No major low-confidence dimension detected in this first calibration.'],
    focusSkills: focusSkills.length > 0 ? focusSkills : ['Execution consistency', 'Evidence packaging'],
    materials,
    nextActions: nextActions.length > 0 ? nextActions : ['Complete your first weekly mission and submit one evidence link.']
  };
}

function reportToText(report: StarterReport): string {
  return [
    'AI Career Path OS - One-Page Starter Report',
    '',
    `Summary: ${report.summary}`,
    '',
    'Strengths:',
    ...report.strengths.map((item) => `- ${item}`),
    '',
    'Growth Areas:',
    ...report.growthAreas.map((item) => `- ${item}`),
    '',
    'Skills to Build:',
    ...report.focusSkills.map((item) => `- ${item}`),
    '',
    'Recommended Materials:',
    ...report.materials.map((item) => `- ${item.title}: ${item.url}`),
    '',
    'Next Actions:',
    ...report.nextActions.map((item) => `- ${item}`)
  ].join('\n');
}

export function FirstTestPage() {
  const { state } = useOnboardingState();
  const [session, setSession] = useState<TestSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [starterBlueprint, setStarterBlueprint] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<StarterReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestedRole = useMemo(() => {
    const suggestion = (state as Record<string, unknown> | null)?.first_test_suggestion as
      | Record<string, string>
      | undefined;
    return suggestion?.role_family ?? 'software_engineering';
  }, [state]);

  const answeredCount = Object.keys(answers).length;

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };
      const completion = Math.round((Object.keys(next).length / questions.length) * 65) + 25;
      setProgressPct((prevProgress) => Math.max(prevProgress, completion));
      return next;
    });
  }

  async function startTest() {
    setBusy(true);
    setError(null);
    setResult(null);
    setStarterBlueprint(null);
    setReport(null);
    setAnswers({});

    try {
      const payload = (await api.startFirstTest()) as unknown as TestSession;
      setSession(payload);
      setProgressPct(20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start test.');
    } finally {
      setBusy(false);
    }
  }

  async function completeTestAndGenerateBlueprint() {
    if (!session?.attempt_id) {
      setError('Start the test first.');
      return;
    }
    if (answeredCount < questions.length) {
      setError('Answer all calibration questions before completion.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const events = questions.map((question, index) => {
        const optionId = answers[question.id];
        const option = question.options.find((candidate) => candidate.id === optionId) ?? question.options[0];
        return {
          t: (index + 1) * 45000,
          name: 'answer',
          data: {
            question_id: question.id,
            dimension: question.dimension,
            choice_id: option.id,
            choice_label: option.label,
            rating: option.rating
          }
        };
      });

      await api.appendAssessmentEvents(session.attempt_id, events);
      const completion = await api.completeFirstTest(session.attempt_id);
      setResult((completion.assessment_result as Record<string, unknown>) ?? null);
      const starter = (completion.starter_blueprint as Record<string, unknown>) ?? null;
      setStarterBlueprint(starter);
      setProgressPct(100);

      const region = (state?.goals as Record<string, unknown> | undefined)?.location;
      await api.generateBlueprint({
        region: typeof region === 'string' && region.length > 0 ? region : 'US-NYC',
        target_roles: [suggestedRole],
        scenarios: ['safe', 'aggressive', 'pivot'],
        constraints: {
          time_per_week_hours: (state?.goals as Record<string, unknown> | undefined)?.time_per_week_hours ?? 8
        }
      });

      const goals = (state?.goals as Record<string, unknown> | undefined) ?? {};
      const topClusters = (starter?.top_role_clusters as string[] | undefined) ?? [suggestedRole];
      const plan = (starter?.mini_plan as Array<{ title?: string }> | undefined) ?? [];
      const score = (completion.assessment_result?.scores as ScoreShape | undefined) ?? {};
      setReport(
        buildStarterReport({
          goalType: String(goals.goal_type ?? 'switch_role'),
          horizon: Number(goals.time_horizon_months ?? 12),
          roleCluster: topClusters[0] ?? suggestedRole,
          score,
          miniPlan: plan
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete first test.');
    } finally {
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!report) {
      return;
    }
    const content = reportToText(report);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'starter-career-report.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const topClusters = (starterBlueprint?.top_role_clusters as string[] | undefined) ?? [];
  const miniPlan = (starterBlueprint?.mini_plan as Array<{ title?: string }> | undefined) ?? [];
  const cis = (starterBlueprint?.cis as Record<string, number> | undefined) ?? null;
  const assessmentScores = (result?.scores as ScoreShape | undefined) ?? {};

  return (
    <OnboardingScaffold
      step="first-test"
      title="Step 6/6: First calibration test"
      why="this quick calibration turns your profile into a starter career strategy with concrete actions."
      actions={
        <>
          <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={startTest}>
            {busy ? 'Working...' : session ? 'Restart test' : 'Start test'}
          </button>
          <button
            className="rounded-xl bg-ink px-4 py-2 font-semibold text-white"
            type="button"
            onClick={completeTestAndGenerateBlueprint}
          >
            Submit answers + generate report
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">Suggested test cluster: {suggestedRole}</p>
      <p className="rounded-lg bg-mint/50 p-3 text-sm text-slate-700">
        This is not an exam. It is a calibration to improve path accuracy and confidence.
      </p>

      <div>
        <p className="mb-1 text-xs text-slate-600">Progress</p>
        <div className="h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-sea" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {session ? (
        <div className="grid gap-3">
          {questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-xl border border-line p-3">
              <legend className="px-2 text-sm font-semibold text-ink">
                {index + 1}. {question.prompt}
              </legend>
              <div className="grid gap-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-left text-sm ${
                        selected ? 'border-sea bg-sea/10 text-ink' : 'border-line bg-white text-slate-700'
                      }`}
                      onClick={() => selectAnswer(question.id, option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <p className="text-xs text-slate-500">
            Answered {answeredCount}/{questions.length}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-line p-3 text-sm text-slate-600">
          Start the test to see your 5 calibration questions.
        </div>
      )}

      {result ? (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="m-0 font-semibold text-ink">Result summary</p>
          <p className="mt-2 text-slate-600">Overall score: {formatPercent(assessmentScores.overall)}</p>
          <p className="mt-1 text-slate-600">Reasoning: {formatPercent(assessmentScores.subscores?.reasoning)}</p>
          <p className="mt-1 text-slate-600">Execution: {formatPercent(assessmentScores.subscores?.debugging)}</p>
          <p className="mt-1 text-slate-600">Communication: {formatPercent(assessmentScores.subscores?.communication)}</p>
          <p className="mt-1 text-slate-600">Reliability: {String(result.reliability ?? 'n/a')}</p>
        </div>
      ) : null}

      {starterBlueprint ? (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="m-0 text-lg font-semibold text-ink">Starter Blueprint</p>
          <p className="mt-2 text-slate-700">Top 3 role clusters: {topClusters.join(', ') || 'n/a'}</p>
          <p className="mt-1 text-slate-700">
            CIS: {cis?.cis_mean ?? 'n/a'} (confidence range p50 {cis?.cis_p50 ?? 'n/a'} / p90 {cis?.cis_p90 ?? 'n/a'})
          </p>
          <p className="mt-2 font-semibold text-ink">4-week mini missions</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {miniPlan.slice(0, 4).map((item, index) => (
              <li key={`mission-${index}`}>{item.title ?? 'Mission'}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report ? (
        <article className="rounded-xl border border-line bg-white p-4 text-sm">
          <h3 className="m-0 text-lg font-semibold text-ink">One-page career report</h3>
          <p className="mt-2 text-slate-700">{report.summary}</p>

          <p className="mt-3 text-sm font-semibold text-ink">Strengths</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {report.strengths.map((item, index) => (
              <li key={`strength-${index}`}>{item}</li>
            ))}
          </ul>

          <p className="mt-3 text-sm font-semibold text-ink">Areas to develop</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {report.growthAreas.map((item, index) => (
              <li key={`gap-${index}`}>{item}</li>
            ))}
          </ul>

          <p className="mt-3 text-sm font-semibold text-ink">Skills to focus next</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {report.focusSkills.map((item, index) => (
              <li key={`skill-${index}`}>{item}</li>
            ))}
          </ul>

          <p className="mt-3 text-sm font-semibold text-ink">Recommended materials</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {report.materials.map((item, index) => (
              <li key={`material-${index}`}>
                <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-sea hover:underline">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm font-semibold text-ink">Immediate next actions</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {report.nextActions.map((item, index) => (
              <li key={`next-${index}`}>{item}</li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl border border-line px-3 py-2 font-semibold text-ink" type="button" onClick={downloadReport}>
              Download report (.txt)
            </button>
            <Link className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" to="/app/dashboard">
              Open dashboard
            </Link>
          </div>
        </article>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={session ? completeTestAndGenerateBlueprint : startTest}>
            Retry
          </button>
        </div>
      ) : null}
    </OnboardingScaffold>
  );
}
