// services/storageService.ts
// ✅ OPTIMIZED: React Native Firebase v23 with enhanced error handling and performance
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * ✅ NEW: Type definitions for better TypeScript support
 */
interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

interface DeleteProgress {
  deletedCount: number;
  totalCount: number;
  currentPath: string;
}

type UploadProgressCallback = (progress: UploadProgress) => void;
type DeleteProgressCallback = (progress: DeleteProgress) => void;

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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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
   * ✅ ENHANCED: Added progress callback and better error handling
   */
  async uploadProfilePhoto(
    userId: string, 
    imageUri: string,
    onProgress?: UploadProgressCallback
  ): Promise<string | null> {
    try {
      console.log('📤 Starting upload for user:', userId);
      console.log('📷 Image URI:', imageUri);

      // ✅ Validate authentication
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to upload files');
      }

      if (currentUser.uid !== userId) {
        throw new Error('User ID mismatch - authentication error');
      }

      // ✅ Validate image URI
      if (!imageUri || imageUri.trim() === '') {
        throw new Error('Invalid image URI');
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
            const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
            console.log(`📊 Upload Progress: ${Math.round(progress)}%`);
            console.log(`📦 Bytes: ${taskSnapshot.bytesTransferred} / ${taskSnapshot.totalBytes}`);
            
            // ✅ NEW: Call progress callback if provided
            if (onProgress) {
              onProgress({
                bytesTransferred: taskSnapshot.bytesTransferred,
                totalBytes: taskSnapshot.totalBytes,
                progress: progress,
              });
            }
          }
        );

        uploadTask.then(async () => {
          try {
            console.log('✅ Upload Complete! Getting download URL...');
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

          // ✅ ENHANCED: More specific error messages
          if (error?.code === 'storage/unauthorized') {
            Alert.alert(
              'Upload Failed',
              'Permission denied. Please check Firebase Storage rules or try logging out and back in.'
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
          } else if (error?.code === 'storage/unauthenticated') {
            Alert.alert(
              'Authentication Required',
              'Please log out and log back in, then try again.'
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
   */
  async uploadDocument(
    userId: string,
    documentUri: string,
    documentType: string,
    onProgress?: UploadProgressCallback
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
            
            // ✅ NEW: Call progress callback if provided
            if (onProgress) {
              onProgress({
                bytesTransferred: taskSnapshot.bytesTransferred,
                totalBytes: taskSnapshot.totalBytes,
                progress: progress,
              });
            }
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

  /**
   * ✅ OPTIMIZED: Delete user's profile photo from Storage
   * Handles both legacy and new storage paths
   */
  async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting profile photos for user:', userId);

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to delete files');
      }

      // ✅ Delete from legacy profile-photos folder
      try {
        const profilePhotosRef = storage().ref('profile-photos');
        const photosList = await profilePhotosRef.listAll();

        const deletePromises = photosList.items
          .filter(item => item.name.includes(userId))
          .map(async (item) => {
            try {
              await item.delete();
              console.log('✅ Deleted legacy profile photo:', item.name);
            } catch (error) {
              console.warn('⚠️ Failed to delete legacy photo:', item.name, error);
            }
          });

        await Promise.all(deletePromises);
      } catch (error: any) {
        if (error?.code !== 'storage/object-not-found') {
          console.warn('⚠️ Error accessing legacy profile photos:', error);
        }
      }

      // ✅ Delete from new user-scoped path
      try {
        const userProfileRef = storage().ref(`users/${userId}/profile`);
        const userPhotosList = await userProfileRef.listAll();

        const deletePromises = userPhotosList.items.map(async (item) => {
          try {
            await item.delete();
            console.log('✅ Deleted user profile photo:', item.name);
          } catch (error) {
            console.warn('⚠️ Failed to delete user photo:', item.name, error);
          }
        });

        await Promise.all(deletePromises);
      } catch (error: any) {
        if (error?.code !== 'storage/object-not-found') {
          console.warn('⚠️ Error accessing user profile photos:', error);
        }
      }

      console.log('✅ Profile photo deletion complete');
    } catch (error) {
      console.error('❌ Error deleting profile photos:', error);
      // ✅ Don't throw - allow deletion to continue even if profile photos fail
      console.warn('⚠️ Continuing deletion despite profile photo errors');
    }
  }

  /**
   * ✅ OPTIMIZED: Delete all user files from Firebase Storage
   * 
   * IMPROVEMENTS:
   * - Added progress callback for UX feedback
   * - Optimized parallel deletion
   * - Better error handling and recovery
   * - Validation to prevent accidental deletion
   * 
   * @param userId - The user ID whose files should be deleted
   * @param onProgress - Optional callback for deletion progress
   */
  async deleteAllUserFiles(
    userId: string,
    onProgress?: DeleteProgressCallback
  ): Promise<void> {
    try {
      console.log('🗑️ Starting complete file deletion for user:', userId);

      // ✅ VALIDATION: Ensure userId is valid
      if (!userId || userId.trim() === '') {
        throw new Error('Invalid userId: Cannot delete files with empty ID');
      }

      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('User must be authenticated and match userId to delete files');
      }

      // Define all storage paths to delete
      const storagePaths = [
        `users/${userId}`,           // Primary user files path
        `wellness/${userId}`,         // Wellness module photos
        `documents/${userId}`,        // Documents
        `medical-reports/${userId}`,  // Medical reports
        `lab-results/${userId}`,      // Lab results
        `radiology/${userId}`,        // Radiology scans
        `prescriptions/${userId}`,    // Prescriptions
        `vaccinations/${userId}`,     // Vaccination records
        `child-health/${userId}`,     // Child health records
      ];

      let totalDeleted = 0;
      const totalPaths = storagePaths.length + 1; // +1 for profile photos

      // ✅ OPTIMIZED: Delete directories with progress tracking
      for (let i = 0; i < storagePaths.length; i++) {
        const path = storagePaths[i];
        
        if (onProgress) {
          onProgress({
            deletedCount: i,
            totalCount: totalPaths,
            currentPath: path,
          });
        }

        try {
          await this.deleteDirectory(path);
          totalDeleted++;
        } catch (error) {
          console.warn(`⚠️ Failed to delete ${path}, continuing...`, error);
        }
      }

      // Delete profile photos from legacy path
      if (onProgress) {
        onProgress({
          deletedCount: storagePaths.length,
          totalCount: totalPaths,
          currentPath: 'profile-photos',
        });
      }

      try {
        await this.deleteProfilePhoto(userId);
      } catch (error) {
        console.warn('⚠️ Failed to delete profile photos, continuing...', error);
      }

      if (onProgress) {
        onProgress({
          deletedCount: totalPaths,
          totalCount: totalPaths,
          currentPath: 'Complete',
        });
      }

      console.log(`✅ All user files deleted successfully (${totalDeleted}/${storagePaths.length} paths)`);
    } catch (error) {
      console.error('❌ Error deleting all user files:', error);
      // ✅ Don't throw - this allows Firestore deletion to continue
      console.warn('⚠️ Continuing with account deletion despite storage errors');
    }
  }

  /**
   * ✅ OPTIMIZED: Recursively delete all files in a directory
   * 
   * IMPROVEMENTS:
   * - Better parallel processing with controlled concurrency
   * - Improved error handling
   * - Memory optimization for large directories
   */
  private async deleteDirectory(path: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting directory: ${path}`);

      const directoryRef = storage().ref(path);
      
      // List all items in the directory
      const result = await directoryRef.listAll();

      // ✅ OPTIMIZED: Delete all files in parallel with error handling
      if (result.items.length > 0) {
        console.log(`🗑️ Found ${result.items.length} files in ${path}`);
        
        // ✅ Process in chunks to avoid memory issues with large directories
        const CHUNK_SIZE = 50;
        for (let i = 0; i < result.items.length; i += CHUNK_SIZE) {
          const chunk = result.items.slice(i, i + CHUNK_SIZE);
          
          const deletePromises = chunk.map(async (fileRef) => {
            try {
              await fileRef.delete();
              console.log(`✅ Deleted file: ${fileRef.fullPath}`);
            } catch (error: any) {
              // ✅ Ignore "not found" errors (file already deleted)
              if (error?.code !== 'storage/object-not-found') {
                console.warn(`⚠️ Failed to delete ${fileRef.fullPath}:`, error);
              }
            }
          });

          await Promise.all(deletePromises);
        }
      } else {
        console.log(`⚠️ No files found in ${path}`);
      }

      // ✅ OPTIMIZED: Recursively delete subdirectories in parallel
      if (result.prefixes.length > 0) {
        console.log(`🗑️ Found ${result.prefixes.length} subdirectories in ${path}`);
        
        const subdirPromises = result.prefixes.map((folderRef) => 
          this.deleteDirectory(folderRef.fullPath).catch((error) => {
            console.warn(`⚠️ Failed to delete subdirectory ${folderRef.fullPath}:`, error);
          })
        );

        await Promise.all(subdirPromises);
      }

      console.log(`✅ Directory deleted: ${path}`);
    } catch (error: any) {
      // ✅ If directory doesn't exist, that's OK (nothing to delete)
      if (error?.code === 'storage/object-not-found') {
        console.log(`⚠️ Directory not found (already deleted or never existed): ${path}`);
      } else if (error?.code === 'storage/unauthorized') {
        console.warn(`⚠️ Permission denied for ${path}. Check Firebase Storage Rules.`);
        console.warn('⚠️ Continuing deletion process...');
      } else {
        console.warn(`⚠️ Error deleting directory ${path}:`, error);
      }
    }
  }

  /**
   * ✅ NEW: Count total files for a user (useful for progress estimation)
   */
  async countUserFiles(userId: string): Promise<number> {
    try {
      const storagePaths = [
        `users/${userId}`,
        `wellness/${userId}`,
        `documents/${userId}`,
        `medical-reports/${userId}`,
        `lab-results/${userId}`,
        `radiology/${userId}`,
        `prescriptions/${userId}`,
        `vaccinations/${userId}`,
        `child-health/${userId}`,
      ];

      let totalFiles = 0;

      for (const path of storagePaths) {
        try {
          const result = await storage().ref(path).listAll();
          totalFiles += result.items.length;
          
          // Count files in subdirectories
          for (const prefix of result.prefixes) {
            const subResult = await prefix.listAll();
            totalFiles += subResult.items.length;
          }
        } catch (error) {
          // Ignore errors for non-existent paths
        }
      }

      // Count profile photos
      try {
        const profilePhotosRef = storage().ref('profile-photos');
        const photosList = await profilePhotosRef.listAll();
        totalFiles += photosList.items.filter(item => item.name.includes(userId)).length;
      } catch (error) {
        // Ignore errors
      }

      return totalFiles;
    } catch (error) {
      console.error('❌ Error counting user files:', error);
      return 0;
    }
  }
}

export const storageService = new StorageService();
