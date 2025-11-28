import { SymptomCategory } from '../types/symptom';

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'head',
    name: 'Head',
    icon: 'skull-outline',
    symptoms: [
      'Headache or Pressure',
      'Dizziness or Faint Feeling',
      'Memory Issue',
      'Stress / Lack of Sleep',
      'Blurred Vision / Eye Strain'
    ]
  },
  {
    id: 'eyes',
    name: 'Eyes',
    icon: 'eye-outline',
    symptoms: [
      'Redness or Itching',
      'Watering Eyes',
      'Blurred Vision',
      'Pain around Eyes',
      'Light Sensitivity'
    ]
  },
  {
    id: 'ears',
    name: 'Ears',
    icon: 'ear-outline',
    symptoms: [
      'Ear Pain',
      'Hearing Problem',
      'Ringing Sound (Buzz)',
      'Discharge / Blocked Ear',
      'Balance Problem'
    ]
  },
  {
    id: 'nose',
    name: 'Nose',
    icon: 'water-outline',
    symptoms: [
      'Blocked Nose',
      'Sneezing / Runny Nose',
      'Sinus Pressure (Head/Face)',
      'Nose Bleeding',
      'Loss of Smell'
    ]
  },
  {
    id: 'mouth',
    name: 'Teeth',
    icon: 'happy-outline',
    symptoms: [
      'Tooth Pain',
      'Swollen Gums',
      'Sensitive to Hot/Cold',
      'Bad Breath',
      'Bleeding while Brushing'
    ]
  },
  {
    id: 'throat',
    name: 'Throat',
    icon: 'radio-outline',
    symptoms: [
      'Sore Throat',
      'Pain while Swallowing',
      'Voice Change / Hoarse Voice',
      'Neck Swelling',
      'Dry Throat / Cough'
    ]
  },
  {
    id: 'chest',
    name: 'Chest',
    icon: 'heart-outline',
    symptoms: [
      'Chest Pain or Tightness',
      'Fast Heartbeat',
      'Shortness of Breath',
      'Cough or Wheezing',
      'Pain while Breathing'
    ]
  },
  {
    id: 'spine',
    name: 'Back',
    icon: 'body-outline',
    symptoms: [
      'Back Pain (Upper/Lower)',
      'Neck Stiffness',
      'Shoulder Pain',
      'Nerve Pull / Sciatica',
      'Posture Problem'
    ]
  },
  {
    id: 'stomach',
    name: 'Stomach',
    icon: 'nutrition-outline',
    symptoms: [
      'Stomach Pain or Cramps',
      'Gas or Acidity',
      'Vomiting or Nausea',
      'Constipation / Loose Motion',
      'Loss of Appetite'
    ]
  },
  {
    id: 'liver',
    name: 'Liver',
    icon: 'water-outline',
    symptoms: [
      'Pain in Right Upper Belly',
      'Yellow Eyes or Skin',
      'Loss of Appetite',
      'Fatigue / Weakness',
      'Dark Urine or Pale Stool'
    ]
  },
  {
    id: 'pelvic',
    name: 'Pelvic',
    icon: 'fitness-outline',
    symptoms: [
      'Pain while Urinating',
      'Lower Belly Pain',
      'Itching / Discharge',
      'Missed Period / Irregular Cycle',
      'Swelling or Discomfort'
    ]
  },
  {
    id: 'skin',
    name: 'Skin',
    icon: 'hand-left-outline',
    symptoms: [
      'Itching or Rash',
      'Red Spots',
      'Dry or Cracked Skin',
      'Infection (Pimple, Boil)',
      'Color Change (White/Black Patches)'
    ]
  },
  {
    id: 'hands',
    name: 'Hands',
    icon: 'hand-right-outline',
    symptoms: [
      'Wrist Pain',
      'Finger Pain or Stiffness',
      'Numbness / Tingling',
      'Rash / Infection on Hand',
      'Weak Grip'
    ]
  },
  {
    id: 'legs',
    name: 'Legs',
    icon: 'walk-outline',
    symptoms: [
      'Knee Pain',
      'Leg Swelling',
      'Muscle Pain / Weakness',
      'Numbness or Tingling',
      'Difficulty Walking'
    ]
  },
  {
    id: 'feet',
    name: 'Feet',
    icon: 'footsteps-outline',
    symptoms: [
      'Foot Pain or Heel Pain',
      'Swelling in Feet',
      'Numbness or Burning',
      'Fungal Infection (Itchy Toes)',
      'Cracked Heels'
    ]
  }
];

export const SEVERITY_LEVELS = [
  { value: 1, label: 'Very Mild', color: '#10B981' },
  { value: 2, label: 'Mild', color: '#84CC16' },
  { value: 3, label: 'Moderate', color: '#FBBF24' },
  { value: 4, label: 'Severe', color: '#F97316' },
  { value: 5, label: 'Very Severe', color: '#EF4444' }
];

export const DURATION_OPTIONS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' }
];
