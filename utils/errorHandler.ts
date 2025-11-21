// utils/errorHandler.ts

import { Alert } from 'react-native';

export const handleUploadError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message?.includes('permission')) {
    userMessage = 'Permission denied. Please check app permissions.';
  } else if (error.message?.includes('network')) {
    userMessage = 'Network error. Please check your connection.';
  } else if (error.message?.includes('storage')) {
    userMessage = 'Storage error. You may be out of space.';
  } else if (error.message?.includes('API key')) {
    userMessage = 'API configuration error. Please contact support.';
  }
  
  Alert.alert('Upload Error', userMessage);
};
