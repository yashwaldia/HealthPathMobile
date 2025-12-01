// constants/fitcalcConfig.ts

import { FitCalcId } from '../types/fitcalc';
import { FitCalcField } from '../components/fitcalc/FitCalcCard';

export type FitCalcConfigEntry = {
  title: string;
  description?: string;
  fields: FitCalcField[];
};

export const FITCALC_CONFIG: Record<FitCalcId, FitCalcConfigEntry> = {
  bmi: {
    title: 'Body Mass Index (BMI)',
    description: 'Estimate of body fat based on height and weight.',
    fields: [
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  bmr: {
    title: 'Basal Metabolic Rate (BMR)',
    description: 'Calories your body burns each day at complete rest.',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'age', label: 'Age (years)', type: 'number', keyboardType: 'numeric' },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'formula',
        label: 'Formula',
        type: 'chips',
        options: [
          { value: 'mifflin', label: 'Mifflin-St Jeor' },
          { value: 'harris', label: 'Harris-Benedict' },
        ],
      },
    ],
  },
  tdee: {
    title: 'Total Daily Energy Expenditure (TDEE)',
    description: 'Daily calories burned including your typical activity.',
    fields: [
      { key: 'bmr', label: 'BMR (kcal/day)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: '1.2', label: 'Sedentary' },
          { value: '1.375', label: 'Light' },
          { value: '1.55', label: 'Moderate' },
          { value: '1.725', label: 'Very' },
          { value: '1.9', label: 'Extreme' },
        ],
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'chips',
        options: [
          { value: 'maintain', label: 'Maintain' },
          { value: 'lose', label: 'Lose' },
          { value: 'gain', label: 'Gain' },
        ],
      },
    ],
  },
  macros: {
    title: 'Macronutrients',
    description: 'Split your daily calories into protein, carbs and fats using presets.',
    fields: [
      {
        key: 'calories',
        label: 'Goal calories (kcal/day)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'preset',
        label: 'Macro preset',
        type: 'chips',
        options: [
          { value: 'balanced', label: 'Balanced' },      // P 30 / C 40 / F 30
          { value: 'keto', label: 'Ketogenic' },        // P 20 / C 5  / F 75
          { value: 'highp', label: 'High Protein' },    // P 35 / C 35 / F 30
          { value: 'lowcarb', label: 'Low Carb' },      // P 30 / C 25 / F 45
        ],
      },
    ],
  },
  onerm: {
    title: 'One-Rep Max (1RM)',
    description: 'Estimate the max weight you can lift for one repetition.',
    fields: [
      {
        key: 'weight',
        label: 'Weight lifted (kg)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'reps',
        label: 'Repetitions (1–10)',
        type: 'number',
        keyboardType: 'numeric',
      },
      {
        key: 'formula',
        label: 'Formula',
        type: 'chips',
        options: [
          { value: 'epley', label: 'Epley' },
          { value: 'brzycki', label: 'Brzycki' },
          { value: 'lombardi', label: 'Lombardi' },
        ],
      },
    ],
  },
  bodyfat: {
    title: 'Body Fat % (US Navy)',
    description: 'Estimate body fat percentage from body measurements.',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'waist', label: 'Waist (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'neck', label: 'Neck (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'hip', label: 'Hip (cm, women)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  hrzones: {
    title: 'Heart Rate Zones',
    description: 'Training intensity zones based on your age and HR.',
    fields: [
      { key: 'age', label: 'Age (years)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'resting',
        label: 'Resting HR (bpm, optional)',
        type: 'number',
        keyboardType: 'numeric',
      },
    ],
  },
  vo2max: {
    title: 'VO₂max (1.5 mile test)',
    description: 'Estimate aerobic fitness from 1.5 mile run time.',
    fields: [
      {
        key: 'time',
        label: '1.5 mile time (mm:ss)',
        type: 'text',
        keyboardType: 'default',
      },
    ],
  },
  activity: {
    title: 'Activity Calories',
    description: 'Estimate calories burned for a workout.',
    fields: [
      {
        key: 'type',
        label: 'Activity type',
        type: 'chips',
        options: [
          { value: 'walking', label: 'Walking' },
          { value: 'running', label: 'Running' },
          { value: 'cycling', label: 'Cycling' },
          { value: 'swimming', label: 'Swimming' },
          { value: 'weightlifting', label: 'Weightlifting' },
        ],
      },
      {
        key: 'intensity',
        label: 'Intensity',
        type: 'chips',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'vigorous', label: 'Vigorous' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        keyboardType: 'numeric',
      },
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  ratios: {
    title: 'Body Ratios',
    description: 'Waist-to-height and waist-to-hip ratios.',
    fields: [
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'waist', label: 'Waist (cm)', type: 'number', keyboardType: 'numeric' },
      { key: 'hip', label: 'Hip (cm)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  idealweight: {
    title: 'Ideal Weight',
    description: 'Healthy weight estimates from different formulas.',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        type: 'chips',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
      { key: 'height', label: 'Height (cm)', type: 'number', keyboardType: 'numeric' },
    ],
  },
  water: {
    title: 'Water Intake',
    description: 'Daily water needs based on weight and activity.',
    fields: [
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly', label: 'Lightly active' },
          { value: 'moderately', label: 'Moderately active' },
          { value: 'very', label: 'Very active' },
        ],
      },
    ],
  },
  running: {
    title: 'Running Pace',
    description: 'Pace and speed from distance and time.',
    fields: [
      { key: 'distance', label: 'Distance (km)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'time',
        label: 'Time (hh:mm:ss)',
        type: 'text',
        keyboardType: 'default',
      },
    ],
  },
  protein: {
    title: 'Protein Intake',
    description: 'Daily protein based on weight, activity and goal.',
    fields: [
      { key: 'weight', label: 'Weight (kg)', type: 'number', keyboardType: 'numeric' },
      {
        key: 'activity',
        label: 'Activity level',
        type: 'chips',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly', label: 'Lightly active' },
          { value: 'moderately', label: 'Moderately active' },
          { value: 'very', label: 'Very active' },
          { value: 'athlete', label: 'Athlete' },
        ],
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'chips',
        options: [
          { value: 'maintain', label: 'Maintain' },
          { value: 'lose', label: 'Fat loss' },
          { value: 'gain', label: 'Muscle gain' },
        ],
      },
    ],
  },
};
