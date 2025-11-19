import { TestCategory, RadiologyCategory, PathologyTest, RadiologyTest } from '../types/learning';

export const PATHOLOGY_TESTS: PathologyTest[] = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    category: TestCategory.BLOOD,
    purpose: 'To evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia.',
    detects: 'Counts of red blood cells, white blood cells, platelets, hemoglobin concentration, and hematocrit.',
    normalRange: 'Varies by age and gender. Adults: RBC 4.5-5.5 million/µL, WBC 4,000-11,000/µL, Platelets 150,000-450,000/µL.',
    sampleType: 'Whole blood',
    interpretationTips: 'Low RBC may indicate anemia. High WBC may suggest infection. Low platelets can lead to bleeding issues.',
    system: 'General Health'
  },
  {
    id: 'lft',
    name: 'Liver Function Tests (LFT)',
    category: TestCategory.BLOOD,
    purpose: 'To assess liver health and detect liver damage.',
    detects: 'Levels of enzymes and proteins like ALT, AST, ALP, bilirubin, albumin, total protein.',
    normalRange: 'ALT: 7-56 U/L, AST: 10-40 U/L, ALP: 44-147 U/L, Total Bilirubin: 0.3-1.2 mg/dL, Albumin: 3.5-5.0 g/dL.',
    sampleType: 'Blood serum',
    interpretationTips: 'Elevated ALT and AST indicate liver cell damage. High bilirubin causes jaundice. Low albumin suggests chronic liver disease.',
    system: 'Liver'
  },
  {
    id: 'rft',
    name: 'Renal Function Tests (RFT)',
    category: TestCategory.BLOOD,
    purpose: 'To check how well the kidneys are functioning.',
    detects: 'Creatinine, Blood Urea Nitrogen (BUN), uric acid, electrolytes (sodium, potassium, chloride).',
    normalRange: 'Creatinine: 0.7-1.3 mg/dL (men), 0.6-1.1 mg/dL (women). BUN: 7-20 mg/dL. Uric Acid: 3.5-7.2 mg/dL (men), 2.6-6.0 mg/dL (women).',
    sampleType: 'Blood serum',
    interpretationTips: 'High creatinine and BUN levels indicate impaired kidney function. Monitor electrolyte imbalances.',
    system: 'Kidney'
  },
  {
    id: 'tft',
    name: 'Thyroid Function Tests (TFT)',
    category: TestCategory.BLOOD,
    purpose: 'To evaluate thyroid gland function and diagnose thyroid disorders.',
    detects: 'TSH (Thyroid Stimulating Hormone), T3 (Triiodothyronine), T4 (Thyroxine).',
    normalRange: 'TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 5-12 µg/dL.',
    sampleType: 'Blood serum',
    interpretationTips: 'High TSH with low T3/T4 indicates hypothyroidism. Low TSH with high T3/T4 suggests hyperthyroidism.',
    system: 'Thyroid'
  },
  {
    id: 'lipid',
    name: 'Lipid Profile',
    category: TestCategory.BLOOD,
    purpose: 'To assess risk of cardiovascular disease by measuring fats in blood.',
    detects: 'Total cholesterol, LDL cholesterol, HDL cholesterol, triglycerides.',
    normalRange: 'Total Cholesterol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL (men), >50 mg/dL (women), Triglycerides: <150 mg/dL.',
    sampleType: 'Blood serum (fasting)',
    interpretationTips: 'High LDL (bad cholesterol) increases heart disease risk. High HDL (good cholesterol) is protective. High triglycerides indicate metabolic issues.',
    system: 'Cardiac'
  },
  {
    id: 'hba1c',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: TestCategory.BLOOD,
    purpose: 'To monitor long-term blood sugar control in diabetes.',
    detects: 'Average blood glucose levels over the past 2-3 months.',
    normalRange: 'Normal: <5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: ≥6.5%.',
    sampleType: 'Whole blood',
    interpretationTips: 'HbA1c reflects average glucose over 3 months. Target for diabetics: <7%. Every 1% reduction lowers complication risk by 20-25%.',
    system: 'Endocrine'
  },
  {
    id: 'urine-routine',
    name: 'Urine Routine & Microscopy',
    category: TestCategory.URINE,
    purpose: 'To detect urinary tract infections, kidney disease, diabetes, and other metabolic conditions.',
    detects: 'pH, specific gravity, protein, glucose, ketones, blood, white blood cells, bacteria, crystals.',
    normalRange: 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030, Protein: Negative, Glucose: Negative, Ketones: Negative, Blood: Negative.',
    sampleType: 'Midstream urine',
    interpretationTips: 'Protein in urine suggests kidney damage. Glucose indicates diabetes. WBCs/bacteria suggest infection.',
    system: 'Kidney/Urinary'
  },
  {
    id: 'stool-routine',
    name: 'Stool Routine Examination',
    category: TestCategory.STOOL,
    purpose: 'To diagnose gastrointestinal infections, parasites, and digestive disorders.',
    detects: 'Consistency, color, blood, mucus, parasites, bacteria, undigested food particles.',
    normalRange: 'Brown color, formed consistency, no blood/mucus, no parasites.',
    sampleType: 'Fresh stool sample',
    interpretationTips: 'Blood in stool may indicate bleeding in GI tract. Mucus suggests inflammation. Parasites require treatment.',
    system: 'Gastrointestinal'
  },
];

