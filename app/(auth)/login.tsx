// app/(auth)/login.tsx

import React, { useState, useRef } from 'react';
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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { ConfirmationResult } from 'firebase/auth';
import { Colors } from '../../constants/colors';
import { 
  signInWithEmail, 
  sendPhoneOTP, 
  // NOTE: use the login-specific verify function
  verifyPhoneOTPForLogin,
  validatePhoneNumber 
} from '../../services/authService';

// ✅ FIX: Get Firebase config directly instead of importing app
const getFirebaseConfig = () => {
  return {
    apiKey: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_HEALTHPATH_FIREBASE_APP_ID,
  };
};

type AuthMethod = 'email' | 'phone';

export default function LoginScreen() {
  const router = useRouter();
  
  // Common State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [loading, setLoading] = useState(false);
  
  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone State
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Recaptcha
  const recaptchaVerifier = useRef<any>(null);

  // ============================================
  // EMAIL LOGIN
  // ============================================
  
  const handleEmailLogin = async () => {
    console.log('🔐 Email login button pressed');
    
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

  // ============================================
  // PHONE LOGIN - SEND OTP
  // ============================================
  
  const handleSendOTP = async () => {
    console.log('📱 Send OTP button pressed');
    
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number');
      return;
    }

    // Validate phone number format
    if (!validatePhoneNumber(fullPhoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number with country code.\nExample: +91 9876543210'
      );
      return;
    }

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
  // PHONE LOGIN - VERIFY OTP (LOGIN-ONLY)
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
      
      // IMPORTANT: use login-specific verify that does NOT auto-create a profile
      await verifyPhoneOTPForLogin(confirmationResult, verificationCode);
      
      console.log('✅ Phone login successful, navigating to app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      // If profile is missing, authService should throw a message like:
      // "No account found for this phone number. Please sign up first."
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
  // TAB SWITCH
  // ============================================
  
  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    // Reset states when switching
    if (method === 'email') {
      setPhoneNumber('');
      setVerificationCode('');
      setOtpSent(false);
      setConfirmationResult(null);
      setResendTimer(0);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ✅ Recaptcha Verifier Modal (Required for Phone Auth) */}
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
            <Text style={styles.title}>Login here</Text>
            <Text style={styles.subtitle}>Welcome back, you've been missed!</Text>
          </View>

          {/* ✅ NEW: Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, authMethod === 'email' && styles.activeTab]}
              onPress={() => switchAuthMethod('email')}
              disabled={loading}
            >
              <Text style={[styles.tabText, authMethod === 'email' && styles.activeTabText]}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, authMethod === 'phone' && styles.activeTab]}
              onPress={() => switchAuthMethod('phone')}
              disabled={loading}
            >
              <Text style={[styles.tabText, authMethod === 'phone' && styles.activeTabText]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.form}>
            {authMethod === 'email' ? (
              // ============================================
              // EMAIL LOGIN FORM
              // ============================================
              <>
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
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign in</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // ============================================
              // ✅ NEW: PHONE LOGIN FORM
              // ============================================
              <>
                {!otpSent ? (
                  // Phone Number Input
                  <>
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
                      style={[styles.signInButton, loading && styles.buttonDisabled, { marginTop: 20 }]}
                      onPress={handleSendOTP}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.signInButtonText}>Send OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  // OTP Verification
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
                      style={[styles.signInButton, loading && styles.buttonDisabled]}
                      onPress={handleVerifyOTP}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.signInButtonText}>Verify OTP</Text>
                      )}
                    </TouchableOpacity>

                    {/* Resend OTP */}
                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>Didn't receive the code? </Text>
                      <TouchableOpacity
                        onPress={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                      >
                        <Text style={[
                          styles.resendLink,
                          (resendTimer > 0 || loading) && styles.resendLinkDisabled
                        ]}>
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
              </>
            )}

            {/* Create Account Link */}
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/signup')}
              disabled={loading}
              style={styles.createAccountContainer}
            >
              <Text style={styles.createAccount}>Create new account</Text>
            </TouchableOpacity>
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
  
  // ✅ NEW: Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
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
  
  // ✅ NEW: Phone Input Styles
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
  
  // ✅ NEW: OTP Styles
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
  
  // ✅ NEW: Resend OTP Styles
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
  
  // ✅ NEW: Change Number Button
  changeNumberButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
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
  createAccountContainer: {
    marginTop: 8,
  },
  createAccount: {
    color: Colors.light.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
