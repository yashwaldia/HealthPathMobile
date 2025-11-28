// types/radiology.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Exam types supported by radiology analyzer
 */
export type ExamType = 
  | 'X-Ray' 
  | 'CT Scan' 
  | 'MRI' 
  | 'Ultrasound' 
  | 'PET Scan' 
  | 'Mammography'
  | 'DEXA Scan'
  | 'Fluoroscopy'
  | 'Other';

/**
 * Urgency levels for follow-up
 */
export type UrgencyLevel = 'routine' | 'follow-up-needed' | 'urgent' | 'emergency';

/**
 * Analysis status
 */
export type AnalysisStatus = 'pending' | 'analyzing' | 'analyzed' | 'error';

/**
 * Main radiology analysis document
 */
export interface RadiologyAnalysis {
  analysisId: string;
  userId: string;
  
  // File Information
  fileName: string;
  fileURL: string;
  fileType: 'image' | 'pdf';
  fileSize: number;
  mimeType: string;
  uploadDate: Timestamp | Date;
  
  // Scan Details
  examType: ExamType;
  bodyPart?: string;
  scanDate: string; // YYYY-MM-DD
  radiologist?: string;
  facility?: string;
  
  // AI Analysis Results
  summary: string;
  keyFindings: string[];
  abnormalities?: string[];
  recommendations: string[];
  followUpActions: string[];
  urgencyLevel: UrgencyLevel;
  
  // Metadata
  aiModel: string;
  confidence: number; // 0.0 - 1.0
  analyzedAt: Timestamp | Date;
  status: AnalysisStatus;
  
  // Optional Fields
  comparisonToPrevious?: string;
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
  
  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Radiology analysis for display (with formatted dates)
 */
export interface RadiologyAnalysisDisplay extends Omit<RadiologyAnalysis, 'uploadDate' | 'analyzedAt' | 'createdAt' | 'updatedAt'> {
  uploadDate: Date;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI response from Gemini
 */
export interface RadiologyAIResponse {
  examType: ExamType;
  bodyPart: string;
  summary: string;
  keyFindings: string[];
  abnormalities?: string[];
  recommendations: string[];
  followUpActions: string[];
  urgencyLevel: UrgencyLevel;
  confidence: number;
  disclaimer: string;
}

/**
 * Upload progress state
 */
export interface RadiologyUploadProgress {
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
  error?: string;
}
