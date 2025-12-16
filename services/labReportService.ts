// services/labReportService.ts
import firestore from '@react-native-firebase/firestore';
import { LabReport, UploadedFile } from '../types/upload';
import { ReportAIAnalysis } from './reportAnalysisAIService';

/**
 * Check for report with duplicate file name
 */
export const checkDuplicateReport = async (
  userId: string,
  fileName: string
): Promise<boolean> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .get();

    const docs = querySnapshot.docs;
    for (const docSnap of docs) {
      const report = docSnap.data() as LabReport;
      if (report.files && Array.isArray(report.files)) {
        for (const file of report.files as UploadedFile[]) {
          if (file.fileName === fileName) return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking duplicate report:', error);
    throw error;
  }
};

/**
 * Save lab report to Firestore
 */
export const saveLabReport = async (
  userId: string,
  reportData: Partial<LabReport>
): Promise<string> => {
  try {
    const newReportRef = firestore().collection(`users/${userId}/lab_reports`).doc();

    // Build report object without undefined fields
    const report: any = {
      reportId: newReportRef.id,
      userId,
      uploadDate: new Date(),
      testDate: reportData.testDate || new Date().toISOString().split('T')[0],
      reportType: reportData.reportType || 'pathology',
      labName: reportData.labName || '',
      files: reportData.files || [],
      testResults: reportData.testResults || [],
      tags: reportData.tags || [],
      isFavorite: false,
      notes: reportData.notes || '',
      status: reportData.aiInterpretation ? 'analyzed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add optional fields if they are defined
    if (reportData.doctorName !== undefined) {
      report.doctorName = reportData.doctorName;
    }
    if (reportData.aiInterpretation !== undefined) {
      report.aiInterpretation = reportData.aiInterpretation;
    }

    await newReportRef.set({
      ...report,
      uploadDate: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return newReportRef.id;
  } catch (error) {
    console.error('Error saving lab report:', error);
    throw error;
  }
};

/**
 * Get lab report by ID
 */
export const getLabReport = async (
  userId: string,
  reportId: string
): Promise<LabReport | null> => {
  try {
    const reportDoc = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .doc(reportId)
      .get();

    if (!reportDoc.exists) {
      return null;
    }

    return {
      ...reportDoc.data(),
      reportId: reportDoc.id,
    } as LabReport;
  } catch (error) {
    console.error('Error getting lab report:', error);
    throw error;
  }
};

/**
 * Get all lab reports for user
 */
export const getAllLabReports = async (userId: string): Promise<LabReport[]> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .orderBy('uploadDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      reportId: doc.id,
    } as LabReport));
  } catch (error) {
    console.error('Error getting lab reports:', error);
    throw error;
  }
};

/**
 * Update lab report
 */
export const updateLabReport = async (
  userId: string,
  reportId: string,
  updates: Partial<LabReport>
): Promise<void> => {
  try {
    const reportRef = firestore().collection(`users/${userId}/lab_reports`).doc(reportId);
    
    // Filter out undefined values from updates
    const cleanedUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof LabReport] !== undefined) {
        cleanedUpdates[key] = updates[key as keyof LabReport];
      }
    });

    await reportRef.update({
      ...cleanedUpdates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating lab report:', error);
    throw error;
  }
};

/**
 * Delete lab report
 */
export const deleteLabReport = async (
  userId: string,
  reportId: string
): Promise<void> => {
  try {
    await firestore()
      .collection(`users/${userId}/lab_reports`)
      .doc(reportId)
      .delete();
  } catch (error) {
    console.error('Error deleting lab report:', error);
    throw error;
  }
};

/**
 * Search lab reports
 */
export const searchLabReports = async (
  userId: string,
  searchTerm: string
): Promise<LabReport[]> => {
  try {
    const allReports = await getAllLabReports(userId);
    // Client-side search (Firestore doesn't support full-text search natively)
    return allReports.filter(report => 
      report.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.testResults.some(test => 
        test.testName.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      report.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error searching lab reports:', error);
    throw error;
  }
};

/**
 * Get reports by date range
 */
export const getReportsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<LabReport[]> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .where('testDate', '>=', startDate)
      .where('testDate', '<=', endDate)
      .orderBy('testDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      reportId: doc.id,
    } as LabReport));
  } catch (error) {
    console.error('Error getting reports by date range:', error);
    throw error;
  }
};

/**
 * Save AI analysis to existing lab report
 */
export const saveAIAnalysisToReport = async (
  userId: string,
  reportId: string,
  aiAnalysis: ReportAIAnalysis
): Promise<void> => {
  try {
    console.log('Saving AI analysis to report:', reportId);

    const reportRef = firestore().collection(`users/${userId}/lab_reports`).doc(reportId);

    // Convert ReportAIAnalysis to aiInterpretation format
    const aiInterpretation = {
      summary: aiAnalysis.summary,
      keyFindings: aiAnalysis.keyFindings,
      recommendations: aiAnalysis.recommendations,
      riskLevel: aiAnalysis.riskLevel,
      abnormalTests: aiAnalysis.abnormalTests,
      analyzedAt: aiAnalysis.analyzedAt.toISOString(),
      confidence: aiAnalysis.confidence,
    };

    // Update report with AI analysis and set status to 'analyzed'
    await reportRef.update({
      aiInterpretation,
      status: 'analyzed',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log('AI analysis saved successfully');
  } catch (error) {
    console.error('Error saving AI analysis:', error);
    throw error;
  }
};

/**
 * Remove AI analysis from report (for re-analysis)
 */
export const removeAIAnalysisFromReport = async (
  userId: string,
  reportId: string
): Promise<void> => {
  try {
    const reportRef = firestore().collection(`users/${userId}/lab_reports`).doc(reportId);
    
    await reportRef.update({
      aiInterpretation: null,
      status: 'pending',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log('AI analysis removed successfully');
  } catch (error) {
    console.error('Error removing AI analysis:', error);
    throw error;
  }
};

/**
 * Get reports that need AI analysis (status: pending)
 */
export const getPendingAnalysisReports = async (userId: string): Promise<LabReport[]> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .where('status', '==', 'pending')
      .orderBy('uploadDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      reportId: doc.id,
    } as LabReport));
  } catch (error) {
    console.error('Error getting pending reports:', error);
    throw error;
  }
};

/**
 * Get reports that have been analyzed
 */
export const getAnalyzedReports = async (userId: string): Promise<LabReport[]> => {
  try {
    const querySnapshot = await firestore()
      .collection(`users/${userId}/lab_reports`)
      .where('status', '==', 'analyzed')
      .orderBy('uploadDate', 'desc')
      .get();

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      reportId: doc.id,
    } as LabReport));
  } catch (error) {
    console.error('Error getting analyzed reports:', error);
    throw error;
  }
};
