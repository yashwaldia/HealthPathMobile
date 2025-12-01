import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { predictNutrientDeficiencies, DeficiencyInsight } from '../../services/nutritionAIService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  onAnalysisComplete?: (result: DeficiencyInsight) => void;
};

export default function NutritionDeficiencyCard({ onAnalysisComplete }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<DeficiencyInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Run analysis ONLY when user requests
  const runAnalysis = async () => {
    if (!user?.uid) {
      setError('Please sign in to run analysis');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setHasRun(true);

      const result = await predictNutrientDeficiencies(user.uid);

      setInsight(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze nutrient deficiencies');
      Alert.alert('Analysis Failed', err.message || 'Unable to run predictor. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = () => {
    Alert.alert(
      'Re-run Analysis',
      'This will analyze your last 30 days of nutrition and lab data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run', onPress: runAnalysis },
      ]
    );
  };

  // If still loading analysis
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Nutrient Deficiency Predictor</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Analyzing your nutrition data...</Text>
        </View>
      </View>
    );
  }

  // If error and no previous data
  if (error && !insight) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Nutrient Deficiency Predictor</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.light.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <TouchableOpacity style={styles.rerunButton} onPress={runAnalysis} disabled={loading}>
          <Text style={styles.rerunText}>Try Again</Text>
          <Ionicons name="refresh-circle" size={18} color={Colors.light.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    );
  }

  // If no data yet (user not logged in or hasn't run)
  if (!insight) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.title}>Nutrient Deficiency Predictor</Text>
        </View>
        <Text style={styles.summary}>
          Run AI-powered analysis to identify potential nutrient gaps based on your diet and lab reports.
        </Text>
        <TouchableOpacity style={styles.rerunButton} onPress={runAnalysis} disabled={loading}>
          <Text style={styles.rerunText}>Run Analysis</Text>
          <Ionicons name="arrow-forward-circle" size={18} color={Colors.light.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    );
  }

  // Display results
  const deficiencies = insight.deficiencies || [];
  const hasDeficiencies = deficiencies.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="flask-outline" size={20} color={Colors.light.primary} />
        <Text style={styles.title}>Nutrient Deficiency Predictor</Text>
      </View>

      {hasDeficiencies ? (
        <>
          <View style={styles.chipRow}>
            {deficiencies.slice(0, 5).map((def, i) => (
              <View style={styles.chip} key={i}>
                <Text style={styles.chipText}>
                  {def.name} ({Math.round(def.confidence * 100)}%)
                </Text>
              </View>
            ))}
            {deficiencies.length > 5 && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>+{deficiencies.length - 5} more</Text>
              </View>
            )}
          </View>

          <Text style={styles.summary}>{insight.summary}</Text>

          {/* Show top deficiency details */}
          {deficiencies.length > 0 && (
            <View style={styles.detailBox}>
              <Text style={styles.detailTitle}>Top Concern: {deficiencies[0].name}</Text>
              <Text style={styles.detailReasons}>{deficiencies[0].reasons}</Text>
              <Text style={styles.detailLabel}>Suggested foods:</Text>
              <Text style={styles.detailFoods}>
                {deficiencies[0].suggestedFoods.join(', ')}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.light.success} />
            <Text style={styles.successText}>No significant deficiencies detected! 🎉</Text>
          </View>
          <Text style={styles.summary}>{insight.summary}</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.rerunButton}
        onPress={handleRerun}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={[styles.rerunText, { marginLeft: 6 }]}>Analyzing...</Text>
          </>
        ) : (
          <>
            <Text style={styles.rerunText}>Re-run analysis</Text>
            <Ionicons name="refresh-circle" size={18} color={Colors.light.primary} style={{ marginLeft: 4 }} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ...same as previously shared styles...
  container: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    borderRadius: 8,
    backgroundColor: Colors.light.primary + '11',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  summary: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginVertical: 6,
    lineHeight: 18,
  },
  detailBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.light.primary + '08',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  detailReasons: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 4,
    marginBottom: 2,
  },
  detailFoods: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  rerunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.primary + '1A',
    borderRadius: 12,
  },
  rerunText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.error,
    lineHeight: 16,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.success,
    fontWeight: '600',
  },
});
