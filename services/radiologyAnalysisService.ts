// services/radiologyAnalysisService.ts
import firestore from '@react-native-firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { 
  RadiologyAnalysis, 
  RadiologyAIResponse, 
  ExamType, 
  UrgencyLevel 
} from '../types/radiology';

// Initialize Gemini AI
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY || 
  process.env.EXPO_PUBLIC_HEALTHPATH_GEMINI_REPORT_ANALYZE_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Convert file URI to base64
 */
async function fileToBase64(uri: string): Promise<string> {
  try {
    console.log('📂 Reading radiology file from:', uri);
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
    case 'dcm':
      return 'application/dicom';
    default:
      return 'image/jpeg';
  }
}

/**
 * Analyze radiology scan using Gemini AI
 */
export async function analyzeRadiologyScan(
  uri: string,
  type: 'image' | 'pdf'
): Promise<RadiologyAIResponse> {
  try {
    console.log('🔍 Starting radiology scan analysis...');
    console.log('📄 File URI:', uri);
    console.log('📋 File type:', type);

    // Convert file to base64
    const base64Data = await fileToBase64(uri);
    const mimeType = getMimeType(uri, type);
    console.log('🎯 MIME type:', mimeType);

    // Use Gemini 2.0 Flash for analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a radiology AI assistant specializing in medical imaging analysis for EDUCATIONAL purposes.

Analyze this radiology scan and provide structured insights.

**YOUR TASK:**
1. Identify the type of scan (X-Ray, CT Scan, MRI, Ultrasound, PET Scan, Mammography, DEXA Scan, Fluoroscopy, Other)
2. Identify the body part being scanned
3. Describe what is visible in patient-friendly language
4. Note any visible abnormalities or areas of concern
5. Provide educational explanations
6. Suggest follow-up actions if needed

**IMPORTANT DISCLAIMERS:**
- This is for EDUCATIONAL purposes only
- NOT a medical diagnosis
- Always consult a licensed radiologist/doctor
- AI analysis should not replace professional interpretation

**RESPONSE FORMAT (JSON ONLY):**
{
  "examType": "X-Ray|CT Scan|MRI|Ultrasound|PET Scan|Mammography|DEXA Scan|Fluoroscopy|Other",
  "bodyPart": "Chest|Abdomen|Brain|Spine|Pelvis|Extremities|etc",
  "summary": "2-3 sentence overview of what is visible in simple terms",
  "keyFindings": [
    "Finding 1 with patient-friendly explanation",
    "Finding 2 with explanation",
    "Finding 3 (if applicable)"
  ],
  "abnormalities": [
    "Any visible concerns (empty array if none detected)"
  ],
  "recommendations": [
    "Educational recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ],
  "followUpActions": [
    "Consult your radiologist about the findings",
    "Bring this scan to your next appointment",
    "Monitor symptoms and follow up if worsening"
  ],
  "urgencyLevel": "routine|follow-up-needed|urgent|emergency",
  "confidence": 0.85,
  "disclaimer": "This AI analysis is for educational purposes only. Always consult with a licensed healthcare professional for medical interpretation."
}

**ANALYSIS GUIDELINES:**
- Use simple, patient-friendly language
- Explain medical terms in parentheses
- Focus on visible structures and patterns
- Note image quality if poor (e.g., "Image quality is limited")
- Be conservative with urgency levels:
  - "routine": No significant concerns visible
  - "follow-up-needed": Minor findings that warrant discussion with doctor
  - "urgent": Findings that require prompt medical attention
  - "emergency": Critical findings requiring immediate medical attention
- Always include the disclaimer
- If scan type is unclear, use "Other" and explain in summary
- Confidence score should reflect clarity of the image and certainty of analysis

**IMPORTANT:**
Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    console.log('🤖 Calling Gemini AI for radiology analysis...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('📝 AI Response:', text);

    // Clean up the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json/gi, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    console.log('🧹 Cleaned response:', cleanedText);

    // Parse JSON response
    const aiResponse: RadiologyAIResponse = JSON.parse(cleanedText);

    // Validate required fields
    if (!aiResponse.examType || !aiResponse.summary || !aiResponse.keyFindings) {
      throw new Error('Invalid AI response format');
    }

    console.log('✅ Radiology analysis complete:', aiResponse);
    return aiResponse;

  } catch (error: any) {
    console.error('❌ Error analyzing radiology scan:', error);
    console.error('Error details:', error?.message, error?.stack);

    if (error instanceof SyntaxError) {
      throw new Error('AI response format error. The image may not be a clear radiology scan.');
    }

    if (error?.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.');
    }

    throw new Error(error?.message || 'Failed to analyze scan. Please try again.');
  }
}

/**
 * Check for duplicate radiology analysis by filename
 */
export async function checkDuplicateRadiologyAnalysis(
  userId: string,
  fileName: string
): Promise<boolean> {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .get();

    for (const docSnap of querySnapshot.docs) {
      const analysis = docSnap.data() as RadiologyAnalysis;
      if (analysis.fileName === fileName) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    throw error;
  }
}

/**
 * Save radiology analysis to Firestore
 */
export async function saveRadiologyAnalysis(
  userId: string,
  analysisData: Omit<RadiologyAnalysis, 'analysisId' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const newAnalysisRef = firestore().collection(`users/${userId}/radiologyAnalyses`).doc();

    const analysis: any = {
      analysisId: newAnalysisRef.id,
      userId,
      ...analysisData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await newAnalysisRef.set(analysis);

    console.log('✅ Radiology analysis saved:', newAnalysisRef.id);
    return newAnalysisRef.id;
  } catch (error) {
    console.error('Error saving radiology analysis:', error);
    throw error;
  }
}

/**
 * Get radiology analysis by ID
 */
export async function getRadiologyAnalysis(
  userId: string,
  analysisId: string
): Promise<RadiologyAnalysis | null> {
  try {
    const analysisDoc = await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .doc(analysisId)
      .get();

    if (!analysisDoc.exists) {
      return null;
    }

    return {
      ...analysisDoc.data(),
      analysisId: analysisDoc.id,
    } as RadiologyAnalysis;
  } catch (error) {
    console.error('Error getting radiology analysis:', error);
    throw error;
  }
}

/**
 * Get all radiology analyses for user
 */
export async function getAllRadiologyAnalyses(
  userId: string,
  limitCount?: number
): Promise<RadiologyAnalysis[]> {
  try {
    let queryRef = firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .orderBy('uploadDate', 'desc');
    
    if (limitCount) {
      queryRef = queryRef.limit(limitCount);
    }

    const querySnapshot = await queryRef.get();
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      analysisId: doc.id,
    } as RadiologyAnalysis));
  } catch (error) {
    console.error('Error getting radiology analyses:', error);
    throw error;
  }
}

