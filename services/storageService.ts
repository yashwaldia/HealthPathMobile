import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';
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
   */
  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string | null> {
    try {
      console.log('📤 Starting upload for user:', userId);
      console.log('📷 Image URI:', imageUri);

      // Fetch the image as a blob
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      console.log('📦 Blob size:', blob.size, 'bytes');
      console.log('📦 Blob type:', blob.type);

      // Check blob size (limit to 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image size must be less than 5MB');
        return null;
      }

      // Verify blob is valid
      if (blob.size === 0) {
        throw new Error('Invalid image blob - size is 0 bytes');
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      const storageRef = ref(storage, `profile-photos/${filename}`);

      console.log('📁 Storage path:', `profile-photos/${filename}`);

      // Upload the blob with metadata
      const metadata = {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      };

      console.log('⬆️ Uploading to Firebase Storage...');
      console.log('🔑 Storage instance:', storage.app.name);
      
      const snapshot = await uploadBytes(storageRef, blob, metadata);
      console.log('✅ Upload complete!', snapshot.metadata.fullPath);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading profile photo:', error);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
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
      
      return null;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log('✅ File deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Upload document/report to Firebase Storage
   */
  async uploadDocument(
    userId: string,
    documentUri: string,
    documentType: string
  ): Promise<string | null> {
    try {
      const response = await fetch(documentUri);
      const blob = await response.blob();

      // Check blob size (limit to 10MB for documents)
      if (blob.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'Document size must be less than 10MB');
        return null;
      }

      const timestamp = Date.now();
      const filename = `${documentType}_${userId}_${timestamp}`;
      const storageRef = ref(storage, `documents/${userId}/${filename}`);

      const metadata = {
        contentType: blob.type,
        customMetadata: {
          userId: userId,
          documentType: documentType,
          uploadedAt: new Date().toISOString(),
        },
      };

      const snapshot = await uploadBytes(storageRef, blob, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
      return null;
    }
  }
}

export const storageService = new StorageService();
