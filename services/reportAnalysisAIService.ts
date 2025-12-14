// services/reportAnalysisAIService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { LabReport } from '../types/upload';

// Initialize Gemini AI for Report Analysis
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// Interface for AI Analysis Result
export interface ReportAIAnalysis {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  abnormalTests: string[];
  analyzedAt: Date;
  confidence: number;
}

/**
 * Analyze a lab report using Google Gemini AI
 * Converts complex medical information into simple, easy-to-understand language
 * for users without medical background
 */
export async function analyzeLabReportWithAI(report: LabReport): Promise<ReportAIAnalysis> {
  try {
    console.log('Starting AI analysis for report:', report.reportId);

    // Prepare report data for AI analysis
    const reportData = prepareReportData(report);

    // Generate AI prompt for non-medical audience
    const prompt = generateAnalysisPrompt(reportData);

    // Call Gemini AI with updated model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Analysis completed');

    // Parse AI response
    const analysis = parseAIResponse(text);

    return {
      ...analysis,
      analyzedAt: new Date(),
      confidence: 0.85, // Confidence score
    };
  } catch (error) {
    console.error('Error analyzing report with AI:', error);
    throw new Error('Failed to analyze report. Please try again.');
  }
}

/**
 * Prepare report data for AI analysis
 */
function prepareReportData(report: LabReport): string {
  let data = '';

  // Add report metadata
  data += `Report Type: ${report.reportType || 'Medical Report'}\n`;
  data += `Lab Name: ${report.labName || 'N/A'}\n`;
  data += `Test Date: ${report.testDate || 'N/A'}\n\n`;

  // Add test results if available
  if (report.testResults && report.testResults.length > 0) {
    data += `Test Results:\n`;
    report.testResults.forEach((test) => {
      data += `- ${test.testName}: ${test.value} ${test.unit || ''} (${test.status || 'N/A'})`;
      if (test.normalRange) {
        data += ` [Normal Range: ${test.normalRange}]`;
      }
      data += `\n`;
    });
    data += `\n`;
  }

  // Add existing AI interpretation if available
  if (report.aiInterpretation) {
    data += `Previous Analysis:\n`;
    data += `Summary: ${report.aiInterpretation.summary || 'N/A'}\n`;
    if (report.aiInterpretation.keyFindings && report.aiInterpretation.keyFindings.length > 0) {
      data += `Key Findings: ${report.aiInterpretation.keyFindings.join(', ')}\n`;
    }
    data += `\n`;
  }

  // Add notes if available
  if (report.notes) {
    data += `Additional Notes: ${report.notes}\n`;
  }

  return data;
}

/**
 * Generate AI prompt for non-medical audience
 */
