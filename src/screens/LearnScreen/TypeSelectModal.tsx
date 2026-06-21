import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from './styles';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  title: string;
  mcqLabel: string;
  flashcardLabel: string;
  onClose: () => void;
  onSelect: (type: 'mcq' | 'flashcard') => void;
}

export function TypeSelectModal({ visible, slideAnim, title, mcqLabel, flashcardLabel, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.sourceModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sourceModalHeader}>
            <Text style={styles.sourceModalTitle}>{title}</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={onClose}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.sourceList}>
            <TouchableOpacity style={styles.sourceOption} onPress={() => onSelect('mcq')}>
              <Text style={styles.sourceOptionText}>{mcqLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sourceOption} onPress={() => onSelect('flashcard')}>
              <Text style={styles.sourceOptionText}>{flashcardLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
