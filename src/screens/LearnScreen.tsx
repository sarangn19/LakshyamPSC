import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Animated, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fontFamily } from '../theme';
import { useMCQStore } from '../store/mcqStore';
import { useFlashcardStore } from '../store/flashcardStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { syllabus } from '../data/syllabus';
import { LoadingAnimation } from '../components/common/LoadingAnimation';
import { useTranslation } from '../i18n/useTranslation';



const sources = ['Chaptewise', 'Saved note', 'Paste text'];

export function LearnScreen({ navigation }: any) {
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [practiceType, setPracticeType] = useState<'mcq' | 'flashcard'>('mcq');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const notes = useKnowledgeStore((s) => s.notes);
  const { t, typography: tx } = useTranslation();
  const sourceLabels: Record<string, string> = {
    'Chaptewise': t('learn.chaptewise'),
    'Saved note': t('learn.savedNote'),
    'Paste text': t('learn.pasteText'),
  };
  const allSubjects = syllabus.map((s) => s.name);
  const filteredSubjects = allSubjects.filter((s) =>
    s.toLowerCase().includes(chapterSearch.toLowerCase())
  );
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(noteSearch.toLowerCase())
  );
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [taskCount, setTaskCount] = useState('');
  const [selectedTaskPreset, setSelectedTaskPreset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdaptiveLoading, setIsAdaptiveLoading] = useState(false);
  const generationProgress = useMCQStore((s) => s.generationProgress);
  const taskPresets = [5, 20, 50, 100];
  const sourceSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(sourceSlideAnim, { toValue: showSourceModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showSourceModal]);

  const typeSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(typeSlideAnim, { toValue: showTypeModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showTypeModal]);

  const chapterSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(chapterSlideAnim, { toValue: showChapterModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showChapterModal]);

  const noteSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(noteSlideAnim, { toValue: showNoteModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showNoteModal]);

  const pasteSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(pasteSlideAnim, { toValue: showPasteModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showPasteModal]);

  const tasksSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(tasksSlideAnim, { toValue: showTasksModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showTasksModal]);

  const handleSourceSelect = (source: string) => {
    setShowSourceModal(false);
    // Clear all source states so only the current selection is active
    setSelectedChapter(null);
    setSelectedNote(null);
    setPasteContent('');
    if (source === 'Chaptewise') {
      setChapterSearch('');
      setShowChapterModal(true);
    } else if (source === 'Saved note') {
      setNoteSearch('');
      setShowNoteModal(true);
    } else if (source === 'Paste text') {
      setShowPasteModal(true);
    }
  };

  const openTasksModal = () => {
    setTaskCount('');
    setSelectedTaskPreset(null);
    setShowTasksModal(true);
  };

  const handleContinueChapter = () => {
    setShowChapterModal(false);
    openTasksModal();
  };

  const handleContinueNote = () => {
    setShowNoteModal(false);
    // Skip question count for note-based practice
    handleFinalContinue();
  };

  const handleContinuePaste = () => {
    setShowPasteModal(false);
    // Skip question count for paste-based practice
    handleFinalContinue();
  };

  const handleTaskPresetSelect = (val: number) => {
    setSelectedTaskPreset(val);
    setTaskCount(String(val));
  };

  const handleFinalContinue = async () => {
    setShowTasksModal(false);
    setIsLoading(true);
    const store = useMCQStore.getState();
    const flashcardStore = useFlashcardStore.getState();
    const subjects = selectedChapter ? [selectedChapter] : undefined;
    console.log('[AUDIT] selectedTopic:', subjects?.[0] ?? 'any');
    if (practiceType === 'flashcard') {
      // For note/paste, use default count of 5. For chapter, use user input
      const count = (selectedNote || pasteContent) ? 5 : (Number(taskCount) || 10);
      await flashcardStore.startPracticeSession({
        subjects,
        sourceType: selectedNote ? 'note' : pasteContent ? 'paste' : 'chapter',
        noteId: selectedNote ?? undefined,
        pastedContent: pasteContent || undefined,
        count,
      });
      setIsLoading(false);
      navigation.navigate('Flashcards', { mode: 'practice' });
    } else {
      // For note/paste, use default count of 5. For chapter, use user input
      const count = (selectedNote || pasteContent) ? 5 : (Number(taskCount) || 10);
      await store.startPracticeSession({
        subjects,
        sourceType: selectedNote ? 'note' : pasteContent ? 'paste' : 'chapter',
        noteId: selectedNote ?? undefined,
        pastedContent: pasteContent || undefined,
        difficulty: 'medium',
        count,
      });
      setIsLoading(false);
      navigation.navigate('MCQ', { mode: 'practice' });
    }
  };

  const sourceScrollRef = useRef<ScrollView>(null);
  const [sourceScrollOffset, setSourceScrollOffset] = useState(0);
  const [sourceContentHeight, setSourceContentHeight] = useState(0);
  const sourceScrollTrackHeight = 260;
  const sourceScrollThumbHeight = 50.87;

  const noteScrollRef = useRef<ScrollView>(null);
  const [noteScrollOffset, setNoteScrollOffset] = useState(0);
  const [noteContentHeight, setNoteContentHeight] = useState(0);

  const chapterScrollRef = useRef<ScrollView>(null);
  const [chapterScrollOffset, setChapterScrollOffset] = useState(0);
  const [chapterContentHeight, setChapterContentHeight] = useState(0);

  const renderCheckbox = (checked: boolean) => {
    if (checked) {
      return (
        <View style={styles.checkboxChecked}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      );
    }
    return <View style={styles.checkboxUnchecked} />;
  };

  const renderChapterItem = (subject: string) => {
    const isSelected = selectedChapter === subject;
    return (
      <TouchableOpacity
        key={subject}
        style={[styles.selectItem, isSelected && styles.selectItemSelected]}
        onPress={() => setSelectedChapter(subject)}
      >
        <Text style={styles.selectItemText} numberOfLines={1} ellipsizeMode="tail">{subject}</Text>
        {renderCheckbox(isSelected)}
      </TouchableOpacity>
    );
  };

  const renderNoteItem = (note: { id: string; title: string }) => {
    const isSelected = selectedNote === note.id;
    return (
      <TouchableOpacity
        key={note.id}
        style={[styles.selectItem, isSelected && styles.selectItemSelected]}
        onPress={() => setSelectedNote(note.id)}
      >
        <Text style={styles.selectItemText} numberOfLines={1} ellipsizeMode="tail">{note.title}</Text>
        {renderCheckbox(isSelected)}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Bar: Bookmark */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={() => navigation.navigate('Bookmarks')} activeOpacity={0.8}>
            <View style={styles.bookmarkCircle}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card 1: Adaptive Learning */}
        <View style={styles.adaptiveCard}>
          <View style={styles.adaptiveLeft}>
            <Text style={styles.adaptiveTitle}>{t('learn.adaptiveLearning').replace('\n', ' ')}</Text>
            <TouchableOpacity style={styles.adaptiveArrowBtn} onPress={async () => {
              setIsAdaptiveLoading(true);
              const store = useMCQStore.getState();
              await store.startDailyDrill();
              setIsAdaptiveLoading(false);
              navigation.navigate('MCQ');
            }} activeOpacity={0.8}>
              <Svg width="12.44" height="13.07" viewBox="0 0 14 14" fill="none">
                <Path d="M8 1L13 7L8 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M1 7H13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
          <Image source={require('../../icons/adaptive learning image.png')} style={styles.adaptiveImage} />
        </View>

        {/* Card 2 + 3: Notes & Practice row */}
        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('SavedNotes')} activeOpacity={0.7}>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>{t('learn.notes')}</Text>
              <Text style={styles.smallCardSubtitle}>{t('learn.viewSavedNotes')}</Text>
            </View>
            <View style={styles.smallCardArrowBtn}>
              <Svg width="12.44" height="13.07" viewBox="0 0 14 14" fill="none">
                <Path d="M8 1L13 7L8 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M1 7H13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => setShowTypeModal(true)} activeOpacity={0.7}>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>{t('learn.practice')}</Text>
              <Text style={styles.smallCardSubtitle}>{t('learn.practiceMCQFlashcards')}</Text>
            </View>
            <View style={styles.smallCardArrowBtn}>
              <Svg width="12.44" height="13.07" viewBox="0 0 14 14" fill="none">
                <Path d="M8 1L13 7L8 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M1 7H13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Select type modal (MCQ or Flashcard) */}
      <Modal visible={showTypeModal} transparent animationType="none" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypeModal(false)}>
          <Animated.View style={[styles.sourceModal, { transform: [{ translateY: typeSlideAnim }] }]}>
            <View style={styles.sourceModalHeader}>
              <Text style={styles.sourceModalTitle}>{t('learn.selectType')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowTypeModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.sourceList}>
              <TouchableOpacity
                style={styles.sourceOption}
                onPress={() => { setPracticeType('mcq'); setShowTypeModal(false); setShowSourceModal(true); }}
              >
                <Text style={styles.sourceOptionText}>{t('learn.mcq')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sourceOption}
                onPress={() => { setPracticeType('flashcard'); setShowTypeModal(false); setShowSourceModal(true); }}
              >
                <Text style={styles.sourceOptionText}>{t('learn.flashcard')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Select a source modal */}
      <Modal visible={showSourceModal} transparent animationType="none" onRequestClose={() => setShowSourceModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSourceModal(false)}>
          <Animated.View style={[styles.sourceModal, { transform: [{ translateY: sourceSlideAnim }] }]}>
            <View style={styles.sourceModalHeader}>
              <Text style={styles.sourceModalTitle}>{t('learn.selectSource')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowSourceModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.sourceList}>
              {sources.map((source) => (
                <TouchableOpacity key={source} style={styles.sourceOption} onPress={() => handleSourceSelect(source)}>
                  <Text style={styles.sourceOptionText}>{sourceLabels[source]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Select a chapter modal */}
      <Modal visible={showChapterModal} transparent animationType="none" onRequestClose={() => setShowChapterModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChapterModal(false)}>
          <Animated.View style={[styles.selectionModal, { transform: [{ translateY: chapterSlideAnim }] }]}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>{t('learn.selectChapter')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowChapterModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('learn.search')}
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={chapterSearch}
                onChangeText={setChapterSearch}
              />
            </View>

            <View style={styles.selectListRow}>
              <ScrollView
                ref={chapterScrollRef}
                style={styles.selectScroll}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                  setChapterScrollOffset(contentOffset.y);
                  setChapterContentHeight(contentSize.height - layoutMeasurement.height);
                }}
              >
                <View style={styles.selectListGap}>
                  {filteredSubjects.map((subject) => renderChapterItem(subject))}
                </View>
              </ScrollView>

              <View style={styles.scrollTrack}>
                <View
                  style={[
                    styles.scrollThumb,
                    {
                      top: chapterContentHeight > 0
                        ? (chapterScrollOffset / chapterContentHeight) * (sourceScrollTrackHeight - sourceScrollThumbHeight)
                        : 0,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={[styles.continueBtn, selectedChapter === null && styles.continueBtnDisabled]}
                onPress={handleContinueChapter}
                disabled={selectedChapter === null}
              >
                <Text style={styles.continueBtnText}>{t('learn.continue')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Select a note modal */}
      <Modal visible={showNoteModal} transparent animationType="none" onRequestClose={() => setShowNoteModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNoteModal(false)}>
          <Animated.View style={[styles.selectionModal, { transform: [{ translateY: noteSlideAnim }] }]}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>{t('learn.selectNote')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowNoteModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('learn.search')}
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={noteSearch}
                onChangeText={setNoteSearch}
              />
            </View>

            <View style={styles.selectListRow}>
              <ScrollView
                ref={noteScrollRef}
                style={styles.selectScroll}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                  setNoteScrollOffset(contentOffset.y);
                  setNoteContentHeight(contentSize.height - layoutMeasurement.height);
                }}
              >
                <View style={styles.selectListGap}>
                  {filteredNotes.map((note) => renderNoteItem(note))}
                </View>
              </ScrollView>

              <View style={styles.scrollTrack}>
                <View
                  style={[
                    styles.scrollThumb,
                    {
                      top: noteContentHeight > 0
                        ? (noteScrollOffset / noteContentHeight) * (sourceScrollTrackHeight - sourceScrollThumbHeight)
                        : 0,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={[styles.continueBtn, selectedNote === null && styles.continueBtnDisabled]}
                onPress={handleContinueNote}
                disabled={selectedNote === null}
              >
                <Text style={styles.continueBtnText}>{t('learn.continue')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Paste content modal */}
      <Modal visible={showPasteModal} transparent animationType="none" onRequestClose={() => setShowPasteModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPasteModal(false)}>
          <Animated.View style={[styles.selectionModal, { transform: [{ translateY: pasteSlideAnim }] }]}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>{t('learn.pasteContent')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowPasteModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.pasteContentRow}>
              <TextInput
                style={styles.pasteInput}
                placeholder={t('learn.pastePlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={pasteContent}
                onChangeText={setPasteContent}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={[styles.continueBtn, pasteContent.trim().length === 0 && styles.continueBtnDisabled]}
                onPress={handleContinuePaste}
                disabled={pasteContent.trim().length === 0}
              >
                <Text style={styles.continueBtnText}>{t('learn.continue')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Number of tasks modal */}
      <Modal visible={showTasksModal} transparent animationType="none" onRequestClose={() => setShowTasksModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTasksModal(false)}>
          <Animated.View style={[styles.tasksModal, { transform: [{ translateY: tasksSlideAnim }] }]}>
            <View style={styles.tasksModalHeader}>
              <Text style={styles.tasksModalTitle}>{t('learn.numberOfTasks')}</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => setShowTasksModal(false)}>
                <View style={styles.sourceModalCloseIcon}>
                  <Text style={styles.sourceModalCloseX}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.tasksModalBody}>
              <View style={styles.tasksInputRow}>
                <TextInput
                  style={styles.tasksInput}
                  placeholder={t('learn.taskCountPlaceholder')}
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  value={taskCount}
                  onChangeText={(t) => { setTaskCount(t); setSelectedTaskPreset(null); }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.tasksPresetRow}>
                {taskPresets.map((val) => {
                  const active = selectedTaskPreset === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.taskPreset, active && styles.taskPresetActive]}
                      onPress={() => handleTaskPresetSelect(val)}
                    >
                      <Text style={[styles.taskPresetText, active && styles.taskPresetTextActive]}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={[styles.continueBtn, taskCount.trim().length === 0 && styles.continueBtnDisabled]}
                onPress={handleFinalContinue}
                disabled={taskCount.trim().length === 0}
              >
                <Text style={styles.continueBtnText}>{t('learn.continue')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Loading overlay for practice */}
      {isLoading && (
        <LoadingAnimation
          message={generationProgress ? t('learn.generatingQuestion', { current: generationProgress.current + 1, total: generationProgress.total }) : t('learn.preparingPractice')}
          progress={generationProgress ?? undefined}
        />
      )}

      {/* Loading overlay for adaptive learning */}
      {isAdaptiveLoading && (
        <LoadingAnimation message={t('learn.generatingAdaptiveSession')} />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navCenterBg} />
        <View style={styles.navItems}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <Svg width="16.25" height="16" viewBox="0 0 18 18" fill="none">
              <Path d="M2 15.5H5V10.5C5 10.2167 5.096 9.97933 5.288 9.788C5.48 9.59667 5.71733 9.50067 6 9.5H10C10.2833 9.5 10.521 9.596 10.713 9.788C10.905 9.98 11.0007 10.2173 11 10.5V15.5H14V6.5L8 2L2 6.5V15.5ZM0 15.5V6.5C0 6.18333 0.0709998 5.88333 0.213 5.6C0.355 5.31667 0.550667 5.08333 0.8 4.9L6.8 0.4C7.15 0.133333 7.55 0 8 0C8.45 0 8.85 0.133333 9.2 0.4L15.2 4.9C15.45 5.08333 15.646 5.31667 15.788 5.6C15.93 5.88333 16.0007 6.18333 16 6.5V15.5C16 16.05 15.804 16.521 15.412 16.913C15.02 17.305 14.5493 17.5007 14 17.5H10C9.71667 17.5 9.47933 17.404 9.288 17.212C9.09667 17.02 9.00067 16.7827 9 16.5V11.5H7V16.5C7 16.7833 6.904 17.021 6.712 17.213C6.52 17.405 6.28267 17.5007 6 17.5H2C1.45 17.5 0.979333 17.3043 0.588 16.913C0.196666 16.5217 0.000666667 16.0507 0 15.5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => navigation.navigate('Learn')}>
            <Svg width="18.97" height="16" viewBox="0 0 24 24" fill="black">
              <Path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 18.72L7 16V12.27L12 15L17 12.27V16Z" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <Svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <Path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="black" strokeWidth="2"/>
              <Path d="M2 18C3.5 14.5 6 13 10 13C14 13 16.5 14.5 18 18" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F0EF',
    paddingHorizontal: 24,
  },
  scrollContent: {
    gap: 10,
    paddingTop: 64,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    gap: 8,
  },
  bookmarkBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  adaptiveCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    alignSelf: 'stretch',
  },
  adaptiveLeft: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    width: 95,
  },
  adaptiveTitle: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 29,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  adaptiveArrowBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#F7B11A',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  adaptiveImage: {
    width: 249,
    height: 142.23,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  smallCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  smallCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  smallCardSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 17,
    color: '#000000',
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  smallCardArrowBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#F9F9F9',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    justifyContent: 'center',
  },
  navCenterBg: {
    position: 'absolute',
    width: 54.32,
    height: 54.32,
    left: '50%',
    top: 8.84,
    marginLeft: -27.16,
    backgroundColor: '#F7B11A',
    borderRadius: 999,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    zIndex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sourceModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 24,
    gap: 33,
    boxShadow: '0px 0px 24px rgba(0,0,0,0.08)',
    elevation: 8,
  },
  sourceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sourceModalTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  sourceModalClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9D9D9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceModalCloseIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceModalCloseX: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  sourceList: {
    gap: 12,
  },
  sourceOption: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ED9200',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceOptionText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
    textAlign: 'center',
  },
  selectionModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 24,
    gap: 33,
    boxShadow: '0px 0px 24px rgba(0,0,0,0.08)',
    elevation: 8,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  selectionModalTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  searchRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
    padding: 0,
  },
  selectListRow: {
    flexDirection: 'row',
    gap: 16,
    height: 260,
  },
  selectScroll: {
    flex: 1,
  },
  selectListGap: {
    gap: 12,
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  selectItemSelected: {
    borderWidth: 2,
    borderColor: '#ED9200',
  },
  selectItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
    marginRight: 12,
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    backgroundColor: '#ED9200',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  scrollTrack: {
    width: 8.8,
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  scrollThumb: {
    position: 'absolute',
    left: 0,
    width: 8.8,
    height: 50.87,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
  },
  modalBottomBar: {
    height: 80,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: -24,
    marginBottom: -24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  continueBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#ED9200',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: fontFamily.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pasteContentRow: {
    height: 321,
  },
  pasteInput: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
  },
  tasksModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 33,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    boxShadow: '0px 0px 24px rgba(0,0,0,0.08)',
    elevation: 8,
  },
  tasksModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  tasksModalTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  tasksModalBody: {
    gap: 12,
  },
  tasksInputRow: {
    height: 48,
  },
  tasksInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
  },
  tasksPresetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  taskPreset: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskPresetActive: {
    borderWidth: 3,
    borderColor: '#ED661D',
  },
  taskPresetText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: 'rgba(0,0,0,0.5)',
  },
  taskPresetTextActive: {
    color: '#000000',
    fontWeight: '500',
    fontFamily: fontFamily.body,
  },

});
