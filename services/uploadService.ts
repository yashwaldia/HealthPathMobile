// services/uploadService.ts
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { UploadedFile, UploadProgress } from '../types/upload';

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Upload a file to Firebase Storage with progress tracking
 */
export const uploadFileToStorage = async (
  fileUri: string,
  fileName: string,
  userId: string,
  category: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile> => {
  try {
    // ✅ Validate authentication first
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to upload files');
    }

    console.log('🔐 Authentication Check:');
    console.log('  Current User:', currentUser.uid);
    console.log('  Provided User ID:', userId);
    console.log('  Match:', currentUser.uid === userId);

    // ✅ Validate inputs
    if (!userId) {
      throw new Error('User ID is required for upload');
    }

    if (currentUser.uid !== userId) {
      throw new Error('User ID mismatch - authentication error');
    }

    // Determine file type from filename
    const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
    const mimeType = fileType === 'pdf' 
      ? 'application/pdf' 
      : fileName.toLowerCase().endsWith('.png') 
        ? 'image/png' 
        : 'image/jpeg';

    // Create storage path matching database documentation
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `users/${userId}/${category}/${timestamp}_${sanitizedFileName}`;
    
    // ✅ Debug logging
    console.log('📤 Upload Configuration:');
    console.log('  User ID:', userId);
    console.log('  Category:', category);
    console.log('  File Name:', fileName);
    console.log('  Sanitized Name:', sanitizedFileName);
    console.log('  Storage Path:', storagePath);
    console.log('  MIME Type:', mimeType);
    
    const storageRef = storage().ref(storagePath);
    console.log('  Storage Ref Created:', storageRef.fullPath);

    // Fetch the file as a blob (React Native standard)
    console.log('  Fetching file from:', fileUri);
    const response = await fetch(fileUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const fileSize = blob.size;
    
    console.log('  File Size:', formatFileSize(fileSize));
    console.log('  Blob Type:', blob.type);
    console.log('  Blob Size (bytes):', fileSize);

    // ✅ Validate blob
    if (fileSize === 0) {
      throw new Error('File is empty (0 bytes)');
    }

    // ✅ Check file size limit (20MB for lab reports)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (fileSize > MAX_SIZE) {
      throw new Error(`File size ${formatFileSize(fileSize)} exceeds limit of ${formatFileSize(MAX_SIZE)}`);
    }

    // Upload with progress tracking using putFile (React Native optimized)
    console.log('  Starting upload...');
    const uploadTask = storageRef.put(blob, {
      contentType: mimeType,
      customMetadata: {
        uploadedBy: userId,
        originalFileName: fileName,
        category: category,
        uploadTimestamp: new Date().toISOString(),
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', (taskSnapshot) => {
        // Progress tracking
        const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        console.log(`  Upload Progress: ${Math.round(progress)}%`);
        console.log(`  Bytes: ${taskSnapshot.bytesTransferred} / ${taskSnapshot.totalBytes}`);
        
        if (onProgress) {
          onProgress({
            status: 'uploading',
            progress,
            message: `Uploading... ${Math.round(progress)}%`,
            currentFile: fileName,
          });
        }
      });

      uploadTask.then(async () => {
        // Upload complete - get download URL
        try {
          console.log('  ✅ Upload Complete! Getting download URL...');
          const downloadURL = await storageRef.getDownloadURL();
          console.log('  Download URL:', downloadURL);
          
          const uploadedFile: UploadedFile = {
            fileName: sanitizedFileName,
            fileURL: downloadURL,
            fileType,
            fileSize,
            mimeType,
            uploadedAt: new Date(),
          };

          if (onProgress) {
            onProgress({
              status: 'complete',
              progress: 100,
              message: 'Upload complete',
              currentFile: fileName,
            });
          }

          console.log('  ✅ Upload fully complete!');
          resolve(uploadedFile);
        } catch (error) {
          console.error('❌ Error getting download URL:', error);
          reject(error);
        }
      });

      uploadTask.catch((error) => {
        // Enhanced error handling
        console.error('❌ Upload Error:', error);
        console.error('  Error Code:', error.code);
        console.error('  Error Message:', error.message);
        
        if (onProgress) {
          onProgress({
            status: 'error',
            progress: 0,
            message: `Upload failed: ${error.message}`,
            error: error.message,
          });
        }
        
        reject(error);
      });
    });
  } catch (error: any) {
    console.error('❌ Upload Service Error:', error);
    console.error('  Error Type:', error?.constructor?.name);
    console.error('  Error Code:', error?.code);
    console.error('  Error Message:', error?.message);
    throw error;
  }
};

/**
 * Upload multiple files sequentially
 */
export const uploadMultipleFiles = async (
  fileUris: string[],
  fileNames: string[],
  userId: string,
  category: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile[]> => {
  const uploadedFiles: UploadedFile[] = [];
  
  for (let i = 0; i < fileUris.length; i++) {
    const fileUri = fileUris[i];
    const fileName = fileNames[i];
    
    try {
      console.log(`📤 Uploading file ${i + 1}/${fileUris.length}: ${fileName}`);
      const uploadedFile = await uploadFileToStorage(
        fileUri,
        fileName,
        userId,
        category,
        onProgress
      );
      uploadedFiles.push(uploadedFile);
      console.log(`✅ File ${i + 1} uploaded successfully`);
    } catch (error) {
      console.error(`❌ Error uploading file ${fileName}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return uploadedFiles;
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFileFromStorage = async (fileURL: string): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to delete files');
    }

    // Extract path from URL for React Native Firebase
    const path = decodeURIComponent(fileURL.split('/o/')[1]?.split('?')[0] || fileURL);
    await storage().ref(path).delete();
    console.log('✅ File deleted successfully:', fileURL);
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    throw error;
  }
};

/**
 * Verify storage configuration
 */
export const verifyStorageConfig = (): boolean => {
  try {
    console.log('✅ Storage configuration verified');
    console.log('  App Name:', storage().app.name);
    return true;
  } catch (error) {
    console.error('❌ Error verifying storage config:', error);
    return false;
  }
};
