import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { db } from '../config/firebaseConfig';
import { SymptomLog, SymptomFormData } from '../types/symptom';

// Initialize Gemini AI
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_REPORT_ANALYZE_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// AI Analysis Response Interface
export interface SymptomAIAnalysis {
  summary: string;
  possibleConditions: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  disclaimer: string;
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

**URGENCY LEVELS:**
- "low": Common, non-serious symptoms (mild headache, minor fatigue)
- "medium": Moderate symptoms that should be monitored (persistent pain, fever)
- "high": Concerning symptoms requiring medical attention soon (severe pain, difficulty breathing)
- "emergency": Critical symptoms requiring immediate medical care (chest pain, severe bleeding, sudden weakness)

**IMPORTANT GUIDELINES:**
1. Be helpful, accurate, and non-alarming
2. Provide 3-4 possible conditions (most likely first)
3. Give 4 actionable recommendations
4. Be specific but balanced - don't cause unnecessary panic
5. If severity is 4-5 or symptoms suggest emergency, set urgency to "high" or "emergency"
6. Always emphasize consulting a doctor for proper diagnosis
7. Return ONLY valid JSON, no markdown, no extra text`;

    console.log('🤖 Calling Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('📝 AI Response received:', text.substring(0, 200) + '...');

    // Clean up the response - FIXED REGEX
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    console.log('🧹 Cleaned response length:', cleanedText.length);

    // Parse JSON response
    const analysis: SymptomAIAnalysis = JSON.parse(cleanedText);

    // Validate response structure
    if (!analysis.summary || !analysis.possibleConditions || !analysis.recommendations || !analysis.urgency) {
      throw new Error('Invalid AI response structure');
    }

    // Add timestamp
    analysis.analyzedAt = new Date().toISOString();

    console.log('✅ Symptom analysis complete:', {
      urgency: analysis.urgency,
      conditionsCount: analysis.possibleConditions.length,
      recommendationsCount: analysis.recommendations.length
    });

    return analysis;

  } catch (error: any) {
    console.error('❌ Error analyzing symptoms with AI:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error('AI response format error. Please try again.');
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(error?.message || 'Failed to analyze symptoms. Please try again.');
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
  try {
    const symptomsRef = collection(db, `users/${userId}/symptoms`);
    
    const symptomData = {
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
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
      // AI Analysis
      aiAnalysis: {
        summary: aiAnalysis.summary,
        possibleConditions: aiAnalysis.possibleConditions,
        recommendations: aiAnalysis.recommendations,
        urgency: aiAnalysis.urgency,
        analyzedAt: aiAnalysis.analyzedAt
      }
    };

    const docRef = await addDoc(symptomsRef, symptomData);
    
    // Update with symptomId
    await updateDoc(docRef, { symptomId: docRef.id });
    
    console.log('✅ Symptom log saved with AI analysis:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding symptom log with analysis:', error);
    throw error;
  }
};

/**
 * Add a new symptom log entry (without AI analysis - legacy support)
 */
export const addSymptomLog = async (
  userId: string, 
  formData: SymptomFormData
): Promise<string> => {
  try {
    const symptomsRef = collection(db, `users/${userId}/symptoms`);
    
    const symptomData = {
      timestamp: serverTimestamp(),
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
      tags: []
    };

    const docRef = await addDoc(symptomsRef, symptomData);
    await updateDoc(docRef, { symptomId: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding symptom log:', error);
    throw error;
  }
};

/**
 * Get all symptom logs for a user
 */
export const getAllSymptomLogs = async (userId: string): Promise<SymptomLog[]> => {
  try {
    const symptomsRef = collection(db, `users/${userId}/symptoms`);
    const q = query(symptomsRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      symptomId: doc.id,
      timestamp: doc.data().timestamp || Timestamp.now()
    } as SymptomLog));
  } catch (error) {
    console.error('Error fetching symptom logs:', error);
    throw error;
  }
};

/**
 * Get recent symptom logs (last N entries)
 */
export const getRecentSymptomLogs = async (
  userId: string, 
  limitCount: number = 30
): Promise<SymptomLog[]> => {
  try {
    const symptomsRef = collection(db, `users/${userId}/symptoms`);
    const q = query(
      symptomsRef, 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      symptomId: doc.id,
      timestamp: doc.data().timestamp || Timestamp.now()
    } as SymptomLog));
  } catch (error) {
    console.error('Error fetching recent symptom logs:', error);
    throw error;
  }
};

/**
 * Get symptom logs for a specific date
 */
export const getSymptomLogsByDate = async (
  userId: string, 
  date: string // YYYY-MM-DD
): Promise<SymptomLog[]> => {
  try {
    const symptomsRef = collection(db, `users/${userId}/symptoms`);
    const q = query(
      symptomsRef, 
      where('date', '==', date),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      symptomId: doc.id,
      timestamp: doc.data().timestamp || Timestamp.now()
    } as SymptomLog));
  } catch (error) {
    console.error('Error fetching symptom logs by date:', error);
    throw error;
  }
};

/**
 * Update a symptom log entry
 */
export const updateSymptomLog = async (
  userId: string,
  symptomId: string,
  updates: Partial<SymptomLog>
): Promise<void> => {
  try {
    const symptomRef = doc(db, `users/${userId}/symptoms/${symptomId}`);
    await updateDoc(symptomRef, updates);
  } catch (error) {
    console.error('Error updating symptom log:', error);
    throw error;
  }
};

/**
 * Delete a symptom log entry
 */
export const deleteSymptomLog = async (
  userId: string,
  symptomId: string
): Promise<void> => {
  try {
    const symptomRef = doc(db, `users/${userId}/symptoms/${symptomId}`);
    await deleteDoc(symptomRef);
  } catch (error) {
    console.error('Error deleting symptom log:', error);
    throw error;
  }
};

/**
 * Toggle favorite status
 */
export const toggleSymptomFavorite = async (
  userId: string,
  symptomId: string,
  isFavorite: boolean
): Promise<void> => {
  try {
    await updateSymptomLog(userId, symptomId, { isFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

/**
 * Get symptom statistics (for analytics)
 */
export const getSymptomStats = async (userId: string) => {
  try {
    const logs = await getAllSymptomLogs(userId);
    
    // Count by category
    const categoryCount: Record<string, number> = {};
    logs.forEach(log => {
      categoryCount[log.categoryName] = (categoryCount[log.categoryName] || 0) + 1;
    });
    
    // Most common symptoms
    const symptomCount: Record<string, number> = {};
    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });
    
    return {
      totalLogs: logs.length,
      categoryCount,
      symptomCount,
      averageSeverity: logs.reduce((sum, log) => sum + log.severity, 0) / logs.length || 0
    };
  } catch (error) {
    console.error('Error calculating symptom stats:', error);
    throw error;
  }
};