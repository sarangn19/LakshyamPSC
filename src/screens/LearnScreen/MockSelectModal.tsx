import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { styles } from './styles';
import { colors } from '../../theme';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  onSelect: (setId: string) => void;
}

const MOCK_OPTIONS = [
  { id: 'mock_set_1', title: 'LDC Mock Test 1', description: '100 questions · 75 min' },
  { id: 'mock_set_2', title: 'LDC Mock Test 2', description: '100 questions · 75 min' },
  { id: 'mock_set_3', title: 'LDC Mock Test 3', description: '100 questions · 75 min' },
];

export function MockSelectModal({ visible, slideAnim, onClose, onSelect }: Props) {
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.sourceModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sourceModalHeader}>
            <Text style={styles.sourceModalTitle}>Select Mock Test</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={onClose} activeOpacity={0.8}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>X</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.sourceList}>
            {MOCK_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.id} style={styles.sourceOption} onPress={() => onSelect(opt.id)} activeOpacity={0.8}>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={styles.sourceOptionText}>{opt.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{opt.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}