// types/fitcalc.ts

export type FitCalcId =
  | 'bmi'
  | 'bmr'
  | 'tdee'
  | 'macros'
  | 'onerm'
  | 'bodyfat'
  | 'hrzones'
  | 'vo2max'
  | 'activity'
  | 'ratios'
  | 'idealweight'
  | 'water'
  | 'running'
  | 'protein';

// ---- BMI ----

export type BmiInputs = { height?: string; weight?: string };

export type BmiResult = {
  value: string;
  category: string;
  hint: string;
  categoryClass:
    | 'category-underweight'
    | 'category-normal'
    | 'category-overweight'
    | 'category-obese';
};

// ---- BMR ----

export type BmrInputs = {
  gender?: 'male' | 'female';
  age?: string;
  height?: string;
  weight?: string;
  formula?: 'mifflin' | 'harris';
};

export type BmrResult = { value: number };

// ---- TDEE ----

export type TdeeInputs = {
  bmr?: string;
  activity?: string; // multiplier as string: "1.2" | "1.375" | ...
  goal?: 'maintain' | 'lose' | 'gain';
};

export type TdeeResult = {
  tdee: number;
  target: number;
};

// ---- Macros (MacroMaster style) ----

export type MacrosInputs = {
  calories?: string;
  preset?: 'balanced' | 'keto' | 'highp' | 'lowcarb';
};

export type MacrosResult = {
  protein: number; // g/day
  fat: number;     // g/day
  carbs: number;   // g/day
  ratios: {
    protein: number; // fraction of total kcal, e.g. 0.3
    fat: number;
    carbs: number;
  };
  kcal: {
    protein: number;
    fat: number;
    carbs: number;
    total: number;
  };
};

// ---- One-Rep Max ----

export type OneRmInputs = {
  weight?: string;
  reps?: string;
  formula?: 'epley' | 'brzycki' | 'lombardi';
};

export type OneRmResult = {
  value: number;
};

// ---- Body Fat ----

export type BodyFatInputs = {
  gender?: 'male' | 'female';
  height?: string;
  waist?: string;
  neck?: string;
  hip?: string; // only used for female
};

export type BodyFatResult = {
  value: string; // percentage, e.g. "18.5"
};

// ---- HR Zones ----

export type HrZonesInputs = {
  age?: string;
  resting?: string;
};

export type HrZonesResult = {
  maxHR: number;
  zone1: string;
  zone2: string;
  zone3: string;
  zone4: string;
  zone5: string;
};

// ---- VO2max ----

export type Vo2maxInputs = {
  time?: string; // "mm:ss" or "hh:mm:ss"
};

export type Vo2maxResult = {
  value: string; // ml/kg/min
};

// ---- Activity Calories ----

export type ActivityInputs = {
  type?: 'walking' | 'running' | 'cycling' | 'swimming' | 'weightlifting';
  intensity?: 'light' | 'moderate' | 'vigorous';
  duration?: string; // minutes
  weight?: string; // kg
};

export type ActivityResult = {
  value: number; // kcal
};

// ---- Body Ratios ----

export type RatiosInputs = {
  height?: string;
  waist?: string;
  hip?: string;
};

export type RatiosResult = {
  whtr: string; // waist/height
  whr: string;  // waist/hip
};

// ---- Ideal Weight ----

export type IdealWeightInputs = {
  gender?: 'male' | 'female';
  height?: string;
};

export type IdealWeightResult = {
  devine: number;
  robinson: number;
  miller: number;
};

// ---- Water Intake ----

export type WaterInputs = {
  weight?: string; // kg
  activity?: 'sedentary' | 'lightly' | 'moderately' | 'very';
};

export type WaterResult = {
  value: string; // liters/day
};

// ---- Running Pace ----

export type RunningInputs = {
  distance?: string; // km
  time?: string;     // "hh:mm:ss"
};

export type RunningResult = {
  pace: string;  // "MM:SS" per km
  speed: string; // km/h
};

// ---- Protein Intake ----

export type ProteinInputs = {
  weight?: string; // kg
  activity?: 'sedentary' | 'lightly' | 'moderately' | 'very' | 'athlete';
  goal?: 'maintain' | 'lose' | 'gain';
};

export type ProteinResult = {
  value: number; // g/day
};

// ---- Aggregated types used in state ----

export type FitCalcInputs = {
  bmi?: BmiInputs;
  bmr?: BmrInputs;
  tdee?: TdeeInputs;
  macros?: MacrosInputs;
  onerm?: OneRmInputs;
  bodyfat?: BodyFatInputs;
  hrzones?: HrZonesInputs;
  vo2max?: Vo2maxInputs;
  activity?: ActivityInputs;
  ratios?: RatiosInputs;
  idealweight?: IdealWeightInputs;
  water?: WaterInputs;
  running?: RunningInputs;
  protein?: ProteinInputs;
};

export type FitCalcResults = {
  bmi?: BmiResult;
  bmr?: BmrResult;
  tdee?: TdeeResult;
  macros?: MacrosResult;
  onerm?: OneRmResult;
  bodyfat?: BodyFatResult;
  hrzones?: HrZonesResult;
  vo2max?: Vo2maxResult;
  activity?: ActivityResult;
  ratios?: RatiosResult;
  idealweight?: IdealWeightResult;
  water?: WaterResult;
  running?: RunningResult;
  protein?: ProteinResult;
};
