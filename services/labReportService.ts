// services/labReportService.ts

import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const q = query(reportsRef);

    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const newReportRef = doc(reportsRef);

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

    await setDoc(newReportRef, {
      ...report,
      uploadDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    const reportRef = doc(db, `users/${userId}/lab_reports`, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const q = query(reportsRef, orderBy('uploadDate', 'desc'));
    const querySnapshot = await getDocs(q);

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
    const reportRef = doc(db, `users/${userId}/lab_reports`, reportId);
    // Filter out undefined values from updates
    const cleanedUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof LabReport] !== undefined) {
        cleanedUpdates[key] = updates[key as keyof LabReport];
      }
    });
    await setDoc(reportRef, {
      ...cleanedUpdates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
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
    const reportRef = doc(db, `users/${userId}/lab_reports`, reportId);
    await deleteDoc(reportRef);
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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const q = query(
      reportsRef,
      where('testDate', '>=', startDate),
      where('testDate', '<=', endDate),
      orderBy('testDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
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
 * This function updates a report with AI-generated analysis results
 */
export const saveAIAnalysisToReport = async (
  userId: string,
  reportId: string,
  aiAnalysis: ReportAIAnalysis
): Promise<void> => {
  try {
    console.log('Saving AI analysis to report:', reportId);

    const reportRef = doc(db, `users/${userId}/lab_reports`, reportId);

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
    await setDoc(reportRef, {
      aiInterpretation,
      status: 'analyzed',
      updatedAt: serverTimestamp(),
    }, { merge: true });

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
    const reportRef = doc(db, `users/${userId}/lab_reports`, reportId);
    
    await setDoc(reportRef, {
      aiInterpretation: null,
      status: 'pending',
      updatedAt: serverTimestamp(),
    }, { merge: true });

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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const q = query(
      reportsRef,
      where('status', '==', 'pending'),
      orderBy('uploadDate', 'desc')
    );
    const querySnapshot = await getDocs(q);

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
    const reportsRef = collection(db, `users/${userId}/lab_reports`);
    const q = query(
      reportsRef,
      where('status', '==', 'analyzed'),
      orderBy('uploadDate', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      reportId: doc.id,
    } as LabReport));
  } catch (error) {
    console.error('Error getting analyzed reports:', error);
    throw error;
  }
};
