import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../assets/images/welcomecard.jpeg')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>HealthPath</Text>
          <Text style={styles.subtitle}>Your AI-Powered Health Companion</Text>
          <Text style={styles.description}>
            Track your health metrics, analyze lab reports, and get personalized insights powered by AI
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustration: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    overflow: 'hidden', // Ensures the image corners are clipped
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  buttonContainer: {
    gap: 14,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  registerButtonText: {
    color: Colors.light.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
