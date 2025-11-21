// services/uploadService.ts

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../config/firebaseConfig';
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
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload files');
    }

    console.log('🔐 Authentication Check:');
    console.log('  Current User:', auth.currentUser.uid);
    console.log('  Provided User ID:', userId);
    console.log('  Match:', auth.currentUser.uid === userId);

    // ✅ Validate inputs
    if (!userId) {
      throw new Error('User ID is required for upload');
    }

    if (auth.currentUser.uid !== userId) {
      throw new Error('User ID mismatch - authentication error');
    }
    
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    if (!storage.app.options.storageBucket) {
      throw new Error('Storage bucket is not configured');
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
    console.log('  Storage Bucket:', storage.app.options.storageBucket);
    
    const storageRef = ref(storage, storagePath);
    console.log('  Storage Ref Created:', storageRef.fullPath);
    console.log('  Storage Ref Bucket:', storageRef.bucket);

    // Fetch the file as a blob
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

    // Upload with progress tracking
    console.log('  Starting upload...');
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
      customMetadata: {
        uploadedBy: userId,
        originalFileName: fileName,
        category: category,
        uploadTimestamp: new Date().toISOString(),
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`  Upload Progress: ${Math.round(progress)}%`);
          console.log(`  Bytes: ${snapshot.bytesTransferred} / ${snapshot.totalBytes}`);
          
          if (onProgress) {
            onProgress({
              status: 'uploading',
              progress,
              message: `Uploading... ${Math.round(progress)}%`,
              currentFile: fileName,
            });
          }
        },
        (error: any) => {
          // Enhanced error handling
          console.error('❌ Upload Error:', error);
          console.error('  Error Code:', error.code);
          console.error('  Error Message:', error.message);
          console.error('  Server Response:', error.serverResponse);
          console.error('  Full Error Object:', JSON.stringify(error, null, 2));
          
          // Log auth state during error
          console.error('  Auth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
          if (auth.currentUser) {
            console.error('  Auth UID:', auth.currentUser.uid);
          }
          
          if (onProgress) {
            onProgress({
              status: 'error',
              progress: 0,
              message: `Upload failed: ${error.message}`,
              error: error.message,
            });
          }
          
          reject(error);
        },
        async () => {
          // Upload complete - get download URL
          try {
            console.log('  ✅ Upload Complete! Getting download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
        }
      );
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
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete files');
    }

    const fileRef = ref(storage, fileURL);
    await deleteObject(fileRef);
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
    if (!storage) {
      console.error('❌ Storage not initialized');
      return false;
    }

    if (!storage.app.options.storageBucket) {
      console.error('❌ Storage bucket not configured');
      return false;
    }

    console.log('✅ Storage configuration verified');
    console.log('  Bucket:', storage.app.options.storageBucket);
    return true;
  } catch (error) {
    console.error('❌ Error verifying storage config:', error);
    return false;
  }
};