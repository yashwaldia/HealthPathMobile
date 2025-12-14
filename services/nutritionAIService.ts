// services/nutritionAIService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { getISODateNDaysAgo, getTodayISO } from '../utils/dateUtils';
import { getReportsByDateRange } from './labReportService';
import { NutritionEntry, nutritionService } from './nutritionService';

// Get API key from environment
const API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY;

if (!API_KEY) {
  console.warn('⚠️ Gemini API key not found for nutrition AI service');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Helper: Convert file URI to base64
async function fileToBase64(uri: string): Promise<string> {
  try {
    console.log('📂 Reading nutrition image from:', uri);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('✅ File converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('❌ Error converting file to base64:', error);
    throw new Error('Failed to read image file. Please try again.');
  }
}

// Helper: Detect MIME type from URI
function getMimeType(uri: string): string {
  const ext = uri.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

// Helper: Clean JSON response from AI (remove markdown fences)
function cleanJSONResponse(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// Type definitions
export type MealAnalysisResult = {
  foods: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  };
  insight: string;
};

export type DeficiencyInsight = {
  deficiencies: {
    name: string;
    confidence: number;
    reasons: string;
    suggestedFoods: string[];
  }[];
  summary: string;
};

// NEW: Result type for two-meal comparison
export type MealCompareResult = {
  meal1: {
    name: string;
    nutrients: { [key: string]: number };
  };
  meal2: {
    name: string;
    nutrients: { [key: string]: number };
  };
  summary: string;
};

/**
 * Analyze meal from image using Gemini Vision AI
 * Returns estimated food items with nutrition data
 */
export async function analyzeMealFromImage(
  uri: string,
): Promise<MealAnalysisResult> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🍽️ Starting meal analysis from image...');
    console.log('📄 Image URI:', uri);

    // Convert file to base64
    const base64 = await fileToBase64(uri);
    const mimeType = getMimeType(uri);
    console.log('🎯 MIME type:', mimeType);

    // Use Gemini 2.0 Flash for analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are an expert nutritionist. Analyze this meal photo and identify all visible food items with their estimated nutritional values.

Return ONLY valid JSON in this exact format (no markdown, no explanations):

{
  "foods": [
    {
      "name": "Food item name",
      "quantity": 100,
      "unit": "g",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fat": 8,
      "sugar": 5,
      "sodium": 200
    }
  ],
  "totals": {
    "calories": 200,
    "protein": 10,
    "carbs": 25,
    "fat": 8,
    "sugar": 5,
    "sodium": 200
  },
  "insight": "A brief, friendly assessment of this meal's nutritional balance."
}

Important rules:
- Identify ALL visible food items separately
- Use realistic portion sizes based on typical servings
- Provide accurate macro estimates based on USDA data
- All numeric values must be numbers (not strings)
- Units should be "g", "ml", "cup", "piece", "serving"
- Totals must be the sum of all foods
- Insight should be 1-2 sentences, encouraging and helpful
- Return ONLY the JSON object, no other text`;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType,
      },
    };

    console.log('🤖 Calling Gemini AI for meal analysis...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw AI response:', text.substring(0, 200) + '...');

    // Clean and parse JSON
    text = cleanJSONResponse(text);
    console.log('🧹 Cleaned response:', text.substring(0, 200) + '...');

    let parsed: MealAnalysisResult;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Failed text:', text);
      throw new Error(
        'AI returned invalid JSON format. Please try with a clearer meal photo.',
      );
    }

    // Validate response structure
    if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
      throw new Error(
        'AI could not identify any foods in the image. Please try with a clearer photo.',
      );
    }

    if (!parsed.totals || typeof parsed.totals.calories !== 'number') {
      throw new Error('AI returned incomplete nutrition data. Please try again.');
    }

    console.log('✅ Meal analyzed successfully:', parsed.foods.length, 'items found');
    return parsed;
  } catch (error: any) {
    console.error('❌ Meal analysis error:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error(
        'AI response format error. The image may not be a clear meal photo.',
      );
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(
      error?.message || 'Failed to analyze meal from image. Please try again.',
    );
  }
}

/**
 * NEW: Compare two meal photos and return a nutrient matrix-style result
 * This is what the Image Comparator screen will call.
 */
export async function analyzeAndCompareMealImages(
  imageAUri: string,
  imageBUri: string,
): Promise<MealCompareResult> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🧮 Starting two-meal image comparison');
    console.log('📄 Image A URI:', imageAUri);
    console.log('📄 Image B URI:', imageBUri);

    const [base64A, base64B] = await Promise.all([
      fileToBase64(imageAUri),
      fileToBase64(imageBUri),
    ]);

    const mimeA = getMimeType(imageAUri);
    const mimeB = getMimeType(imageBUri);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are an expert nutritionist. The user has provided TWO meal photos.

Your job:
1. Identify the main meal in each photo.
2. Estimate key nutrients for each meal.
3. Compare them and explain which is more suitable for general health and why.

Return ONLY valid JSON in this exact format (no markdown, no explanations):

{
  "meal1": {
    "name": "Short descriptive name of meal A",
    "nutrients": {
      "Calories (kcal)": 450,
      "Protein (g)": 25,
      "Carbs (g)": 50,
      "Fat (g)": 15,
      "Sugar (g)": 8,
      "Sodium (mg)": 600
    }
  },
  "meal2": {
    "name": "Short descriptive name of meal B",
    "nutrients": {
      "Calories (kcal)": 520,
      "Protein (g)": 18,
      "Carbs (g)": 60,
      "Fat (g)": 20,
      "Sugar (g)": 12,
      "Sodium (mg)": 800
    }
  },
  "summary": "A concise comparison (2-4 sentences) explaining key differences and which meal is generally healthier, in friendly language."
}

Important rules:
- Keep nutrient keys exactly as shown so the app can render a table.
- All nutrient values must be numbers (not strings).
- Make reasonable estimates based on typical serving sizes and USDA-style data.
- The summary should be understandable by a non-expert.
- Return ONLY the JSON object, nothing else.`;

    const imagePartA = {
      inlineData: {
        data: base64A,
        mimeType: mimeA,
      },
    };
    const imagePartB = {
      inlineData: {
        data: base64B,
        mimeType: mimeB,
      },
    };

    console.log('🤖 Calling Gemini AI for two-meal comparison...');
    const result = await model.generateContent([prompt, imagePartA, imagePartB]);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw AI response (compare):', text.substring(0, 200) + '...');

    text = cleanJSONResponse(text);
    console.log('🧹 Cleaned response (compare):', text.substring(0, 200) + '...');

    let parsed: MealCompareResult;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error (compare):', parseError);
      console.error('Failed text:', text);
      throw new Error(
        'AI returned invalid JSON format for meal comparison. Please try again.',
      );
    }

    if (!parsed.meal1 || !parsed.meal2) {
      throw new Error('AI returned incomplete comparison data.');
    }

    if (
      !parsed.meal1.nutrients ||
      !parsed.meal2.nutrients ||
      typeof parsed.meal1.nutrients !== 'object' ||
      typeof parsed.meal2.nutrients !== 'object'
    ) {
      throw new Error('AI comparison result missing nutrient maps.');
    }

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      parsed.summary =
        'Comparison complete. Both meals have pros and cons; review the nutrient table above.';
    }

    console.log('✅ Meal comparison completed successfully');
    return parsed;
  } catch (error: any) {
    console.error('❌ Meal comparison error:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error(
        'AI response format error for meal comparison. Please try again.',
      );
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(
      error?.message || 'Failed to compare meals from images. Please try again.',
    );
  }
}

