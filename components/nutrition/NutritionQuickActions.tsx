// components/nutrition/NutritionQuickActions.tsx
// ✅ UPDATED: Simplified to only Scan Meal feature (Dec 28, 2025)

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { analyzeMealFromImage } from '../../services/nutritionAIService';
import { nutritionService } from '../../services/nutritionService';
import { getTodayISO } from '../../utils/dateUtils';
import MealTypeSelectorModal, { MealType } from './MealTypeSelectorModal';

type Props = {
  onEntryAdded: () => void;
};

type PendingAnalysis = {
  uri: string;
  calories: number;
  foods: {
    name: string;
    quantity: number;
    unit?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  };
  insight: string;
} | null;

export default function NutritionQuickActions({ onEntryAdded }: Props) {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);

  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis>(null);
  const [savingScannedMeal, setSavingScannedMeal] = useState(false);

  const handleScanMeal = async () => {
    try {
      if (!user?.uid) {
        Alert.alert('Not logged in', 'Please sign in to log meals.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow photo access in your settings to scan meals.'
        );
        return;
      }

      Alert.alert(
        'Scan Meal',
        'Choose an option:',
        [
          { text: 'Take Photo', onPress: () => launchCamera() },
          { text: 'Choose from Gallery', onPress: () => launchGallery() },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Scan meal error:', error);
      Alert.alert('Error', 'Failed to open camera/gallery.');
    }
  };

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        await processMealImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const launchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        await processMealImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const processMealImage = async (uri: string) => {
    try {
      setScanning(true);

      if (!user?.uid) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      const analysis = await analyzeMealFromImage(uri);

      setPendingAnalysis({
        uri,
        calories: analysis.totals.calories,
        foods: analysis.foods,
        totals: {
          calories: analysis.totals.calories,
          protein: analysis.totals.protein,
          carbs: analysis.totals.carbs,
          fat: analysis.totals.fat,
          sugar: analysis.totals.sugar || 0,
          sodium: analysis.totals.sodium || 0,
        },
        insight: analysis.insight,
      });

      setMealTypeModalVisible(true);
    } catch (error: any) {
      console.error('❌ Process meal error:', error);
      
      // ✅ Split multi-line error messages into title and message
      const errorMessage = error.message || 'Could not analyze the meal. Please try again.';
      const lines = errorMessage.split('\n');
      const title = lines[0] || 'Analysis Failed';
      const message = lines.slice(1).join('\n') || 'Please try again with a clearer photo.';
      
      Alert.alert(title, message, [{ text: 'OK' }]);
    } finally {
      setScanning(false);
    }
  };

  const handleMealTypeSelected = async (mealType: MealType) => {
    if (!user?.uid || !pendingAnalysis) {
      setMealTypeModalVisible(false);
      setPendingAnalysis(null);
      return;
    }

    try {
      setSavingScannedMeal(true);

      const today = getTodayISO();
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const normalizedFoods = pendingAnalysis.foods.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit || 'serving',
        calories: f.calories ?? 0,
        protein: f.protein ?? 0,
        carbs: f.carbs ?? 0,
        fat: f.fat ?? 0,
      }));

      await nutritionService.addEntry(user.uid, {
        date: today,
        mealType,
        time,
        foods: normalizedFoods,
        totalCalories: pendingAnalysis.totals.calories,
        totalProtein: pendingAnalysis.totals.protein,
        totalCarbs: pendingAnalysis.totals.carbs,
        totalFats: pendingAnalysis.totals.fat,
        totalSugar: pendingAnalysis.totals.sugar || 0,
        totalSodium: pendingAnalysis.totals.sodium || 0,
        images: [pendingAnalysis.uri],
        notes: pendingAnalysis.insight,
      });

      Alert.alert(
        'Meal Logged!',
        `Saved as ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} with ~${
          pendingAnalysis.totals.calories
        } kcal.\n\n${pendingAnalysis.insight}`,
        [{ text: 'OK' }]
      );

      onEntryAdded();
    } catch (error: any) {
      console.error('❌ Save meal error:', error);
      Alert.alert(
        'Save Failed',
        error.message || 'Could not save the meal. Please try again.'
      );
    } finally {
      setSavingScannedMeal(false);
      setMealTypeModalVisible(false);
      setPendingAnalysis(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Scan Meal Button with dotted border */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={handleScanMeal}
        disabled={scanning}
      >
        <View style={styles.iconCircle}>
          {scanning ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Ionicons name="scan-outline" size={20} color={Colors.light.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{scanning ? 'Analyzing...' : 'Scan Meal'}</Text>
          <Text style={styles.subtitle}>Use AI to estimate calories & macros</Text>
        </View>
      </TouchableOpacity>

      <MealTypeSelectorModal
        visible={mealTypeModalVisible}
        onClose={() => {
          if (!savingScannedMeal) {
            setMealTypeModalVisible(false);
            setPendingAnalysis(null);
          }
        }}
        onSelect={handleMealTypeSelected}
        loading={savingScannedMeal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.light.primary + '44',
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
