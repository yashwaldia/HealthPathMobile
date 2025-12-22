// constants/wellnessData.ts
// Wellness Module Configuration Data
// Last Updated: December 10, 2025

import { ModuleCardData, WellnessModuleType, WarningSign } from '../types/wellness';

// ============================================================================
// MODULE CARD CONFIGURATION (for Wellness Hub screen)
// ============================================================================

export const WELLNESS_MODULES: ModuleCardData[] = [
  {
    moduleType: 'mother-care',
    title: 'Mother Care',
    icon: 'woman-outline',
    color: '#FFB6C1',
    description: 'Pregnancy tracking & trimester care',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'child-care',
    title: 'Child Care',
    icon: 'people-outline',
    color: '#87CEEB',
    description: 'Growth milestones & food plans',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'liver-kidney',
    title: 'Liver & Kidney',
    icon: 'water-outline',
    color: '#98D8C8',
    description: '30-day detox program',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'skin-hair',
    title: 'Skin & Hair',
    icon: 'sparkles-outline',
    color: '#F4C2C2',
    description: 'Daily routines & monthly plans',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'gut-health',
    title: 'Gut Health',
    icon: 'leaf-outline',
    color: '#FFD700',
    description: 'Digestion & bloating solutions',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'bone-joint',
    title: 'Bone & Joint',
    icon: 'fitness-outline',
    color: '#D3D3D3',
    description: 'Pain relief & flexibility',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'teeth-oral',
    title: 'Teeth & Oral Care',
    icon: 'happy-outline',
    color: '#E0FFFF',
    description: 'Oral health & whitening',
    status: 'not-started',
    progress: 0,
  },
  {
    moduleType: 'beauty-fitness',
    title: 'Beauty & Fitness',
    icon: 'star-outline',
    color: '#DDA0DD',
    description: '30-day transformation plan',
    status: 'not-started',
    progress: 0,
  },
];

// ============================================================================
// PROGRAM DURATIONS (in days)
// ============================================================================

export const PROGRAM_DURATIONS: Record<WellnessModuleType, number> = {
  'mother-care': 280,      // ~40 weeks
  'child-care': 1095,      // 36 months
  'liver-kidney': 30,
  'skin-hair': 30,
  'gut-health': 30,
  'bone-joint': 30,
  'teeth-oral': 30,
  'beauty-fitness': 30,
};

// ============================================================================
// COMMON WARNING SIGNS (Shared across modules)
// ============================================================================

export const COMMON_WARNING_SIGNS: WarningSign[] = [
  {
    signId: 'severe-pain',
    symptom: 'Severe or persistent pain',
    action: 'Contact your healthcare provider immediately',
    severity: 'critical',
    icon: 'alert-circle',
  },
  {
    signId: 'breathing-difficulty',
    symptom: 'Difficulty breathing',
    action: 'Seek emergency medical attention',
    severity: 'critical',
    icon: 'medical',
  },
  {
    signId: 'chest-pain',
    symptom: 'Chest pain or pressure',
    action: 'Call emergency services immediately',
    severity: 'critical',
    icon: 'heart-dislike',
  },
  {
    signId: 'unusual-swelling',
    symptom: 'Sudden or severe swelling',
    action: 'Consult your doctor today',
    severity: 'urgent',
    icon: 'water',
  },
  {
    signId: 'high-fever',
    symptom: 'Fever above 101°F (38.3°C)',
    action: 'Contact your healthcare provider',
    severity: 'urgent',
    icon: 'thermometer',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getModuleConfig = (moduleType: WellnessModuleType): ModuleCardData => {
  return WELLNESS_MODULES.find(m => m.moduleType === moduleType) || WELLNESS_MODULES[0];
};

export const getModuleDuration = (moduleType: WellnessModuleType): number => {
  return PROGRAM_DURATIONS[moduleType];
};

export const getModuleColor = (moduleType: WellnessModuleType): string => {
  const module = getModuleConfig(moduleType);
  return module.color;
};

export const getModuleIcon = (moduleType: WellnessModuleType): string => {
  const module = getModuleConfig(moduleType);
  return module.icon;
};
