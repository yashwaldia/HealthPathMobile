// services/classificationService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { ClassificationResult, DocumentCategory } from '../types/upload';
import { ExtractedMedication, extractMedicationsFromDocument } from './aiService';
import { addMedication } from './medicationService';

// Initialize Gemini AI (use your existing API key from aiService.ts)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Helper function to parse duration string to number of days
 */
const parseDuration = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : undefined;
};

/**
 * Map AI frequency string to app's FrequencyType
 */
const mapFrequency = (aiFrequency?: string): 'Once a day' | 'Twice a day' | 'Thrice a day' | 'Four times a day' | 'Every 4 hours' | 'Every 6 hours' | 'Every 8 hours' | 'Every 12 hours' | 'As needed' | 'Weekly' | 'Custom' => {
  if (!aiFrequency) return 'Once a day';
  const freq = aiFrequency.toLowerCase();
  
  if (freq.includes('once') || freq.includes('1 time') || freq === 'daily') return 'Once a day';
  if (freq.includes('twice') || freq.includes('2 time')) return 'Twice a day';
  if (freq.includes('thrice') || freq.includes('three') || freq.includes('3 time')) return 'Thrice a day';
  if (freq.includes('four') || freq.includes('4 time')) return 'Four times a day';
  if (freq.includes('every 4 hour')) return 'Every 4 hours';
  if (freq.includes('every 6 hour')) return 'Every 6 hours';
  if (freq.includes('every 8 hour')) return 'Every 8 hours';
  if (freq.includes('every 12 hour')) return 'Every 12 hours';
  if (freq.includes('week')) return 'Weekly';
  if (freq.includes('as needed') || freq.includes('prn')) return 'As needed';
  
  // Default to 'Custom' for unrecognized patterns (including monthly)
  return 'Custom';
};

/**
 * Map AI dosage form string to app's DosageForm
 */
const mapDosageForm = (form?: string): 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Cream' | 'Ointment' | 'Inhaler' | 'Patch' | 'Suppository' | 'Other' => {
  if (!form) return 'Tablet';
  const lower = form.toLowerCase();
  
  if (lower.includes('tablet') || lower.includes('tab')) return 'Tablet';
  if (lower.includes('capsule') || lower.includes('cap')) return 'Capsule';
  if (lower.includes('syrup') || lower.includes('liquid') || lower.includes('suspension')) return 'Syrup';
  if (lower.includes('injection') || lower.includes('inj')) return 'Injection';
  if (lower.includes('drop')) return 'Drops';
  if (lower.includes('ointment')) return 'Ointment';
  if (lower.includes('cream') || lower.includes('gel')) return 'Cream';
  if (lower.includes('inhaler') || lower.includes('puff')) return 'Inhaler';
  if (lower.includes('patch')) return 'Patch';
  if (lower.includes('suppository')) return 'Suppository';
  
  return 'Other';
};

/**
 * Map AI meal relation string to app's MealRelation
 * FIXED: Changed to match exact type definition (plural forms and "Any time")
 */
const mapMealRelation = (relation?: string): 'Before meals' | 'After meals' | 'With meals' | 'Empty stomach' | 'Any time' => {
  if (!relation) return 'Any time';
  const lower = relation.toLowerCase();
  
  if (lower.includes('before meal') || lower.includes('before food')) return 'Before meals';
  if (lower.includes('after meal') || lower.includes('after food')) return 'After meals';
  if (lower.includes('with meal') || lower.includes('with food')) return 'With meals';
  if (lower.includes('empty stomach')) return 'Empty stomach';
  
  return 'Any time';
};

/**
 * Helper function to map extracted medication data to Firestore format
 */
const mapMedicationForSave = (
  med: ExtractedMedication,
  classification: ClassificationResult,
  fileURL?: string
) => {
  const durationDays = parseDuration(med.duration);
  const startDate = med.startDate || new Date().toISOString().split('T')[0];
  let endDate: string | undefined;

  if (durationDays) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + durationDays);
    endDate = start.toISOString().split('T')[0];
  }

  return {
    name: med.name,
    strength: med.strength || 'As prescribed',
    dosageForm: mapDosageForm(med.dosageForm),
    frequency: mapFrequency(med.frequency),
    mealRelation: mapMealRelation(med.mealRelation),
    startDate,
    durationDays,
    endDate,
    prescribedBy: med.prescribedBy || classification.doctorName,
    instructions: med.instructions,
    reminderEnabled: false,
    prescriptionImage: fileURL,
    isActive: true,
  };
};

/**
 * Save extracted medications to Firestore
 */
