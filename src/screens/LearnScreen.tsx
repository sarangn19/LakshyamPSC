import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMCQStore } from '../store/mcqStore';
import { useKnowledgeStore, useFlashcardStore } from '../store';
import { syllabus } from '../data/syllabus';
import { LoadingAnimation } from '../components/common/LoadingAnimation';
import { useTranslation } from '../i18n/useTranslation';
import { BottomNav } from '../components/BottomNav';
import { styles } from './LearnScreen/styles';
import { AdaptiveLearningCard } from './LearnScreen/AdaptiveLearningCard';
import { ActionCardsRow } from './LearnScreen/ActionCardsRow';
import { TypeSelectModal } from './LearnScreen/TypeSelectModal';
import { SourceSelectModal } from './LearnScreen/SourceSelectModal';
import { SelectListModal } from './LearnScreen/SelectListModal';
import { PasteModal } from './LearnScreen/PasteModal';
import { TasksModal } from './LearnScreen/TasksModal';

const SOURCES = ['Chaptewise', 'Saved note', 'Paste text'];
const TASK_PRESETS = [5, 20, 50, 100];

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
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [taskCount, setTaskCount] = useState('');
  const [selectedTaskPreset, setSelectedTaskPreset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdaptiveLoading, setIsAdaptiveLoading] = useState(false);

  const notes = useKnowledgeStore((s) => s.notes);
  const { t } = useTranslation();
  const generationProgress = useMCQStore((s) => s.generationProgress);

  const typeSlideAnim = useRef(new Animated.Value(300)).current;
  const sourceSlideAnim = useRef(new Animated.Value(300)).current;
  const chapterSlideAnim = useRef(new Animated.Value(300)).current;
  const noteSlideAnim = useRef(new Animated.Value(300)).current;
  const pasteSlideAnim = useRef(new Animated.Value(300)).current;
  const tasksSlideAnim = useRef(new Animated.Value(300)).current;
  const chapterScrollRef = useRef<ScrollView>(null);
  const noteScrollRef = useRef<ScrollView>(null);
  const [chapterScrollOffset, setChapterScrollOffset] = useState(0);
  const [chapterContentHeight, setChapterContentHeight] = useState(0);
  const [noteScrollOffset, setNoteScrollOffset] = useState(0);
  const [noteContentHeight, setNoteContentHeight] = useState(0);

  const animateIn = (anim: Animated.Value) => { anim.setValue(300); Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(); };
  const animateOut = (anim: Animated.Value, cb: () => void) => Animated.timing(anim, { toValue: 300, duration: 250, useNativeDriver: true }).start(cb);

  const handleSourceSelect = (source: string) => {
    setShowSourceModal(false);
    setSelectedChapter(null); setSelectedNote(null); setPasteContent('');
    if (source === 'Chaptewise') { setChapterSearch(''); animateIn(chapterSlideAnim); setShowChapterModal(true); }
    else if (source === 'Saved note') { setNoteSearch(''); animateIn(noteSlideAnim); setShowNoteModal(true); }
    else if (source === 'Paste text') { animateIn(pasteSlideAnim); setShowPasteModal(true); }
  };

  const handleFinalContinue = async () => {
    setIsLoading(true);
    const mcqStore = useMCQStore.getState();
    const flashcardStore = useFlashcardStore.getState();
    const subjects = selectedChapter ? [selectedChapter] : undefined;
    const count = (selectedNote || pasteContent) ? 5 : (Number(taskCount) || 10);
    try {
      if (practiceType === 'flashcard') {
        await flashcardStore.startPracticeSession({ subjects, sourceType: selectedNote ? 'note' : pasteContent ? 'paste' : 'chapter', noteId: selectedNote ?? undefined, pastedContent: pasteContent || undefined, count });
        setIsLoading(false); navigation.navigate('Flashcards', { mode: 'practice' });
      } else {
        await mcqStore.startPracticeSession({ subjects, sourceType: selectedNote ? 'note' : pasteContent ? 'paste' : 'chapter', noteId: selectedNote ?? undefined, pastedContent: pasteContent || undefined, difficulty: 'medium', count });
        setIsLoading(false); navigation.navigate('MCQ', { mode: 'practice' });
      }
    } catch (e) {
      console.error('[LearnScreen] startPracticeSession failed:', e);
      setIsLoading(false);
    }
  };

  const allSubjects = syllabus.map((s) => s.name);
  const filteredSubjects = allSubjects.filter((s) => s.toLowerCase().includes(chapterSearch.toLowerCase()));
  const chapterItems = [{ id: '', title: 'All Subjects' }, ...filteredSubjects.map((s) => ({ id: s, title: s }))];
  const filteredNotes = notes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()));
  const sourceLabels: Record<string, string> = { 'Chaptewise': t('learn.chaptewise'), 'Saved note': t('learn.savedNote'), 'Paste text': t('learn.pasteText') };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={() => navigation.navigate('Bookmarks')} activeOpacity={0.8}>
            <View style={styles.bookmarkCircle}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        <AdaptiveLearningCard title={t('learn.adaptiveLearning')} onStart={async () => { setIsAdaptiveLoading(true); try { await useMCQStore.getState().startDailyDrill(); } catch (e) { console.error('[Adaptive] startDailyDrill failed:', e); } setIsAdaptiveLoading(false); navigation.navigate('MCQ'); }} />
        <ActionCardsRow notesTitle={t('learn.notes')} notesSubtitle={t('learn.viewSavedNotes')} practiceTitle={t('learn.practice')} practiceSubtitle={t('learn.practiceMCQFlashcards')} onNotesPress={() => navigation.navigate('SavedNotes')} onPracticePress={() => { animateIn(typeSlideAnim); setShowTypeModal(true); }} />

      </ScrollView>

      <TypeSelectModal visible={showTypeModal} slideAnim={typeSlideAnim} title={t('learn.selectType')} mcqLabel={t('learn.mcq')} flashcardLabel={t('learn.flashcard')} onClose={() => setShowTypeModal(false)} onSelect={(type) => { setPracticeType(type); setShowTypeModal(false); animateIn(sourceSlideAnim); setShowSourceModal(true); }} />
      <SourceSelectModal visible={showSourceModal} slideAnim={sourceSlideAnim} title={t('learn.selectSource')} sources={SOURCES.map((k) => ({ key: k, label: sourceLabels[k] }))} onClose={() => setShowSourceModal(false)} onSelect={handleSourceSelect} />
      <SelectListModal visible={showChapterModal} slideAnim={chapterSlideAnim} title={t('learn.selectChapter')} searchPlaceholder={t('learn.search')} searchValue={chapterSearch} onSearchChange={setChapterSearch} items={chapterItems} selectedId={selectedChapter} onSelect={setSelectedChapter} onContinue={() => { setShowChapterModal(false); animateIn(tasksSlideAnim); setShowTasksModal(true); }} onClose={() => setShowChapterModal(false)} continueDisabled={selectedChapter === null && chapterItems.length > 0} scrollRef={chapterScrollRef} scrollOffset={chapterScrollOffset} contentHeight={chapterContentHeight} onScroll={(o, h) => { setChapterScrollOffset(o); setChapterContentHeight(h); }} />
      <SelectListModal visible={showNoteModal} slideAnim={noteSlideAnim} title={t('learn.selectNote')} searchPlaceholder={t('learn.search')} searchValue={noteSearch} onSearchChange={setNoteSearch} items={filteredNotes.map((n) => ({ id: n.id, title: n.title }))} selectedId={selectedNote} onSelect={setSelectedNote} onContinue={() => { setShowNoteModal(false); handleFinalContinue(); }} onClose={() => setShowNoteModal(false)} continueDisabled={selectedNote === null} scrollRef={noteScrollRef} scrollOffset={noteScrollOffset} contentHeight={noteContentHeight} onScroll={(o, h) => { setNoteScrollOffset(o); setNoteContentHeight(h); }} />
      <PasteModal visible={showPasteModal} slideAnim={pasteSlideAnim} title={t('learn.pasteContent')} placeholder={t('learn.pastePlaceholder')} value={pasteContent} onChange={setPasteContent} onContinue={() => { setShowPasteModal(false); handleFinalContinue(); }} onClose={() => setShowPasteModal(false)} />
      <TasksModal visible={showTasksModal} slideAnim={tasksSlideAnim} title={t('learn.numberOfTasks')} inputPlaceholder={t('learn.taskCountPlaceholder')} taskCount={taskCount} onTaskCountChange={(v) => { setTaskCount(v); setSelectedTaskPreset(null); }} selectedPreset={selectedTaskPreset} presets={TASK_PRESETS} onPresetSelect={(v) => { setSelectedTaskPreset(v); setTaskCount(String(v)); }} onContinue={() => { setShowTasksModal(false); handleFinalContinue(); }} onClose={() => setShowTasksModal(false)} />

      {isLoading && <LoadingAnimation message={generationProgress ? t('learn.generatingQuestion', { current: generationProgress.current + 1, total: generationProgress.total }) : t('learn.preparingPractice')} progress={generationProgress ?? undefined} />}
      {isAdaptiveLoading && <LoadingAnimation message={t('learn.generatingAdaptiveSession')} />}

      <BottomNav activeTab="Learn" />
    </View>
  );
}
