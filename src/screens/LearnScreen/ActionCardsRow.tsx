import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Arrow45Icon } from '../../components/Icons';
import { styles } from './styles';

interface Props {
  notesTitle: string;
  notesSubtitle: string;
  practiceTitle: string;
  practiceSubtitle: string;
  onNotesPress: () => void;
  onPracticePress: () => void;
}

export function ActionCardsRow({ notesTitle, notesSubtitle, practiceTitle, practiceSubtitle, onNotesPress, onPracticePress }: Props) {
  return (
    <View style={styles.cardRow}>
      <TouchableOpacity style={styles.smallCard} onPress={onNotesPress} activeOpacity={0.7}>
        <View style={styles.smallCardContent}>
          <Text style={styles.smallCardTitle}>{notesTitle}</Text>
          <Text style={styles.smallCardSubtitle}>{notesSubtitle}</Text>
        </View>
        <View style={styles.smallCardArrowBtn}>
          <Arrow45Icon width={12.44} height={13.07} color="black" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.smallCard} onPress={onPracticePress} activeOpacity={0.7}>
        <View style={styles.smallCardContent}>
          <Text style={styles.smallCardTitle}>{practiceTitle}</Text>
          <Text style={styles.smallCardSubtitle}>{practiceSubtitle}</Text>
        </View>
        <View style={styles.smallCardArrowBtn}>
          <Arrow45Icon width={12.44} height={13.07} color="black" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
