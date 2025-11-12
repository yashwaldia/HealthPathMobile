import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { signInWithEmail } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    console.log('🔐 Login button pressed');
    
    // Validation
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Missing Information', 'Please enter your password');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      console.log('✅ Login successful, navigating to app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Login here</Text>
            <Text style={styles.subtitle}>Welcome back, you've been missed!</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.light.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.light.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotContainer}
              disabled={loading}
            >
              <Text style={styles.forgotPassword}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Create Account Link */}
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/signup')}
              disabled={loading}
            >
              <Text style={styles.createAccount}>Create new account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    top: 14,
  },
  eyeText: {
    fontSize: 20,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  forgotPassword: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  createAccount: {
    color: Colors.light.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
