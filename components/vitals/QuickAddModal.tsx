import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../constants/colors';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void; // Replace 'any' with a specific type later
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ visible, onClose, onSave }) => {
  // Add state for form inputs here later
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Vital Reading</Text>
          
          {/* Form fields will go here */}
          <Text style={{ textAlign: 'center', marginVertical: 20 }}>Form inputs for BP, HR, etc. will be here.</Text>

          <TouchableOpacity style={styles.saveButton} onPress={() => onSave({})}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: Colors.light.textLight,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default QuickAddModal;
