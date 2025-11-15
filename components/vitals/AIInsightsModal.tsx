import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { VitalRecord } from '../../types/vitals';
import { getHealthRecommendations } from '../../services/aiService';

interface AIInsightsModalProps {
  visible: boolean;
  onClose: () => void;
  latestVitals: Partial<VitalRecord>;
}

// Helper function to parse markdown-like text to React Native components
const parseMarkdownText = (text: string) => {
  const parts: any[] = [];
  let lastIndex = 0;

  // Regex to find **bold** and numbered lists
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: text.substring(lastIndex, match.index),
      });
    }
    // Add bold text
    parts.push({
      type: 'bold',
      text: match[1],
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      text: text.substring(lastIndex),
    });
  }

  return parts;
};

// Component to render parsed text with bold styling
const FormattedText = ({ text, style }: { text: string; style: any }) => {
  const parts = parseMarkdownText(text);

  return (
    <Text style={style}>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.type === 'bold' ? [style, styles.boldText] : style}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

export default function AIInsightsModal({
  visible,
  onClose,
  latestVitals,
}: AIInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');

  // --- ANIMATION VALUES ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Load insights
      loadInsights();
    }
  }, [visible]);

  const loadInsights = async () => {
    setLoading(true);
    setInsights('');
    try {
      const recommendations = await getHealthRecommendations(latestVitals);
      setInsights(recommendations);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights('Unable to generate insights at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasData = Object.keys(latestVitals).some(
    key => key !== 'id' && key !== 'userId' && key !== 'date' && key !== 'source' && latestVitals[key as keyof VitalRecord]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={24} color={Colors.light.primary} />
              <Text style={styles.headerTitle}>AI Health Insights</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {!hasData ? (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No vitals data available</Text>
              <Text style={styles.emptySubtext}>Add vital readings to get personalized health insights</Text>
            </View>
          ) : loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loaderText}>Analyzing your vitals...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              <View style={styles.insightCard}>
                <FormattedText text={insights} style={styles.insightText} />
              </View>

              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Quick Health Tips</Text>
                <View style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>Monitor your readings regularly for better insights</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>Share your data with your healthcare provider</Text>
                </View>
                <View style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>Use Smart Upload for instant AI analysis</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 200,
  },
  insightCard: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
  },
  boldText: {
    fontWeight: '700',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
  },
  tipBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  button: {
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
