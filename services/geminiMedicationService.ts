// services/geminiMedicationService.ts
// AI-powered medication extraction, classification, and merge suggestions
// Last Updated: December 17, 2025

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import {
    AIClassificationResult,
    ExtractedMedication,
    MedicationComparisonResult
} from '../types/medication';

// Initialize Gemini AI
const API_KEY = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Convert file URI to base64 for Gemini API
 */
async function fileToBase64(uri: string): Promise<string> {
  try {
    console.log('📂 Reading medication image from:', uri);
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
function getMimeType(uri: string): string {
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
 * Extract medications from a single prescription image
 * Used for Smart Import feature
 */
export async function extractMedicationsFromImage(
  imageUri: string
): Promise<ExtractedMedication[]> {
  try {
    console.log('💊 Starting medication extraction from image...');
    
    // Convert file to base64
    const base64Data = await fileToBase64(imageUri);
    const mimeType = getMimeType(imageUri);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a medical prescription extraction AI specialist. Analyze this prescription image and extract ALL medications with their complete details.

INFORMATION TO EXTRACT (for each medication):
- Medication name (prefer generic name if visible, otherwise brand name)
- Strength/dosage (e.g., "500mg", "10mg/5ml", "250mg")
- Dosage form: MUST be one of: Tablet, Capsule, Syrup, Injection, Cream, Ointment, Drops, Inhaler, Patch, Suppository, Other
- Frequency: MUST be one of: "Once a day", "Twice a day", "Thrice a day", "Four times a day", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed", "Weekly", "Custom"
- Duration (e.g., "7 days", "2 weeks", "1 month") - extract as text
- Meal relation: MUST be one of: "Before meals", "After meals", "With meals", "Empty stomach", "Any time"
- Special instructions or notes
- Doctor's name (if visible)
- Prescription date (if visible)

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "name": "Paracetamol",
    "strength": "500mg",
    "dosageForm": "Tablet",
    "frequency": "Twice a day",
    "duration": "7 days",
    "mealRelation": "After meals",
    "instructions": "Take with plenty of water",
    "prescribedBy": "Dr. John Smith",
    "startDate": "2025-12-17",
    "confidence": 95
  }
]

IMPORTANT RULES:
1. Return [] if NO medications found
2. Include ALL medications from the prescription
3. confidence: integer 0-100 based on text clarity
4. startDate in YYYY-MM-DD format (use prescription date or today's date: ${new Date().toISOString().split('T')[0]})
5. If frequency not clear, use "As needed"
6. If meal relation not clear, use "Any time"
7. Only include fields with actual values
8. NO markdown formatting, NO explanations, ONLY valid JSON array`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    console.log('🤖 Calling Gemini AI for medication extraction...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 AI Response:', text.substring(0, 200) + '...');

    // Clean up the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json|```/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON response
    const extractedMedications: ExtractedMedication[] = JSON.parse(cleanedText);

    // Validate extracted data
    if (!Array.isArray(extractedMedications) || extractedMedications.length === 0) {
      console.log('⚠️ No medications extracted from image');
      return [];
    }

    console.log(`✅ Extracted ${extractedMedications.length} medications`);
    return extractedMedications;

  } catch (error: any) {
    console.error('❌ Error extracting medications from image:', error);
    
    if (error instanceof SyntaxError) {
      console.warn('⚠️ Failed to parse medication data');
      throw new Error('Could not understand prescription format. Please try a clearer image.');
    }
    
    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please contact support.');
    }
    
    throw new Error('Failed to analyze prescription. Please try again.');
  }
}

/**
 * Extract medications from pasted text (prescription details)
 * Used for Smart Import text input mode
 */
export async function extractMedicationsFromText(
  text: string
): Promise<ExtractedMedication[]> {
  try {
    console.log('💊 Starting medication extraction from text...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a medical prescription extraction AI specialist. Analyze this prescription text and extract ALL medications with their details.

PRESCRIPTION TEXT:
${text}

INFORMATION TO EXTRACT (for each medication):
- Medication name
- Strength/dosage (e.g., "500mg", "10mg/5ml")
- Dosage form: MUST be one of: Tablet, Capsule, Syrup, Injection, Cream, Ointment, Drops, Inhaler, Patch, Suppository, Other
- Frequency: MUST be one of: "Once a day", "Twice a day", "Thrice a day", "Four times a day", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed", "Weekly", "Custom"
- Duration (e.g., "7 days", "2 weeks")
- Meal relation: MUST be one of: "Before meals", "After meals", "With meals", "Empty stomach", "Any time"
- Special instructions

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "name": "Paracetamol",
    "strength": "500mg",
    "dosageForm": "Tablet",
    "frequency": "Twice a day",
    "duration": "7 days",
    "mealRelation": "After meals",
    "instructions": "Take with water",
    "startDate": "${new Date().toISOString().split('T')[0]}",
    "confidence": 90
  }
]

IMPORTANT RULES:
1. Return [] if NO medications found
2. confidence: integer 0-100
3. startDate: today's date in YYYY-MM-DD format
4. If details unclear, use sensible defaults
5. NO markdown, NO explanations, ONLY valid JSON array`;

    console.log('🤖 Calling Gemini AI for text extraction...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('📝 AI Response:', responseText.substring(0, 200) + '...');

    // Clean up the response
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/```json|```/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON response
    const extractedMedications: ExtractedMedication[] = JSON.parse(cleanedText);

    if (!Array.isArray(extractedMedications) || extractedMedications.length === 0) {
      console.log('⚠️ No medications extracted from text');
      return [];
    }

    console.log(`✅ Extracted ${extractedMedications.length} medications from text`);
    return extractedMedications;

  } catch (error: any) {
    console.error('❌ Error extracting medications from text:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Could not understand prescription format. Please try again.');
    }
    
    throw new Error('Failed to analyze text. Please try again.');
  }
}

/**
 * Classify medications to get generic names and therapeutic classifications
 * Used for duplicate detection and smart merging
 */
export async function classifyMedications(
  medicationNames: string[]
): Promise<AIClassificationResult[]> {
  try {
    console.log(`🔬 Classifying ${medicationNames.length} medications...`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a pharmaceutical classification AI. For each medication name, provide its generic name and therapeutic classification.

MEDICATIONS TO CLASSIFY:
${medicationNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "originalName": "Crocin",
    "genericName": "Paracetamol",
    "classification": "Analgesic/Antipyretic",
    "confidence": 95
  },
  {
    "originalName": "Dolo 650",
    "genericName": "Paracetamol",
    "classification": "Analgesic/Antipyretic",
    "confidence": 98
  }
]

CLASSIFICATION CATEGORIES (use one of these or similar):
- Analgesic/Antipyretic (pain relief/fever)
- Antibiotic (bacterial infections)
- Antacid/PPI (stomach acid)
- Antihistamine (allergies)
- Antihypertensive (blood pressure)
- Antidiabetic (diabetes)
- Steroid/Anti-inflammatory
- Cardiovascular
- Respiratory
- Supplement/Vitamin
- Other

IMPORTANT RULES:
1. Provide results for ALL input medications in the same order
2. genericName: standard pharmaceutical generic name
3. classification: therapeutic category
4. confidence: integer 0-100
5. If medication unknown, set confidence to 0 and use original name as generic
6. NO markdown, NO explanations, ONLY valid JSON array`;

    console.log('🤖 Calling Gemini AI for classification...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 AI Classification Response:', text.substring(0, 200) + '...');

    // Clean up the response
    let cleanedText = text.trim();
cleanedText = cleanedText.replace(/```json|```/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON response
    const classifications: AIClassificationResult[] = JSON.parse(cleanedText);

    if (!Array.isArray(classifications) || classifications.length === 0) {
      console.log('⚠️ No classifications returned');
      return [];
    }

    console.log(`✅ Classified ${classifications.length} medications`);
    return classifications;

  } catch (error: any) {
    console.error('❌ Error classifying medications:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse classification data.');
    }
    
    throw new Error('Failed to classify medications. Please try again.');
  }
}

