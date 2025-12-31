// services/reportComparisonAIService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { LabReport } from '../types/upload';

// Initialize Gemini AI for Report Comparison
const API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Interface for individual report summary in comparison
 */
export interface ReportSummary {
  reportId: string;
  date: string;
  labName?: string;
  riskLevel: string;
  testsCount: number;
  abnormalCount: number;
  aiInterpretation: {
    summary?: string;
    riskLevel?: string;
    keyFindings?: string[];
    recommendations?: string[];
    abnormalTests?: string[];
  };
}

/**
 * Interface for comparison insights
 */
export interface ComparisonInsights {
  overallTrend: string;
  keyChanges: string[];
  recommendations: string[];
  healthProgress: 'improving' | 'stable' | 'declining' | 'mixed';
}

/**
 * Main comparison result interface
 */
export interface ComparisonResult {
  reports: ReportSummary[];
  comparison: ComparisonInsights;
  comparedAt: Date;
}

/**
 * Helper function to safely convert any date type to JS Date
 * Handles: Date objects, Firestore Timestamps, and string dates
 */
function toJSDate(date: Date | string | any): Date {
  // Already a Date object
  if (date instanceof Date) {
    return date;
  }

  // Firestore Timestamp (has toDate method)
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }

  // String date
  if (typeof date === 'string') {
    return new Date(date);
  }

  // Fallback to current date if all else fails
  console.warn('Unable to parse date, using current date as fallback');
  return new Date();
}

/**
 * Compare multiple lab reports and generate AI insights
 * Designed for non-medical users to understand health trends
 */
