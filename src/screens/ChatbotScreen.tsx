import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Animated, Keyboard, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';
import type { Note } from '../data/mockData';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveContent, setSaveContent] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const chipAnims = useRef(suggestions.map(() => new Animated.Value(0))).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(gradientAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(greetingAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(100, chipAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 350, useNativeDriver: true })
      )),
    ]).start();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      Animated.timing(keyboardOffset, { toValue: e.endCoordinates.height, duration: 250, useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      Animated.timing(keyboardOffset, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 40 }).start();
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
    return text.replace(/[#*]/g, '');
  }

  function handleSaveNote(text: string) {
    const firstLine = text.split('\n')[0].replace(/[*#]/g, '').trim();
    setSaveTitle(firstLine.slice(0, 60) || 'AI Tutor Response');
    setSaveContent(text);
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
      </LinearGradient>

      {!chatStarted ? (
        /* Initial greeting */
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
      ) : (
        /* Chat conversation */
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
              <View style={[styles.bubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color="#F7B11A" />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

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
        <Animated.View style={[styles.gradientGlow, {
          opacity: gradientAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.35, 0.15] }),
          transform: [{
            translateX: gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] }),
          }],
        }]}>
          <LinearGradient
            colors={['rgba(247,177,26,0)', 'rgba(247,177,26,0.6)', 'rgba(247,177,26,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputText}
            placeholder="Ask about...."
            placeholderTextColor="rgba(0,0,0,0.75)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend(inputText)}
            returnKeyType="send"
          />
          <View style={styles.inputActions}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.attachButton}>
                <Svg width="5.97" height="11.11" viewBox="0 0 6 12" fill="none">
                  <Path d="M2.2375 4.04576V8.54107C2.24269 8.86979 2.37692 9.18328 2.61122 9.41391C2.84551 9.64453 3.16109 9.77379 3.48984 9.77379C3.8186 9.77379 4.13418 9.64453 4.36847 9.41391C4.60277 9.18328 4.737 8.86979 4.74219 8.54107L4.74625 2.64888C4.74966 2.36792 4.69726 2.08908 4.5921 1.82852C4.48694 1.56796 4.33111 1.33087 4.13364 1.13098C3.93616 0.931099 3.70098 0.7724 3.44171 0.664087C3.18245 0.555773 2.90426 0.5 2.62328 0.5C2.3423 0.5 2.06412 0.555773 1.80485 0.664087C1.54559 0.7724 1.3104 0.931099 1.11293 1.13098C0.915452 1.33087 0.759618 1.56796 0.654458 1.82852C0.549298 2.08908 0.496904 2.36792 0.500313 2.64888V8.58076C0.494588 8.9763 0.567552 9.36904 0.714962 9.73614C0.862372 10.1032 1.08129 10.4374 1.35898 10.7191C1.63667 11.0009 1.9676 11.2246 2.33253 11.3773C2.69746 11.53 3.0891 11.6086 3.48469 11.6086C3.88028 11.6086 4.27192 11.53 4.63685 11.3773C5.00177 11.2246 5.3327 11.0009 5.6104 10.7191C5.88809 10.4374 6.107 10.1032 6.25441 9.73614C6.40182 9.36904 6.47479 8.9763 6.46906 8.58076V3.03763" stroke="black" strokeMiterlimit="10" strokeLinecap="round"/>
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mikeButton}>
                <Svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                  <Path fillRule="evenodd" clipRule="evenodd" d="M2.8 3V7C2.8 7.28891 2.8569 7.57499 2.96747 7.8419C3.07803 8.10882 3.24008 8.35135 3.44437 8.55564C3.64865 8.75992 3.89118 8.92197 4.1581 9.03254C4.42501 9.1431 4.71109 9.2 5 9.2C5.28891 9.2 5.57499 9.1431 5.8419 9.03254C6.10882 8.92197 6.35135 8.75992 6.55564 8.55564C6.75992 8.35135 6.92197 8.10882 7.03254 7.8419C7.1431 7.57499 7.2 7.28891 7.2 7V3C7.2 2.41652 6.96822 1.85695 6.55564 1.44437C6.14305 1.03179 5.58348 0.8 5 0.8C4.41652 0.8 3.85695 1.03179 3.44437 1.44437C3.03179 1.85695 2.8 2.41652 2.8 3ZM5.4 11.984V14H4.6V11.984C3.34718 11.8835 2.17819 11.3148 1.32576 10.3912C0.473326 9.46759 -6.45565e-06 8.25684 0 7V6H0.8V7C0.8 8.11391 1.2425 9.1822 2.03015 9.96985C2.8178 10.7575 3.88609 11.2 5 11.2C6.11391 11.2 7.1822 10.7575 7.96985 9.96985C8.7575 9.1822 9.2 8.11391 9.2 7V6H10V7C10 8.25684 9.52667 9.46759 8.67424 10.3912C7.82181 11.3148 6.65282 11.8835 5.4 11.984ZM2 3C2 2.20435 2.31607 1.44129 2.87868 0.87868C3.44129 0.31607 4.20435 0 5 0C5.79565 0 6.55871 0.31607 7.12132 0.87868C7.68393 1.44129 8 2.20435 8 3V7C8 7.79565 7.68393 8.55871 7.12132 9.12132C6.55871 9.68393 5.79565 10 5 10C4.20435 10 3.44129 9.68393 2.87868 9.12132C2.31607 8.55871 2 7.79565 2 7V3Z" fill="black"/>
                </Svg>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(inputText)}>
              <Svg width="12.44" height="13.07" viewBox="0 0 13 14" fill="none">
                <Path d="M6.21363 1.07592C6.2137 0.977425 6.23316 0.879911 6.27092 0.788942C6.30867 0.697972 6.36397 0.61533 6.43366 0.545733C6.50335 0.476135 6.58606 0.420946 6.67708 0.383315C6.7681 0.345685 6.86564 0.326351 6.96413 0.326416C7.06263 0.326482 7.16014 0.345946 7.25111 0.383698C7.34208 0.42145 7.42472 0.476749 7.49432 0.54644C7.56392 0.61613 7.6191 0.698846 7.65674 0.789866C7.69437 0.880885 7.7137 0.978425 7.71363 1.07692L6.21363 1.07592ZM6.96313 2.20642H6.21313V2.20592L6.96313 2.20642ZM7.71313 7.22492C7.71313 7.42383 7.63412 7.61459 7.49346 7.75525C7.35281 7.8959 7.16205 7.97492 6.96313 7.97492C6.76422 7.97492 6.57346 7.8959 6.4328 7.75525C6.29215 7.61459 6.21313 7.42383 6.21313 7.22492H7.71313ZM6.21313 7.23417C6.21313 7.03525 6.29215 6.84449 6.4328 6.70384C6.57346 6.56318 6.76422 6.48417 6.96313 6.48417C7.16205 6.48417 7.35281 6.56318 7.49346 6.70384C7.63412 6.84449 7.71313 7.03525 7.71313 7.23417H6.21313ZM7.71313 12.6509C7.71313 12.8498 7.63412 13.0406 7.49346 13.1812C7.35281 13.3219 7.16205 13.4009 6.96313 13.4009C6.76422 13.4009 6.57346 13.3219 6.4328 13.1812C6.29215 13.0406 6.21313 12.8498 6.21313 12.6509H7.71313ZM7.71363 1.07692V1.09567L6.21363 1.09492V1.07592L7.71363 1.07692ZM7.71363 1.09567V1.31817L6.21363 1.31692V1.09492L7.71363 1.09567ZM7.71363 1.31817V1.54017L6.21363 1.53917V1.31692L7.71363 1.31817ZM7.71363 1.54017L7.71338 1.76267L6.21338 1.76142L6.21363 1.53917L7.71363 1.54017ZM7.71338 1.76267L7.71313 1.98467L6.21313 1.98367L6.21338 1.76142L7.71338 1.76267ZM7.71313 1.98467V2.20692L6.21313 2.20592V1.98367L7.71313 1.98467ZM7.71313 2.20642V7.22492H6.21313V2.20642H7.71313ZM7.71313 7.23417L7.71313 12.6509H6.21313L6.21313 7.23417H7.71313Z" fill="white"/>
                <Path d="M0.750122 6.42847L6.04437 1.13447C6.16625 1.01258 6.31094 0.915888 6.47019 0.849921C6.62944 0.783953 6.80013 0.75 6.9725 0.75C7.14487 0.75 7.31555 0.783953 7.4748 0.849921C7.63405 0.915888 7.77874 1.01258 7.90062 1.13447L13.1946 6.42872" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

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
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 999,
    padding: 4,
  },
  scrollContent: {
    paddingTop: 96,
    paddingBottom: 200,
    gap: 40,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: '#000000',
    paddingHorizontal: 24,
  },
  chipsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    color: '#000000',
  },
  chatContent: {
    paddingTop: 96,
    paddingBottom: 200,
    paddingHorizontal: 4,
    gap: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aiRow: {
    alignSelf: 'stretch',
  },
  userRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 1,
  },
  bubble: {
    padding: 16,
    gap: 10,
  },
  aiBubble: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  userBubble: {
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
    maxWidth: '80%',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.body,
    color: '#000000',
  },
  userBubbleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
    textAlign: 'right',
  },
  saveNoteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#F9F9F9',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    alignSelf: 'flex-start',
    height: 32,
  },
  saveNoteText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 7, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 98.5,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
    overflow: 'hidden',
  },
  gradientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    fontFamily: fontFamily.body,
    color: '#000000',
    opacity: 0.75,
    padding: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: 88,
    height: 44,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mikeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7B11A',
    borderRadius: 12,
    padding: 0,
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
    padding: 38.5,
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
  typingText: {
    fontSize: 14,
    color: '#999',
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
});
