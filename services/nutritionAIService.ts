// services/nutritionAIService.ts
// ✅ UPDATED: Added user-friendly error messages + improved error handling (Dec 28, 2025)

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { getISODateNDaysAgo, getTodayISO } from '../utils/dateUtils';
import { getReportsByDateRange } from './labReportService';
import { NutritionEntry, nutritionService } from './nutritionService';

// Get API key from environment
const API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;

if (!API_KEY) {
  console.warn('⚠️ Gemini API key not found for nutrition AI service');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ NEW: Constants for image validation
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB limit
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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

// ✅ IMPROVED: Better JSON cleaning helper
function cleanJSONResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks (multiple formats)
  cleaned = cleaned.replace(/```json\n?/gi, '');
  cleaned = cleaned.replace(/```javascript\n?/gi, '');
  cleaned = cleaned.replace(/```\n?/g, '');
  cleaned = cleaned.replace(/`/g, ''); // Remove single backticks.  
  
  // Try to extract JSON object/array from text
  // Look for { ... } or [ ... ]
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[1]; // ✅ FIXED: Access first capture group
    }
  
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// ✅ NEW: User-friendly error message generator
function getUserFriendlyError(error: any, context: 'scan' | 'predictor' | 'manual' | 'compare'): string {
  const errorMsg = error?.message?.toLowerCase() || '';
  
  // Image quality issues (JSON parsing errors typically mean bad image)
  if (errorMsg.includes('invalid json') || errorMsg.includes('parse') || errorMsg.includes('format error')) {
    if (context === 'scan') {
      return '📸 Image Quality Issue\n\nThe AI couldn\'t clearly identify the food in this photo.\n\n✅ Tips for better results:\n-  Take photos in good lighting\n-  Ensure food is clearly visible\n-  Avoid blurry or dark images\n-  Try capturing from directly above the plate';
    }
    if (context === 'compare') {
      return '📸 Image Analysis Issue\n\nOne or both images couldn\'t be analyzed clearly.\n\n✅ Please ensure:\n-  Both images show food clearly\n-  Photos are well-lit and in focus\n-  Food items are visible and identifiable';
    }
    return '🤖 AI Analysis Error\n\nThe AI couldn\'t process your request properly.\n\n✅ Please try again with clearer information.';
  }
  
  // No data to analyze
  if (errorMsg.includes('no data') || errorMsg.includes('not enough') || errorMsg.includes('no nutrition data')) {
    return '📊 Not Enough Data\n\nYou need to log at least 3-7 meals before the predictor can provide accurate insights.\n\n✅ Get started:\n-  Use "Scan Meal" to log food with your camera\n-  Or tap "Log Food" to add meals manually\n-  Come back after logging a few days of meals';
  }
  
  // API/Service configuration issues
  if (errorMsg.includes('api key') || errorMsg.includes('configuration')) {
    return '⚙️ Service Configuration Issue\n\nThere\'s a problem with the AI service setup.\n\n✅ Please contact support or try again later.';
  }
  
  // Rate limiting / Quota issues
  if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('temporarily unavailable')) {
    return '⏰ Service Temporarily Busy\n\nThe AI service is experiencing high demand right now.\n\n✅ Please wait 2-3 minutes and try again.';
  }
  
  // Network/Connection issues
  if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('connection')) {
    return '📡 Connection Issue\n\nUnable to reach the AI service.\n\n✅ Please check:\n-  Your internet connection is active\n-  You have stable WiFi or mobile data\n-  Try again in a moment';
  }
  
  // File/Image format issues
  if (errorMsg.includes('unsupported') || errorMsg.includes('format')) {
    return '🖼️ Unsupported Image Format\n\nThis image format isn\'t supported.\n\n✅ Please use:\n-  JPG or JPEG\n-  PNG\n-  WEBP\n\nTry taking a new photo with your camera.';
  }
  
  // File size issues
  if (errorMsg.includes('too large') || errorMsg.includes('size')) {
    return '📦 Image File Too Large\n\nThe image file size exceeds the 20MB limit.\n\n✅ Please:\n-  Use your phone\'s camera compression\n-  Reduce image quality/resolution\n-  Try a different photo';
  }
  
  // Empty/No foods detected
  if (errorMsg.includes('no foods') || errorMsg.includes('could not identify') || errorMsg.includes('no food provided')) {
    if (context === 'scan') {
      return '🍽️ No Food Detected\n\nThe AI couldn\'t identify any food items in this image.\n\n✅ Make sure:\n-  Food is clearly visible in the frame\n-  The image isn\'t too dark or blurry\n-  You\'re photographing actual food (not empty plates)';
    }
    return '❌ No Food Items\n\nPlease add at least one food item to analyze.';
  }
  
  // Invalid food data
  if (errorMsg.includes('invalid food') || errorMsg.includes('incomplete')) {
    return '⚠️ Invalid Food Data\n\nThe AI returned incomplete nutrition information.\n\n✅ Please try again, or:\n-  Use "Manual Log" to enter food details yourself\n-  Try a different photo with better visibility';
  }
  
  // Default friendly message for unknown errors
  return '❌ Analysis Failed\n\nSomething went wrong while analyzing your request.\n\n✅ What to try:\n-  Check your internet connection\n-  Try again in a moment\n-  Contact support if this keeps happening\n\nError: ' + (error?.message || 'Unknown error');
}