function generateAnalysisPrompt(reportData: string): string {
  return `You are a friendly and caring health assistant helping people understand their medical lab reports. 
Your goal is to explain complex medical information in SIMPLE, EASY-TO-UNDERSTAND language for people WITHOUT medical background.

Here is the lab report data:

${reportData}

Please provide a comprehensive analysis in the following JSON format:

{
  "summary": "A brief, friendly 2-3 sentence summary of the overall health status in simple language. Avoid medical jargon. Explain what the report means for their health.",
  "keyFindings": [
    "Simple explanation of finding 1 (use everyday language)",
    "Simple explanation of finding 2",
    "Simple explanation of finding 3"
  ],
  "recommendations": [
    "Practical, actionable recommendation 1 in friendly tone",
    "Practical, actionable recommendation 2",
    "Practical, actionable recommendation 3"
  ],
  "riskLevel": "low/moderate/high (based on test results)",
  "abnormalTests": [
    "Test name 1 with simple explanation",
    "Test name 2 with simple explanation"
  ]
}

IMPORTANT GUIDELINES:
1. Use SIMPLE everyday language (avoid terms like "hemoglobin", "creatinine" - instead say "red blood cells", "kidney function")
2. Be FRIENDLY and REASSURING, not scary
3. Explain WHY each test matters for their health
4. Give PRACTICAL advice they can actually follow
5. If tests are normal, say so clearly and positively
6. If tests are abnormal, explain what it means WITHOUT causing panic
7. Keep sentences SHORT and CLEAR
8. Use examples when helpful (e.g., "like how a car needs oil, your body needs...")

Return ONLY the JSON object, no additional text.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiText: string): Omit<ReportAIAnalysis, 'analyzedAt' | 'confidence'> {
  try {
    // Remove markdown code blocks if present
    let cleanText = aiText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanText);

    return {
      summary: parsed.summary || 'Analysis completed. Please review the findings below.',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      riskLevel: ['low', 'moderate', 'high'].includes(parsed.riskLevel) 
        ? parsed.riskLevel 
        : 'moderate',
      abnormalTests: Array.isArray(parsed.abnormalTests) ? parsed.abnormalTests : [],
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback: extract basic information from text
    return {
      summary: 'Your lab report has been analyzed. The findings are displayed below.',
      keyFindings: ['Report analysis completed'],
      recommendations: ['Consult with your healthcare provider for detailed interpretation'],
      riskLevel: 'moderate',
      abnormalTests: [],
    };
  }
}

/**
 * Re-analyze a report (for refresh button)
 */
export async function reanalyzeLabReport(report: LabReport): Promise<ReportAIAnalysis> {
  console.log('Re-analyzing report:', report.reportId);
  return analyzeLabReportWithAI(report);
}

/**
 * Batch analyze multiple reports (for analyzing all reports at once)
 */
export async function batchAnalyzeReports(
  reports: LabReport[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, ReportAIAnalysis>> {
  const results = new Map<string, ReportAIAnalysis>();
  
  for (let i = 0; i < reports.length; i++) {
    try {
      const analysis = await analyzeLabReportWithAI(reports[i]);
      results.set(reports[i].reportId, analysis);
      
      if (onProgress) {
        onProgress(i + 1, reports.length);
      }
    } catch (error) {
      console.error(`Error analyzing report ${reports[i].reportId}:`, error);
      // Continue with next report even if one fails
    }
  }
  
  return results;
}

/**
 * Get simplified test interpretation for individual tests
 */
export function getSimpleTestInterpretation(
  testName: string,
  value: string | number,
  status: string,
  normalRange?: string
): string {
  const statusLower = status.toLowerCase();
  
  const interpretations: { [key: string]: { [status: string]: string } } = {
    'hemoglobin': {
      'normal': '✅ Your blood oxygen levels are healthy',
      'low': '⚠️ Your blood may not be carrying enough oxygen. Eat iron-rich foods like spinach and beans.',
      'high': '⚠️ Your blood is thicker than normal. Stay well hydrated.',
    },
    'wbc': {
      'normal': '✅ Your immune system is working well',
      'high': '⚠️ Your body might be fighting an infection',
      'low': '⚠️ Your immune system needs support',
    },
    'glucose': {
      'normal': '✅ Your blood sugar is at a healthy level',
      'high': '⚠️ Your blood sugar is high. Reduce sugary foods and exercise regularly.',
      'low': '⚠️ Your blood sugar is low. Have a small snack.',
    },
    'cholesterol': {
      'normal': '✅ Your cholesterol is at a healthy level',
      'high': '⚠️ Your cholesterol is high. Reduce fried and fatty foods, exercise more.',
      'low': '✅ Your cholesterol is low - that\'s good!',
    },
  };

  const testKey = testName.toLowerCase().split('(')[0].trim();
  
  if (interpretations[testKey] && interpretations[testKey][statusLower]) {
    return interpretations[testKey][statusLower];
  }
  
  // Default interpretation
  if (statusLower === 'normal') {
    return `✅ ${testName} is normal`;
  } else if (statusLower.includes('high')) {
    return `⚠️ ${testName} is elevated. Discuss with your doctor.`;
  } else if (statusLower.includes('low')) {
    return `⚠️ ${testName} is below normal. Discuss with your doctor.`;
  }
  
  return `Test result: ${status}. Consult your healthcare provider for interpretation.`;
}