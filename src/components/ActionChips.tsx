import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface ChipAction {
  icon: string;
  label: string;
  action: string;
}

const ACTIONS: ChipAction[] = [
  { icon: '🔍', label: 'Explain Simpler', action: 'explain_simpler' },
  { icon: '📜', label: 'Give PYQs', action: 'give_pyqs' },
  { icon: '🔗', label: 'Related Topic', action: 'related_topic' },
  { icon: '📇', label: 'Create Flashcard', action: 'create_flashcard' },
];

interface ActionChipsProps {
  onAction: (action: string) => void;
}

export function ActionChips({ onAction }: ActionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        paddingStart: 8,
        paddingEnd: 16,
      }}
    >
      {ACTIONS.map((act) => (
        <TouchableOpacity
          key={act.action}
          onPress={() => onAction(act.action)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>{act.icon}</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>{act.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