/**
 * Delete radiology analysis
 */
export async function deleteRadiologyAnalysis(
  userId: string,
  analysisId: string
): Promise<void> {
  try {
    await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .doc(analysisId)
      .delete();
    console.log('✅ Radiology analysis deleted:', analysisId);
  } catch (error) {
    console.error('Error deleting radiology analysis:', error);
    throw error;
  }
}

/**
 * Get analyses by urgency level
 */
export async function getAnalysesByUrgency(
  userId: string,
  urgencyLevel: UrgencyLevel
): Promise<RadiologyAnalysis[]> {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .where('urgencyLevel', '==', urgencyLevel)
      .orderBy('uploadDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      analysisId: doc.id,
    } as RadiologyAnalysis));
  } catch (error) {
    console.error('Error getting analyses by urgency:', error);
    throw error;
  }
}

/**
 * Get analyses by exam type
 */
export async function getAnalysesByExamType(
  userId: string,
  examType: ExamType
): Promise<RadiologyAnalysis[]> {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .where('examType', '==', examType)
      .orderBy('uploadDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      analysisId: doc.id,
    } as RadiologyAnalysis));
  } catch (error) {
    console.error('Error getting analyses by exam type:', error);
    throw error;
  }
}

/**
 * Update analysis notes
 */
export async function updateAnalysisNotes(
  userId: string,
  analysisId: string,
  notes: string
): Promise<void> {
  try {
    await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .doc(analysisId)
      .update({
        notes,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    console.log('✅ Analysis notes updated');
  } catch (error) {
    console.error('Error updating notes:', error);
    throw error;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  userId: string,
  analysisId: string,
  isFavorite: boolean
): Promise<void> {
  try {
    await firestore()
      .collection(`users/${userId}/radiologyAnalyses`)
      .doc(analysisId)
      .update({
        isFavorite,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    console.log('✅ Favorite status toggled');
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}
