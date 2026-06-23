import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Animated, Keyboard, Platform, Easing, Alert } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontFamily } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';
import type { Note } from '../data/mockData';
import { useTranslation } from '../i18n/useTranslation';
import { SendArrowIcon, AttachIcon, MicIcon, BackIcon } from '../components/Icons';
import { BottomNav, BOTTOM_NAV_HEIGHT, TAB_BAR_TOTAL_HEIGHT } from '../components/BottomNav';
import { getAIResponse, buildHistory, ChatMessage, ResponseMode, logRenderer } from '../services/chatService';
import { AnswerRenderer, plainTextToSections } from '../components/AnswerRenderer';
import { ActionChips } from '../components/ActionChips';
import { ResponseModeRenderer } from '../components/renderers/ResponseModeRenderer';

const INPUT_CONTAINER_GAP = 4;
const INPUT_ROW_HEIGHT = 44;
const ACTION_ROW_HEIGHT = 56;
const INPUT_CONTAINER_TOP_PADDING = 16;
const COMPOSER_VISUAL_MARGIN = 4;

export function ChatbotScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const suggestions = [
    { text: t('chatbot.suggestion1') },
    { text: t('chatbot.suggestion2') },
    { text: t('chatbot.suggestion3') },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveContent, setSaveContent] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingSlide = useRef(new Animated.Value(0)).current;
  const chatOpacity = useRef(new Animated.Value(0)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const chipAnims = useRef(suggestions.map(() => new Animated.Value(0))).current;

  const composerHeight = useMemo(
    () => INPUT_CONTAINER_TOP_PADDING + INPUT_ROW_HEIGHT + INPUT_CONTAINER_GAP + ACTION_ROW_HEIGHT,
    [],
  );
  const composerClearance = useMemo(
    () => TAB_BAR_TOTAL_HEIGHT + insets.bottom + COMPOSER_VISUAL_MARGIN,
    [insets.bottom],
  );
  const scrollBottomPadding = useMemo(
    () => composerClearance + composerHeight + COMPOSER_VISUAL_MARGIN,
    [composerClearance],
  );
  const clearanceRef = useRef(composerClearance);
  clearanceRef.current = composerClearance;

  const keyboardOffset = useRef(new Animated.Value(composerClearance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(greetingAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(100, chipAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      )),
    ]).start();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      Animated.timing(keyboardOffset, { toValue: e.endCoordinates.height + clearanceRef.current, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      Animated.timing(keyboardOffset, { toValue: clearanceRef.current, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [messages.length]);

  async function handleSend(text: string, mode?: ResponseMode) {
    if (!text.trim() || isLoading) return;
    setInputText('');

    const userMsg: ChatMessage = { role: 'user', text, responseMode: mode };

    if (!chatStarted) {
      setChatStarted(true);
      setMessages([{ role: 'ai' as const, text: t('chatbot.welcomeMessage') }, userMsg]);
      setIsLoading(true);
      Animated.parallel([
        Animated.timing(greetingOpacity, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(greetingSlide, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(chatOpacity, { toValue: 1, duration: 350, delay: 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setShowGreeting(false));
      const result = await getAIResponse(text, [], mode);
      setIsLoading(false);
      const aiMode = result.responseMode || mode || 'tutor';
      logRenderer(`Chatbot handleSend mode=${aiMode}`);
      setMessages((prev) => [...prev, { role: 'ai', text: result.reply, responseMode: aiMode }]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      const history = buildHistory(messages);
      const result = await getAIResponse(text, history, mode);
      setIsLoading(false);
      const aiMode = result.responseMode || mode || 'tutor';
      logRenderer(`Chatbot handleSend mode=${aiMode}`);
      setMessages((prev) => [...prev, { role: 'ai', text: result.reply, responseMode: aiMode }]);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  function handleSuggestion(text: string) {
    handleSend(text);
  }

  function sanitizeText(text: string) {
    return text.replace(/[#*`>]/g, '');
  }

  function cleanContent(text: string) {
    return text.replace(/[#*`>]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function handleSaveNote(text: string) {
    const cleaned = cleanContent(text);
    const firstLine = cleaned.split('\n')[0].trim();
    setSaveTitle(firstLine.slice(0, 60) || t('chatbot.noteTitleFallback'));
    setSaveContent(cleaned);
    setShowSaveModal(true);
  }

  function handleAddTag() {
    const t = tagInput.trim();
    if (t && !saveTags.includes(t)) {
      setSaveTags([...saveTags, t]);
      setTagInput('');
    }
  }

  function handleRemoveTag(tag: string) {
    setSaveTags(saveTags.filter((x) => x !== tag));
  }

  const [showAttachModal, setShowAttachModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const attachSlideAnim = useRef(new Animated.Value(300)).current;

  const openAttachModal = () => {
    setShowAttachModal(true);
    attachSlideAnim.setValue(300);
    Animated.timing(attachSlideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closeAttachModal = () => {
    Animated.timing(attachSlideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setShowAttachModal(false);
    });
  };

  async function handlePickImage() {
    closeAttachModal();
    try {
      const ImagePicker = await import('expo-image-picker');
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) { Alert.alert(t('chatbot.permissionRequired'), t('chatbot.galleryPermissionNeeded')); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        useKnowledgeStore.getState().addNote({
          id: `note-${Date.now()}`,
          title: `Image from chat ${new Date().toLocaleString()}`,
          content: result.assets[0].uri, type: 'ocr', subject: 'General', topicIds: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['image', 'chat'],
        });
        Alert.alert(t('chatbot.saved'), t('chatbot.imageSaved'));
      }
    } catch { Alert.alert(t('chatbot.notAvailable'), t('chatbot.imagePickerNotSupported')); }
  }

  async function handleCaptureImage() {
    closeAttachModal();
    try {
      const ImagePicker = await import('expo-image-picker');
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert(t('chatbot.permissionRequired'), t('chatbot.cameraPermissionNeeded')); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        useKnowledgeStore.getState().addNote({
          id: `note-${Date.now()}`,
          title: `Captured from chat ${new Date().toLocaleString()}`,
          content: result.assets[0].uri, type: 'ocr', subject: 'General', topicIds: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['image', 'chat'],
        });
        Alert.alert(t('chatbot.saved'), t('chatbot.photoSaved'));
      }
    } catch { Alert.alert(t('chatbot.notAvailable'), t('chatbot.cameraNotSupported')); }
  }

  let speechRecognition: any = null;

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      Alert.alert(t('chatbot.notAvailable'), t('chatbot.speechNotSupported'));
      return;
    }
    speechRecognition = new SR();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      if (event.results[0].isFinal) {
        setInputText(transcript);
        setIsListening(false);
        speechRecognition = null;
      }
    };

    speechRecognition.onerror = () => {
      setIsListening(false);
      speechRecognition = null;
      Alert.alert(t('common.error'), t('chatbot.speechFailed'));
    };

    speechRecognition.onend = () => {
      setIsListening(false);
      speechRecognition = null;
    };

    speechRecognition.start();
    setIsListening(true);
  }

  function stopListening() {
    if (speechRecognition) {
      speechRecognition.stop();
      speechRecognition = null;
    }
    setIsListening(false);
  }

  function handleVoiceNote() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

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
          <BackIcon color="black" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('chatbot.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('chatbot.headerSubtitle')}</Text>
        </View>
      </LinearGradient>

      <View style={styles.contentArea}>
        {isListening && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingBannerText}>{t('chatbot.recordingBanner')}</Text>
          </View>
        )}
        {/* Chat conversation */}
        <Animated.View style={[styles.overlay, { opacity: chatOpacity, pointerEvents: chatStarted ? 'auto' : 'none' }]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.chatContent, { paddingBottom: scrollBottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1 && msg.role === 'ai';
              return (
              <Animated.View key={i} style={isLast ? { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }], opacity: slideAnim } : {}}>
              <View
                style={[
                  styles.messageRow,
                  msg.role === 'user' ? styles.userRow : styles.aiRow,
                ]}
              >
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  {msg.role === 'ai' ? (
                    <>
                      <ResponseModeRenderer mode={msg.responseMode || 'tutor'} text={msg.text} />
                      <TouchableOpacity style={styles.saveNoteBtn} onPress={() => handleSaveNote(msg.text)}>
                        <Text style={styles.saveNoteText}>{t('chatbot.saveAsNote')}</Text>
                      </TouchableOpacity>
                      <ActionChips onAction={(action) => {
                        const MODE_MAP: Record<string, ResponseMode> = {
                          generate_mcq: 'mcq',
                          explain_simpler: 'simple_explanation',
                          give_pyqs: 'pyq',
                          related_topic: 'related_topic',
                          create_flashcard: 'flashcard',
                        };
                        const prompts: Record<string, string> = {
                          generate_mcq: `Generate a multiple choice question about this topic for Kerala PSC exam. Include question, 4 options, answer, and explanation.`,
                          explain_simpler: `Explain the previous response in simpler terms for exam preparation.`,
                          give_pyqs: `List previous year questions from Kerala PSC exams related to this topic.`,
                          related_topic: `Suggest a related topic from Kerala PSC syllabus that I should study next.`,
                          create_flashcard: `Create a flashcard summary of this response for quick revision. Format as: Front: ... Back: ...`,
                        };
                        handleSend(prompts[action] || action, MODE_MAP[action] || 'tutor');
                      }} />
                    </>
                  ) : (
                    <Text style={styles.userBubbleText}>{msg.text}</Text>
                  )}
                </View>
              </View>
              </Animated.View>
              );
            })}
            {isLoading && (
              <View style={[styles.messageRow, styles.aiRow]}>
                <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                  <Text style={styles.typingDots}>...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Greeting overlay */}
        {showGreeting && (
          <Animated.View style={[styles.overlay, {
            opacity: greetingOpacity,
            transform: [{ translateY: greetingSlide.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }],
            pointerEvents: chatStarted ? 'none' : 'auto',
          }]}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} showsVerticalScrollIndicator={false}>
              <Animated.Text style={[styles.greeting, { opacity: greetingAnim, transform: [{ translateY: greetingAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>{t('chatbot.greeting')}</Animated.Text>
              <View style={styles.chipsContainer}>
                {suggestions.map((item, i) => (
                  <Animated.View key={i} style={{ opacity: chipAnims[i], transform: [{ translateY: chipAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <TouchableOpacity style={styles.chip} onPress={() => handleSuggestion(item.text)}>
                      <Text style={styles.chipText}>{item.text}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Save Note Modal */}
      <Modal visible={showSaveModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCardOuterScroll} contentContainerStyle={styles.modalCardScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('chatbot.saveNote')}</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowSaveModal(false)}>
                  <View style={styles.modalCloseIcon}>
                    <Text style={styles.modalCloseX}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('chatbot.titleLabel')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={saveTitle}
                  onChangeText={setSaveTitle}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('chatbot.tagsLabel')}</Text>
                <View style={styles.tagInputRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScrollContent}>
                    {saveTags.map((tag) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                          <Text style={styles.tagChipClose}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TextInput
                      style={styles.tagInputField}
                      placeholder={t('chatbot.tagsPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={handleAddTag}
                      returnKeyType="done"
                    />
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('chatbot.contentLabel')}</Text>
                <View style={styles.modalContentArea}>
                  <ScrollView style={styles.modalContentScroll} showsVerticalScrollIndicator={true}>
                    <Text style={styles.modalContentText}>{saveContent}</Text>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={() => {
                const note: Note = {
                  id: `note_${Date.now()}`,
                  title: saveTitle || t('chatbot.noteTitleFallback'),
                  content: saveContent,
                  type: 'text',
                  subject: saveTags[0] || 'General',
                  topicIds: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  tags: saveTags,
                };
                useKnowledgeStore.getState().addNote(note);
                setShowSaveModal(false);
                navigation.navigate('SavedNotes');
              }}>
                <Text style={styles.modalSaveBtnText}>{t('chatbot.saveNote')}</Text>
              </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <BottomNav activeTab="Chatbot" />

      {/* Input Container - Frame 2435 */}
      <Animated.View style={[styles.inputContainer, { bottom: keyboardOffset }]}>
        {/* Text Input Row - Frame 2436 */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about...."
            placeholderTextColor={colors.text}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend(inputText)}
            returnKeyType="send"
          />
        </View>

        {/* Action Buttons Row - Frame 2511 */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.noteIconBtn} onPress={handleVoiceNote}>
            <MicIcon color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton} onPress={openAttachModal}>
            <AttachIcon color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(inputText)}>
            <SendArrowIcon color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Attach Modal */}
      <Modal visible={showAttachModal} transparent animationType="none" onRequestClose={closeAttachModal}>
        <TouchableOpacity style={styles.attachOverlay} activeOpacity={1} onPress={closeAttachModal}>
          <Animated.View style={[styles.attachSheet, { transform: [{ translateY: attachSlideAnim }] }]}>
            <View style={styles.attachHandle} />
            <Text style={styles.attachSheetTitle}>{t('chatbot.attach')}</Text>
            <TouchableOpacity style={styles.attachOption} onPress={handlePickImage}>
              <View style={[styles.attachOptionIcon, { backgroundColor: colors.warning + '15' }]}>
                <Svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <Rect x="1" y="1" width="20" height="20" rx="3" stroke={colors.warning} strokeWidth="1.5"/>
                  <Circle cx="7" cy="7" r="2" stroke={colors.warning} strokeWidth="1.5"/>
                  <Path d="M1 16L6 11L11 16L16 11L21 16" stroke={colors.warning} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachOptionTitle}>{t('chatbot.uploadGallery')}</Text>
                <Text style={styles.attachOptionSub}>{t('chatbot.uploadGallerySub')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={handleCaptureImage}>
              <View style={[styles.attachOptionIcon, { backgroundColor: colors.error + '15' }]}>
                <Svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <Path d="M2 7C2 5.89543 2.89543 5 4 5H5.38197C5.70515 5 5.99277 4.78929 6.09202 4.48683L6.61732 2.80428C6.79354 2.27572 7.29613 1.91603 7.8541 1.91603H14.1459C14.7039 1.91603 15.2065 2.27572 15.3827 2.80428L15.908 4.48683C16.0072 4.78929 16.2948 5 16.618 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H4C2.89543 19 2 18.1046 2 17V7Z" stroke={colors.error} strokeWidth="1.5"/>
                  <Circle cx="11" cy="12" r="4" stroke={colors.error} strokeWidth="1.5"/>
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachOptionTitle}>{t('chatbot.captureImage')}</Text>
                <Text style={styles.attachOptionSub}>{t('chatbot.captureImageSub')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachCancel} onPress={closeAttachModal}>
              <Text style={styles.attachCancelText}>{t('common.cancel')}</Text>
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
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 102,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm,
    gap: spacing.md - 4,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.full,
  },
  headerInfo: {
    paddingTop: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 310,
    gap: spacing.xl,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: colors.text,
    paddingHorizontal: spacing.xl,
  },
  chipsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: spacing.xs + 6,
  },
  chip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg - 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: colors.text,
  },
  chatContent: {
    paddingTop: 100,
    paddingBottom: 310,
    paddingHorizontal: spacing.md,
    gap: spacing.md - 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  userRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  bubble: {
    padding: spacing.sm + 4,
  },
  aiBubble: {
    maxWidth: '85%',
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 0,
    borderTopRightRadius: radius.md + 2,
    borderBottomLeftRadius: radius.md + 2,
    borderBottomRightRadius: radius.md + 2,
    padding: spacing.xs + 6,
  },
  userBubble: {
    borderRadius: radius.md + 2,
    borderBottomRightRadius: 0,
    backgroundColor: colors.primary,
    maxWidth: '78%',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  userBubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    color: colors.white,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 6,
    alignSelf: 'flex-start',
    height: 26,
    marginTop: spacing.xs,
  },
  saveNoteText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    zIndex: 15,
    ...Platform.select({
      web: { boxShadow: '7px 0px 98.5px rgba(0,0,0,0.12)' },
      default: { elevation: 8 },
    }),
  },
  textInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 17,
    fontFamily: fontFamily.body,
    color: colors.text,
    opacity: 0.75,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: spacing.xs,
    gap: spacing.xs,
    height: 56,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  noteIconBtn: {
    width: 31.43,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 0px 4px rgba(0,0,0,0.12)' },
      default: { elevation: 2 },
    }),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modalCardOuterScroll: {
    flex: 1,
  },
  modalCardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
    boxShadow: '0px 0px 16px rgba(0,0,0,0.12)',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 27,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  modalClose: {
    width: 24,
    height: 24,
    borderRadius: radius.md,
    backgroundColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseX: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  modalField: {
    gap: spacing.sm,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  modalInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  tagInputRow: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  tagScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    gap: spacing.xs,
    height: 24,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    fontFamily: fontFamily.bodyBold,
    color: colors.white,
  },
  tagChipClose: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  tagInputField: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: colors.text,
    padding: 0,
    minWidth: 60,
  },
  modalContentArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm + 4,
    height: 200,
  },
  modalContentScroll: {
    flex: 1,
    paddingRight: 4,
  },
  modalContentText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  modalFooter: {
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginHorizontal: -(spacing.lg),
    marginBottom: -(spacing.lg),
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 4,
  },
  modalSaveBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    fontFamily: fontFamily.bodyBold,
    color: colors.white,
    textAlign: 'center',
  },
  typingBubble: {
    paddingVertical: spacing.xs + 6,
    paddingHorizontal: spacing.md,
  },
  typingDots: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: 2,
  },

  attachOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  attachSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    gap: spacing.md - 4,
  },
  attachHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.xs,
  },
  attachSheetTitle: {
    fontSize: 17, fontWeight: '600', fontFamily: fontFamily.bodySemiBold,
    color: colors.text, textAlign: 'center', marginBottom: spacing.xs,
  },
  attachOption: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.md,
  },
  attachOptionIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  attachOptionTitle: {
    fontSize: 14, fontWeight: '600', fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  attachOptionSub: {
    fontSize: 12, fontWeight: '400', fontFamily: fontFamily.body,
    color: colors.textSecondary, marginTop: 2,
  },
  attachCancel: {
    alignItems: 'center', paddingVertical: spacing.sm + 4, marginTop: spacing.xs,
  },
  attachCancelText: {
    fontSize: 14, fontWeight: '500', fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
  },

  recordingBanner: {
    position: 'absolute', top: 108, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 6,
    backgroundColor: colors.error, borderRadius: radius.md, zIndex: 20,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }, default: { elevation: 6 } }),
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  recordingBannerText: {
    fontSize: 13, fontWeight: '600', fontFamily: fontFamily.bodyMedium,
    color: colors.white, flex: 1,
  },

});
