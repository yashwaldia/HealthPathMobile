// services/symptomService.ts
import firestore from '@react-native-firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { SymptomLog, SymptomFormData } from '../types/symptom';

// Initialize Gemini AI
const API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;

const genAI = new GoogleGenerativeAI(API_KEY as string);

// AI Analysis Response Interface
export interface SymptomAIAnalysis {
  summary: string;
  possibleConditions: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  disclaimer?: string;
  analyzedAt: string;
}

/**
 * Analyze symptoms using Gemini AI
 */
export const analyzeSymptomWithAI = async (
  formData: SymptomFormData
): Promise<SymptomAIAnalysis> => {
  try {
    console.log('🤖 Starting symptom AI analysis...');
    console.log('📋 Analyzing symptoms:', formData.symptoms);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medical symptom analysis AI assistant. Analyze the following symptoms and provide helpful, educational information.

**PATIENT REPORTED SYMPTOMS:**
Body Part/Category: ${formData.categoryName}
Symptoms: ${formData.symptoms.join(', ')}
Severity: ${formData.severity}/5 (1=Very Mild, 5=Very Severe)
Duration: ${formData.durationValue} ${formData.duration}
${formData.triggers ? `Triggers: ${formData.triggers}` : ''}
${formData.notes ? `Additional Notes: ${formData.notes}` : ''}

**YOUR TASK:**
Provide a preliminary analysis in the following JSON format ONLY:

{
  "summary": "A brief, non-alarming summary of what these symptoms might indicate (2-3 sentences, max 150 words)",
  "possibleConditions": [
    "Most likely condition 1",
    "Possible condition 2",
    "Alternative condition 3"
  ],
  "recommendations": [
    "Specific action or remedy 1",
    "Lifestyle tip or home care 2",
    "When to seek medical attention 3",
    "Additional helpful advice 4"
  ],
  "urgency": "low | medium | high | emergency",
  "disclaimer": "This is an AI-generated educational analysis and not medical advice. Please consult a healthcare professional for accurate diagnosis and treatment."
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // ✅ FIXED REGEX (this was the crash)
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json/gi, '');
    cleanedText = cleanedText.replace(/```/g, '');
    cleanedText = cleanedText.trim();

    const analysis: SymptomAIAnalysis = JSON.parse(cleanedText);

    if (
      !analysis.summary ||
      !analysis.possibleConditions ||
      !analysis.recommendations ||
      !analysis.urgency
    ) {
      throw new Error('Invalid AI response structure');
    }

    analysis.analyzedAt = new Date().toISOString();
    return analysis;
  } catch (error: any) {
    console.error('❌ Error analyzing symptoms with AI:', error);

    if (error instanceof SyntaxError) {
      throw new Error('AI response format error. Please try again.');
    }

    throw new Error(error?.message || 'Failed to analyze symptoms.');
  }
};

/**
 * Add a new symptom log entry WITH AI analysis
 */
export const addSymptomLogWithAnalysis = async (
  userId: string,
  formData: SymptomFormData,
  aiAnalysis: SymptomAIAnalysis
): Promise<string> => {
  const symptomsRef = firestore().collection(`users/${userId}/symptoms`);

  const symptomData = {
    timestamp: firestore.FieldValue.serverTimestamp(),
    date: new Date().toISOString().split('T')[0],
    category: formData.category,
    categoryName: formData.categoryName,
    symptoms: formData.symptoms,
    severity: formData.severity,
    duration: formData.duration,
    durationValue: formData.durationValue,
    triggers: formData.triggers || '',
    notes: formData.notes || '',
    activities: '',
    relatedMedications: [],
    images: [],
    isFavorite: false,
    tags: [],
    aiAnalysis: {
      summary: aiAnalysis.summary,
      possibleConditions: aiAnalysis.possibleConditions,
      recommendations: aiAnalysis.recommendations,
      urgency: aiAnalysis.urgency,
      analyzedAt: aiAnalysis.analyzedAt,
    },
  };

  const docRef = await symptomsRef.add(symptomData);
  await docRef.update({ symptomId: docRef.id });
  return docRef.id;
};

/**
 * Add a new symptom log entry (without AI)
 */
export const addSymptomLog = async (
  userId: string,
  formData: SymptomFormData
): Promise<string> => {
  const symptomsRef = firestore().collection(`users/${userId}/symptoms`);

  const symptomData = {
    timestamp: firestore.FieldValue.serverTimestamp(),
    date: new Date().toISOString().split('T')[0],
    category: formData.category,
    categoryName: formData.categoryName,
    symptoms: formData.symptoms,
    severity: formData.severity,
    duration: formData.duration,
    durationValue: formData.durationValue,
    triggers: formData.triggers || '',
    notes: formData.notes || '',
    activities: '',
    relatedMedications: [],
    images: [],
    isFavorite: false,
    tags: [],
  };

  const docRef = await symptomsRef.add(symptomData);
  await docRef.update({ symptomId: docRef.id });
  return docRef.id;
};

/**
 * Get all symptom logs
 */
export const getAllSymptomLogs = async (userId: string): Promise<SymptomLog[]> => {
  const snapshot = await firestore()
    .collection(`users/${userId}/symptoms`)
    .orderBy('timestamp', 'desc')
    .get();

  return snapshot.docs.map(
    doc =>
      ({
        ...doc.data(),
        symptomId: doc.id,
        timestamp: doc.data().timestamp || firestore.Timestamp.now(),
      } as SymptomLog)
  );
};

/**
 * Update symptom log
 */
export const updateSymptomLog = async (
  userId: string,
  symptomId: string,
  updates: Partial<SymptomLog>
): Promise<void> => {
  await firestore()
    .collection(`users/${userId}/symptoms`)
    .doc(symptomId)
    .update(updates);
};

/**
 * Delete symptom log
 */
export const deleteSymptomLog = async (
  userId: string,
  symptomId: string
): Promise<void> => {
  await firestore()
    .collection(`users/${userId}/symptoms`)
    .doc(symptomId)
    .delete();
};
