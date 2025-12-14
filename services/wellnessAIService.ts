// services/wellnessAIService.ts
// AI-powered insights and reports for Wellness Modules
// Last Updated: December 13, 2025
// Uses Google Gemini 2.0 Flash

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyTracking, WeeklyReport, WellnessModuleType } from '../types/wellness';

const API_KEY = process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ EXPO_PUBLIC_HEALTHPATH_GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================================================
// ⭐ GENERIC GEMINI GENERATION (NEW - for child care AI)
// ============================================================================

/**
 * Generic function to generate content with Gemini
 * Used by childCareAIService for weekly content generation
 */
export const generateWithGemini = async (prompt: string): Promise<string> => {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🤖 Calling Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    console.log('✅ Gemini API response received');
    return responseText;
  } catch (error: any) {
    console.error('❌ Error calling Gemini API:', error);
    throw error;
  }
};

// ============================================================================
// WEEKLY REPORT GENERATION
// ============================================================================

/**
 * Generate AI-powered weekly report
 */
export const generateWeeklyReport = async (
  moduleType: WellnessModuleType,
  weekNumber: number,
  dailyTrackingData: DailyTracking[]
): Promise<Omit<WeeklyReport, 'reportId' | 'generatedAt'>> => {
  try {
    console.log(`🤖 Generating weekly report for ${moduleType}, Week ${weekNumber}...`);

    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Calculate statistics
    const completionRates = dailyTrackingData.map(d => d.overallCompletion);
    const avgCompletion = completionRates.length > 0
      ? completionRates.reduce((sum, val) => sum + val, 0) / completionRates.length
      : 0;

    const totalTasks = dailyTrackingData.reduce((sum, d) => sum + d.tasks.length, 0);
    const completedTasks = dailyTrackingData.reduce(
      (sum, d) => sum + d.tasks.filter(t => t.completed).length,
      0
    );

    // Build prompt
    const prompt = `
You are a professional wellness coach analyzing a user's progress in their ${moduleType.replace('-', ' ')} program.

**Week:** ${weekNumber}
**Days Tracked:** ${dailyTrackingData.length}
**Average Daily Completion:** ${avgCompletion.toFixed(1)}%
**Total Tasks:** ${totalTasks}
**Completed Tasks:** ${completedTasks}
**Daily Completion Rates:** ${completionRates.map(r => `${r.toFixed(0)}%`).join(', ')}

Provide a comprehensive weekly analysis with:

1. **Summary** (3-4 sentences): Overall progress assessment
2. **Achievements** (3 bullet points): Specific accomplishments this week
3. **Areas to Improve** (2-3 bullet points): Constructive feedback
4. **Recommendations** (3-4 actionable tips): Personalized advice for next week

Keep the tone encouraging, professional, and supportive. Focus on progress, not perfection.

Format your response as JSON:
{
  "summary": "string",
  "achievements": ["string", "string", "string"],
  "areasToImprove": ["string", "string"],
  "recommendations": "string (paragraph format)"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    const report: Omit<WeeklyReport, 'reportId' | 'generatedAt'> = {
      moduleType,
      weekNumber,
      summary: aiResponse.summary || 'No summary available',
      achievements: aiResponse.achievements || [],
      areasToImprove: aiResponse.areasToImprove || [],
      aiRecommendations: aiResponse.recommendations || '',
      completionRate: Math.round(avgCompletion),
    };

    console.log('✅ Weekly report generated successfully');
    return report;
  } catch (error: any) {
    console.error('❌ Error generating weekly report:', error);
    
    // Fallback report
    const avgCompletion = dailyTrackingData.length > 0
      ? dailyTrackingData.reduce((sum, d) => sum + d.overallCompletion, 0) / dailyTrackingData.length
      : 0;

    return {
      moduleType,
      weekNumber,
      summary: `Week ${weekNumber} completed with ${avgCompletion.toFixed(0)}% average completion rate.`,
      achievements: [
        `Tracked ${dailyTrackingData.length} days this week`,
        'Maintained consistency in daily logging',
        'Engaged with wellness activities',
      ],
      areasToImprove: [
        'Continue building healthy habits',
        'Stay consistent with daily tasks',
      ],
      aiRecommendations: 'Keep up the great work! Consistency is key to achieving your wellness goals.',
      completionRate: Math.round(avgCompletion),
    };
  }
};

// ============================================================================
// DAILY INSIGHTS GENERATION
// ============================================================================

/**
 * Generate daily motivational insight
 */
export const generateDailyInsight = async (
  moduleType: WellnessModuleType,
  tracking: DailyTracking
): Promise<string> => {
  try {
    if (!API_KEY) {
      return getFallbackDailyInsight(tracking.overallCompletion);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const completedCount = tracking.tasks.filter(t => t.completed).length;
    const totalCount = tracking.tasks.length;

    const prompt = `
You are a supportive wellness coach providing a brief daily insight.

Program: ${moduleType.replace('-', ' ')}
Today's Completion: ${tracking.overallCompletion}%
Tasks Completed: ${completedCount}/${totalCount}

Provide ONE motivational sentence (30-40 words) that:
- Acknowledges today's effort
- Encourages continued progress
- Is warm and supportive

Do not use emojis. Be genuine and specific.
`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    console.log('✅ Daily insight generated');
    return insight;
  } catch (error) {
    console.error('❌ Error generating daily insight:', error);
    return getFallbackDailyInsight(tracking.overallCompletion);
  }
};

/**
 * Fallback daily insight (when AI fails)
 */
const getFallbackDailyInsight = (completion: number): string => {
  if (completion >= 80) {
    return 'Excellent work today! Your dedication is paying off. Keep up this momentum.';
  } else if (completion >= 50) {
    return 'Good progress today. Every step forward counts. Tomorrow is another opportunity to shine.';
  } else if (completion >= 20) {
    return 'You took important steps today. Remember, consistency matters more than perfection.';
  } else {
    return 'Today was challenging, but you showed up. That takes courage. Tomorrow is a fresh start.';
  }
};

// ============================================================================
// PERSONALIZED SUGGESTIONS
// ============================================================================

/**
 * Generate personalized suggestions based on user data
 */
export const generatePersonalizedSuggestions = async (
  moduleType: WellnessModuleType,
  weekNumber: number,
  recentTracking: DailyTracking[]
): Promise<{ food: string[]; exercise: string[]; mentalHealth: string[] }> => {
  try {
    if (!API_KEY) {
      return getFallbackSuggestions(moduleType);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const avgCompletion = recentTracking.length > 0
      ? recentTracking.reduce((sum, d) => sum + d.overallCompletion, 0) / recentTracking.length
      : 0;

    const prompt = `
You are a wellness expert providing personalized suggestions.

Program: ${moduleType.replace('-', ' ')}
Week: ${weekNumber}
Recent Average Completion: ${avgCompletion.toFixed(0)}%

Provide 3 suggestions for each category (Indian context preferred):
1. **Food** - Nutrition tips, specific foods, meal ideas
2. **Exercise** - Physical activities, duration, safety tips
3. **Mental Health** - Mindfulness, stress relief, self-care

Format as JSON:
{
  "food": ["tip1", "tip2", "tip3"],
  "exercise": ["tip1", "tip2", "tip3"],
  "mentalHealth": ["tip1", "tip2", "tip3"]
}

Keep tips practical, specific, and culturally relevant.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse suggestions');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    console.log('✅ Personalized suggestions generated');
    return suggestions;
  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
    return getFallbackSuggestions(moduleType);
  }
};

/**
 * Fallback suggestions
 */
const getFallbackSuggestions = (
  moduleType: WellnessModuleType
): { food: string[]; exercise: string[]; mentalHealth: string[] } => {
  return {
    food: [
      'Eat balanced meals with protein, carbs, and healthy fats',
      'Stay hydrated with 8-10 glasses of water daily',
      'Include seasonal fruits and vegetables',
    ],
    exercise: [
      '30 minutes of moderate activity daily',
      'Walking, yoga, or stretching exercises',
      'Listen to your body and rest when needed',
    ],
    mentalHealth: [
      'Practice 5-10 minutes of deep breathing daily',
      'Get 7-8 hours of quality sleep',
      'Connect with loved ones regularly',
    ],
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export const wellnessAIService = {
  generateWeeklyReport,
  generateDailyInsight,
  generatePersonalizedSuggestions,
  generateWithGemini, // ⭐ NEW: Export for childCareAIService
};
