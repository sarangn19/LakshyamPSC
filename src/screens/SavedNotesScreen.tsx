import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Platform, Animated } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily, spacing, radius, typography } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';

const SearchIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <Circle cx="7.5" cy="7.5" r="6" stroke={colors.textTertiary} strokeWidth="1.5" />
    <Path d="M16 16L12 12" stroke={colors.textTertiary} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const TextNoteIcon = () => (
  <Svg width="18" height="22" viewBox="0 0 18 22" fill="none">
    <Rect x="1" y="1" width="16" height="20" rx="2" stroke={colors.primary} strokeWidth="1.5" />
    <Path d="M5 6H13" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M5 10H13" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M5 14H10" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const VoiceIcon = () => (
  <Svg width="18" height="22" viewBox="0 0 18 22" fill="none">
    <Rect x="5.5" y="1" width="7" height="13" rx="3.5" stroke={colors.success} strokeWidth="1.5" />
    <Path d="M1 9.5C1 13.6421 4.35786 17 8.5 17C12.6421 17 16 13.6421 16 9.5" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M8.5 17V21" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const BRAND_YELLOW = '#F7B11A';

const EmptyNotesIcon = () => (
  <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <Rect x="10" y="6" width="60" height="68" rx="8" stroke={colors.border} strokeWidth="2" />
    <Path d="M26 28H54" stroke={colors.border} strokeWidth="2" strokeLinecap="round" />
    <Path d="M26 36H54" stroke={colors.border} strokeWidth="2" strokeLinecap="round" />
    <Path d="M26 44H44" stroke={colors.border} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="56" cy="56" r="18" fill={`${BRAND_YELLOW}15`} />
    <Path d="M50 56H62M56 50V62" stroke={BRAND_YELLOW} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export function SavedNotesScreen({ navigation }: any) {
  const notes = useKnowledgeStore((s) => s.notes);
  const addNote = useKnowledgeStore((s) => s.addNote);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null);
  const searchRef = useRef<TextInput>(null);
  const createSlideAnim = useRef(new Animated.Value(300)).current;

  const openCreateModal = () => {
    setShowAddModal(true);
    createSlideAnim.setValue(300);
    Animated.timing(createSlideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closeCreateModal = () => {
    Animated.timing(createSlideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setShowAddModal(false);
    });
  };

  const allTopics = [...new Set(notes.flatMap((n) => n.tags).filter(Boolean))];

  const filtered = notes.filter((n) => {
    const matchesSearch = searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === '' || (n.tags && n.tags.includes(selectedTopic));
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
    closeCreateModal();
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width="9" height="17" viewBox="0 0 9 17" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M8.99892 15.938L7.95392 17L0.287919 9.21C0.10342 9.0197 0.000244141 8.76505 0.000244141 8.5C0.000244141 8.23495 0.10342 7.9803 0.287919 7.79L7.95392 0L8.99892 1.063L1.68092 8.5L8.99892 15.938Z" fill="black"/>
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>My Notes</Text>
          <Text style={styles.headerSub}>{notes.length} note{notes.length !== 1 ? 's' : ''}</Text>
        </View>
      </LinearGradient>

      {isRecording && (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingBannerText}>Recording... tap the mic button to stop</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchRow}>
          <TouchableOpacity activeOpacity={1} onPress={() => searchRef.current?.focus()} style={styles.searchInputWrap}>
            <SearchIcon />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search notes..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <Path d="M1 1L13 13M13 1L1 13" stroke={colors.textTertiary} strokeWidth="1.5" strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {allTopics.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
            <TouchableOpacity
              style={[styles.topicChip, selectedTopic === '' && styles.topicChipActive]}
              onPress={() => setSelectedTopic('')}
            >
              <Text style={[styles.topicChipText, selectedTopic === '' && styles.topicChipTextActive]}>All</Text>
            </TouchableOpacity>
            {allTopics.map((topic) => {
              const isActive = topic === selectedTopic;
              return (
                <TouchableOpacity
                  key={topic}
                  style={[styles.topicChip, isActive && styles.topicChipActive]}
                  onPress={() => setSelectedTopic(isActive ? '' : topic)}
                >
                  <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>{topic}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {filtered.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
              >
                <View style={styles.cardMenu}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{note.title}</Text>
                <Text style={styles.cardPreview} numberOfLines={11}>{note.content}</Text>
                <Text style={styles.cardTime}>{formatDate(note.createdAt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <EmptyNotesIcon />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedTopic ? 'No matching notes' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery || selectedTopic
                ? 'Try a different search or filter'
                : 'Tap the + button to create your first note'}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openCreateModal}
        style={[styles.fab, Platform.select({ web: { boxShadow: '0 4px 16px rgba(247, 177, 26, 0.4)' }, default: { elevation: 6 } })]}
      >
        <LinearGradient
          colors={[BRAND_YELLOW, '#DAA10E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Path d="M11 2V20M2 11H20" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={showAddModal} transparent animationType="none" onRequestClose={closeCreateModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeCreateModal}>
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: createSlideAnim }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Note</Text>

            <TouchableOpacity style={styles.optionBtn} onPress={() => { closeCreateModal(); setTimeout(() => navigation.navigate('CreateNote'), 220); }}>
              <View style={[styles.optionIcon, { backgroundColor: `${BRAND_YELLOW}15` }]}>
                <TextNoteIcon />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Type a note</Text>
                <Text style={styles.optionSub}>Write your note manually</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={handleVoiceNote}>
              <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
                <VoiceIcon />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>{isRecording ? 'Recording... tap to stop' : 'Voice note'}</Text>
                <Text style={styles.optionSub}>{isRecording ? 'Recording in progress' : 'Record a voice note'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeCreateModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
    gap: spacing.sm,
    backgroundColor: colors.transparent,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, default: { elevation: 2 } }),
  },
  headerTextWrap: {
    paddingBottom: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    lineHeight: 22,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },

  scrollContent: {
    paddingTop: 120,
    paddingBottom: 120,
    paddingHorizontal: spacing.md,
  },

  searchRow: {
    marginBottom: spacing.md,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: 10,
    outlineStyle: 'none',
    ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }, default: { elevation: 1 } }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.text,
    padding: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
    lineHeight: 20,
  },
  clearBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingBottom: 20,
  },
  topicChip: {
    paddingHorizontal: spacing.sm + 4,
    height: 32,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }, default: { elevation: 1 } }),
  },
  topicChipActive: {
    backgroundColor: BRAND_YELLOW,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  topicChipTextActive: {
    color: colors.white,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  noteCard: {
    width: '47.5%',
    flexGrow: 1,
    maxWidth: 260,
    minHeight: 275,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    ...Platform.select({ web: { boxShadow: '0 16px 35px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)' }, default: { elevation: 4 } }),
  },
  cardMenu: {
    position: 'absolute',
    top: 18,
    right: 18,
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9f9f9f',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
    color: '#2f2f2f',
    lineHeight: 19,
    paddingRight: 18,
    marginBottom: 2,
  },
  cardPreview: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: '#666666',
    lineHeight: 18.5,
    overflow: 'hidden',
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
    color: '#9b9b9b',
    marginTop: 8,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 18,
  },

  recordingBanner: {
    position: 'absolute',
    top: 110,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    zIndex: 20,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }, default: { elevation: 6 } }),
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  recordingBannerText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.white,
    flex: 1,
    lineHeight: 18,
  },

  fab: {
    position: 'absolute',
    bottom: spacing.xl + 8,
    right: spacing.lg,
    zIndex: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    gap: spacing.sm,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 23,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    lineHeight: 19,
  },
  optionSub: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
