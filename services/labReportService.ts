// services/labReportService.ts

import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { LabReport } from '../types/upload';

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

    const report: LabReport = {
      reportId: newReportRef.id,
      userId,
      uploadDate: new Date(),
      testDate: reportData.testDate || new Date().toISOString().split('T')[0],
      reportType: reportData.reportType || 'pathology',
      labName: reportData.labName || '',
      doctorName: reportData.doctorName,
      files: reportData.files || [],
      aiInterpretation: reportData.aiInterpretation,
      testResults: reportData.testResults || [],
      tags: reportData.tags || [],
      isFavorite: false,
      notes: reportData.notes || '',
      status: reportData.aiInterpretation ? 'analyzed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
    
    await setDoc(reportRef, {
      ...updates,
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
