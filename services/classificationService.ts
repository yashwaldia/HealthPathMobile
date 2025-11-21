// services/classificationService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClassificationResult, DocumentCategory } from '../types/upload';
import * as FileSystem from 'expo-file-system';

// Initialize Gemini AI (use your existing API key from aiService.ts)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Extract text from image using OCR (via Gemini Vision)
 */
export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
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
 * Classify medical document using AI
 */
export const classifyDocument = async (
  fileUri: string,
  fileName: string
): Promise<ClassificationResult> => {
  try {
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    
    // For images, extract text first
    let documentText = '';
    if (!isPdf) {
      documentText = await extractTextFromImage(fileUri);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    return classification;
  } catch (error) {
    console.error('Error classifying document:', error);
    
    // Return fallback classification
    return {
      category: 'other' as DocumentCategory,
      confidence: 0.5,
      reasoning: 'Failed to classify document automatically',
      extractedText: '',
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      analyzedAt: new Date(),
    };
  }
};