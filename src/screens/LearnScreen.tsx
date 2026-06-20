import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Animated, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fontFamily } from '../theme';
import { useMCQStore } from '../store/mcqStore';
import { useKnowledgeStore, useFlashcardStore } from '../store';
import { syllabus } from '../data/syllabus';
import { LoadingAnimation } from '../components/common/LoadingAnimation';
import { useTranslation } from '../i18n/useTranslation';
import { Arrow45Icon } from '../components/Icons';
import { BottomNav } from '../components/BottomNav';
import { submitSuggestion } from '../services/adminDataService';



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
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionSubject, setSuggestionSubject] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);
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

  const suggestionSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(suggestionSlideAnim, { toValue: showSuggestionModal ? 0 : 300, duration: 250, useNativeDriver: true }).start();
  }, [showSuggestionModal]);

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

  const handleSubmitSuggestion = async () => {
    if (!suggestionMessage.trim()) return;
    setSuggestionSubmitting(true);
    try {
      await submitSuggestion(suggestionSubject.trim(), suggestionMessage.trim());
      setSuggestionSuccess(true);
      setTimeout(() => {
        setShowSuggestionModal(false);
        setSuggestionSubject('');
        setSuggestionMessage('');
        setSuggestionSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    } finally {
      setSuggestionSubmitting(false);
    }
  };

  const handleOpenSuggestion = () => {
    setSuggestionSubject('');
    setSuggestionMessage('');
    setSuggestionSuccess(false);
    setShowSuggestionModal(true);
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
              <Arrow45Icon width={12.44} height={13.07} color="black" />
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
              <Arrow45Icon width={12.44} height={13.07} color="black" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => setShowTypeModal(true)} activeOpacity={0.7}>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>{t('learn.practice')}</Text>
              <Text style={styles.smallCardSubtitle}>{t('learn.practiceMCQFlashcards')}</Text>
            </View>
            <View style={styles.smallCardArrowBtn}>
              <Arrow45Icon width={12.44} height={13.07} color="black" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Suggestions / Feedback */}
        <TouchableOpacity style={styles.feedbackBtn} onPress={handleOpenSuggestion} activeOpacity={0.7}>
          <Text style={styles.feedbackBtnText}>Give Feedback</Text>
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

      {/* Suggestion / Feedback Modal */}
      <Modal visible={showSuggestionModal} transparent animationType="none" onRequestClose={() => setShowSuggestionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => !suggestionSubmitting && setShowSuggestionModal(false)} />
          <Animated.View style={[styles.selectionModal, { transform: [{ translateY: suggestionSlideAnim }] }]}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Give Feedback</Text>
              <TouchableOpacity style={styles.sourceModalClose} onPress={() => !suggestionSubmitting && setShowSuggestionModal(false)}>
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
                value={suggestionSubject}
                onChangeText={setSuggestionSubject}
              />
            </View>

            <View style={styles.pasteContentRow}>
              <TextInput
                style={styles.pasteInput}
                placeholder="Share your suggestion..."
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={suggestionMessage}
                onChangeText={setSuggestionMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalBottomBar}>
              {suggestionSuccess ? (
                <View style={[styles.continueBtn, { backgroundColor: '#16A34A' }]}>
                  <Text style={styles.continueBtnText}>Submitted ✓</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.continueBtn, (suggestionMessage.trim().length === 0 || suggestionSubmitting) && styles.continueBtnDisabled]}
                  onPress={handleSubmitSuggestion}
                  disabled={suggestionMessage.trim().length === 0 || suggestionSubmitting}
                >
                <Text style={styles.continueBtnText}>{suggestionSubmitting ? 'Submitting...' : 'Submit Feedback'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        </View>
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

      <BottomNav activeTab="Learn" />
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
  feedbackBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  feedbackBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    fontFamily: fontFamily.bodyMedium,
  },
});
