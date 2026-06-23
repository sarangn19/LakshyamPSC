import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { styles } from './styles';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  title: string;
  sources: { key: string; label: string }[];
  onClose: () => void;
  onSelect: (sourceKey: string) => void;
}

export function SourceSelectModal({ visible, slideAnim, title, sources, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
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
            {sources.map((source) => (
              <TouchableOpacity key={source.key} style={styles.sourceOption} onPress={() => onSelect(source.key)}>
                <Text style={styles.sourceOptionText}>{source.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