export const saveMedicationsToFirestore = async (
  userId: string,
  medications: ExtractedMedication[],
  classification: ClassificationResult,
  fileURL?: string
): Promise<{ savedCount: number; failedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let savedCount = 0;
  let failedCount = 0;

  console.log(`💊 Saving ${medications.length} medications to Firestore...`);

  for (const med of medications) {
    try {
      const medicationData = mapMedicationForSave(med, classification, fileURL);
      console.log(`💊 Saving medication: ${med.name}`, medicationData);

      await addMedication(userId, medicationData);
      savedCount++;
      console.log(`✅ Successfully saved: ${med.name}`);
    } catch (error) {
      failedCount++;
      const errorMsg = `Failed to save ${med.name}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log(`💊 Save complete: ${savedCount} saved, ${failedCount} failed`);
  return { savedCount, failedCount, errors };
};

/**
 * Extract text from image using OCR (via Gemini Vision)
 */
export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: 'image/jpeg',
      },
    };

    const prompt = `Extract all text from this medical document. Return only the extracted text without any additional commentary.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
};

/**
 * Classify medical document using AI and always extract medications if any exist
 */
export const classifyDocument = async (
  fileUri: string,
  fileName: string,
  userId?: string,
  fileURL?: string,
  autoSaveMedications: boolean = false
): Promise<ClassificationResult> => {
  try {
    const isPdf = fileName.toLowerCase().endsWith('.pdf');

    // For images, extract text first
    let documentText = '';
    if (!isPdf) {
      documentText = await extractTextFromImage(fileUri);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a medical document classifier. Analyze the following medical document and classify it into ONE of these categories:

1. pathology_report - Lab test results (blood tests, urine tests, stool tests, biopsies)
2. radiology_scan - Medical imaging reports (X-Ray, CT, MRI, Ultrasound, PET scan)
3. medication_prescription - Prescription documents or medication lists
4. vitals_record - Vital signs tracking sheets (blood pressure, glucose, heart rate logs)
5. vaccination_card - Immunization records or vaccination certificates
6. discharge_summary - Hospital discharge papers or summaries
7. other - Any other medical document

${isPdf ? 'Document is a PDF file.' : `Extracted text from document:\n${documentText}`}

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{
  "category": "pathology_report",
  "confidence": 0.95,
  "detectedTests": ["Complete Blood Count", "Lipid Profile"],
  "labName": "Quest Diagnostics",
  "testDate": "2025-11-15",
  "doctorName": "Dr. John Smith",
  "reasoning": "Document contains lab test results with reference ranges"
}

Rules:
- confidence must be between 0.0 and 1.0
- testDate must be in YYYY-MM-DD format
- Only include fields that are clearly present in the document
- If unsure about a field, omit it
- reasoning should explain why you chose this category
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON response
    const classification: ClassificationResult = JSON.parse(responseText);

    // Validate response
    if (!classification.category || typeof classification.confidence !== 'number') {
      throw new Error('Invalid classification response format');
    }

    // Ensure confidence is between 0 and 1
    classification.confidence = Math.max(0, Math.min(1, classification.confidence));
    
    // Store extracted text
    classification.extractedText = documentText;

    // Extract medications from any document type
    try {
      const fileType = isPdf ? 'pdf' : 'image';
      const medications = await extractMedicationsFromDocument(fileUri, fileType);
      (classification as any).extractedMedications = medications;

      if (medications && medications.length > 0) {
        console.log(`✅ Medications extracted (${medications.length}) from document`);

        // Auto-save medications if requested and userId is provided
        if (autoSaveMedications && userId) {
          console.log('💾 Auto-saving medications to Firestore...');
          const saveResult = await saveMedicationsToFirestore(
            userId,
            medications,
            classification,
            fileURL
          );
          (classification as any).medicationsSaveResult = saveResult;

          if (saveResult.savedCount > 0) {
            console.log(`✅ Auto-saved ${saveResult.savedCount} medications to Firestore`);
          }
          if (saveResult.failedCount > 0) {
            console.warn(`⚠️ Failed to save ${saveResult.failedCount} medications`);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to extract medications:', error);
      (classification as any).extractedMedications = [];
    }

    return classification;
  } catch (error) {
    console.error('Error classifying document:', error);
    // Return fallback classification
    return {
      category: 'other' as DocumentCategory,
      confidence: 0.5,
      reasoning: 'Failed to classify document automatically',
      extractedText: '',
      extractedMedications: [],
    };
  }
};

/**
 * Extract structured data from pathology report
 */
export const extractLabResults = async (
  extractedText: string
): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Analyze this lab report and extract all test results in structured format.

Lab Report Text:
${extractedText}

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "labName": "Quest Diagnostics",
  "testDate": "2025-11-15",
  "doctorName": "Dr. Smith",
  "patientName": "John Doe",
  "testResults": [
    {
      "testName": "Hemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "normalRange": "13.5-17.5",
      "status": "normal"
    },
    {
      "testName": "White Blood Cell Count",
      "value": "11.2",
      "unit": "K/µL",
      "normalRange": "4.5-11.0",
      "status": "abnormal"
    }
  ]
}

Rules:
- status must be: "normal", "abnormal", or "critical"
- Include ALL tests found in the report
- Use standard medical abbreviations
- Omit fields if not clearly stated
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error extracting lab results:', error);
    return {
      testResults: [],
    };
  }
};

/**
 * Generate AI health interpretation
 */
export const generateInterpretation = async (
  testResults: any[],
  userProfile?: any
): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a medical AI assistant. Analyze these lab test results and provide a comprehensive interpretation.

Test Results:
${JSON.stringify(testResults, null, 2)}

${userProfile ? `Patient Profile:\nAge: ${userProfile.age}\nGender: ${userProfile.gender}\nConditions: ${userProfile.conditions || 'None'}` : ''}

Provide a response in this JSON format (no markdown, no code blocks):
{
  "summary": "Brief 2-3 sentence overview of overall health status",
  "keyFindings": [
    "Finding 1 with specific values",
    "Finding 2 with specific values"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "riskLevel": "low",
  "confidenceScore": 0.9
}

Rules:
- summary must be concise and clear
- keyFindings should highlight abnormal values
- recommendations must be actionable
- riskLevel must be: "low", "moderate", or "high"
- confidenceScore between 0.0 and 1.0
- Use simple, patient-friendly language
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const interpretation = JSON.parse(responseText);
    interpretation.analyzedAt = new Date();

    return interpretation;
  } catch (error) {
    console.error('Error generating interpretation:', error);
    return {
      summary: 'Unable to generate interpretation at this time.',
      keyFindings: [],
      recommendations: [],
      riskLevel: 'low',
      analyzedAt: new Date()
    };
  }
};