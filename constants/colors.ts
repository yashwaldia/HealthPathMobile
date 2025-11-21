// constants/colors.ts

export const Colors = {
  light: {
    // Warm Peachy-Orange Primary Colors
    primary: '#fa8a61ff',      // Warm coral/peach
    primaryDark: '#FF7B54',    // Darker coral
    primaryLight: '#FFB199',   // Lighter peach
    
    // Background Colors
    background: '#FFF5F0',     // Very light peach
    cardBackground: '#FFFFFF',
    
    // Text Colors
    text: '#2D3748',
    textSecondary: '#5A5A5A',
    textLight: '#A0A0A0',
    
    // UI Elements
    border: '#FFD4C4',
    
    // Status & Feedback Colors
    error: '#ef4444',          // Critical/Error
    success: '#22c55e',        // Success/Normal
    warning: '#f59e0b',        // Warning/Alert
    
    // Input Fields
    inputBackground: '#FFFFFF',
    inputBorder: '#FFB199',
    
    // Shadows
    shadow: 'rgba(255, 154, 118, 0.25)',
    
    // ===== NEW: Upload Feature Colors =====
    upload: {
      // Upload States
      idle: '#FFB199',         // Lighter peach (ready to upload)
      uploading: '#fa8a61ff',  // Primary peach (uploading)
      analyzing: '#9C88FF',    // Purple (AI analyzing)
      success: '#22c55e',      // Green (upload complete)
      error: '#ef4444',        // Red (upload failed)
      
      // Document Category Colors (matching your warm theme)
      categories: {
        pathology: '#FF8C69',    // Warm coral (lab reports)
        radiology: '#FFB5A7',    // Soft peach (scans)
        medication: '#FFC857',   // Warm gold (prescriptions)
        vitals: '#FF6B9D',       // Warm pink (vitals)
        vaccination: '#B4A7D6',  // Soft purple (vaccines)
        discharge: '#A8DADC',    // Soft blue-green (discharge)
        other: '#C4C4C4',        // Neutral gray (other)
      },
      
      // Progress Indicator
      progressBar: '#fa8a61ff',     // Primary peach
      progressBackground: '#FFE5DC', // Very light peach
      
      // Upload Zone
      dropZone: {
        border: '#FFB199',           // Light peach border
        borderActive: '#fa8a61ff',   // Primary when dragging
        background: '#FFFFFF',
        backgroundActive: '#FFF5F0', // Light peach when dragging
      },
      
      // File Preview
      fileThumbnail: {
        background: '#FFF5F0',       // Light peach
        border: '#FFD4C4',
        iconColor: '#fa8a61ff',      // Primary peach
      },
      
      // AI Classification Badge
      badge: {
        background: '#FFF5F0',       // Light peach
        text: '#FF7B54',             // Dark coral
        border: '#FFB199',           // Light peach
      },
      
      // Confidence Score Colors
      confidence: {
        high: '#22c55e',             // Green (>80%)
        medium: '#f59e0b',           // Orange (50-80%)
        low: '#ef4444',              // Red (<50%)
      },
    },
  }
};

// ===== NEW: Upload Color Helpers =====

/**
 * Get color based on upload status
 */
export const getUploadStatusColor = (status: string): string => {
  const colors = Colors.light.upload;
  switch (status) {
    case 'uploading':
      return colors.uploading;
    case 'analyzing':
      return colors.analyzing;
    case 'complete':
      return colors.success;
    case 'error':
      return colors.error;
    default:
      return colors.idle;
  }
};

/**
 * Get color based on document category
 */
export const getCategoryColor = (category: string): string => {
  const categories = Colors.light.upload.categories;
  switch (category) {
    case 'pathology_report':
      return categories.pathology;
    case 'radiology_scan':
      return categories.radiology;
    case 'medication_prescription':
      return categories.medication;
    case 'vitals_record':
      return categories.vitals;
    case 'vaccination_card':
      return categories.vaccination;
    case 'discharge_summary':
      return categories.discharge;
    default:
      return categories.other;
  }
};

/**
 * Get color based on confidence score (0-1)
 */
export const getConfidenceColor = (confidence: number): string => {
  const colors = Colors.light.upload.confidence;
  if (confidence >= 0.8) return colors.high;
  if (confidence >= 0.5) return colors.medium;
  return colors.low;
};

/**
 * Get color with opacity
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
