import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { styles } from './styles';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  title: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onContinue: () => void;
  onClose: () => void;
}

export function PasteModal({ visible, slideAnim, title, placeholder, value, onChange, onContinue, onClose }: Props) {
  const disabled = value.trim().length === 0;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.selectionModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>{title}</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={onClose}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.pasteContentRow}>
            <TextInput
              style={styles.pasteInput}
              placeholder={placeholder}
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={value}
              onChangeText={onChange}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalBottomBar}>
            <TouchableOpacity
              style={[styles.continueBtn, disabled && styles.continueBtnDisabled]}
              onPress={onContinue}
              disabled={disabled}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
