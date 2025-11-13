export interface VitalRecord {
  id: string;
  userId: string;
  date: string; // ISO timestamp
  
  // Blood Pressure
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  
  // Blood Sugar
  bloodSugarFasting?: number;
  bloodSugarPostMeal?: number;
  
  // Basic Vitals
  heartRate?: number;
  pulseRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respirationRate?: number;
  
  // Weight & Body
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  
  // Advanced Metrics
  steps?: number;
  activeCalories?: number;
  sleepHours?: number;
  sleepMinutes?: number;
  readinessScore?: number;
  stressLevel?: number;
  
  // Metadata
  notes?: string;
  source?: 'manual' | 'device' | 'imported';
}

export type VitalType = 
  | 'bloodPressure'
  | 'bloodSugar'
  | 'heartRate'
  | 'temperature'
  | 'oxygenSaturation'
  | 'weight'
  | 'sleep';

export type VitalStatus = 'normal' | 'alert' | 'critical';

export interface VitalCardData {
  id: VitalType;
  title: string;
  icon: string; // Ionicons name
  latestValue: string;
  unit: string;
  status: VitalStatus;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  lastUpdated?: Date;
}
