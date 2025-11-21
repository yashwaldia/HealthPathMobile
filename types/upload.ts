// types/upload.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Document categories that AI can classify
 */
export type DocumentCategory =
  | 'pathology_report'      // Lab test results (blood, urine, etc.)
  | 'radiology_scan'        // Medical imaging (X-Ray, CT, MRI)
  | 'medication_prescription' // Prescription documents
  | 'vitals_record'         // BP, glucose, heart rate logs
  | 'vaccination_card'      // Immunization records
  | 'discharge_summary'     // Hospital discharge papers
  | 'other';                // Unclassified documents

/**
 * File information after upload to Firebase Storage
 */
export interface UploadedFile {
  fileName: string;
  fileURL: string;          // Firebase Storage download URL
  fileType: 'pdf' | 'image';
  fileSize: number;         // In bytes
  mimeType: string;         // e.g., 'application/pdf', 'image/jpeg'
  uploadedAt: Timestamp | Date;
}

/**
 * AI Classification result from Gemini
 */
export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;       // 0.0 to 1.0 (e.g., 0.95 = 95% confident)
  detectedTests?: string[]; // For pathology reports
  labName?: string;         // For lab reports
  testDate?: string;        // YYYY-MM-DD format
  doctorName?: string;      // Prescribing doctor
  medications?: string[];   // For prescriptions
  scanType?: string;        // For radiology (e.g., "X-Ray", "CT Scan")
  extractedText?: string;   // OCR extracted text
  reasoning?: string;       // Why AI chose this category
}

/**
 * Status of the upload/analysis process
 */
export type UploadStatus =
  | 'idle'                  // Not started
  | 'selecting'             // User selecting file
  | 'uploading'             // Uploading to Firebase Storage
  | 'analyzing'             // AI analyzing content
  | 'extracting'            // Extracting structured data
  | 'saving'                // Saving to Firestore
  | 'complete'              // All done
  | 'error';                // Something failed

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  status: UploadStatus;
  progress: number;         // 0 to 100
  message: string;          // User-friendly status message
  currentFile?: string;     // Current file being processed
  error?: string;           // Error message if failed
}

/**
 * Test result extracted from lab report
 */
export interface TestResult {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  notes?: string;
}

/**
 * AI-generated interpretation of health data
 */
export interface AIInterpretation {
  summary: string;          // Brief overview (2-3 sentences)
  keyFindings: string[];    // Important findings (bullets)
  recommendations: string[]; // Actionable advice
  riskLevel: 'low' | 'moderate' | 'high';
  analyzedAt: Timestamp | Date;
  confidenceScore?: number; // How confident the AI is
}

/**
 * Lab Report document stored in Firestore
 */
export interface LabReport {
  reportId: string;
  userId: string;
  uploadDate: Timestamp | Date;
  testDate: string;         // YYYY-MM-DD
  reportType: 'pathology' | 'radiology' | 'other';
  labName: string;
  doctorName?: string;
  files: UploadedFile[];    // Can have multiple files per report
  aiInterpretation?: AIInterpretation;
  testResults: TestResult[];
  tags: string[];           // e.g., ['blood test', 'annual checkup']
  isFavorite: boolean;
  notes: string;
  status: 'pending' | 'analyzed' | 'reviewed';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Radiology report stored in Firestore
 */
export interface RadiologyReport {
  reportId: string;
  userId: string;
  uploadDate: Timestamp | Date;
  scanDate: string;         // YYYY-MM-DD
  scanType: string;         // X-Ray, CT, MRI, Ultrasound
  bodyPart: string;         // Chest, Brain, Abdomen, etc.
  radiologistName?: string;
  facilityName?: string;
  files: UploadedFile[];
  aiInterpretation?: AIInterpretation;
  findings: string;         // Radiologist's findings
  impression: string;       // Radiologist's impression
  tags: string[];
  isFavorite: boolean;
  notes: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Medication extracted from prescription
 */
export interface Medication {
  medicationId?: string;
  name: string;
  dosage: string;           // e.g., "500mg"
  frequency: string;        // e.g., "Twice daily"
  duration: string;         // e.g., "7 days"
  instructions?: string;    // Special instructions
  sideEffects?: string[];
  prescribedBy?: string;
  prescribedDate?: string;  // YYYY-MM-DD
}

/**
 * Medication prescription document
 */
export interface PrescriptionDocument {
  prescriptionId: string;
  userId: string;
  uploadDate: Timestamp | Date;
  prescriptionDate: string; // YYYY-MM-DD
  doctorName: string;
  clinicName?: string;
  files: UploadedFile[];
  medications: Medication[];
  diagnosis?: string;
  tags: string[];
  notes: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Upload configuration options
 */
export interface UploadConfig {
  maxFileSize: number;      // Max file size in MB
  allowedTypes: string[];   // MIME types allowed
  enableAIClassification: boolean;
  enableAutoRouting: boolean;
  requireUserConfirmation: boolean; // Confirm before saving
}

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 10,          // 10 MB
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',           // iPhone photos
  ],
  enableAIClassification: true,
  enableAutoRouting: true,
  requireUserConfirmation: true,
};

/**
 * Category metadata for UI display
 */
export interface CategoryMetadata {
  label: string;
  icon: string;             // Ionicon name
  color: string;            // Hex color
  description: string;
  firestoreCollection: string; // Where to save
  routePath: string;        // Where to navigate
}

/**
 * Mapping of categories to metadata
 */
export const CATEGORY_METADATA: Record<DocumentCategory, CategoryMetadata> = {
  pathology_report: {
    label: 'Lab Report',
    icon: 'flask-outline',
    color: '#4CAF50',
    description: 'Blood tests, urine tests, and other pathology results',
    firestoreCollection: 'lab_reports',
    routePath: '/(tabs)/reports',
  },
  radiology_scan: {
    label: 'Radiology Scan',
    icon: 'scan-outline',
    color: '#2196F3',
    description: 'X-Ray, CT, MRI, and other medical imaging',
    firestoreCollection: 'radiology_reports',
    routePath: '/(tabs)/radiology',
  },
  medication_prescription: {
    label: 'Prescription',
    icon: 'medical-outline',
    color: '#FF9800',
    description: 'Medication prescriptions and pharmacy documents',
    firestoreCollection: 'prescriptions',
    routePath: '/(tabs)/medications',
  },
  vitals_record: {
    label: 'Vitals Record',
    icon: 'pulse-outline',
    color: '#E91E63',
    description: 'Blood pressure, glucose, heart rate logs',
    firestoreCollection: 'vitals',
    routePath: '/(tabs)/vitals',
  },
  vaccination_card: {
    label: 'Vaccination',
    icon: 'bandage-outline',
    color: '#9C27B0',
    description: 'Immunization records and vaccination cards',
    firestoreCollection: 'vaccinations',
    routePath: '/(tabs)/vaccinations',
  },
  discharge_summary: {
    label: 'Discharge Summary',
    icon: 'document-text-outline',
    color: '#607D8B',
    description: 'Hospital discharge papers and summaries',
    firestoreCollection: 'discharge_summaries',
    routePath: '/(tabs)/documents',
  },
  other: {
    label: 'Other Document',
    icon: 'document-outline',
    color: '#9E9E9E',
    description: 'General medical documents',
    firestoreCollection: 'documents',
    routePath: '/(tabs)/documents',
  },
};
