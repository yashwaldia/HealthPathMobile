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

/**
 * Helper functions for urgency display
 */

/**
 * Get user-friendly label for urgency level
 */
export function getUrgencyLabel(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'routine':
      return 'Normal';
    case 'follow-up-needed':
      return 'Needs Review';
    case 'urgent':
      return 'Urgent';
    case 'emergency':
      return 'Emergency';
    default:
      return 'Unknown';
  }
}

/**
 * Get color code for urgency level
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'routine':
      return '#10B981'; // Green
    case 'follow-up-needed':
      return '#F97316'; // Orange
    case 'urgent':
      return '#EF4444'; // Red
    case 'emergency':
      return '#DC2626'; // Dark Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get icon name for urgency level (Ionicons)
 */
export function getUrgencyIcon(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'routine':
      return 'checkmark-circle';
    case 'follow-up-needed':
      return 'alert-circle';
    case 'urgent':
      return 'warning';
    case 'emergency':
      return 'medical';
    default:
      return 'information-circle';
  }
}
