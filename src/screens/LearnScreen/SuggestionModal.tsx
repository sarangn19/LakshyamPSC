import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { styles } from './styles';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  subject: string;
  onSubjectChange: (val: string) => void;
  message: string;
  onMessageChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  isSuccess: boolean;
}

export function SuggestionModal({
  visible, slideAnim, subject, onSubjectChange, message, onMessageChange,
  onSubmit, onClose, isSubmitting, isSuccess,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => !isSubmitting && onClose()} />
        <Animated.View style={[styles.selectionModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Give Feedback</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={() => !isSubmitting && onClose()}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Subject (optional)"
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={subject}
              onChangeText={onSubjectChange}
            />
          </View>

          <View style={styles.pasteContentRow}>
            <TextInput
              style={styles.pasteInput}
              placeholder="Share your suggestion..."
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={message}
              onChangeText={onMessageChange}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalBottomBar}>
            {isSuccess ? (
              <View style={[styles.continueBtn, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.continueBtnText}>Submitted ✓</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.continueBtn, (message.trim().length === 0 || isSubmitting) && styles.continueBtnDisabled]}
                onPress={onSubmit}
                disabled={message.trim().length === 0 || isSubmitting}
              >
                <Text style={styles.continueBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
