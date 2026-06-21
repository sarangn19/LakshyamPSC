import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { styles } from './styles';

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  title: string;
  inputPlaceholder: string;
  taskCount: string;
  onTaskCountChange: (val: string) => void;
  selectedPreset: number | null;
  presets: number[];
  onPresetSelect: (val: number) => void;
  onContinue: () => void;
  onClose: () => void;
}

export function TasksModal({
  visible, slideAnim, title, inputPlaceholder, taskCount, onTaskCountChange,
  selectedPreset, presets, onPresetSelect, onContinue, onClose,
}: Props) {
  const disabled = taskCount.trim().length === 0;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.tasksModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.tasksModalHeader}>
            <Text style={styles.tasksModalTitle}>{title}</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={onClose}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksModalBody}>
            <View style={styles.tasksInputRow}>
              <TextInput
                style={styles.tasksInput}
                placeholder={inputPlaceholder}
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={taskCount}
                onChangeText={(t) => { onTaskCountChange(t); }}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.tasksPresetRow}>
              {presets.map((val) => {
                const active = selectedPreset === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.taskPreset, active && styles.taskPresetActive]}
                    onPress={() => onPresetSelect(val)}
                  >
                    <Text style={[styles.taskPresetText, active && styles.taskPresetTextActive]}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
      </TouchableOpacity>
    </Modal>
  );
}
