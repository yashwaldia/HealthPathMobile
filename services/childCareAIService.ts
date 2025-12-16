// services/childCareAIService.ts
// AI helper for child-care insights (growth + vaccination + routines)
// Last Updated: December 16, 2025

import {
  FEEDING_GUIDELINES,
  getAgeGroup,
  getDailyTasksForAge,
  getMilestoneForAge,
  VACCINATION_SCHEDULE,
} from '../constants/childCareData';
import {
  ChildCareProfile,
  GrowthRecord,
  VaccinationStatus,
} from '../types/wellness';
import { generateWithGemini } from './wellnessAIService';

/**
 * Shape of the analysis result returned to the UI.
 * You can adjust this later if you want more fields.
 */
export interface ChildCareAIAnalysis {
  childId: string;
  childName: string;
  ageInMonths: number;
  ageSummary: string;
  markdownSummary: string; // Ready‑to‑render Markdown
}

/**
 * Build a compact, structured prompt for Gemini.
 * Focused on analysis instead of generating a full weekly plan.
 */
function buildChildCareAnalysisPrompt(
  profile: ChildCareProfile,
  growthRecords: GrowthRecord[],
  vaccinations: Record<string, VaccinationStatus>,
): string {
  const genderLabel =
    profile.gender === 'male'
      ? 'boy'
      : profile.gender === 'female'
      ? 'girl'
      : 'child';

  const ageGroupKey = getAgeGroup(profile.ageInMonths);
  const ageMilestone = getMilestoneForAge(profile.ageInMonths);
  const feeding =
    FEEDING_GUIDELINES[ageGroupKey as keyof typeof FEEDING_GUIDELINES];
  const todayTasks = getDailyTasksForAge(profile.ageInMonths);

  const latestGrowth =
    growthRecords.length > 0 ? growthRecords[0] : null;

  // GrowthRecord in your types only has date, heightCm, weightKg
  const growthSnippet = latestGrowth
    ? `Latest growth record:
- Date: ${latestGrowth.date}
- Weight: ${latestGrowth.weightKg ?? 'unknown'} kg
- Height: ${latestGrowth.heightCm ?? 'unknown'} cm`
    : 'No growth records are available yet.';

  const vaccinationEntries = Object.entries(vaccinations || {});
  // VaccinationStatus is a simple string union type
  const vaccinationSnippet =
    vaccinationEntries.length === 0
      ? 'No vaccination status is recorded yet.'
      : vaccinationEntries
          .map(([id, status]) => `- ${id}: ${status}`)
          .join('\n');

  // VACCINATION_SCHEDULE is defined as { age: string; vaccines: string[] }[]
  const dueVaccinesText = VACCINATION_SCHEDULE.map((row) => {
    const r = row as unknown as { age: string; vaccines: string[] };
    return `- Age: ${r.age} → ${r.vaccines.join(', ')}`;
  }).join('\n');

  const milestoneText = `
Physical: ${ageMilestone.physical?.join('; ') || 'N/A'}
Cognitive: ${ageMilestone.cognitive?.join('; ') || 'N/A'}
Social: ${ageMilestone.social?.join('; ') || 'N/A'}
`;

  const feedingText = feeding
    ? `Primary: ${feeding.primary}
Frequency: ${feeding.frequency}
Notes: ${feeding.notes}`
    : 'No specific feeding guideline found for this age group.';

  const taskText = todayTasks
    .map((t) => `- ${t.name} (${t.category}, priority: ${t.priority})`)
    .join('\n');

  return `
You are a careful pediatrician and child-development specialist.
Analyse the data and produce a SHORT, parent-friendly summary in Markdown.
Always be conservative and say that this is general information and not a diagnosis.

Child profile:
- Name: ${profile.childName}
- Age in months: ${profile.ageInMonths}
- Gender: ${genderLabel}
- Age in days: ${profile.ageInDays ?? 'unknown'}
- Developmental stage tag: ${profile.developmentalStage}

Latest growth information:
${growthSnippet}

Recorded vaccination statuses:
${vaccinationSnippet}

Standard vaccination schedule (for reference only, do NOT assume they follow any specific national program – just speak generally):
${dueVaccinesText}

Age-based milestones (from app defaults):
${milestoneText}

Age-based feeding guideline:
${feedingText}

Today’s suggested routine tasks (from app defaults):
${taskText}

IMPORTANT OUTPUT REQUIREMENTS:
1. Respond ONLY in valid GitHub-flavored Markdown.
2. Use clear sections with headings:
   - "Overview"
   - "Growth & nutrition"
   - "Vaccinations"
   - "Development & daily routine"
   - "When to seek medical help"
3. In each section, keep 2–5 concise bullet points.
4. NEVER give a diagnosis, drug names, or emergency instructions.
5. Always end with a short disclaimer that parents must consult their pediatrician for personalised advice.
`;
}

/**
 * Main entry: generate an AI analysis for a child.
 * This is a single-shot call (no caching, no weekly objects).
 */
export async function analyzeChildCareWithAI(
  profile: ChildCareProfile,
  growthRecords: GrowthRecord[] = [],
  vaccinations: Record<string, VaccinationStatus> = {},
): Promise<ChildCareAIAnalysis> {
  const prompt = buildChildCareAnalysisPrompt(
    profile,
    growthRecords,
    vaccinations,
  );
  const markdownSummary = await generateWithGemini(prompt);

  const years = Math.floor(profile.ageInMonths / 12);
  const months = profile.ageInMonths % 12;
  const ageSummary =
    years > 0
      ? `${years} year${years > 1 ? 's' : ''}${
          months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''
        }`
      : `${months} month${months !== 1 ? 's' : ''}`;

  return {
    childId: profile.childId,
    childName: profile.childName,
    ageInMonths: profile.ageInMonths,
    ageSummary,
    markdownSummary: markdownSummary.trim(),
  };
}
