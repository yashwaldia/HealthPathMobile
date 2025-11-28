import { Timestamp } from 'firebase/firestore';

export interface SymptomCategory {
  id: string;
  name: string;
  icon: string; // Ionicons name
  symptoms: string[];
}

export interface SymptomLog {
  symptomId: string;
  timestamp: Timestamp;
  date: string; // YYYY-MM-DD
  
  // Selection
  category: string;
  categoryName: string;
  symptoms: string[];
  
  // Severity & Duration
  severity: number; // 1-5
  duration: string; // "hours" | "days" | "weeks"
  durationValue: number;
  
  // Context
  triggers?: string;
  activities?: string;
  relatedMedications?: string[];
  
  // AI Analysis (UPDATED)
  aiAnalysis?: {
    summary: string;
    possibleConditions: string[];
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    analyzedAt: string;
  };
  
  // Organization
  notes?: string;
  images?: string[];
  isFavorite: boolean;
  tags?: string[];
}

export interface SymptomFormData {
  category: string;
  categoryName: string;
  symptoms: string[];
  severity: number;
  duration: string;
  durationValue: number;
  triggers?: string;
  notes?: string;
}
