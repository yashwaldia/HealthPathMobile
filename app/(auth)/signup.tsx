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
import { signUpWithEmail } from '../../services/authService';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    console.log('📝 Sign up button pressed');
    
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Missing Information', 'Please enter a password');
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Missing Information', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
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
      await signUpWithEmail(email.trim(), password, fullName.trim());
      Alert.alert(
        'Success!', 
        'Your account has been created successfully!',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join HealthPath and start your wellness journey!</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.light.textLight}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.light.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/login')}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 32,
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
    marginBottom: 16,
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
  createButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
