// app/(auth)/signup.tsx

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRouter } from 'expo-router';
import type { ConfirmationResult } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import {
  sendPhoneOTP,
  validatePhoneNumber,
  verifyPhoneOTPForSignup,
} from '../../services/authService';

// Get Firebase config directly
const getFirebaseConfig = () => {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
};

export default function SignUpScreen() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP State
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Recaptcha
  const recaptchaVerifier = useRef<any>(null);

  // ============================================
  // VALIDATION HELPER
  // ============================================
  
  const validateForm = (): boolean => {
    // Full Name
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name');
      return false;
    }

    // Email
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    // Password
    if (!password) {
      Alert.alert('Missing Information', 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }

    // Confirm Password
    if (!confirmPassword) {
      Alert.alert('Missing Information', 'Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return false;
    }

    // Phone Number
    if (!phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number');
      return false;
    }

    const fullPhoneNumber = countryCode + phoneNumber;
    if (!validatePhoneNumber(fullPhoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number with country code.\nExample: +91 9876543210'
      );
      return false;
    }

    return true;
  };

  // ============================================
  // SEND OTP
  // ============================================
  
  const handleSendOTP = async () => {
    console.log('📱 Send OTP button pressed');
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }

    const fullPhoneNumber = countryCode + phoneNumber;

    setLoading(true);
    try {
      console.log('📞 Sending OTP to:', fullPhoneNumber);
      
      const confirmation = await sendPhoneOTP(
        fullPhoneNumber,
        recaptchaVerifier.current
      );
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      startResendTimer();
      
      Alert.alert(
        'OTP Sent!',
        `Verification code has been sent to ${fullPhoneNumber}`,
        [{ text: 'OK' }]
      );
      
      console.log('✅ OTP sent successfully');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert('Failed to Send OTP', error.message);
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VERIFY OTP & CREATE ACCOUNT
  // ============================================
  
  const handleVerifyOTP = async () => {
    console.log('🔐 Verify OTP button pressed');
    
    // Validation
    if (!verificationCode.trim()) {
      Alert.alert('Missing Information', 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Verification code must be 6 digits');
      return;
    }

    if (!confirmationResult) {
      Alert.alert('Error', 'Please request a new verification code');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying OTP code...');

      // ✅ FIXED: Now passing fullName as displayName to the credentials
      await verifyPhoneOTPForSignup(confirmationResult, verificationCode, {
        email: email.trim(),
        password: password,
        displayName: fullName.trim(), // ✅ CHANGE: Added fullName here
      });
      
      Alert.alert(
        'Success!', 
        'Your account has been created successfully!',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('Verification Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESEND OTP
  // ============================================
  
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setVerificationCode('');
    setOtpSent(false);
    setConfirmationResult(null);
    
    // Retry sending OTP
    await handleSendOTP();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Recaptcha Verifier Modal (Required for Phone Auth) */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={getFirebaseConfig()}
        attemptInvisibleVerification={true}
      />

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

          {/* Form Container */}
          <View style={styles.form}>
            {!otpSent ? (
              // ============================================
              // SIGNUP FORM (Unified - All Fields)
              // ============================================
              <>
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

                {/* Phone Number */}
                <Text style={styles.phoneLabel}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  {/* Country Code Input */}
                  <TextInput
                    style={styles.countryCodeInput}
                    value={countryCode}
                    onChangeText={setCountryCode}
                    keyboardType="phone-pad"
                    placeholder="+91"
                    placeholderTextColor={Colors.light.textLight}
                    editable={!loading}
                    maxLength={4}
                  />
                  
                  {/* Phone Number Input */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    placeholderTextColor={Colors.light.textLight}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    editable={!loading}
                    maxLength={10}
                  />
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[styles.createButton, loading && styles.buttonDisabled, { marginTop: 20 }]}
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // ============================================
              // OTP VERIFICATION
              // ============================================
              <>
                <Text style={styles.otpLabel}>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.phoneNumberDisplay}>
                    {countryCode} {phoneNumber}
                  </Text>
                </Text>

                {/* OTP Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={Colors.light.textLight}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    textAlign="center"
                    autoFocus
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.createButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Verify & Create Account</Text>
                  )}
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                  >
                    <Text
                      style={[
                        styles.resendLink,
                        (resendTimer > 0 || loading) && styles.resendLinkDisabled
                      ]}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Change Number */}
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setVerificationCode('');
                    setConfirmationResult(null);
                    setResendTimer(0);
                  }}
                  disabled={loading}
                  style={styles.changeNumberButton}
                >
                  <Text style={styles.changeNumberText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}

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

// ============================================
// STYLES
// ============================================

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
  phoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCodeInput: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    width: 70,
    textAlign: 'center',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  otpLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneNumberDisplay: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: Colors.light.textLight,
  },
  changeNumberButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
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