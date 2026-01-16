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
  fitCalcUsed: number;
  aiSummary: string;
  generatedAt: admin.firestore.FieldValue;
  dataPoints: {
    vitals: number;
    medications: number;
    labs: number;
    symptoms: number;
    fitcalc: number;
  };
  topSymptoms?: string[];
  averageSeverity?: number;
  fitCalcTypes?: string[];
}

/**
 * Generates a weekly health report.
 * If active: Generates AI summary.
 * If inactive: Sends an "Engagement Nudge" notification instead of a report.
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

    // D. Symptoms
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

    // E. FitCalc History
    const fitCalcSnapshot = await db
      .collection(`users/${userId}/fitcalc_history`)
      .where('savedAt', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();
    const fitCalcCount = fitCalcSnapshot.size;

    // Get calculator types used this week
    const calculatorTypesSet = new Set<string>();
    fitCalcSnapshot.docs.forEach((doc) => {
      const calcId = doc.data().calculatorId;
      if (calcId) {
        calculatorTypesSet.add(calcId);
      }
    });
    const fitCalcTypes = Array.from(calculatorTypesSet).slice(0, 3);

    // Calculate Total Activity
    const totalActivity = vitalsCount + labsCount + symptomsCount + fitCalcCount;

    // 2. Smart Check: Is user active? (The "Engagement Nudge" Logic)
    // =============================================================
    if (totalActivity === 0 && activeMedsCount === 0) {
      logger.info(`User ${userId} is inactive. Sending engagement nudge instead of report.`);

      // 🔥 NEW: Create "We Missed You" In-App Notification
      const nudgeRef = db.collection(`users/${userId}/notifications`).doc();
      
      await nudgeRef.set({
        title: '👋 We missed you this week!',
        body: 'No health logs found for last week. Tracking just one vital takes less than 30 seconds. Tap to start!',
        type: 'reminder', // Uses the 'alarm-outline' icon or similar from your frontend
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: { 
          type: 'engagement-nudge',
          action: 'open-add-vitals' // You can handle this in frontend navigation
        },
      });

      // Return null so we don't send the "Weekly Report Ready" Push Notification
      // (The user will see the red dot on the bell icon next time they open the app)
      return null;
    }

    // 3. Generate AI Summary via Google Gemini
    // ==========================================
    let aiSummary = '';

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      // ✅ UPDATED: Using the latest stable Flash model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

        const aiAnalyzedSymptoms = symptomLogs.filter((log) => log.aiAnalysis);
        if (aiAnalyzedSymptoms.length > 0) {
          symptomContext += `
- AI-analyzed symptoms: ${aiAnalyzedSymptoms.length}
- Urgency levels detected: ${[...new Set(aiAnalyzedSymptoms.map((log) => log.aiAnalysis?.urgency))].join(', ')}
`;
        }
      }

      // Build FitCalc context for AI
      let fitCalcContext = '';
      if (fitCalcCount > 0) {
        const calcNames: { [key: string]: string } = {
          bmi: 'BMI', bmr: 'BMR', tdee: 'TDEE', macros: 'Macros',
          'one-rm': '1-Rep Max', 'body-fat': 'Body Fat', 'hr-zones': 'Heart Rate Zones',
          vo2max: 'VO₂max', 'activity-calories': 'Activity Calories',
          'body-ratios': 'Body Ratios', 'ideal-weight': 'Ideal Weight',
          water: 'Water Intake', running: 'Running Pace', protein: 'Protein Intake',
        };

        const calcNamesUsed = fitCalcTypes
          .map((id) => calcNames[id] || id)
          .join(', ');

        fitCalcContext = `
- Fitness calculations performed: ${fitCalcCount}${fitCalcTypes.length > 0 ? ` (${calcNamesUsed})` : ''}
`;
      }

      const prompt = `
You are HealthPath, a friendly and encouraging medical assistant.
Write a concise 3-4 sentence weekly health summary for a user based on their data.

**User Data (Last 7 Days):**
- Vitals logged: ${vitalsCount} times
- Lab reports uploaded: ${labsCount}
- Active medications: ${activeMedsCount}
- Symptom logs: ${symptomsCount}${symptomContext}${fitCalcContext}

**Tone Instructions:**
- Activity LOW (1-2 logs): Be encouraging. Focus on "small steps matter."
- Activity HIGH (>3 logs): Praise consistency. Mention specific numbers.
- Symptoms logged: Acknowledge tracking. If severity > 3, suggest consulting a doctor.
- FitCalc used: Acknowledge fitness tracking efforts.

**Formatting:**
- Conversational paragraph (no bullet points).
- Keep it under 80 words.
- Compassionate, professional, and supportive.
      `;

      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (aiError) {
      logger.error('AI Generation failed, falling back to rule-based summary', aiError);

      if (totalActivity > 5) {
        aiSummary = `Outstanding week! You logged ${vitalsCount} vitals, ${symptomsCount} symptoms${
          fitCalcCount > 0 ? `, and performed ${fitCalcCount} fitness calculations` : ''
        }, and stayed on top of your health. Keep up the great tracking!`;
      } else if (symptomsCount > 0) {
        aiSummary = `You tracked ${symptomsCount} symptoms this week. ${
          averageSeverity > 3
            ? 'Average severity was moderate - monitor closely.'
            : 'Great awareness of your body!'
        }`;
      } else if (fitCalcCount > 0) {
        aiSummary = `Great job tracking fitness! You performed ${fitCalcCount} calculations this week. Keep building those healthy habits! 💪`;
      } else {
        aiSummary =
          'Every step counts. Try logging a few more vitals or symptoms next week to build your health history! 🌱';
      }
    }

    // 4. Save Report to Firestore
    // ==========================================
    const reportRef = db.collection(`users/${userId}/weeklyReports`).doc();
    const reportData: WeeklySummary = {
      weekStartDate: sevenDaysAgo.toISOString(),
      weekEndDate: now.toISOString(),
      medicationAdherence: 80,
      vitalsLogged: vitalsCount,
      labsUploaded: labsCount,
      symptomsLogged: symptomsCount,
      fitCalcUsed: fitCalcCount,
      aiSummary: aiSummary,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      dataPoints: {
        vitals: vitalsCount,
        medications: activeMedsCount,
        labs: labsCount,
        symptoms: symptomsCount,
        fitcalc: fitCalcCount,
      },
      topSymptoms: topSymptoms.length > 0 ? topSymptoms : undefined,
      averageSeverity: symptomsCount > 0 ? averageSeverity : undefined,
      fitCalcTypes: fitCalcTypes.length > 0 ? fitCalcTypes : undefined,
    };

    await reportRef.set(reportData);
    logger.info(`Generated weekly report for ${userId}: ${reportRef.id}`);

    // 5. Create In-App Notification (Report Ready)
    // ==========================================
    const notificationRef = db.collection(`users/${userId}/notifications`).doc();
    
    let notificationBody = 'Tap to view your AI health summary for this week.';
    if (symptomsCount > 0 && fitCalcCount > 0) {
      notificationBody = `Your AI summary includes ${symptomsCount} symptom${symptomsCount > 1 ? 's' : ''} and ${fitCalcCount} fitness calc${fitCalcCount > 1 ? 's' : ''}.`;
    } else if (symptomsCount > 0) {
      notificationBody = `Your AI summary includes ${symptomsCount} symptom${symptomsCount > 1 ? 's' : ''} tracked this week.`;
    }

    await notificationRef.set({
      title: '📊 Weekly Health Report Ready',
      body: notificationBody,
      type: 'ai-insight',
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: { reportId: reportRef.id, type: 'weekly-report' },
    });

    return reportRef.id;
  } catch (error) {
    logger.error(`Error generating weekly report for ${userId}`, error);
    return null;
  }
};