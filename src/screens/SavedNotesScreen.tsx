import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily, colors } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';

const barHeights = [12.29, 34.47, 28.13, 13.46, 28.13, 15.4, 18.91];

export function SavedNotesScreen({ navigation }: any) {
  const notes = useKnowledgeStore((s) => s.notes);
  const addNote = useKnowledgeStore((s) => s.addNote);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null);

  const allTopics = [...new Set(notes.flatMap((n) => n.tags))];

  const filtered = notes.filter((n) => {
    const matchesSearch = searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === '' || n.tags.includes(selectedTopic);
    return matchesSearch && matchesTopic;
  });

  const handleVoiceNote = async () => {
    if (isRecording && recordingRef.current) {
      const uri = recordingRef.current.getURI();
      await recordingRef.current.stopAndUnloadAsync();
      setIsRecording(false);
      recordingRef.current = null;
      if (uri) {
        addNote({
          id: `note-${Date.now()}`,
          title: `Voice note ${new Date().toLocaleString()}`,
          content: uri,
          type: 'voice',
          subject: 'General',
          topicIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['voice'],
        });
      }
      return;
    }
    setShowAddModal(false);
    try {
      const Audio = await import('expo-av').then(m => m.Audio);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Microphone permission is needed to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      Alert.alert('Not available', 'Voice recording is not supported in this environment.');
    }
  };

  const handleImagePick = async () => {
    setShowAddModal(false);
    try {
      const ImagePicker = await import('expo-image-picker');
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Gallery permission is needed to upload images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        addNote({
          id: `note-${Date.now()}`,
          title: `Image note ${new Date().toLocaleString()}`,
          content: result.assets[0].uri,
          type: 'ocr',
          subject: 'General',
          topicIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['image'],
        });
      }
    } catch {
      Alert.alert('Not available', 'Image picker is not supported in this environment.');
    }
  };

  const handleCaptureImage = async () => {
    setShowAddModal(false);
    try {
      const ImagePicker = await import('expo-image-picker');
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Camera permission is needed to capture images.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        addNote({
          id: `note-${Date.now()}`,
          title: `Captured image ${new Date().toLocaleString()}`,
          content: result.assets[0].uri,
          type: 'ocr',
          subject: 'General',
          topicIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['image'],
        });
      }
    } catch {
      Alert.alert('Not available', 'Camera is not supported in this environment.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backArrowWrap}>
            <Svg width="9" height="17" viewBox="0 0 9 17" fill="none">
              <Path fillRule="evenodd" clipRule="evenodd" d="M8.99892 15.938L7.95392 17L0.287919 9.21C0.10342 9.0197 0.000244141 8.76505 0.000244141 8.5C0.000244141 8.23495 0.10342 7.9803 0.287919 7.79L7.95392 0L8.99892 1.063L1.68092 8.5L8.99892 15.938Z" fill="black"/>
            </Svg>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {isRecording && (
        <View style={styles.recordingBanner}>
          <Text style={styles.recordingBannerText}>🔴 Recording... tap "Voice note" to stop</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search + Add */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(0,0,0,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Topic Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
          {allTopics.map((topic) => {
            const isActive = topic === selectedTopic;
            return (
              <TouchableOpacity
                key={topic}
                style={[styles.topicChip, isActive && styles.topicChipActive]}
                onPress={() => setSelectedTopic(isActive ? '' : topic)}
              >
                <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>{topic}</Text>
                {isActive && <Text style={styles.topicChipCross}>✕</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Title</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Subject</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
          </View>
          {filtered.map((note) => (
            <TouchableOpacity key={note.id} style={styles.tableRow} onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}>
              <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>{note.title}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{note.tags[0] || note.subject}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No notes yet. Save one from the AI Tutor!</Text>
          )}
        </View>
      </ScrollView>
      {/* Add Note Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Note</Text>

            <TouchableOpacity style={styles.optionBtn} onPress={() => { setShowAddModal(false); navigation.navigate('CreateNote'); }}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.optionIconText}>✏️</Text>
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Type a note</Text>
                <Text style={styles.optionSub}>Write your note manually</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={handleVoiceNote}>
              <View style={[styles.optionIcon, { backgroundColor: '#16A34A' + '15' }]}>
                <Text style={styles.optionIconText}>{isRecording ? '⏹️' : '🎤'}</Text>
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>{isRecording ? 'Recording… tap to stop' : 'Voice note'}</Text>
                <Text style={styles.optionSub}>{isRecording ? 'Recording in progress' : 'Record a voice note'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={handleImagePick}>
              <View style={[styles.optionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                <Text style={styles.optionIconText}>🖼️</Text>
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Upload from gallery</Text>
                <Text style={styles.optionSub}>Choose an image from your library</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={handleCaptureImage}>
              <View style={[styles.optionIcon, { backgroundColor: '#DC2626' + '15' }]}>
                <Text style={styles.optionIconText}>📷</Text>
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Capture image</Text>
                <Text style={styles.optionSub}>Take a photo with your camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 122,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 21,
    paddingBottom: 57,
    gap: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 999,
  },

  scrollContent: {
    paddingTop: 96,
    paddingBottom: 240,
    paddingHorizontal: 16,
    gap: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
    outlineWidth: 0,
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#F7B11A',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 49,
    fontFamily: fontFamily.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  topicRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
    gap: 4,
  },
  topicChipActive: {
    backgroundColor: '#F7B11A',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  topicChipTextActive: {
    color: '#FFFFFF',
  },
  topicChipCross: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  table: {
    paddingHorizontal: 16,
    gap: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.bodyBold,
    color: 'rgba(0, 0, 0, 0.5)',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    gap: 8,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  recordingBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#DC2626',
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 96,
    marginBottom: -16,
    zIndex: 20,
  },
  recordingBannerText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconText: { fontSize: 22 },
  optionTextWrap: { flex: 1 },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  optionSub: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
    color: 'rgba(0,0,0,0.5)',
  },
});
