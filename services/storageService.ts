// services/storageService.ts
// ✅ FIXED: Updated to React Native Firebase v23 (using putFile instead of put/blob)
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { Alert, Platform } from 'react-native';

class StorageService {
  /**
   * Request camera roll permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to upload photos.'
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick an image from the device
   */
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Fixed deprecated MediaTypeOptions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Changed from MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  /**
   * Upload profile photo to Firebase Storage
   * ✅ FIXED: Using putFile() instead of put(blob) for React Native Firebase
   */
  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string | null> {
    try {
      console.log('📤 Starting upload for user:', userId);
      console.log('📷 Image URI:', imageUri);

      // ✅ Validate authentication first
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to upload files');
      }

      if (currentUser.uid !== userId) {
        throw new Error('User ID mismatch - authentication error');
      }

      // Determine MIME type from file extension
      const mimeType = imageUri.toLowerCase().endsWith('.png') 
        ? 'image/png' 
        : 'image/jpeg';

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      const storagePath = `profile-photos/${filename}`;

      console.log('📁 Storage path:', storagePath);
      console.log('🔑 MIME type:', mimeType);

      const storageRef = storage().ref(storagePath);

      // ✅ FIXED: Use putFile() for React Native Firebase (NOT put(blob))
      // This directly uploads from the local file system without fetching as blob
      console.log('⬆️ Starting upload with putFile()...');
      const uploadTask = storageRef.putFile(imageUri, {
        contentType: mimeType,
        customMetadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Wait for upload to complete using Promise
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (taskSnapshot) => {
            // Progress tracking
            const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
            console.log(`📊 Upload Progress: ${Math.round(progress)}%`);
            console.log(`📦 Bytes: ${taskSnapshot.bytesTransferred} / ${taskSnapshot.totalBytes}`);
          }
        );

        uploadTask.then(async () => {
          try {
            console.log('✅ Upload Complete! Getting download URL...');
            
            // Get download URL
            const downloadURL = await storageRef.getDownloadURL();
            console.log('🔗 Download URL:', downloadURL);
            
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(error);
          }
        });

        uploadTask.catch((error) => {
          console.error('❌ Upload Error:', error);
          console.error('❌ Error Code:', error.code);
          console.error('❌ Error Message:', error.message);

          // Provide more specific error messages
          if (error?.code === 'storage/unauthorized') {
            Alert.alert(
              'Upload Failed',
              'Permission denied. Please check Firebase Storage rules in your Firebase Console.'
            );
          } else if (error?.code === 'storage/canceled') {
            Alert.alert('Upload Canceled', 'The upload was canceled.');
          } else if (error?.code === 'storage/unknown') {
            Alert.alert(
              'Upload Failed',
              'Storage permission error. Please update Firebase Storage rules to allow authenticated uploads.'
            );
          } else if (error?.code === 'storage/retry-limit-exceeded') {
            Alert.alert(
              'Upload Failed',
              'Upload timeout. Please check your internet connection and try again.'
            );
          } else {
            Alert.alert(
              'Upload Failed',
              `${error?.message || 'Unknown error occurred'}`
            );
          }

          reject(error);
        });
      });
    } catch (error: any) {
      console.error('❌ Error uploading profile photo:', error);
      console.error('❌ Error Type:', error?.constructor?.name);
      console.error('❌ Error Code:', error?.code);
      console.error('❌ Error Message:', error?.message);
      
      Alert.alert('Upload Failed', error?.message || 'Failed to upload profile photo');
      return null;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to delete files');
      }

      // Extract path from URL for React Native Firebase
      const path = decodeURIComponent(fileUrl.split('/o/')[1]?.split('?')[0] || fileUrl);
      await storage().ref(path).delete();
      console.log('✅ File deleted successfully:', fileUrl);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Upload document/report to Firebase Storage
   * ✅ FIXED: Using putFile() instead of put(blob) for React Native Firebase
   */
  async uploadDocument(
    userId: string,
    documentUri: string,
    documentType: string
  ): Promise<string | null> {
    try {
      console.log('📄 Starting document upload for user:', userId);
      console.log('📎 Document URI:', documentUri);

      // ✅ Validate authentication
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to upload files');
      }

      if (currentUser.uid !== userId) {
        throw new Error('User ID mismatch - authentication error');
      }

      // Determine MIME type from file extension
      const isPdf = documentUri.toLowerCase().endsWith('.pdf');
      const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

      const timestamp = Date.now();
      const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-]/g, '_');
      const filename = `${sanitizedDocType}_${userId}_${timestamp}`;
      const storagePath = `documents/${userId}/${filename}`;

      console.log('📁 Storage path:', storagePath);
      console.log('📄 MIME type:', mimeType);

      const storageRef = storage().ref(storagePath);

      // ✅ FIXED: Use putFile() for React Native Firebase
      console.log('⬆️ Starting document upload with putFile()...');
      const uploadTask = storageRef.putFile(documentUri, {
        contentType: mimeType,
        customMetadata: {
          userId: userId,
          documentType: documentType,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Wait for upload to complete
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (taskSnapshot) => {
            const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
            console.log(`📊 Document Upload Progress: ${Math.round(progress)}%`);
          }
        );

        uploadTask.then(async () => {
          try {
            console.log('✅ Document Upload Complete! Getting download URL...');
            const downloadURL = await storageRef.getDownloadURL();
            console.log('🔗 Document Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(error);
          }
        });

        uploadTask.catch((error) => {
          console.error('❌ Document Upload Error:', error);
          Alert.alert('Error', 'Failed to upload document');
          reject(error);
        });
      });
    } catch (error: any) {
      console.error('❌ Error uploading document:', error);
      Alert.alert('Error', error?.message || 'Failed to upload document');
      return null;
    }
  }
}

export const storageService = new StorageService();
