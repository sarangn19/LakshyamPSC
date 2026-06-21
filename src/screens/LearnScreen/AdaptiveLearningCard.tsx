import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Arrow45Icon } from '../../components/Icons';
import { styles } from './styles';

interface Props {
  title: string;
  onStart: () => void;
}

export function AdaptiveLearningCard({ title, onStart }: Props) {
  return (
    <TouchableOpacity style={styles.adaptiveCard} onPress={onStart} activeOpacity={0.8}>
      <View style={styles.adaptiveLeft}>
        <Text style={styles.adaptiveTitle}>{title.replace('\n', ' ')}</Text>
        <View style={styles.adaptiveArrowBtn}>
          <Arrow45Icon width={12.44} height={13.07} color="black" />
        </View>
      </View>
      <Image source={require('../../../icons/adaptive learning image.png')} style={styles.adaptiveImage} />
    </TouchableOpacity>
  );
}
