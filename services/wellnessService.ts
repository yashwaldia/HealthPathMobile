// services/wellnessService.ts
// Last Updated: December 16, 2025 - Migrated to React Native Firebase + Fixed progress bar NaN issue + Fixed TypeScript errors

import firestore from '@react-native-firebase/firestore';
import { PROGRAM_DURATIONS } from '../constants/wellnessData';
import {
  BeautyFitnessProfile, BoneJointProfile, ChildCareProfile, ChildProfileSummary,
  DailyTracking, GutHealthProfile, LiverKidneyProfile, MedicalReminder,
  MotherCareMetrics, MotherCareProfile, SkinHairProfile, TeethOralProfile,
  WeeklyAIContent, WeeklyMilestone, WeeklyReport, WellnessModuleProfile, WellnessModuleType,
} from '../types/wellness';
import { createFallbackWeeklyContent, generateWeeklyContent, getWeekId, isContentValid } from './childCareAIService';
import {
  calculateDentalHealthStatus, calculateDigestiveHealthStatus, calculateHairHealthStatus,
  calculateKidneyHealthStatus, calculateLiverHealthStatus, calculateMobilityStatus, calculateSkinHealthStatus
} from './healthStatusCalculator';


// ============================================================================
// ⭐ NEW: HELPER TO GET CORRECT CURRENT DAY FIELD (FIX FOR NaN)
// ============================================================================
const getModuleCurrentDay = (profile: any, moduleType: WellnessModuleType): number => {
  if (!profile) return 1;
  
  switch (moduleType) {
    case 'mother-care': return profile?.currentDayOfPregnancy || profile?.currentDay || 1;
    case 'liver-kidney': return profile?.detoxDay || profile?.currentDay || 1;
    case 'gut-health': return profile?.detoxDay || profile?.currentDay || 1;
    case 'skin-hair': return profile?.careDay || profile?.currentDay || 1;
    case 'bone-joint': return profile?.recoveryDay || profile?.currentDay || 1;
    case 'teeth-oral': return profile?.careDay || profile?.currentDay || 1;
    case 'beauty-fitness': return profile?.programDay || profile?.currentDay || 1;
    case 'child-care': return profile?.ageInDays || profile?.currentDay || 1;
    default: return profile?.currentDay || 1;
  }
};


// ⭐ NEW: GET TODAY'S TASK COMPLETION PERCENTAGE (FOR MODULE SCREENS)
export const getDailyTaskCompletion = async (
  userId: string,
  moduleType: WellnessModuleType,
  date: string
): Promise<number> => {
  try {
    const tracking = await getDailyTracking(userId, moduleType, date);
    if (!tracking || !tracking.tasks || tracking.tasks.length === 0) return 0;
    
    const completed = tracking.tasks.filter(t => t.completed).length;
    return Math.round((completed / tracking.tasks.length) * 100);
  } catch (error) {
    console.error('❌ Error getting daily task completion:', error);
    return 0;
  }
};


