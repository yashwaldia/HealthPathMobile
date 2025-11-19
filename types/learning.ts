/**
 * Learning Module Type Definitions
 */

export enum TestCategory {
  BLOOD = 'Blood Tests',
  URINE = 'Urine Tests',
  STOOL = 'Stool Tests',
  SPUTUM = 'Sputum Tests',
  FLUID = 'Body Fluid Tests',
  TISSUE = 'Tissue & Cytology',
  BONE_MARROW = 'Bone Marrow & Histopathology',
}

export enum RadiologyCategory {
  BASIC = 'Basic Radiology Tests',
  INTERMEDIATE = 'Intermediate Radiology Tests',
  ADVANCED = 'Advanced Radiology Tests',
  SPECIALIZED = 'Optional / Specialized Radiology',  // ✅ ADDED 4TH CATEGORY
}

export interface PathologyTest {
  id: string;
  name: string;
  category: TestCategory;
  purpose: string;
  detects: string;
  normalRange: string;
  sampleType: string;
  interpretationTips: string;
  system?: string;
}

export interface RadiologyTest {
  id: string;
  name: string;
  category: RadiologyCategory;
  subCategory: string;
  purpose: string;
}
