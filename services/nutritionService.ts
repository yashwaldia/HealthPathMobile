// services/nutritionService.ts

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type NutritionFoodItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  sodium?: number;
};

export type NutritionEntry = {
  entryId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string; // HH:mm
  foods: NutritionFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalSugar?: number;
  totalSodium?: number;
  images?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const cleanData = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
};

const getCollectionRef = (userId: string) =>
  collection(db, `users/${userId}/nutrition`);

export const nutritionService = {
  async addEntry(
    userId: string,
    entryData: Omit<NutritionEntry, 'entryId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const colRef = getCollectionRef(userId);
    const newDocRef = doc(colRef);
    const now = new Date();

    const payload: NutritionEntry = {
      entryId: newDocRef.id,
      userId,
      ...entryData,
      createdAt: now,
      updatedAt: now,
    };

    const cleaned = cleanData({
      ...payload,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    await setDoc(newDocRef, cleaned);
    return newDocRef.id;
  },

  async getEntry(userId: string, entryId: string): Promise<NutritionEntry | null> {
    const docRef = doc(db, `users/${userId}/nutrition`, entryId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as any;
    return {
      ...(data as NutritionEntry),
      entryId: snap.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    };
  },

  async getForDate(userId: string, date: string): Promise<NutritionEntry[]> {
    const colRef = getCollectionRef(userId);
    const qRef = query(colRef, where('date', '==', date), orderBy('date', 'asc'));
    const snapshot = await getDocs(qRef);

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        ...(data as NutritionEntry),
        entryId: docSnap.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      };
    });

    // Optional: sort by time in memory
    return items.sort((a, b) => a.time.localeCompare(b.time));
  },

  async getInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<NutritionEntry[]> {
    const colRef = getCollectionRef(userId);
    const qRef = query(
      colRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(qRef);

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        ...(data as NutritionEntry),
        entryId: docSnap.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      };
    });

    // Optional: sort by date + time for charts
    return items.sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return a.date.localeCompare(b.date);
    });
  },

  async updateEntry(
    userId: string,
    entryId: string,
    updates: Partial<NutritionEntry>
  ): Promise<void> {
    const docRef = doc(db, `users/${userId}/nutrition`, entryId);

    const cleaned = cleanData({
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    await updateDoc(docRef, cleaned);
  },

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/nutrition`, entryId);
    await deleteDoc(docRef);
  },
};
