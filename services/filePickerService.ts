// services/filePickerService.ts

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  type: 'image' | 'pdf';
  mimeType: string;
}

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera permission is required to take photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Media library permission is required to select photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};

/**
 * Take a photo with the camera
 */
export const takePhoto = async (): Promise<PickedFile | null> => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const fileName = `photo_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      name: fileName,
      size: asset.fileSize || 0,
      type: 'image',
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

/**
 * Select image(s) from gallery
 */
export const selectImages = async (
  allowMultiple: boolean = false
): Promise<PickedFile[]> => {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return [];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: allowMultiple,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) return [];

    return result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
      size: asset.fileSize || 0,
      type: 'image' as const,
      mimeType: 'image/jpeg',
    }));
  } catch (error) {
    console.error('Error selecting images:', error);
    Alert.alert('Error', 'Failed to select images. Please try again.');
    return [];
  }
};

/**
 * Select PDF document(s)
 */
export const selectDocuments = async (
  allowMultiple: boolean = false
): Promise<PickedFile[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: allowMultiple,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return [];

    // Handle single or multiple files
    const assets = result.assets || [];
    
    return assets.map((asset) => {
      const isPdf = asset.mimeType === 'application/pdf' || asset.name.endsWith('.pdf');
      
      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        type: isPdf ? 'pdf' : 'image',
        mimeType: asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
      };
    });
  } catch (error) {
    console.error('Error selecting documents:', error);
    Alert.alert('Error', 'Failed to select documents. Please try again.');
    return [];
  }
};

/**
 * Show file selection options
 */
export const showFilePickerOptions = async (
  allowMultiple: boolean = false
): Promise<PickedFile[]> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Source',
      'Choose where to get your file from:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const photo = await takePhoto();
            resolve(photo ? [photo] : []);
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const images = await selectImages(allowMultiple);
            resolve(images);
          },
        },
        {
          text: 'Documents',
          onPress: async () => {
            const docs = await selectDocuments(allowMultiple);
            resolve(docs);
          },
        },
        {
          text: 'Cancel',
          onPress: () => resolve([]),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  });
};