/**
 * Analyze manually entered foods (name + quantity + unit) using text prompt
 * Used by ManualFoodModal when user logs food without a photo
 */
export async function analyzeManualFoods(
  foods: {
    name: string;
    quantity: number;
    unit: string;
  }[],
): Promise<MealAnalysisResult> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    if (!foods || foods.length === 0) {
      throw new Error('No foods provided for analysis.');
    }

    console.log('🍽️ Starting manual foods analysis...', foods);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are an expert nutritionist. The user has logged foods manually with quantity and unit (for example in grams, milliliters, cups, pieces, or servings).

FOODS TO ANALYZE:
${JSON.stringify(foods, null, 2)}

For each food, estimate realistic nutritional values based on typical preparation and USDA-style data.

Return ONLY valid JSON in this exact format (no markdown, no explanations):

{
  "foods": [
    {
      "name": "Food item name",
      "quantity": 100,
      "unit": "g",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fat": 8,
      "sugar": 5,
      "sodium": 200
    }
  ],
  "totals": {
    "calories": 200,
    "protein": 10,
    "carbs": 25,
    "fat": 8,
    "sugar": 5,
    "sodium": 200
  },
  "insight": "A brief, friendly assessment of this meal's nutritional balance."
}

Important rules:
- Use the provided quantity and unit as the serving size for each food.
- If the unit is ambiguous, infer the most typical meaning (e.g., "piece", "cup", "serving").
- All numeric values must be numbers (not strings).
- Units should be "g", "ml", "cup", "piece", or "serving" (normalize similar units).
- Totals must be the sum of all foods.
- Insight should be 1–2 sentences, encouraging and helpful.
- Return ONLY the JSON object, no other text.`;

    console.log('🤖 Calling Gemini AI for manual foods analysis...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw AI response (manual foods):', text.substring(0, 200) + '...');

    text = cleanJSONResponse(text);
    console.log('🧹 Cleaned response (manual foods):', text.substring(0, 200) + '...');

    let parsed: MealAnalysisResult;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error (manual foods):', parseError);
      console.error('Failed text:', text);
      throw new Error('AI returned invalid JSON format for manual foods.');
    }

    if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
      throw new Error(
        'AI could not analyze the entered foods. Please check the names.',
      );
    }

    if (!parsed.totals || typeof parsed.totals.calories !== 'number') {
      throw new Error('AI returned incomplete nutrition data for manual foods.');
    }

    console.log(
      '✅ Manual foods analyzed successfully:',
      parsed.foods.length,
      'items found',
    );
    return parsed;
  } catch (error: any) {
    console.error('❌ Manual foods analysis error:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error(
        'AI response format error for manual foods. Please try again.',
      );
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(
      error?.message ||
        'Failed to analyze manually entered foods. Please try again.',
    );
  }
}

/**
 * Predict nutrient deficiencies based on 30-day nutrition history + lab reports
 * Uses AI to correlate dietary gaps with lab abnormalities
 */
export async function predictNutrientDeficiencies(
  userId: string,
): Promise<DeficiencyInsight> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🧬 Running nutrient deficiency prediction for user:', userId);

    const end = getTodayISO();
    const start = getISODateNDaysAgo(30);

    console.log(`📅 Date range: ${start} to ${end}`);

    // Fetch nutrition and lab data in parallel
    const [nutritionHistory, labReports] = await Promise.all([
      nutritionService.getInRange(userId, start, end),
      getReportsByDateRange(userId, start, end),
    ]);

    console.log(
      `📊 Data fetched: ${nutritionHistory.length} meals, ${labReports.length} lab reports`,
    );

    // Compact nutrition data for AI prompt
    const compactNutrition = nutritionHistory.map((n: NutritionEntry) => ({
      date: n.date,
      mealType: n.mealType,
      totalCalories: n.totalCalories,
      totalProtein: n.totalProtein,
      totalCarbs: n.totalCarbs,
      totalFats: n.totalFats,
      foods: n.foods.map((f) => f.name),
    }));

    // Compact lab data
    const compactLabs = labReports.map((r: any) => ({
      testDate: r.testDate,
      labName: r.labName,
      abnormalTests: r.aiInterpretation?.abnormalTests || [],
      riskLevel: r.aiInterpretation?.riskLevel || 'unknown',
    }));

    // Use Gemini 2.0 Flash for analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are a clinical nutritionist and medical doctor. Analyze the patient's 30-day nutrition history and recent lab reports to identify likely nutrient deficiencies.

NUTRITION DATA (last 30 days):
${JSON.stringify(compactNutrition, null, 2)}

LAB REPORTS (with AI-detected abnormalities):
${JSON.stringify(compactLabs, null, 2)}

Based on this data, identify nutrient deficiencies by:
1. Looking for consistently low intake of specific nutrients
2. Correlating dietary patterns with lab abnormalities
3. Identifying missing food groups
4. Considering biochemical markers that suggest deficiencies

Return ONLY valid JSON in this exact format (no markdown):

{
  "deficiencies": [
    {
      "name": "Nutrient name (e.g., Iron, Vitamin D, Omega-3)",
      "confidence": 0.85,
      "reasons": "Explain why you suspect this deficiency based on diet and labs",
      "suggestedFoods": ["Food 1", "Food 2", "Food 3"]
    }
  ],
  "summary": "A 2-3 sentence friendly summary of key findings and recommendations."
}

Important:
- Only include deficiencies with confidence > 0.6
- Be specific about reasons (cite actual data patterns)
- Suggest 3-5 realistic food sources for each deficiency
- If no clear deficiencies, return empty array with encouraging summary
- Confidence must be a number between 0 and 1
- Return ONLY the JSON object`;

    console.log('🤖 Calling Gemini AI for deficiency analysis...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw AI response:', text.substring(0, 200) + '...');

    // Clean and parse JSON
    text = cleanJSONResponse(text);
    console.log('🧹 Cleaned response:', text.substring(0, 200) + '...');

    let parsed: DeficiencyInsight;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Failed text:', text);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate response
    if (!parsed.deficiencies || !Array.isArray(parsed.deficiencies)) {
      throw new Error('AI returned invalid deficiency data');
    }

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      parsed.summary = 'Analysis completed. Check individual deficiency details.';
    }

    console.log('✅ Deficiencies analyzed:', parsed.deficiencies.length, 'found');
    return parsed;
  } catch (error: any) {
    console.error('❌ Deficiency prediction error:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error('AI response format error. Please try again.');
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(error?.message || 'Failed to predict nutrient deficiencies');
  }
}