export const RADIOLOGY_TESTS: RadiologyTest[] = [
  // BASIC RADIOLOGY TESTS
  {
    id: 'xray-chest',
    name: 'X-Ray Chest (PA View)',
    category: RadiologyCategory.BASIC,
    subCategory: 'Chest Imaging',
    purpose: 'To detect lung infections, heart enlargement, tumors, and chest injuries.',
  },
  {
    id: 'xray-abdomen',
    name: 'X-Ray Abdomen',
    category: RadiologyCategory.BASIC,
    subCategory: 'Abdominal Imaging',
    purpose: 'To identify bowel obstructions, kidney stones, and abdominal masses.',
  },
  {
    id: 'xray-spine',
    name: 'X-Ray Spine',
    category: RadiologyCategory.BASIC,
    subCategory: 'Musculoskeletal Imaging',
    purpose: 'To diagnose fractures, arthritis, and spinal alignment issues.',
  },
  {
    id: 'xray-bone',
    name: 'X-Ray Bone',
    category: RadiologyCategory.BASIC,
    subCategory: 'Musculoskeletal Imaging',
    purpose: 'To detect bone fractures, infections, and tumors.',
  },

  // INTERMEDIATE RADIOLOGY TESTS
  {
    id: 'ultrasound-abdomen',
    name: 'Ultrasound Whole Abdomen',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Abdominal Imaging',
    purpose: 'To examine liver, gallbladder, pancreas, kidneys, spleen, and detect abnormalities.',
  },
  {
    id: 'ultrasound-pelvis',
    name: 'Ultrasound Pelvis',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Pelvic Imaging',
    purpose: 'To evaluate uterus, ovaries, bladder, and detect cysts, fibroids, or tumors.',
  },
  {
    id: 'ultrasound-pregnancy',
    name: 'Ultrasound Pregnancy (Obstetric)',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Obstetric Imaging',
    purpose: 'To monitor fetal development and detect pregnancy complications.',
  },
  {
    id: 'mammography',
    name: 'Mammography',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Breast Imaging',
    purpose: 'To screen for breast cancer and detect lumps or abnormalities.',
  },
  {
    id: 'dexa-scan',
    name: 'DEXA Scan (Bone Density)',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Bone Imaging',
    purpose: 'To measure bone mineral density and diagnose osteoporosis.',
  },
  {
    id: 'echocardiography',
    name: 'Echocardiography (Echo)',
    category: RadiologyCategory.INTERMEDIATE,
    subCategory: 'Cardiac Imaging',
    purpose: 'To assess heart structure and function using ultrasound.',
  },

  // ADVANCED RADIOLOGY TESTS
  {
    id: 'ct-brain',
    name: 'CT Scan Brain',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Neurological Imaging',
    purpose: 'To detect brain tumors, bleeding, stroke, and head injuries.',
  },
  {
    id: 'ct-chest',
    name: 'CT Scan Chest',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Chest Imaging',
    purpose: 'To diagnose lung diseases, detect tumors, and evaluate heart and blood vessels.',
  },
  {
    id: 'ct-abdomen',
    name: 'CT Scan Abdomen & Pelvis',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Abdominal Imaging',
    purpose: 'To diagnose abdominal pain, detect tumors, and evaluate internal organs.',
  },
  {
    id: 'mri-brain',
    name: 'MRI Brain',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Neurological Imaging',
    purpose: 'High-resolution imaging to detect brain tumors, multiple sclerosis, stroke, and infections.',
  },
  {
    id: 'mri-spine',
    name: 'MRI Spine',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Musculoskeletal Imaging',
    purpose: 'To diagnose herniated discs, spinal tumors, nerve compression, and spinal cord injuries.',
  },
  {
    id: 'mri-joint',
    name: 'MRI Joint (Knee/Shoulder)',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Musculoskeletal Imaging',
    purpose: 'To evaluate ligament tears, cartilage damage, and joint abnormalities.',
  },
  {
    id: 'ct-angiography',
    name: 'CT Angiography',
    category: RadiologyCategory.ADVANCED,
    subCategory: 'Vascular Imaging',
    purpose: 'To visualize blood vessels and detect blockages, aneurysms, or vascular diseases.',
  },

  // OPTIONAL / SPECIALIZED RADIOLOGY
  {
    id: 'pet-scan',
    name: 'PET Scan (Positron Emission Tomography)',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Metabolic Imaging',
    purpose: 'To detect cancer, assess heart disease, and evaluate brain disorders.',
  },
  {
    id: 'pet-ct',
    name: 'PET-CT Scan',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Hybrid Imaging',
    purpose: 'Combines PET and CT for detailed cancer staging and treatment monitoring.',
  },
  {
    id: 'bone-scan',
    name: 'Bone Scan (Nuclear Medicine)',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Skeletal Imaging',
    purpose: 'To detect bone infections, fractures, tumors, and arthritis.',
  },
  {
    id: 'thyroid-scan',
    name: 'Thyroid Scan',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Endocrine Imaging',
    purpose: 'To evaluate thyroid function and detect nodules or tumors.',
  },
  {
    id: 'cardiac-catheterization',
    name: 'Cardiac Catheterization',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Interventional Cardiology',
    purpose: 'To diagnose and treat heart conditions by visualizing coronary arteries.',
  },
  {
    id: 'fluoroscopy',
    name: 'Fluoroscopy',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Dynamic Imaging',
    purpose: 'Real-time X-ray imaging to visualize moving body structures.',
  },
  {
    id: 'mra',
    name: 'MR Angiography (MRA)',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Vascular Imaging',
    purpose: 'To visualize blood vessels using MRI technology.',
  },
  {
    id: 'virtual-colonoscopy',
    name: 'Virtual Colonoscopy (CT Colonography)',
    category: RadiologyCategory.SPECIALIZED,
    subCategory: 'Gastrointestinal Imaging',
    purpose: 'Non-invasive colon cancer screening using CT imaging.',
  },
];