// ============================================================================
// MODULE PROFILE OPERATIONS
// ============================================================================
export const startWellnessModule = async (
  userId: string, moduleType: WellnessModuleType, startDate: string, additionalData?: Record<string, any>
): Promise<WellnessModuleProfile> => {
  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc(moduleType);
  const profileData: WellnessModuleProfile = {
    moduleType, isActive: true, startDate, currentDay: 1, currentWeek: 1,
    programDuration: PROGRAM_DURATIONS[moduleType], completionPercentage: 0,
    lastUpdated: new Date(), notificationsEnabled: false, ...additionalData,
  };
  await moduleRef.set({ 
    profile: profileData, 
    createdAt: firestore.FieldValue.serverTimestamp(), 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  console.log(`✅ Started ${moduleType} module`);
  return profileData;
};


export const getModuleProfile = async (
  userId: string, moduleType: WellnessModuleType
): Promise<WellnessModuleProfile | null> => {
  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc(moduleType);
  const snapshot = await moduleRef.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null; // ✅ FIX: Check if data exists
  return { ...data.profile, lastUpdated: data.profile.lastUpdated?.toDate() || new Date() } as WellnessModuleProfile;
};


export const updateModuleProfile = async (
  userId: string, moduleType: WellnessModuleType, updates: Partial<WellnessModuleProfile>
): Promise<void> => {
  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc(moduleType);
  await moduleRef.update({ 
    profile: { ...updates, lastUpdated: new Date() }, 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
};


export const deactivateModule = async (userId: string, moduleType: WellnessModuleType): Promise<void> => {
  await updateModuleProfile(userId, moduleType, { isActive: false });
};


// ============================================================================
// DAILY TRACKING OPERATIONS
// ============================================================================
export const saveDailyTracking = async (
  userId: string, moduleType: WellnessModuleType, tracking: Omit<DailyTracking, 'trackingId' | 'createdAt'>
): Promise<void> => {
  const trackingRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('dailyTracking').doc(tracking.date);
  await trackingRef.set({ 
    ...tracking, 
    trackingId: trackingRef.id, 
    createdAt: firestore.FieldValue.serverTimestamp() 
  }, { merge: true });
};


export const getDailyTracking = async (
  userId: string, moduleType: WellnessModuleType, date: string
): Promise<DailyTracking | null> => {
  const trackingRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('dailyTracking').doc(date);
  const snapshot = await trackingRef.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null; // ✅ FIX: Check if data exists
  return { ...data, createdAt: data.createdAt?.toDate() || new Date() } as DailyTracking;
};


export const getDailyTrackingRange = async (
  userId: string, moduleType: WellnessModuleType, startDate: string, endDate: string
): Promise<DailyTracking[]> => {
  const snapshot = await firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('dailyTracking')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();
  return snapshot.docs.map(d => ({ 
    ...d.data(), 
    createdAt: d.data().createdAt?.toDate() || new Date() 
  })) as DailyTracking[];
};


// ⭐ UPDATED: Toggle task completion (Option A - doesn't affect overall progress)
export const toggleTaskCompletion = async (
  userId: string, moduleType: WellnessModuleType, date: string, taskId: string
): Promise<void> => {
  const tracking = await getDailyTracking(userId, moduleType, date);
  if (!tracking) throw new Error('No tracking data found');

  const updatedTasks = tracking.tasks.map(task =>
    task.taskId === taskId ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : undefined } : task
  );

  const completionRate = (updatedTasks.filter(t => t.completed).length / updatedTasks.length) * 100;
  await saveDailyTracking(userId, moduleType, { ...tracking, tasks: updatedTasks, overallCompletion: Math.round(completionRate) });
  console.log(`✅ Task ${taskId} toggled - Daily completion: ${Math.round(completionRate)}%`);
};


// ⭐ UPDATED: Calculate overall program progress (not daily tasks)
export const updateCompletionPercentage = async (userId: string, moduleType: WellnessModuleType): Promise<void> => {
  const profile = await getModuleProfile(userId, moduleType);
  if (!profile) return;

  const currentDay = getModuleCurrentDay(profile, moduleType);
  const percentage = Math.min(Math.round((currentDay / profile.programDuration) * 100), 100);

  if (percentage !== profile.completionPercentage) {
    await updateModuleProfile(userId, moduleType, { completionPercentage: percentage });
    console.log(`✅ Updated ${moduleType} program progress: ${percentage}%`);
  }
};


// ⭐ UPDATED: Sync completion percentage (Option A - based on days, not tasks)
export const syncCompletionPercentage = async (userId: string, moduleType: WellnessModuleType): Promise<number> => {
  try {
    const profile = await getModuleProfile(userId, moduleType);
    if (!profile) return 0;

    const currentDay = getModuleCurrentDay(profile, moduleType);
    const calculatedPercentage = Math.min(Math.round((currentDay / profile.programDuration) * 100), 100);

    if (calculatedPercentage !== profile.completionPercentage) {
      await updateModuleProfile(userId, moduleType, { completionPercentage: calculatedPercentage });
      console.log(`✅ Synced ${moduleType}: ${calculatedPercentage}%`);
    }

    return calculatedPercentage;
  } catch (error) {
    console.error(`❌ Error syncing ${moduleType}:`, error);
    return 0;
  }
};


// ============================================================================
// WEEKLY DATA & REPORTS
// ============================================================================
export const saveWeeklyMilestone = async (userId: string, moduleType: WellnessModuleType, milestone: WeeklyMilestone): Promise<void> => {
  const weekRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('weeklyData').doc(milestone.weekNumber.toString());
  await weekRef.set(milestone, { merge: true });
};


export const getWeeklyMilestone = async (userId: string, moduleType: WellnessModuleType, weekNumber: number): Promise<WeeklyMilestone | null> => {
  const weekRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('weeklyData').doc(weekNumber.toString());
  const snapshot = await weekRef.get();
  return snapshot.exists() ? snapshot.data() as WeeklyMilestone : null; // ✅ FIX: Call exists()
};


export const saveWeeklyReport = async (userId: string, moduleType: WellnessModuleType, report: Omit<WeeklyReport, 'reportId' | 'generatedAt'>): Promise<void> => {
  const reportRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('weeklyReports').doc();
  await reportRef.set({ 
    ...report, 
    reportId: reportRef.id, 
    generatedAt: firestore.FieldValue.serverTimestamp() 
  });
};


export const getWeeklyReports = async (userId: string, moduleType: WellnessModuleType, limit: number = 10): Promise<WeeklyReport[]> => {
  const snapshot = await firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('weeklyReports')
    .orderBy('weekNumber', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(d => ({ 
    ...d.data(), 
    generatedAt: d.data().generatedAt?.toDate() || new Date() 
  })) as WeeklyReport[];
};


// ============================================================================
// MEDICAL REMINDERS
// ============================================================================
export const saveMedicalReminder = async (userId: string, moduleType: WellnessModuleType, reminder: MedicalReminder): Promise<void> => {
  const reminderRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('moduleData').doc('medicalReminders');
  const existingSnapshot = await reminderRef.get();
  const reminders = existingSnapshot.exists() ? existingSnapshot.data()?.reminders || [] : []; // ✅ FIX: Call exists()
  const updatedReminders = reminders.filter((r: MedicalReminder) => r.reminderId !== reminder.reminderId);
  updatedReminders.push(reminder);
  await reminderRef.set({ reminders: updatedReminders }, { merge: true });
};


export const getMedicalReminders = async (userId: string, moduleType: WellnessModuleType): Promise<MedicalReminder[]> => {
  const reminderRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('moduleData').doc('medicalReminders');
  const snapshot = await reminderRef.get();
  return snapshot.exists() ? snapshot.data()?.reminders || [] : []; // ✅ FIX: Call exists()
};


export const updateMedicalReminderStatus = async (userId: string, moduleType: WellnessModuleType, reminderId: string, completed: boolean, completedDate?: string): Promise<void> => {
  const reminders = await getMedicalReminders(userId, moduleType);
  const updatedReminders = reminders.map(r => r.reminderId === reminderId ? { ...r, completed, completedDate } : r);
  const reminderRef = firestore()
    .collection('users').doc(userId)
    .collection('wellnessModules').doc(moduleType)
    .collection('moduleData').doc('medicalReminders');
  await reminderRef.set({ reminders: updatedReminders }, { merge: true });
};


// ============================================================================
// MOTHER CARE OPERATIONS
// ============================================================================
export const startMotherCareModule = async (userId: string, motherName: string, lmpDate: string, dueDate: string): Promise<MotherCareProfile> => {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const totalDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const trimester = weeks <= 13 ? 1 : weeks <= 27 ? 2 : 3;

  const profile: MotherCareProfile = {
    moduleType: 'mother-care', motherName, isActive: true, startDate: lmpDate, currentDay: totalDays,
    currentWeek: weeks, programDuration: 280, completionPercentage: Math.round((totalDays / 280) * 100),
    lastUpdated: new Date(), notificationsEnabled: false, lmpDate, dueDate,
    currentWeekOfPregnancy: weeks, currentDayOfPregnancy: days, trimester,
  };

  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc('mother-care');
  await moduleRef.set({ 
    profile, 
    createdAt: firestore.FieldValue.serverTimestamp(), 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  return profile;
};


export const startMotherCareModuleManual = async (userId: string, motherName: string, currentWeek: number, currentDay: number): Promise<MotherCareProfile> => {
  const today = new Date();
  const totalDays = currentWeek * 7 + currentDay;
  const lmpDate = new Date(today); lmpDate.setDate(lmpDate.getDate() - totalDays);
  const dueDate = new Date(lmpDate); dueDate.setDate(dueDate.getDate() + 280);
  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;

  const profile: MotherCareProfile = {
    moduleType: 'mother-care', motherName, isActive: true, startDate: lmpDate.toISOString().split('T')[0],
    currentDay: totalDays, currentWeek, programDuration: 280, completionPercentage: Math.round((totalDays / 280) * 100),
    lastUpdated: new Date(), notificationsEnabled: false, lmpDate: lmpDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0], currentWeekOfPregnancy: currentWeek, currentDayOfPregnancy: currentDay, trimester,
  };

  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc('mother-care');
  await moduleRef.set({ 
    profile, 
    createdAt: firestore.FieldValue.serverTimestamp(), 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  return profile;
};


export const updatePregnancyProgress = async (userId: string): Promise<MotherCareProfile> => {
  const profile = (await getModuleProfile(userId, 'mother-care')) as MotherCareProfile;
  if (!profile?.lmpDate) throw new Error('Mother Care profile not found');

  const lmp = new Date(profile.lmpDate);
  const today = new Date();
  const totalDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const trimester = weeks <= 13 ? 1 : weeks <= 27 ? 2 : 3;

  const updatedProfile: MotherCareProfile = {
    ...profile, currentDay: totalDays, currentWeek: weeks, currentWeekOfPregnancy: weeks,
    currentDayOfPregnancy: days, trimester, completionPercentage: Math.min(Math.round((totalDays / 280) * 100), 100), lastUpdated: new Date(),
  };

  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc('mother-care');
  await moduleRef.update({ 
    profile: updatedProfile, 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  return updatedProfile;
};


export const deleteMotherCareModule = async (userId: string): Promise<void> => {
  await deleteWellnessModuleWithSubcollections(userId, 'mother-care');
};


export const updateMotherCareMetrics = async (userId: string, date: string, metrics: MotherCareMetrics): Promise<void> => {
  const tracking = await getDailyTracking(userId, 'mother-care', date);
  await saveDailyTracking(userId, 'mother-care', {
    date, dayNumber: tracking?.dayNumber || 1, tasks: tracking?.tasks || [],
    metrics: { ...tracking?.metrics, ...metrics }, overallCompletion: tracking?.overallCompletion || 0,
  });
};


// ============================================================================
// DELETE HELPER
// ============================================================================
const deleteWellnessModuleWithSubcollections = async (userId: string, moduleType: WellnessModuleType): Promise<void> => {
  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc(moduleType);
  
  // Delete subcollections
  const subcollections = ['dailyTracking', 'weeklyData', 'weeklyReports', 'moduleData'];
  for (const sub of subcollections) {
    const snapshot = await moduleRef.collection(sub).get();
    const batch = firestore().batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref)); // ✅ FIX: Add type annotation
    if (!snapshot.empty) await batch.commit();
  }
  
  // Delete main document
  await moduleRef.delete();
};


const deleteProfileWithSubcollections = async (basePath: string, extraSubCollections: string[] = []): Promise<void> => {
  const pathParts = basePath.split('/');
  let ref: any = firestore();
  
  // Build reference
  for (let i = 0; i < pathParts.length; i += 2) {
    ref = ref.collection(pathParts[i]).doc(pathParts[i + 1]);
  }
  
  // Delete subcollections
  const subcollections = ['dailyTracking', 'weeklyData', 'weeklyReports', 'moduleData', ...extraSubCollections];
  for (const sub of subcollections) {
    const snapshot = await ref.collection(sub).get();
    const batch = firestore().batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref)); // ✅ FIX: Add type annotation
    if (!snapshot.empty) await batch.commit();
  }
  
  // Delete main document
  await ref.delete();
};


// ============================================================================
// CHILD CARE OPERATIONS
// ============================================================================
export const createChildProfile = async (userId: string, childName: string, birthDate: string, gender?: 'male' | 'female'): Promise<ChildCareProfile> => {
  const childProfilesRef = firestore().collection('users').doc(userId).collection('childProfiles');
  const newChildRef = childProfilesRef.doc();
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30);

  let developmentalStage: '0-3m' | '3-6m' | '6-12m' | '12-24m' | '24-36m' | '36m+' = '0-3m';
  if (ageInMonths >= 36) developmentalStage = '36m+';
  else if (ageInMonths >= 24) developmentalStage = '24-36m';
  else if (ageInMonths >= 12) developmentalStage = '12-24m';
  else if (ageInMonths >= 6) developmentalStage = '6-12m';
  else if (ageInMonths >= 3) developmentalStage = '3-6m';

  const profile: ChildCareProfile = {
    childId: newChildRef.id, childName, birthDate, ageInMonths, ageInDays, gender, moduleType: 'child-care',
    isActive: true, startDate: today.toISOString().split('T')[0], currentDay: ageInDays, currentWeek: Math.floor(ageInDays / 7),
    programDuration: 60 * 30, completionPercentage: Math.min((ageInMonths / 60) * 100, 100), lastUpdated: new Date(),
    notificationsEnabled: false, developmentalStage, lastTrackedDate: today.toISOString().split('T')[0],
  };

  await newChildRef.set({ 
    profile, 
    createdAt: firestore.FieldValue.serverTimestamp(), 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  return profile;
};


export const createChildProfileManual = async (userId: string, childName: string, ageInMonths: number, gender?: 'male' | 'female'): Promise<ChildCareProfile> => {
  const today = new Date();
  const birthDate = new Date(today); birthDate.setMonth(birthDate.getMonth() - ageInMonths);
  return await createChildProfile(userId, childName, birthDate.toISOString().split('T')[0], gender);
};


export const getAllChildProfiles = async (userId: string): Promise<ChildProfileSummary[]> => {
  const snapshot = await firestore().collection('users').doc(userId).collection('childProfiles').get();
  if (snapshot.empty) return [];

  return snapshot.docs.map(d => {
    const profile = d.data().profile as ChildCareProfile;
    const years = Math.floor(profile.ageInMonths / 12);
    const months = profile.ageInMonths % 12;
    let ageDisplay = '';
    if (years > 0) ageDisplay = `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
    else if (profile.ageInDays && profile.ageInDays < 60) ageDisplay = `${profile.ageInDays} days`;
    else ageDisplay = `${profile.ageInMonths} month${profile.ageInMonths > 1 ? 's' : ''}`;

    return {
      childId: profile.childId, childName: profile.childName, ageInMonths: profile.ageInMonths,
      ageDisplay, gender: profile.gender, lastTrackedDate: profile.lastTrackedDate,
      photoUrl: profile.photoUrl, completionRate: profile.completionPercentage || 0,
    };
  }).sort((a, b) => (b.lastTrackedDate || '').localeCompare(a.lastTrackedDate || ''));
};


export const getChildProfile = async (userId: string, childId: string): Promise<ChildCareProfile | null> => {
  const snapshot = await firestore().collection('users').doc(userId).collection('childProfiles').doc(childId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null; // ✅ FIX: Check if data exists
  return { ...data.profile, lastUpdated: data.profile.lastUpdated?.toDate() || new Date() } as ChildCareProfile;
};


export const updateChildAge = async (userId: string, childId: string): Promise<ChildCareProfile> => {
  const profile = await getChildProfile(userId, childId);
  if (!profile) throw new Error('Child profile not found');

  const birth = new Date(profile.birthDate);
  const today = new Date();
  const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30);

  let developmentalStage: '0-3m' | '3-6m' | '6-12m' | '12-24m' | '24-36m' | '36m+' = '0-3m';
  if (ageInMonths >= 36) developmentalStage = '36m+';
  else if (ageInMonths >= 24) developmentalStage = '24-36m';
  else if (ageInMonths >= 12) developmentalStage = '12-24m';
  else if (ageInMonths >= 6) developmentalStage = '6-12m';
  else if (ageInMonths >= 3) developmentalStage = '3-6m';

  const updatedProfile: ChildCareProfile = {
    ...profile, ageInMonths, ageInDays, currentDay: ageInDays, currentWeek: Math.floor(ageInDays / 7),
    developmentalStage, completionPercentage: Math.min((ageInMonths / 60) * 100, 100),
    lastUpdated: new Date(), lastTrackedDate: today.toISOString().split('T')[0],
  };

  const childRef = firestore().collection('users').doc(userId).collection('childProfiles').doc(childId);
  await childRef.update({ 
    profile: updatedProfile, 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
  return updatedProfile;
};


export const updateChildProfile = async (userId: string, childId: string, updates: Partial<ChildCareProfile>): Promise<void> => {
  const profile = await getChildProfile(userId, childId);
  if (!profile) throw new Error('Child profile not found');
  const updatedProfile = { ...profile, ...updates, lastUpdated: new Date() };
  const childRef = firestore().collection('users').doc(userId).collection('childProfiles').doc(childId);
  await childRef.update({ 
    profile: updatedProfile, 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
};


export const deleteChildProfile = async (userId: string, childId: string): Promise<void> => {
  await deleteProfileWithSubcollections(`users/${userId}/childProfiles/${childId}`, ['weeklyAIContent']);
};


export const getChildDailyTracking = async (userId: string, childId: string, date: string): Promise<DailyTracking | null> => {
  const snapshot = await firestore()
    .collection('users').doc(userId)
    .collection('childProfiles').doc(childId)
    .collection('dailyTracking').doc(date)
    .get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null; // ✅ FIX: Check if data exists
  return { ...data, createdAt: data.createdAt?.toDate() || new Date() } as DailyTracking;
};


export const saveChildDailyTracking = async (userId: string, childId: string, tracking: Omit<DailyTracking, 'trackingId' | 'createdAt'>): Promise<void> => {
  const trackingRef = firestore()
    .collection('users').doc(userId)
    .collection('childProfiles').doc(childId)
    .collection('dailyTracking').doc(tracking.date);
  await trackingRef.set({ 
    ...tracking, 
    trackingId: trackingRef.id, 
    createdAt: firestore.FieldValue.serverTimestamp() 
  }, { merge: true });
};


export const getWeeklyAIContent = async (userId: string, childId: string, weekId: string): Promise<WeeklyAIContent | null> => {
  const snapshot = await firestore()
    .collection('users').doc(userId)
    .collection('childProfiles').doc(childId)
    .collection('weeklyAIContent').doc(weekId)
    .get();
  return snapshot.exists() ? snapshot.data() as WeeklyAIContent : null; // ✅ FIX: Call exists()
};


export const saveWeeklyAIContent = async (userId: string, childId: string, content: WeeklyAIContent): Promise<void> => {
  await firestore()
    .collection('users').doc(userId)
    .collection('childProfiles').doc(childId)
    .collection('weeklyAIContent').doc(content.weekId)
    .set(content);
};


export const getCurrentWeekContent = async (userId: string, childId: string, profile: ChildCareProfile): Promise<WeeklyAIContent> => {
  const weekId = getWeekId();
  const existingContent = await getWeeklyAIContent(userId, childId, weekId);
  if (existingContent && isContentValid(existingContent)) return existingContent;

  try {
    const newContent = await generateWeeklyContent(profile);
    await saveWeeklyAIContent(userId, childId, newContent);
    return newContent;
  } catch {
    const fallbackContent = createFallbackWeeklyContent(profile);
    await saveWeeklyAIContent(userId, childId, fallbackContent);
    return fallbackContent;
  }
};


export const deleteOldWeeklyContent = async (userId: string, childId: string, keepWeeks: number = 4): Promise<void> => {
  const snapshot = await firestore()
    .collection('users').doc(userId)
    .collection('childProfiles').doc(childId)
    .collection('weeklyAIContent')
    .get();
  const now = new Date();
  const deletePromises = snapshot.docs
    .filter(d => {
      const data = d.data() as WeeklyAIContent;
      const daysOld = (now.getTime() - new Date(data.expiresAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > keepWeeks * 7;
    })
    .map(d => d.ref.delete());
  await Promise.all(deletePromises);
};


// ============================================================================
// OTHER MODULE OPERATIONS
// ============================================================================
const saveModuleProfile = async (userId: string, moduleType: WellnessModuleType, profile: any): Promise<void> => {
  const moduleRef = firestore().collection('users').doc(userId).collection('wellnessModules').doc(moduleType);
  await moduleRef.set({ 
    profile, 
    createdAt: firestore.FieldValue.serverTimestamp(), 
    updatedAt: firestore.FieldValue.serverTimestamp() 
  });
};


export const startLiverKidneyModule = async (userId: string, condition: string, dietType: string, age: number, gender: 'male' | 'female'): Promise<LiverKidneyProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const profile: LiverKidneyProfile = {
    moduleType: 'liver-kidney', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: true,
    detoxDay: 1, hydrationGoalLiters: 3, dietPlan: dietType as 'detox' | 'maintenance', condition: condition as any,
    age, gender, currentLiverStatus: calculateLiverHealthStatus(condition, age), 
    currentKidneyStatus: calculateKidneyHealthStatus(condition, 3), lastTestDate: today,
  };
  await saveModuleProfile(userId, 'liver-kidney', profile);
  return profile;
};


export const startSkinHairModule = async (userId: string, concerns: string[], skinType: string, hairType: string, age: number, gender: 'male' | 'female'): Promise<SkinHairProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const skinConcerns = concerns.filter(c => ['acne', 'dull-skin', 'pigmentation', 'dry-skin', 'general'].includes(c));
  const hairConcerns = concerns.filter(c => ['hair-fall', 'damaged-hair', 'general'].includes(c));
  const profile: SkinHairProfile = {
    moduleType: 'skin-hair', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: true,
    concerns, primaryConcern: concerns[0], skinType: skinType as any, hairType: hairType as any, age, gender,
    currentSkinCondition: calculateSkinHealthStatus(skinConcerns.length > 0 ? skinConcerns : ['general'], skinType, age),
    currentHairCondition: calculateHairHealthStatus(hairConcerns.length > 0 ? hairConcerns : ['general'], hairType, age, gender),
    lastTreatmentDate: today,
  };
  await saveModuleProfile(userId, 'skin-hair', profile);
  return profile;
};


export const startGutHealthModule = async (userId: string, concern: string, dietType: string, age: number, gender: 'male' | 'female', severityLevel?: string): Promise<GutHealthProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const profile: GutHealthProfile = {
    moduleType: 'gut-health', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: true,
    concern: concern as any, dietType: dietType as any, age, gender,
    currentDigestiveHealth: calculateDigestiveHealthStatus(concern, (severityLevel as 'mild' | 'moderate' | 'severe') || 'mild'),
    lastCheckupDate: today, severityLevel: (severityLevel as any) || 'mild',
  };
  await saveModuleProfile(userId, 'gut-health', profile);
  return profile;
};


export const startBoneJointModule = async (userId: string, concern: string, affectedJoints: string[], age: number, gender: 'male' | 'female', activityLevel?: string, currentPainLevel?: number): Promise<BoneJointProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const painLevel = currentPainLevel || 0;
  const profile: BoneJointProfile = {
    moduleType: 'bone-joint', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: true,
    concern: concern as any, affectedJoints, age, gender,
    currentMobilityStatus: calculateMobilityStatus(concern, affectedJoints, painLevel),
    currentPainLevel: painLevel, lastCheckupDate: today, activityLevel: (activityLevel as any) || 'moderate',
  };
  await saveModuleProfile(userId, 'bone-joint', profile);
  return profile;
};


export const startTeethOralModule = async (userId: string, concern: string, age: number, gender: 'male' | 'female', smokingStatus?: string, hasDentalIssues?: boolean): Promise<TeethOralProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const smoking = smokingStatus || 'non-smoker';
  const hasIssues = hasDentalIssues || false;
  const profile: TeethOralProfile = {
    moduleType: 'teeth-oral', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: true,
    concern: concern as any, age, gender, currentDentalHealth: calculateDentalHealthStatus(concern, smoking, hasIssues),
    lastDentalVisit: today, hasDentalIssues: hasIssues, smokingStatus: smoking as any,
  };
  await saveModuleProfile(userId, 'teeth-oral', profile);
  return profile;
};


export const startBeautyFitnessModule = async (userId: string, goal: string, currentWeightKg: number, heightCm: number, age: number, gender: 'male' | 'female', targetWeightKg?: number, fitnessLevel?: string): Promise<BeautyFitnessProfile> => {
  const today = new Date().toISOString().split('T')[0];
  const bmi = currentWeightKg / ((heightCm / 100) ** 2);
  const profile: BeautyFitnessProfile = {
    moduleType: 'beauty-fitness', isActive: true, startDate: today, currentDay: 1, currentWeek: 1,
    programDuration: 30, completionPercentage: 0, lastUpdated: new Date(), notificationsEnabled: false,
    goal: goal as any, currentWeightKg, heightCm, age, gender, targetWeightKg: targetWeightKg || currentWeightKg,
    bmi: Math.round(bmi * 10) / 10, fitnessLevel: (fitnessLevel as any) || 'beginner', lastWeightCheckDate: today,
  };
  await saveModuleProfile(userId, 'beauty-fitness', profile);
  return profile;
};


export const deleteLiverKidneyModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'liver-kidney'); };
export const deleteSkinHairModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'skin-hair'); };
export const deleteGutHealthModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'gut-health'); };
export const deleteBoneJointModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'bone-joint'); };
export const deleteTeethOralModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'teeth-oral'); };
export const deleteBeautyFitnessModule = async (userId: string): Promise<void> => { await deleteWellnessModuleWithSubcollections(userId, 'beauty-fitness'); };


export const moduleExists = async (userId: string, moduleType: WellnessModuleType): Promise<boolean> => {
  const profile = await getModuleProfile(userId, moduleType);
  return profile !== null;
};


export const getActiveModules = async (userId: string): Promise<WellnessModuleType[]> => {
  const snapshot = await firestore().collection('users').doc(userId).collection('wellnessModules').get();
  return snapshot.docs
    .map(d => d.data().profile)
    .filter((p: any) => p?.isActive)
    .map((p: any) => p.moduleType);
};


// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================
export const wellnessService = {
  startWellnessModule, getModuleProfile, updateModuleProfile, deactivateModule, moduleExists, getActiveModules,
  syncCompletionPercentage, getDailyTaskCompletion,
  saveDailyTracking, getDailyTracking, getDailyTrackingRange, toggleTaskCompletion, updateCompletionPercentage,
  saveWeeklyMilestone, getWeeklyMilestone, saveWeeklyReport, getWeeklyReports,
  saveMedicalReminder, getMedicalReminders, updateMedicalReminderStatus,
  startMotherCareModule, startMotherCareModuleManual, updatePregnancyProgress, deleteMotherCareModule, updateMotherCareMetrics,
  createChildProfile, createChildProfileManual, getAllChildProfiles, getChildProfile, updateChildAge,
  updateChildProfile, deleteChildProfile, getChildDailyTracking, saveChildDailyTracking,
  getWeeklyAIContent, saveWeeklyAIContent, getCurrentWeekContent, deleteOldWeeklyContent,
  startLiverKidneyModule, startSkinHairModule, startGutHealthModule, startBoneJointModule, startTeethOralModule, startBeautyFitnessModule,
  deleteLiverKidneyModule, deleteSkinHairModule, deleteGutHealthModule, deleteBoneJointModule, deleteTeethOralModule, deleteBeautyFitnessModule,
};
