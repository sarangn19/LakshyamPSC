import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Animated, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card 1: Adaptive Learning */}
        <TouchableOpacity style={styles.card} onPress={async () => {
          setIsAdaptiveLoading(true);
          const store = useMCQStore.getState();
          await store.startDailyDrill();
          setIsAdaptiveLoading(false);
          navigation.navigate('MCQ');
        }}>
          <View style={styles.cardLeftLarge}>
            <Text style={styles.cardTitleLarge}>{t('learn.adaptiveLearning')}</Text>
          </View>
          <Image source={require('../../icons/adaptive learning image.png')} style={styles.cardImageLarge} />
        </TouchableOpacity>

        {/* Card 2 + 3: Notes & Practice row */}
        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('SavedNotes')} activeOpacity={0.7}>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>{t('learn.notes')}</Text>
              <Text style={styles.smallCardSubtitle}>{t('learn.viewSavedNotes')}</Text>
            </View>
            <View style={styles.smallCardArrow}>
              <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <Path d="M5 11L10 7L5 3" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => setShowTypeModal(true)} activeOpacity={0.7}>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>{t('learn.practice')}</Text>
              <Text style={styles.smallCardSubtitle}>{t('learn.practiceMCQFlashcards')}</Text>
            </View>
            <View style={styles.smallCardArrow}>
              <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <Path d="M5 11L10 7L5 3" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card 4: Knowledge Map */}
        <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('Map')} activeOpacity={0.7}>
          <View style={styles.smallCardContent}>
            <Text style={styles.smallCardTitle}>{t('learn.knowledgeMap')}</Text>
            <Text style={styles.smallCardSubtitle}>{t('learn.visualConceptMapping')}</Text>
          </View>
          <View style={styles.smallCardArrow}>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path d="M5 11L10 7L5 3" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.navIcon}>
            <Svg width="16" height="16" viewBox="0 0 16 18" fill="none">
              <Path d="M2 15.5H5V10.5C5 10.2167 5.096 9.97933 5.288 9.788C5.48 9.59667 5.71733 9.50067 6 9.5H10C10.2833 9.5 10.521 9.596 10.713 9.788C10.905 9.98 11.0007 10.2173 11 10.5V15.5H14V6.5L8 2L2 6.5V15.5ZM0 15.5V6.5C0 6.18333 0.0709998 5.88333 0.213 5.6C0.355 5.31667 0.550667 5.08333 0.8 4.9L6.8 0.4C7.15 0.133333 7.55 0 8 0C8.45 0 8.85 0.133333 9.2 0.4L15.2 4.9C15.45 5.08333 15.646 5.31667 15.788 5.6C15.93 5.88333 16.0007 6.18333 16 6.5V15.5C16 16.05 15.804 16.521 15.412 16.913C15.02 17.305 14.5493 17.5007 14 17.5H10C9.71667 17.5 9.47933 17.404 9.288 17.212C9.09667 17.02 9.00067 16.7827 9 16.5V11.5H7V16.5C7 16.7833 6.904 17.021 6.712 17.213C6.52 17.405 6.28267 17.5007 6 17.5H2C1.45 17.5 0.979333 17.3043 0.588 16.913C0.196666 16.5217 0.000666667 16.0507 0 15.5Z" fill="black"/>
            </Svg>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chatbot')}>
          <View style={styles.navIcon}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M9.5 9H9.51M14.5 9H14.51M18 4C18.7956 4 19.5587 4.31607 20.1213 4.87868C20.6839 5.44129 21 6.20435 21 7V15C21 15.7956 20.6839 16.5587 20.1213 17.1213C19.5587 17.6839 18.7956 18 18 18H13L8 21V18H6C5.20435 18 4.44129 17.6839 3.87868 17.1213C3.31607 16.5587 3 15.7956 3 15V7C3 6.20435 3.31607 5.44129 3.87868 4.87868C4.44129 4.31607 5.20435 4 6 4H18Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M9.5 13C9.82588 13.3326 10.2148 13.5968 10.6441 13.7772C11.0734 13.9576 11.5344 14.0505 12 14.0505C12.4656 14.0505 12.9266 13.9576 13.3559 13.7772C13.7852 13.5968 14.1741 13.3326 14.5 13" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
          <View style={styles.navIconActive}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 18.72L7 16V12.27L12 15L17 12.27V16Z" fill="black"/>
            </Svg>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F0EF',
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
  backArrow: {
    fontSize: 18,
    color: '#000000',
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 16,
    paddingBottom: 170,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  cardLeftLarge: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 0,
    gap: 16,
    flex: 1,
    maxWidth: 120,
  },
  cardTitleLarge: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  smallCardContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    alignSelf: 'stretch',
  },
  smallCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  smallCardSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 19,
    fontFamily: fontFamily.bodyLight,
    color: '#000000',
  },
  smallCardArrow: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  cardImageLarge: {
    width: '65%',
    aspectRatio: 265 / 141.43,
    maxWidth: 265,
    borderRadius: 8,
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
    outlineWidth: 0,
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
    outlineWidth: 0,
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
    outlineWidth: 0,
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
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 76,
    backgroundColor: '#F6F6F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 78,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    boxShadow: '0 0 115px rgba(0,0,0,0.12)',
    elevation: 5,
  },
  navItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 86,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconActive: {
    width: 44,
    height: 44,
    borderRadius: 86,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
