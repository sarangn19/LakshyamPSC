import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Animated, Keyboard, Platform, Easing, Alert } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';
import type { Note } from '../data/mockData';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';

const suggestions = [
  { text: 'Make a note on Indian Freedom Struggle' },
  { text: 'Summarise the Preamble of Indian Constitution' },
  { text: 'Create a study note on key Geography facts' },
  { text: 'Note down this week\'s important current affairs' },
];

const welcomeMessage = {
  role: 'ai' as const,
  text: "നമസ്കാരം! 👋 I'm your Lakshyam AI Tutor.\n\nI'll calibrate explanations to your exam level.\n\nI can help you with:\n• Explaining Kerala PSC topics\n• Creating study notes\n• Answering doubts\n• Simplifying difficult concepts\n• മലയാളത്തിലും ചോദിക്കാം\n\nWhat would you like to learn today?",
};

type Message = {
  role: 'ai' | 'user';
  text: string;
};

export function ChatbotScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
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
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingSlide = useRef(new Animated.Value(0)).current;
  const chatOpacity = useRef(new Animated.Value(0)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const chipAnims = useRef(suggestions.map(() => new Animated.Value(0))).current;

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
      Animated.timing(keyboardOffset, { toValue: e.endCoordinates.height, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      Animated.timing(keyboardOffset, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [messages.length]);

  async function getAIResponse(userMessage: string, history: { role: string; content: string }[]) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return 'AI is not configured. Please check your Supabase environment variables.';
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ message: userMessage, history, examType: 'LDC' }),
      });
      const data = await res.json();
      return data.reply || 'Sorry, I could not generate a response.';
    } catch {
      return 'Network error. Please check your connection and try again.';
    }
  }

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return;
    setInputText('');

    const userMsg: Message = { role: 'user', text };

    if (!chatStarted) {
      setChatStarted(true);
      setMessages([welcomeMessage, userMsg]);
      setIsLoading(true);
      Animated.parallel([
        Animated.timing(greetingOpacity, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(greetingSlide, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(chatOpacity, { toValue: 1, duration: 350, delay: 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setShowGreeting(false));
      const reply = await getAIResponse(text, []);
      setIsLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      const history = messages.map((m) => ({ role: m.role, content: m.text }));
      const reply = await getAIResponse(text, history);
      setIsLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
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
    setSaveTitle(firstLine.slice(0, 60) || 'AI Tutor Response');
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
      if (!granted) { Alert.alert('Permission required', 'Gallery permission is needed.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        useKnowledgeStore.getState().addNote({
          id: `note-${Date.now()}`,
          title: `Image from chat ${new Date().toLocaleString()}`,
          content: result.assets[0].uri, type: 'ocr', subject: 'General', topicIds: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['image', 'chat'],
        });
        Alert.alert('Saved', 'Image saved as a note.');
      }
    } catch { Alert.alert('Not available', 'Image picker not supported here.'); }
  }

  async function handleCaptureImage() {
    closeAttachModal();
    try {
      const ImagePicker = await import('expo-image-picker');
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert('Permission required', 'Camera permission is needed.'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        useKnowledgeStore.getState().addNote({
          id: `note-${Date.now()}`,
          title: `Captured from chat ${new Date().toLocaleString()}`,
          content: result.assets[0].uri, type: 'ocr', subject: 'General', topicIds: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['image', 'chat'],
        });
        Alert.alert('Saved', 'Photo saved as a note.');
      }
    } catch { Alert.alert('Not available', 'Camera not supported here.'); }
  }

  let speechRecognition: any = null;

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      Alert.alert('Not available', 'Speech recognition is not supported on this device.');
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
      Alert.alert('Error', 'Speech recognition failed. Please try again.');
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
          <Svg width="9" height="17" viewBox="0 0 9 17" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M8.99892 15.938L7.95392 17L0.287919 9.21C0.10342 9.0197 0.000244141 8.76505 0.000244141 8.5C0.000244141 8.23495 0.10342 7.9803 0.287919 7.79L7.95392 0L8.99892 1.063L1.68092 8.5L8.99892 15.938Z" fill="black"/>
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Tutor</Text>
          <Text style={styles.headerSubtitle}>Lakshyam PSC</Text>
        </View>
      </LinearGradient>

      <View style={styles.contentArea}>
        {isListening && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingBannerText}>Listening... tap mic to stop</Text>
          </View>
        )}
        {/* Chat conversation */}
        <Animated.View style={[styles.overlay, { opacity: chatOpacity, pointerEvents: chatStarted ? 'auto' : 'none' }]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatContent}
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
                  <Text style={msg.role === 'user' ? styles.userBubbleText : styles.bubbleText}>{sanitizeText(msg.text)}</Text>
                  {msg.role === 'ai' && (
                    <TouchableOpacity style={styles.saveNoteBtn} onPress={() => handleSaveNote(msg.text)}>
                      <Text style={styles.saveNoteText}>Save as note</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              </Animated.View>
            );})}
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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.Text style={[styles.greeting, { opacity: greetingAnim, transform: [{ translateY: greetingAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>Hi, what would you like to learn today?</Animated.Text>
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
                <Text style={styles.modalTitle}>Save Note</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowSaveModal(false)}>
                  <View style={styles.modalCloseIcon}>
                    <Text style={styles.modalCloseX}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  value={saveTitle}
                  onChangeText={setSaveTitle}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Tags</Text>
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
                      placeholder="Tags"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={handleAddTag}
                      returnKeyType="done"
                    />
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Content</Text>
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
                  title: saveTitle || 'AI Tutor Response',
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
                <Text style={styles.modalSaveBtnText}>Save Note</Text>
              </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Input Area */}
      <Animated.View style={[styles.inputArea, { bottom: keyboardOffset }]}>
        <View style={styles.composer}>
          <TextInput
            style={styles.prompt}
            placeholder="Ask about anything..."
            placeholderTextColor="#7f8795"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend(inputText)}
            returnKeyType="send"
            multiline
            textAlignVertical="top"
          />
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.attachBtn} onPress={openAttachModal}>
              <Svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <Path d="M9.5 3V10.5C9.5 10.8978 9.34196 11.2794 9.06066 11.5607C8.77936 11.842 8.39782 12 8 12C7.60218 12 7.22064 11.842 6.93934 11.5607C6.65804 11.2794 6.5 10.8978 6.5 10.5V4.5C6.5 3.83696 6.76339 3.20107 7.23223 2.73223C7.70107 2.26339 8.33696 2 9 2C9.66304 2 10.2989 2.26339 10.7678 2.73223C11.2366 3.20107 11.5 3.83696 11.5 4.5V10.5C11.5 11.4283 11.1313 12.3185 10.4749 12.9749C9.8185 13.6313 8.92826 14 8 14C7.07174 14 6.1815 13.6313 5.52513 12.9749C4.86875 12.3185 4.5 11.4283 4.5 10.5V5.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.micBtn} onPress={handleVoiceNote}>
              <Svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <Path d="M11 2C9.89543 2 9 2.89543 9 4V11C9 12.1046 9.89543 13 11 13C12.1046 13 13 12.1046 13 11V4C13 2.89543 12.1046 2 11 2Z" stroke={isListening ? '#DC2626' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M16 10C16 11.3261 15.4732 12.5979 14.5355 13.5355C13.5979 14.4732 12.3261 15 11 15C9.67392 15 8.40215 14.4732 7.46447 13.5355C6.52678 12.5979 6 11.3261 6 10" stroke={isListening ? '#DC2626' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M11 18V20" stroke={isListening ? '#DC2626' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M8 20H14" stroke={isListening ? '#DC2626' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(inputText)}>
              <Svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <Path d="M17.5 10L2.5 10M17.5 10L12 4.5M17.5 10L12 15.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Attach Modal */}
      <Modal visible={showAttachModal} transparent animationType="none" onRequestClose={closeAttachModal}>
        <TouchableOpacity style={styles.attachOverlay} activeOpacity={1} onPress={closeAttachModal}>
          <Animated.View style={[styles.attachSheet, { transform: [{ translateY: attachSlideAnim }] }]}>
            <View style={styles.attachHandle} />
            <Text style={styles.attachSheetTitle}>Attach</Text>
            <TouchableOpacity style={styles.attachOption} onPress={handlePickImage}>
              <View style={[styles.attachOptionIcon, { backgroundColor: '#F59E0B15' }]}>
                <Svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <Rect x="1" y="1" width="20" height="20" rx="3" stroke="#F59E0B" strokeWidth="1.5"/>
                  <Circle cx="7" cy="7" r="2" stroke="#F59E0B" strokeWidth="1.5"/>
                  <Path d="M1 16L6 11L11 16L16 11L21 16" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachOptionTitle}>Upload from gallery</Text>
                <Text style={styles.attachOptionSub}>Choose an image from your library</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={handleCaptureImage}>
              <View style={[styles.attachOptionIcon, { backgroundColor: '#DC262615' }]}>
                <Svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <Path d="M2 7C2 5.89543 2.89543 5 4 5H5.38197C5.70515 5 5.99277 4.78929 6.09202 4.48683L6.61732 2.80428C6.79354 2.27572 7.29613 1.91603 7.8541 1.91603H14.1459C14.7039 1.91603 15.2065 2.27572 15.3827 2.80428L15.908 4.48683C16.0072 4.78929 16.2948 5 16.618 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H4C2.89543 19 2 18.1046 2 17V7Z" stroke="#DC2626" strokeWidth="1.5"/>
                  <Circle cx="11" cy="12" r="4" stroke="#DC2626" strokeWidth="1.5"/>
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachOptionTitle}>Capture image</Text>
                <Text style={styles.attachOptionSub}>Take a photo with your camera</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachCancel} onPress={closeAttachModal}>
              <Text style={styles.attachCancelText}>Cancel</Text>
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
    backgroundColor: '#FAFAF8',
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
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
  },
  headerInfo: {
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: '#111827',
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 180,
    gap: 32,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: '#111827',
    paddingHorizontal: 32,
  },
  chipsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: '#374151',
  },
  chatContent: {
    paddingTop: 100,
    paddingBottom: 180,
    paddingHorizontal: 16,
    gap: 12,
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
    padding: 12,
  },
  aiBubble: {
    maxWidth: '82%',
    backgroundColor: '#F0F2F5',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  userBubble: {
    borderRadius: 14,
    borderBottomRightRadius: 0,
    backgroundColor: '#F7B11A',
    maxWidth: '78%',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    color: '#111827',
  },
  userBubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: fontFamily.body,
    color: '#FFFFFF',
  },
  saveNoteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignSelf: 'flex-start',
    height: 26,
    marginTop: 4,
  },
  saveNoteText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    fontFamily: fontFamily.bodyMedium,
    color: '#6B7280',
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    zIndex: 1,
  },
  composer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 10,
    marginHorizontal: 8,
    marginBottom: Platform.OS === 'ios' ? 8 : 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,.06)' },
      default: { elevation: 3 },
    }),
  },
  prompt: {
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 6,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: '#111827',
    outlineStyle: 'none',
    outlineWidth: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F7B11A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(247,177,26,.3)' },
      default: { elevation: 3 },
    }),
  },
  spacer: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalCardOuterScroll: {
    flex: 1,
  },
  modalCardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 24,
    gap: 24,
    boxShadow: '0px 0px 16px rgba(0,0,0,0.12)',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 27,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  modalClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9D9D9D',
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  modalField: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
  },
  modalInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
    outlineWidth: 0,
  },
  tagInputRow: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tagScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7B11A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    gap: 4,
    height: 24,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    fontFamily: fontFamily.bodyBold,
    color: '#FFFFFF',
  },
  tagChipClose: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
  },
  tagInputField: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
    padding: 0,
    minWidth: 60,
    outlineWidth: 0,
  },
  modalContentArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingLeft: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
    color: '#000000',
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: -24,
    marginBottom: -24,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  modalSaveBtn: {
    height: 48,
    backgroundColor: '#F7B11A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    fontFamily: fontFamily.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  typingBubble: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  typingDots: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: '#6B7280',
    lineHeight: 20,
    letterSpacing: 2,
  },

  attachOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  attachSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 12,
  },
  attachHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 4,
  },
  attachSheetTitle: {
    fontSize: 17, fontWeight: '600', fontFamily: fontFamily.bodySemiBold,
    color: '#111827', textAlign: 'center', marginBottom: 4,
  },
  attachOption: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#F6F6F4', borderRadius: 12, gap: 16,
  },
  attachOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  attachOptionTitle: {
    fontSize: 14, fontWeight: '600', fontFamily: fontFamily.bodyMedium,
    color: '#111827',
  },
  attachOptionSub: {
    fontSize: 12, fontWeight: '400', fontFamily: fontFamily.body,
    color: '#6B7280', marginTop: 2,
  },
  attachCancel: {
    alignItems: 'center', paddingVertical: 12, marginTop: 4,
  },
  attachCancelText: {
    fontSize: 14, fontWeight: '500', fontFamily: fontFamily.bodyMedium,
    color: '#6B7280',
  },

  recordingBanner: {
    position: 'absolute', top: 108, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#DC2626', borderRadius: 12, zIndex: 20,
    ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }, default: { elevation: 6 } }),
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  recordingBannerText: {
    fontSize: 13, fontWeight: '600', fontFamily: fontFamily.bodyMedium,
    color: '#FFFFFF', flex: 1,
  },

});