// ✅ NEW: Validate image before AI processing
async function validateImage(uri: string): Promise<void> {
  try {
    // Check file extension
    const ext = uri.toLowerCase().split('.').pop() || '';
    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(
        `Unsupported image format: ${ext}. Please use JPG, PNG, or WEBP.`
      );
    }

    // Check file size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      if (fileInfo.size > MAX_IMAGE_SIZE) {
        throw new Error(
          'Image file is too large (max 20MB). Please use a smaller image.'
        );
      }
      console.log(`✅ Image validated: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`);
    }
  } catch (error: any) {
    console.error('❌ Image validation error:', error);
    throw error;
  }
}

// ✅ NEW: Sleep helper for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Result type for two-meal comparison
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
 * ✅ IMPROVED: Analyze meal from image with retry logic and user-friendly errors
 * Returns estimated food items with nutrition data
 */
export async function analyzeMealFromImage(
  uri: string,
): Promise<MealAnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  console.log('🍽️ Starting meal analysis from image...');
  console.log('📄 Image URI:', uri);

  // ✅ Validate image before processing
  try {
    await validateImage(uri);
  } catch (validationError: any) {
    console.error('❌ Image validation failed:', validationError);
    throw new Error(getUserFriendlyError(validationError, 'scan'));
  }

  // ✅ Retry logic with exponential backoff
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await sleep(delay);
      }

      // Convert file to base64
      const base64 = await fileToBase64(uri);
      const mimeType = getMimeType(uri);
      console.log('🎯 MIME type:', mimeType);

      // ✅ Use Gemini 2.5 Flash with forced JSON response
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json', // ✅ Force JSON output
        },
      });

      const prompt = `You are an expert nutritionist. Analyze this meal photo and identify all visible food items with their estimated nutritional values.

CRITICAL: Return ONLY valid JSON in this exact format (no markdown, no explanations):

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

      // ✅ Better JSON cleaning and parsing
      text = cleanJSONResponse(text);
      console.log('🧹 Cleaned response:', text.substring(0, 200) + '...');

      let parsed: MealAnalysisResult;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Failed text (first 500 chars):', text.substring(0, 500));
        
        // ✅ Try to fix common JSON issues
        try {
          const fixedText = text
            .replace(/^[^{[]*/, '')
            .replace(/[^}\]]*$/, '');
          
          console.log('🔧 Attempting to parse fixed text...');
          parsed = JSON.parse(fixedText);
          console.log('✅ Fixed JSON parsing succeeded!');
        } catch (secondError) {
          console.error('❌ Second parse attempt failed:', secondError);
          
          if (attempt < MAX_RETRIES) {
            throw new Error('AI returned invalid JSON format. Retrying...');
          }
          
          throw new Error(
            'AI returned invalid JSON format. Please try with a clearer meal photo.',
          );
        }
      }

      // ✅ Validate response structure
      if (!parsed.foods || !Array.isArray(parsed.foods)) {
        throw new Error(
          'AI response missing foods array. Please try with a clearer photo.',
        );
      }

      if (parsed.foods.length === 0) {
        throw new Error(
          'AI could not identify any foods in the image. Please ensure the photo clearly shows food items.',
        );
      }

      // ✅ Validate each food item
      const validFoods = parsed.foods.filter((food: any) => {
        return (
          food.name &&
          typeof food.name === 'string' &&
          typeof food.calories === 'number' &&
          typeof food.protein === 'number' &&
          typeof food.carbs === 'number' &&
          typeof food.fat === 'number'
        );
      });

      if (validFoods.length === 0) {
        throw new Error('AI returned invalid food data. Please try again.');
      }

      parsed.foods = validFoods;

      // ✅ Validate and fix totals
      if (!parsed.totals || typeof parsed.totals !== 'object') {
        console.warn('⚠️ Missing totals, calculating from foods...');
        parsed.totals = parsed.foods.reduce(
          (acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fat: acc.fat + (food.fat || 0),
            sugar: acc.sugar + (food.sugar || 0),
            sodium: acc.sodium + (food.sodium || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0 }
        );
      }

      if (
        typeof parsed.totals.calories !== 'number' ||
        typeof parsed.totals.protein !== 'number' ||
        typeof parsed.totals.carbs !== 'number' ||
        typeof parsed.totals.fat !== 'number'
      ) {
        throw new Error('AI returned incomplete nutrition totals.');
      }

      // ✅ Ensure insight exists
      if (!parsed.insight || typeof parsed.insight !== 'string') {
        parsed.insight = 'Meal analyzed successfully.';
      }

      console.log('✅ Meal analyzed successfully:', parsed.foods.length, 'items found');
      console.log(`📊 Totals: ${parsed.totals.calories} cal, ${parsed.totals.protein}g protein`);
      
      return parsed;

    } catch (error: any) {
      console.error(`❌ Meal analysis error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
      lastError = error;

      // Don't retry for these errors
      if (
        error?.message?.includes('API key') ||
        error?.message?.includes('Unsupported image format') ||
        error?.message?.includes('too large')
      ) {
        break;
      }

      if (attempt === MAX_RETRIES) {
        break;
      }

      console.log('🔄 Will retry...');
    }
  }

  // ✅ User-friendly error after all retries failed
  console.error('❌ All retry attempts failed');
  throw new Error(getUserFriendlyError(lastError, 'scan'));
}

