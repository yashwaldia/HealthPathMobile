import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Initialize Gemini AI
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY || 
                process.env.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ExtractedVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugarFasting?: number;
  bloodSugarPostMeal?: number;
  heartRate?: number;
  pulseRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respirationRate?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  notes?: string;
}

/**
 * Convert file URI to base64 for Gemini API
 */
async function fileToBase64(uri: string): Promise<string> {
  try {
    console.log('📂 Reading file from:', uri);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('✅ File converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('❌ Error converting file to base64:', error);
    throw new Error('Failed to read file. Please try again.');
  }
}

/**
 * Determine MIME type from file URI
 */
function getMimeType(uri: string, type: 'image' | 'pdf'): string {
  if (type === 'pdf') {
    return 'application/pdf';
  }
  
  const extension = uri.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Extract vital signs from medical document using Gemini Vision API
 */
export async function extractVitalsFromDocument(
  uri: string,
  type: 'image' | 'pdf'
): Promise<ExtractedVitals | null> {
  try {
    console.log('🔍 Starting document analysis...');
    console.log('📄 File URI:', uri);
    console.log('📋 File type:', type);
    
    // Convert file to base64
    const base64Data = await fileToBase64(uri);
    const mimeType = getMimeType(uri, type);
    console.log('🎯 MIME type:', mimeType);

    // Use Gemini 1.5 Pro for better accuracy
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medical vitals extraction AI. Analyze this document and extract ONLY VITAL SIGNS (NOT lab test values).

VITAL SIGNS TO EXTRACT (if present):
- Blood Pressure (systolic/diastolic in mmHg)
- Heart Rate or Pulse (in bpm)
- Body Temperature (in Celsius)
- Oxygen Saturation / SpO2 (percentage)
- Respiration Rate (breaths per minute)
- Weight (in kg)
- Height (in cm)
- BMI (if calculated)

DO NOT EXTRACT:
- Lab test results (CBC, blood glucose, cholesterol, etc.)
- Imaging reports
- Medication lists
- Diagnoses

RESPONSE FORMAT:
Return ONLY a valid JSON object with extracted vital signs. Example:
{
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 72,
  "temperature": 37.0 in celcius,
  "oxygenSaturation": 98,
  "weightKg": 70.5
}

IMPORTANT RULES:
1. Return {} if NO vital signs found
2. Only include fields with actual values
3. Use numeric values only (no units in numbers)
4. If BP is "120/80", extract systolic=120, diastolic=80
5. NO markdown, NO explanations, ONLY valid JSON`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    console.log('🤖 Calling Gemini AI...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 AI Response:', text);

    // Clean up the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    console.log('🧹 Cleaned response:', cleanedText);

    // Parse JSON response
    const extractedData: ExtractedVitals = JSON.parse(cleanedText);

    // Validate extracted data
    if (!extractedData || Object.keys(extractedData).length === 0) {
      console.log('⚠️ No vitals data extracted from document');
      return null;
    }

    // Clean up the data - ensure all values are numbers
    const cleanedData: ExtractedVitals = {};
    
    for (const [key, value] of Object.entries(extractedData)) {
      if (key === 'notes' && typeof value === 'string') {
        cleanedData.notes = value;
      } else if (typeof value === 'number' && !isNaN(value) && value > 0) {
        (cleanedData as any)[key] = value;
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
          (cleanedData as any)[key] = numValue;
        }
      }
    }

    console.log('✅ Final extracted vitals:', cleanedData);
    return cleanedData;

  } catch (error: any) {
    console.error('❌ Error extracting vitals from document:', error);
    console.error('Error details:', error?.message, error?.stack);
    
    if (error instanceof SyntaxError) {
      throw new Error('AI response format error. The document may not contain clear vital signs.');
    }
    
    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }
    
    throw new Error(error?.message || 'Failed to analyze document. Please try again.');
  }
}

/**
 * Analyze vitals trends and provide health insights
 */
export async function analyzeVitalsTrends(vitalsHistory: any[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a health analytics AI. Analyze this vitals history data and provide brief, actionable health insights.

Vitals Data:
${JSON.stringify(vitalsHistory, null, 2)}

Provide a concise analysis covering:
1. Overall trends (improving, stable, or concerning)
2. Any patterns or anomalies
3. 2-3 actionable recommendations

Keep response under 200 words. Be encouraging and professional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error analyzing vitals trends:', error);
    return 'Unable to generate insights at this time. Please try again later.';
  }
}

/**
 * Get personalized health recommendations based on latest vitals
 */
export async function getHealthRecommendations(latestVitals: ExtractedVitals): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a health advisor AI. Based on these vital signs, provide 3-4 brief, personalized health recommendations.

Current Vitals:
${JSON.stringify(latestVitals, null, 2)}

Provide:
- Specific lifestyle tips based on these readings
- Any areas that need attention (if values are abnormal)
- Positive reinforcement for normal values

Keep response under 150 words. Focus on actionable advice.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error getting health recommendations:', error);
    return 'Unable to generate recommendations at this time.';
  }
}
