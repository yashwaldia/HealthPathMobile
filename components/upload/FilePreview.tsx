// components/upload/FilePreview.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PickedFile } from '../../services/filePickerService';
import { formatFileSize } from '../../services/uploadService';

interface FilePreviewProps {
  files: PickedFile[];
  onRemove: (index: number) => void;
  showRemove?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  files, 
  onRemove,
  showRemove = true 
}) => {
  if (files.length === 0) return null;

  const renderFileItem = (file: PickedFile, index: number) => {
    const isPdf = file.type === 'pdf';

    return (
      <View key={index} style={styles.fileItem}>
        <View style={styles.thumbnailContainer}>
          {isPdf ? (
            <View style={styles.pdfThumbnail}>
              <Ionicons name="document-text" size={32} color={Colors.light.primary} />
            </View>
          ) : (
            <Image 
              source={{ uri: file.uri }} 
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={2}>
            {file.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(file.size)}
          </Text>
          <View style={styles.fileTypeChip}>
            <Ionicons 
              name={isPdf ? 'document' : 'image'} 
              size={12} 
              color={Colors.light.primary} 
            />
            <Text style={styles.fileTypeText}>
              {file.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {showRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color={Colors.light.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Selected Files ({files.length})
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {files.map((file, index) => renderFileItem(file, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  fileItem: {
    width: 160,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.upload.fileThumbnail.background,
    marginBottom: 8,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  pdfThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.upload.fileThumbnail.background,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  fileTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
  },
});
