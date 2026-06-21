import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { styles } from './styles';

interface Item {
  id: string;
  title: string;
}

interface Props {
  visible: boolean;
  slideAnim: Animated.Value;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onClose: () => void;
  continueDisabled: boolean;
  scrollRef: React.RefObject<ScrollView>;
  scrollOffset: number;
  contentHeight: number;
  onScroll: (offset: number, contentHeight: number) => void;
}

function renderCheckbox(checked: boolean) {
  if (checked) {
    return (
      <View style={styles.checkboxChecked}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
    );
  }
  return <View style={styles.checkboxUnchecked} />;
}

export function SelectListModal({
  visible, slideAnim, title, searchPlaceholder, searchValue, onSearchChange,
  items, selectedId, onSelect, onContinue, onClose, continueDisabled,
  scrollRef, scrollOffset, contentHeight, onScroll,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.selectionModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>{title}</Text>
            <TouchableOpacity style={styles.sourceModalClose} onPress={onClose}>
              <View style={styles.sourceModalCloseIcon}>
                <Text style={styles.sourceModalCloseX}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>

          <View style={styles.selectListRow}>
            <ScrollView
              ref={scrollRef}
              style={styles.selectScroll}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                onScroll(contentOffset.y, contentSize.height - layoutMeasurement.height);
              }}
            >
              <View style={styles.selectListGap}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.selectItem, selectedId === item.id && styles.selectItemSelected]}
                    onPress={() => onSelect(item.id)}
                  >
                    <Text style={styles.selectItemText} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                    {renderCheckbox(selectedId === item.id)}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.scrollTrack}>
              <View
                style={[
                  styles.scrollThumb,
                  {
                    top: contentHeight > 0
                      ? (scrollOffset / contentHeight) * (260 - 50.87)
                      : 0,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.modalBottomBar}>
            <TouchableOpacity
              style={[styles.continueBtn, continueDisabled && styles.continueBtnDisabled]}
              onPress={onContinue}
              disabled={continueDisabled}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