export async function compareMultipleReports(
  reports: LabReport[]
): Promise<ComparisonResult> {
  try {
    console.log('🔄 Starting comparison for', reports.length, 'reports');

    // Validate input
    if (!reports || reports.length < 2) {
      throw new Error('At least 2 reports are required for comparison');
    }

    if (reports.length > 3) {
      throw new Error('Maximum 3 reports can be compared at once');
    }

    // Validate that all reports have AI analysis
    const unanalyzedReports = reports.filter(
      (report) => !report.aiInterpretation || !report.aiInterpretation.summary
    );

    if (unanalyzedReports.length > 0) {
      throw new Error('All reports must be analyzed before comparison');
    }

    // Sort reports by date (oldest to newest) - FIXED
    const sortedReports = [...reports].sort((a, b) => {
      const dateA = toJSDate(a.testDate || a.uploadDate);
      const dateB = toJSDate(b.testDate || b.uploadDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Prepare comparison data
    const comparisonData = prepareComparisonData(sortedReports);

    // Generate AI comparison prompt
    const prompt = generateComparisonPrompt(comparisonData);

    // Call Gemini AI with latest model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ AI Comparison completed');

    // Parse AI response
    const comparisonInsights = parseComparisonResponse(text);

    // Build final result
    const comparisonResult: ComparisonResult = {
      reports: sortedReports.map((report) => ({
        reportId: report.reportId,
        date: report.testDate || formatDate(report.uploadDate),
        labName: report.labName,
        riskLevel: report.aiInterpretation?.riskLevel || 'moderate',
        testsCount: report.testResults?.length || 0,
        abnormalCount: report.aiInterpretation?.abnormalTests?.length || 0,
        aiInterpretation: report.aiInterpretation || {},
      })),
      comparison: comparisonInsights,
      comparedAt: new Date(),
    };

    return comparisonResult;
  } catch (error: any) {
    console.error('❌ Error comparing reports:', error);

    // Handle specific error types
    if (error.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please contact support.');
    }

    if (error instanceof SyntaxError) {
      throw new Error('Failed to process comparison results. Please try again.');
    }

    // Re-throw with user-friendly message
    throw new Error(
      error.message || 'Failed to compare reports. Please try again later.'
    );
  }
}

/**
 * Prepare structured comparison data from reports
 */
function prepareComparisonData(reports: LabReport[]): string {
  let data = `Comparing ${reports.length} Health Reports:\n\n`;

  reports.forEach((report, index) => {
    const reportDate = report.testDate || formatDate(report.uploadDate);
    const reportLabel = `Report ${index + 1}`;

    data += `=== ${reportLabel} (${reportDate}) ===\n`;
    data += `Lab: ${report.labName || 'N/A'}\n`;
    data += `Risk Level: ${report.aiInterpretation?.riskLevel?.toUpperCase() || 'N/A'}\n`;
    data += `Total Tests: ${report.testResults?.length || 0}\n`;
    data += `Issues Found: ${report.aiInterpretation?.abnormalTests?.length || 0}\n\n`;

    // Add AI summary
    if (report.aiInterpretation?.summary) {
      data += `Health Summary:\n${report.aiInterpretation.summary}\n\n`;
    }

    // Add key findings
    if (
      report.aiInterpretation?.keyFindings &&
      report.aiInterpretation.keyFindings.length > 0
    ) {
      data += `Key Findings:\n`;
      report.aiInterpretation.keyFindings.forEach((finding) => {
        data += `- ${finding}\n`;
      });
      data += `\n`;
    }

    // Add abnormal tests
    if (
      report.aiInterpretation?.abnormalTests &&
      report.aiInterpretation.abnormalTests.length > 0
    ) {
      data += `Health Issues:\n`;
      report.aiInterpretation.abnormalTests.forEach((test) => {
        data += `- ${test}\n`;
      });
      data += `\n`;
    }

    data += `\n`;
  });

  return data;
}

/**
 * Generate AI prompt for comparison (designed for non-medical users)
 */
function generateComparisonPrompt(comparisonData: string): string {
  return `You are a caring health assistant helping people understand how their health has changed over time.
Your goal is to explain health trends in SIMPLE, EASY-TO-UNDERSTAND language for people WITHOUT medical background.

Here are the health reports to compare (sorted from oldest to newest):

${comparisonData}

Please analyze these reports and provide a comparison in the following JSON format:

{
  "overallTrend": "A friendly 2-3 sentence summary explaining how the person's health has changed over time. Use simple language and be encouraging. Mention if things are getting better, staying stable, or need attention.",
  "keyChanges": [
    "Simple explanation of change 1 (e.g., 'Your cholesterol dropped from 220 to 180 - that's great progress!')",
    "Simple explanation of change 2",
    "Simple explanation of change 3"
  ],
  "recommendations": [
    "Practical, actionable advice 1 based on the trends",
    "Practical, actionable advice 2",
    "Practical, actionable advice 3"
  ],
  "healthProgress": "improving/stable/declining/mixed"
}

IMPORTANT GUIDELINES:
1. Use SIMPLE everyday language (avoid medical jargon)
2. Be SPECIFIC about what changed (mention actual values if available)
3. Be ENCOURAGING and POSITIVE when showing improvements
4. If things got worse, explain it WITHOUT causing panic
5. Focus on TRENDS, not just individual values
6. Give PRACTICAL advice people can actually follow
7. Highlight the MOST IMPORTANT changes (2-4 key changes maximum)
8. If reports are similar, say so clearly (e.g., "Your health has remained stable")
9. Use comparisons like "improved by", "increased from X to Y", "now within normal range"
10. Keep sentences SHORT and CLEAR

For healthProgress field:
- "improving": Overall health is getting better
- "stable": Health remains consistent (good or needs monitoring)
- "declining": Health is getting worse, needs attention
- "mixed": Some things improved, some got worse

Return ONLY the JSON object, no additional text.`;
}

/**
 * Parse AI comparison response into structured format
 */
function parseComparisonResponse(aiText: string): ComparisonInsights {
  try {
    // Clean up the response
    let cleanText = aiText.trim();

    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanText);

    // Validate and structure the response
    return {
      overallTrend:
        parsed.overallTrend ||
        'Your health reports have been compared. Please review the details below.',
      keyChanges: Array.isArray(parsed.keyChanges)
        ? parsed.keyChanges.slice(0, 4) // Limit to 4 key changes
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 4) // Limit to 4 recommendations
        : [],
      healthProgress: ['improving', 'stable', 'declining', 'mixed'].includes(
        parsed.healthProgress
      )
        ? parsed.healthProgress
        : 'stable',
    };
  } catch (error) {
    console.error('Error parsing AI comparison response:', error);

    // Fallback comparison
    return {
      overallTrend:
        'Your health reports have been compared. The detailed analysis is available above.',
      keyChanges: ['Reports analyzed successfully'],
      recommendations: [
        'Continue monitoring your health regularly',
        'Discuss these results with your healthcare provider',
      ],
      healthProgress: 'stable',
    };
  }
}

/**
 * Format date to readable string
 * Handles Date, string, and Firestore Timestamp
 */
function formatDate(date: Date | string | any): string {
  try {
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    // Firestore Timestamp (has toDate method)
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    return 'N/A';
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Get health progress icon and color
 * Helper function for UI components
 */
export function getHealthProgressIndicator(progress: string): {
  icon: string;
  color: string;
  label: string;
} {
  switch (progress.toLowerCase()) {
    case 'improving':
      return {
        icon: 'trending-up',
        color: '#10B981',
        label: 'Improving',
      };
    case 'stable':
      return {
        icon: 'remove',
        color: '#3B82F6',
        label: 'Stable',
      };
    case 'declining':
      return {
        icon: 'trending-down',
        color: '#EF4444',
        label: 'Needs Attention',
      };
    case 'mixed':
      return {
        icon: 'swap-horizontal',
        color: '#F59E0B',
        label: 'Mixed Results',
      };
    default:
      return {
        icon: 'help-circle',
        color: '#6B7280',
        label: 'Unknown',
      };
  }
}

/**
 * Validate if reports can be compared
 */
export function validateReportsForComparison(
  reports: LabReport[]
): { valid: boolean; error?: string } {
  if (!reports || reports.length < 2) {
    return {
      valid: false,
      error: 'Please select at least 2 reports to compare',
    };
  }

  if (reports.length > 3) {
    return {
      valid: false,
      error: 'You can compare up to 3 reports at once',
    };
  }

  const unanalyzed = reports.filter(
    (r) => !r.aiInterpretation || !r.aiInterpretation.summary
  );

  if (unanalyzed.length > 0) {
    return {
      valid: false,
      error: 'All selected reports must be analyzed before comparison',
    };
  }

  return { valid: true };
}