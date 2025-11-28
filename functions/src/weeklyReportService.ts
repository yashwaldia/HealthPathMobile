import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

// ✅ Securely define the secret
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Interface for Weekly Summary
interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  medicationAdherence: number;
  vitalsLogged: number;
  labsUploaded: number;
  symptomsLogged: number;
  aiSummary: string;
  generatedAt: admin.firestore.FieldValue;
  dataPoints: {
    vitals: number;
    medications: number;
    labs: number;
    symptoms: number;
  };
  topSymptoms?: string[];
  averageSeverity?: number;
}

/**
 * Generates a weekly health report ONLY if the user has been active.
 */
export const generateWeeklyReport = async (userId: string): Promise<string | null> => {
  // Initialize db inside function to avoid 'no-app' error
  const db = admin.firestore();

  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 1. Fetch REAL Data from Subcollections
    // ==========================================

    // A. Vitals
    const vitalsSnapshot = await db
      .collection(`users/${userId}/vitals`)
      .where('recordedAt', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .count()
      .get();
    const vitalsCount = vitalsSnapshot.data().count;

    // B. Lab Reports
    const labsSnapshot = await db
      .collection(`users/${userId}/labreports`)
      .where('uploadDate', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .count()
      .get();
    const labsCount = labsSnapshot.data().count;

    // C. Active Medications
    const medsSnapshot = await db
      .collection(`users/${userId}/medications`)
      .where('isActive', '==', true)
      .get();
    const activeMedsCount = medsSnapshot.size;

    // D. Symptoms (NEW!)
    const symptomsSnapshot = await db
      .collection(`users/${userId}/symptoms`)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();
    const symptomsCount = symptomsSnapshot.size;

    // Extract symptom details for AI analysis
    const symptomLogs = symptomsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        categoryName: data.categoryName || 'Unknown',
        symptoms: data.symptoms || [],
        severity: data.severity || 0,
        duration: `${data.durationValue || 0} ${data.duration || 'days'}`,
        notes: data.notes || '',
        aiAnalysis: data.aiAnalysis || null,
      };
    });

    // Calculate symptom statistics
    const symptomNames: string[] = [];
    let totalSeverity = 0;
    symptomLogs.forEach((log) => {
      symptomNames.push(...log.symptoms);
      totalSeverity += log.severity;
    });

    // Get top 3 most common symptoms
    const symptomFrequency: { [key: string]: number } = {};
    symptomNames.forEach((symptom) => {
      symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
    });
    const topSymptoms = Object.entries(symptomFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([symptom]) => symptom);

    const averageSeverity =
      symptomsCount > 0 ? Math.round((totalSeverity / symptomsCount) * 10) / 10 : 0;

    const totalActivity = vitalsCount + labsCount + symptomsCount;

    // 2. Smart Check: Is user active?
    // ==========================================
    if (totalActivity === 0 && activeMedsCount === 0) {
      logger.info(`Skipping weekly report for ${userId}: No activity.`);
      return null;
    }

    // 3. Generate AI Summary via Google Gemini
    // ==========================================
    let aiSummary = '';

    try {
      // ✅ Access the secret value at runtime
      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Build symptom context for AI
      let symptomContext = '';
      if (symptomsCount > 0) {
        symptomContext = `
        
**Symptoms Tracked:**
- Total symptom logs: ${symptomsCount}
- Most common symptoms: ${topSymptoms.join(', ') || 'None'}
- Average severity: ${averageSeverity}/5
- Categories affected: ${[...new Set(symptomLogs.map((l) => l.categoryName))].join(', ')}
`;

        // Add AI analysis insights if available
        const aiAnalyzedSymptoms = symptomLogs.filter((log) => log.aiAnalysis);
        if (aiAnalyzedSymptoms.length > 0) {
          symptomContext += `
- AI-analyzed symptoms: ${aiAnalyzedSymptoms.length}
- Urgency levels detected: ${[...new Set(aiAnalyzedSymptoms.map((log) => log.aiAnalysis?.urgency))].join(', ')}
`;
        }
      }

      const prompt = `
You are HealthPath, a friendly and encouraging medical assistant.
Write a concise 3-4 sentence weekly health summary for a user based on their data.

**User Data (Last 7 Days):**
- Vitals logged: ${vitalsCount} times
- Lab reports uploaded: ${labsCount}
- Active medications being tracked: ${activeMedsCount}
- Symptom logs: ${symptomsCount}${symptomContext}

**Tone Instructions:**
- If activity is LOW (0-2 total logs): Be encouraging, hype them up to build habits. Focus on "small steps matter."
- If activity is HIGH (>3 logs): Praise their consistency and detailed tracking. Mention specific numbers to validate their effort.
- If symptoms were logged: Acknowledge symptom tracking and provide empathetic, supportive feedback. If severity is high (>3), suggest consulting a healthcare provider.
- If AI analyzed symptoms: Mention that they're using smart health insights.

**Formatting:**
- Conversational paragraph (no bullet points).
- Keep it under 80 words.
- Compassionate, professional, and supportive.
- If multiple symptoms with high severity, gently recommend medical consultation.
      `;

      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (aiError) {
      logger.error('AI Generation failed, falling back to rule-based summary', aiError);

      // Fallback logic if AI fails
      if (totalActivity > 5) {
        aiSummary = `Outstanding week! You logged ${vitalsCount} vitals, ${symptomsCount} symptoms, and stayed on top of your health. ${
          averageSeverity > 3
            ? 'Some symptoms showed higher severity - consider consulting your doctor if they persist.'
            : 'Keep up the great tracking!'
        }`;
      } else if (symptomsCount > 0) {
        aiSummary = `You tracked ${symptomsCount} symptoms this week${
          topSymptoms.length > 0 ? `, including ${topSymptoms.join(', ')}` : ''
        }. ${
          averageSeverity > 3
            ? 'Average severity was moderate - monitor closely and consult a doctor if needed.'
            : 'Great awareness of your body!'
        }`;
      } else {
        aiSummary =
          'A quiet week for logs, but every step counts. Try logging a few more vitals or symptoms next week to build your health history! 🌱';
      }
    }

    // 4. Save Report to Firestore
    // ==========================================
    const reportRef = db.collection(`users/${userId}/weeklyReports`).doc();
    const reportData: WeeklySummary = {
      weekStartDate: sevenDaysAgo.toISOString(),
      weekEndDate: now.toISOString(),
      medicationAdherence: 80, // Placeholder until adherence tracking is live
      vitalsLogged: vitalsCount,
      labsUploaded: labsCount,
      symptomsLogged: symptomsCount,
      aiSummary: aiSummary,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      dataPoints: {
        vitals: vitalsCount,
        medications: activeMedsCount,
        labs: labsCount,
        symptoms: symptomsCount,
      },
      topSymptoms: topSymptoms.length > 0 ? topSymptoms : undefined,
      averageSeverity: symptomsCount > 0 ? averageSeverity : undefined,
    };

    await reportRef.set(reportData);
    logger.info(`Generated weekly report for ${userId}: ${reportRef.id}`);

    // 5. Create In-App Notification (for History/Bell)
    // ==========================================
    const notificationRef = db.collection(`users/${userId}/notifications`).doc();
    await notificationRef.set({
      title: '📊 Weekly Health Report Ready',
      body:
        symptomsCount > 0
          ? `Your AI health summary is ready! Includes ${symptomsCount} symptom${symptomsCount > 1 ? 's' : ''} tracked this week.`
          : 'Tap to view your AI health summary for this week.',
      type: 'ai-insight',
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: { reportId: reportRef.id, type: 'weekly-report' },
    });

    logger.info(`Weekly report notification sent for ${userId}`);

    return reportRef.id;
  } catch (error) {
    logger.error(`Error generating weekly report for ${userId}`, error);
    return null;
  }
};
