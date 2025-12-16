// services/nutritionService.ts
import firestore from '@react-native-firebase/firestore';

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
  firestore()
    .collection('users')
    .doc(userId)
    .collection('nutrition');

export const nutritionService = {
  async addEntry(
    userId: string,
    entryData: Omit<NutritionEntry, 'entryId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const colRef = getCollectionRef(userId);
    const newDocRef = colRef.doc();
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
      createdAt: firestore.Timestamp.fromDate(now),
      updatedAt: firestore.Timestamp.fromDate(now),
    });

    await newDocRef.set(cleaned);
    return newDocRef.id;
  },

  async getEntry(userId: string, entryId: string): Promise<NutritionEntry | null> {
    const snap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('nutrition')
      .doc(entryId)
      .get();

    if (!snap.exists) return null;

    const data = snap.data();
    if (!data) return null;

    return {
      ...(data as any as NutritionEntry),
      entryId: snap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },

  async getForDate(userId: string, date: string): Promise<NutritionEntry[]> {
    const snapshot = await getCollectionRef(userId)
      .where('date', '==', date)
      .orderBy('date', 'asc')
      .get();

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...(data as any as NutritionEntry),
        entryId: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
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
    const snapshot = await getCollectionRef(userId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...(data as any as NutritionEntry),
        entryId: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
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
    const docRef = getCollectionRef(userId).doc(entryId);

    const cleaned = cleanData({
      ...updates,
      updatedAt: firestore.Timestamp.fromDate(new Date()),
    });

    await docRef.update(cleaned);
  },

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await getCollectionRef(userId).doc(entryId).delete();
  },
};