/**
 * ✅ IMPROVED: Compare two meal photos with user-friendly errors
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
        responseMimeType: 'application/json', // ✅ Force JSON
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
      
      // ✅ Try to fix
      try {
        const fixedText = text.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
        parsed = JSON.parse(fixedText);
      } catch {
        throw new Error(
          'AI returned invalid JSON format for meal comparison. Please try again.',
        );
      }
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
    throw new Error(getUserFriendlyError(error, 'compare'));
  }
}

/**
 * ✅ IMPROVED: Analyze manually entered foods with user-friendly errors
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
        responseMimeType: 'application/json', // ✅ Force JSON
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
      
      // ✅ Try to fix
      try {
        const fixedText = text.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
        parsed = JSON.parse(fixedText);
      } catch {
        throw new Error('AI returned invalid JSON format for manual foods.');
      }
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
    throw new Error(getUserFriendlyError(error, 'manual'));
  }
}

/**
 * ✅ IMPROVED: Predict nutrient deficiencies with user-friendly errors
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

    const [nutritionHistory, labReports] = await Promise.all([
      nutritionService.getInRange(userId, start, end),
      getReportsByDateRange(userId, start, end),
    ]);

    console.log(
      `📊 Data fetched: ${nutritionHistory.length} meals, ${labReports.length} lab reports`,
    );

    if (nutritionHistory.length === 0) {
      console.log('⚠️ No nutrition data available');
      return {
        deficiencies: [],
        summary: 'Not enough nutrition data to analyze. Start logging your meals to get personalized insights!',
      };
    }

    const compactNutrition = nutritionHistory.map((n: NutritionEntry) => ({
      date: n.date,
      mealType: n.mealType,
      totalCalories: n.totalCalories,
      totalProtein: n.totalProtein,
      totalCarbs: n.totalCarbs,
      totalFats: n.totalFats,
      foods: n.foods.map((f) => f.name),
    }));

    const compactLabs = labReports.map((r: any) => ({
      testDate: r.testDate,
      labName: r.labName,
      abnormalTests: r.aiInterpretation?.abnormalTests || [],
      riskLevel: r.aiInterpretation?.riskLevel || 'unknown',
    }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json', // ✅ Force JSON
      },
    });

    const prompt = `You are a clinical nutritionist analyzing patient data.

NUTRITION DATA (last 30 days):
${JSON.stringify(compactNutrition, null, 2)}

LAB REPORTS:
${JSON.stringify(compactLabs, null, 2)}

Analyze this data to identify nutrient deficiencies. Consider:
1. Low intake patterns
2. Lab abnormalities correlating with diet
3. Missing food groups
4. Biochemical markers

CRITICAL: Return ONLY this exact JSON structure with NO extra text:
{
  "deficiencies": [
    {
      "name": "Iron",
      "confidence": 0.85,
      "reasons": "Low red meat intake, fatigue noted in labs",
      "suggestedFoods": ["Spinach", "Red meat", "Lentils"]
    }
  ],
  "summary": "Brief 2-3 sentence summary"
}

Rules:
- Only include deficiencies with confidence > 0.6
- Confidence must be a decimal number (0.0 to 1.0)
- Include 3-5 food suggestions per deficiency
- If no clear deficiencies, return empty array with encouraging summary
- NO markdown, NO explanations, ONLY the JSON object`;

    console.log('🤖 Calling Gemini AI for deficiency analysis...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw AI response:', text.substring(0, 300) + '...');

    text = cleanJSONResponse(text);
    console.log('🧹 Cleaned response:', text.substring(0, 300) + '...');

    let parsed: DeficiencyInsight;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Failed text (first 500 chars):', text.substring(0, 500));
      
      try {
        const fixedText = text
          .replace(/^[^{[]*/, '')
          .replace(/[^}\]]*$/, '');
        
        console.log('🔧 Attempting to parse fixed text...');
        parsed = JSON.parse(fixedText);
        console.log('✅ Fixed JSON parsing succeeded!');
      } catch (secondError) {
        console.error('❌ Second parse attempt failed:', secondError);
        throw new Error(
          'AI returned invalid JSON format. Please try again or contact support if issue persists.',
        );
      }
    }

    if (!parsed.deficiencies || !Array.isArray(parsed.deficiencies)) {
      console.error('❌ Invalid deficiencies structure:', parsed);
      throw new Error('AI returned invalid deficiency data structure');
    }

    parsed.deficiencies = parsed.deficiencies
      .filter((def: any) => {
        if (!def.name || typeof def.name !== 'string') return false;
        if (typeof def.confidence !== 'number') return false;
        if (!def.reasons || typeof def.reasons !== 'string') return false;
        if (!Array.isArray(def.suggestedFoods)) return false;
        
        if (def.confidence < 0 || def.confidence > 1) {
          def.confidence = Math.max(0, Math.min(1, def.confidence / 100));
        }
        
        return true;
      })
      .map((def: any) => ({
        name: def.name,
        confidence: Number(def.confidence),
        reasons: def.reasons,
        suggestedFoods: def.suggestedFoods.filter((f: any) => typeof f === 'string'),
      }));

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      parsed.summary = parsed.deficiencies.length > 0
        ? 'Analysis completed. Review the deficiency details below.'
        : 'Great job! No significant nutrient deficiencies detected based on your recent nutrition data.';
    }

    console.log('✅ Deficiencies analyzed:', parsed.deficiencies.length, 'found');
    return parsed;
  } catch (error: any) {
    console.error('❌ Deficiency prediction error:', error);
    throw new Error(getUserFriendlyError(error, 'predictor'));
  }
}