/**
 * Get AI suggestion for merging or keeping medications separate
 * Used in merge conflict resolution
 */
export async function getMedicationComparisonSuggestion(
  existingMedName: string,
  newMedName: string,
  existingGeneric?: string,
  newGeneric?: string,
  classification?: string
): Promise<MedicationComparisonResult> {
  try {
    console.log(`🤔 Comparing: "${existingMedName}" vs "${newMedName}"`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a pharmaceutical expert AI. Compare these two medications and suggest whether they should be merged or kept separate.

EXISTING MEDICATION:
- Name: ${existingMedName}
${existingGeneric ? `- Generic: ${existingGeneric}` : ''}
${classification ? `- Classification: ${classification}` : ''}

NEW MEDICATION:
- Name: ${newMedName}
${newGeneric ? `- Generic: ${newGeneric}` : ''}
${classification ? `- Classification: ${classification}` : ''}

ANALYSIS REQUIRED:
1. Are these the same medication (same active ingredient)?
2. Are they from the same therapeutic class?
3. Should they be merged or kept separate?

RESPONSE FORMAT - Return ONLY a valid JSON object:
{
  "suggestion": "merge",
  "reasoning": "Both contain the same active ingredient (Paracetamol). Crocin and Dolo 650 are different brand names for the same drug.",
  "confidence": 95,
  "recommendedAction": "Merge and update with new prescription details"
}

RULES:
- suggestion: MUST be one of: "merge", "add_new", "uncertain"
- Use "merge" if same active ingredient with different brand names
- Use "add_new" if different medications or if combining makes sense (e.g., different therapeutic purposes)
- Use "uncertain" if not enough information
- reasoning: 1-2 sentences explaining why
- confidence: integer 0-100
- recommendedAction: brief action to take
- NO markdown, ONLY valid JSON object`;

    console.log('🤖 Calling Gemini AI for comparison...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 AI Comparison Response:', text);

    // Clean up the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json|```/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON response
    const comparisonResult: MedicationComparisonResult = JSON.parse(cleanedText);

    console.log('✅ Comparison suggestion:', comparisonResult.suggestion);
    return comparisonResult;

  } catch (error: any) {
    console.error('❌ Error getting comparison suggestion:', error);
    
    // Return default uncertain response on error
    return {
      suggestion: 'uncertain',
      reasoning: 'Unable to determine similarity. Please review manually.',
      confidence: 0,
      recommendedAction: 'Review and decide manually',
    };
  }
}

/**
 * Extract single medication details from image for quick camera scan
 * Simplified version for fast single-medication extraction
 */
export async function extractSingleMedicationFromImage(
  imageUri: string
): Promise<ExtractedMedication | null> {
  try {
    console.log('📸 Quick scan: extracting single medication...');
    
    const medications = await extractMedicationsFromImage(imageUri);
    
    if (medications.length === 0) {
      return null;
    }
    
    // Return the first (or highest confidence) medication
    const bestMatch = medications.sort((a, b) => 
      (b.confidence || 0) - (a.confidence || 0)
    )[0];
    
    console.log('✅ Quick scan complete:', bestMatch.name);
    return bestMatch;
    
  } catch (error) {
    console.error('❌ Quick scan failed:', error);
    return null;
  }
}
