import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useKnowledgeStore } from '../store';
import { useTranslation } from '../i18n/useTranslation';

interface QuizOption {
  key: string;
  text: string;
  correct?: boolean;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLesson?: boolean;
  title?: string;
  quiz?: { question: string; options: QuizOption[] };
}

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

function getDepthPrefix(exams: string[]): string {
  if (exams.some((e) => ['Degree Level', 'University Assistant'].includes(e))) return 'deep';
  if (exams.includes('Secretariat Assistant')) return 'moderate';
  return 'basic';
}

function getExamContext(exams: string[]): string {
  if (exams.length === 0) return 'general';
  if (exams.length === 1) return exams[0];
  return `${exams.slice(0, -1).join(', ')} and ${exams[exams.length - 1]}`;
}

const getSuggestions = (t: (key: string, params?: Record<string, string | number>) => string) => [
  t('aiTutor.suggestion1'),
  t('aiTutor.suggestion2'),
  t('aiTutor.suggestion3'),
  t('aiTutor.malayalamPrompt'),
  t('aiTutor.suggestion4'),
  t('aiTutor.suggestion5'),
];

function TypingDots() {
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        { iterations: -1 },
      ).start();
    };
    pulse(opacity1, 0);
    pulse(opacity2, 200);
    pulse(opacity3, 400);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.sm }}>
      {[opacity1, opacity2, opacity3].map((op, i) => (
        <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', opacity: op }} />
      ))}
    </View>
  );
}

export function AITutorScreen({ route, navigation }: any) {
  const { targetExams, primaryExam } = useUserStore();
  const addNote = useKnowledgeStore((s) => s.addNote);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [savedNoteIds, setSavedNoteIds] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();

  const depth = getDepthPrefix(targetExams);
  const examContext = getExamContext(targetExams);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getWelcomeMessage = (): Message => {
    const contextStr = targetExams.length > 0
      ? `I see you're preparing for **${examContext}**. I'll calibrate explanations to that level.`
      : '';
    return {
      id: 'welcome',
      text: `\u0D28\u0D2E\u0D38\u0D4D\u0D15\u0D3E\u0D30\u0D02! 👋 ${t('aiTutor.welcome')}\n\n${contextStr}\n\n${t('aiTutor.welcomeDesc')}\n• ${t('aiTutor.welcomeItem1')} (${depth} level)\n• ${t('aiTutor.welcomeItem2')}\n• ${t('aiTutor.welcomeItem3')}\n• ${t('aiTutor.welcomeItem4')}\n• ${t('aiTutor.welcomeML')}\n\n${t('aiTutor.whatLearn')}`,
      isUser: false,
      timestamp: new Date(),
    };
  };

  React.useEffect(() => {
    if (messages.length === 0) {
      const msgs: Message[] = [getWelcomeMessage()];
      const weaknessTopic = route?.params?.weaknessAttack as string | undefined;
      if (weaknessTopic) {
        msgs.push({ id: `u-init-${Date.now()}`, text: weaknessTopic, isUser: true, timestamp: new Date() });
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, getAIResponse(weaknessTopic)]);
          setIsTyping(false);
        }, 1200);
      }
      setMessages(msgs);
    }
  }, [targetExams, primaryExam]);

  const getAIResponse = (query: string): Message => {
    const lower = query.toLowerCase().trim();
    const isDeep = depth === 'deep';
    const isModerate = depth === 'moderate';

    if (lower.includes('explain temple entry proclamation') || (lower.includes('temple') && lower.includes('entry'))) {
      const base: Message = {
        id: `a${Date.now()}`,
        isUser: false,
        timestamp: new Date(),
        isLesson: true,
        title: 'Temple Entry Proclamation (ക്ഷേത്രപ്രവേശന വിളംബരം)',
        text: `Here is a high-yield summary calibrated for **LDC & Degree level exams**:\n\n1. **Date of Proclamation**: November 12, 1936 (Malayalam date: 1112 Thulam 27).\n2. **Maharaja**: Issued by **Sri Chithira Thirunal Balarama Varma**.\n3. **Key Brains**: Crafted under the advice of Dewan **Sir C.P. Ramaswami Iyer**.\n4. **Significance**: It opened the state temples of Travancore to all Hindus, regardless of caste, which Gandhiji hailed as "the spiritual charter of modern India" (ആധുനിക ഇന്ത്യയുടെ തീർത്ഥാടനം).\n\nLet's test your memory with a quick exam-style MCQ below:`,
        quiz: {
          question: "Who was the Dewan of Travancore during the Temple Entry Proclamation?",
          options: [
            { key: 'A', text: 'Colonel Munro' },
            { key: 'B', text: 'Sir C.P. Ramaswami Iyer', correct: true },
            { key: 'C', text: 'Velu Thampi Dalawa' },
            { key: 'D', text: 'P.G.N. Unnithan' },
          ],
        },
      };
      if (isDeep) {
        base.text += '\n\n**Degree-Level Depth:**\n• Compare with the Temple Entry Authorization Act of 1947 (Madras)\n• Analyse the role of the Travancore Legislative Council\n• Discuss how it intersected with the larger Devdasi abolition movement\n• Evaluate its economic impact on temple treasury systems\n• Connect to Article 25 of the Constitution (freedom of religion)';
      }
      return base;
    }

    if (lower.includes('nārāyaṇan guru') || lower.includes('narayana guru') || lower.includes('sree narayana') || lower.includes('sndp') || (lower.includes('guru') && lower.includes('ayyankali')) || lower.includes('difference')) {
      return {
        id: `a${Date.now()}`,
        isUser: false,
        timestamp: new Date(),
        isLesson: true,
        title: 'Sree Narayana Guru vs Ayyankali',
        text: `Both are core figures of the Kerala Renaissance. Let's compare high-yield points:\n\n• **Sree Narayana Guru** (1856-1928):\n  - Focus: Spiritual, ideological & education reforms ("One Caste, One Religion, One God for Man").\n  - Epicenter: Southern Travancore (Aravipuram Prathishta, 1888).\n  - Founded: SNDP Yogam (1903).\n\n• **Ayyankali** (1863-1941):\n  - Focus: Aggressive fight for physical freedom, education rights for Dalits, and physical spaces (Chaliyar Riots, Villuvandi Protest).\n  - Epicenter: Venganoor, Travancore.\n  - Founded: Sadhu Jana Paripalana Sangham (SJPS, 1907).\n\nWould you like me to generate a 5-question test on these Renaissance leaders?`,
      };
    }

    if (lower.includes('20') && (lower.includes('ldc') || lower.includes('question') || lower.includes('kerala geography'))) {
      return {
        id: `a${Date.now()}`,
        isUser: false,
        timestamp: new Date(),
        text: 'Here are 5 LDC-level questions on Kerala Geography:\n\n' +
          '1\uFE0F\u20E3 Which is the longest river in Kerala?\n   a) Periyar  b) Bharathapuzha  c) Pamba  d) Chaliyar\n   **Answer: a) Periyar (244 km)**\n\n' +
          '2\uFE0F\u20E3 Which district has the longest coastline?\n   a) Kozhikode  b) Kannur  c) Kasaragod  d) Alappuzha\n   **Answer: d) Alappuzha**\n\n' +
          '3\uFE0F\u20E3 The backwaters of Kerala are known as?\n   a) Kuttanad  b) Vembanad  c) Ashtamudi  d) Kayals\n   **Answer: d) Kayals**\n\n' +
          '4\uFE0F\u20E3 Highest peak in Kerala?\n   a) Anamudi  b) Agastya Mala  c) Chembra  d) Meesapulimala\n   **Answer: a) Anamudi (2,695m)**\n\n' +
          '5\uFE0F\u20E3 Which pass connects Kerala to Tamil Nadu?\n   a) Palakkad Gap  b) Thalassery  c) Kambam  d) Shencottah\n   **Answer: a) Palakkad Gap**\n\nWant more questions or an explanation on any of these?',
      };
    }

    if (lower.includes('degree') || (lower.includes('deep') && (lower.includes('question') || lower.includes('mcq')))) {
      return {
        id: `a${Date.now()}`,
        isUser: false,
        timestamp: new Date(),
        text: 'Here are 3 Degree-Level conceptual questions on Kerala Renaissance:\n\n' +
          '1\uFE0F\u20E3 Critically analyse the socio-economic impact of SNDP Yogam on Kerala society.\n   **Hint:** Focus on caste reform, education access, and economic empowerment.\n\n' +
          '2\uFE0F\u20E3 Evaluate the role of Sree Narayana Guru\'s "One Caste, One God, One Religion" philosophy in shaping Kerala\'s secular identity.\n   **Hint:** Compare with contemporary reform movements across India.\n\n' +
          '3\uFE0F\u20E3 Discuss how the Temple Entry Proclamation of 1936 influenced similar movements in other princely states.\n   **Hint:** Consider Travancore\'s unique position and the role of Maharaja Sree Chithira Thirunal.\n\nWant me to provide detailed model answers for any of these?',
      };
    }

    if (lower.includes('directive principles')) {
      const base = "Think of Directive Principles as the **instruction manual** for the government.\n\n📖 **Simple Version:**\nThe Constitution says 'Government, here's what you SHOULD do for the people.'\n\n🎯 **Key Ideas:**\n• Every village should have schools and hospitals (Article 41)\n• Fair wages for workers (Article 43)\n• Free legal aid for the poor (Article 39A)\n• Protect the environment (Article 48A)";
      return {
        id: `a${Date.now()}`,
        isUser: false,
        timestamp: new Date(),
        text: isDeep
          ? base + '\n\n**Degree-Level Depth:**\n• Distinguish between Socialistic, Gandhian, and Liberal-Intellectual principles\n• Analyse the relationship between Part III (Fundamental Rights) and Part IV (DPSP)\n• Key cases: Minerva Mills (1980), Kesavananda Bharati (1973)\n• Compare with the concept of \'Directive Principles\' in the Irish Constitution\n• Critically evaluate: Are they really \'non-justiciable\' in practice? (Consider Article 21 linkage)'
          : isModerate
            ? base + '\n\n**SA-Level Detail:**\n• DPSPs are borrowed from the Irish Constitution\n• Key amendments: 42nd Amendment (1976) added new principles\n• Important articles: 39 (equal pay), 44 (uniform civil code), 48 (cow protection)\n• Difference between \'legal rights\' and \'directive principles\' - the \'Harijan\' vs state case'
            : base,
      };
    }

    return {
      id: `a${Date.now()}`,
      isUser: false,
      timestamp: new Date(),
      text: `Great question! Let me help you with that for **${examContext}** (${depth} level).\n\n📚 **Key Points:**\n• This is an important topic for Kerala PSC ${examContext} exams\n• It appears in both prelims and mains\n\n💡 **Study Tip:** Make sure to link this topic with related concepts in your Knowledge Vault for better retention.\n\nWant me to:\n1. Generate MCQ questions for ${examContext}?\n2. Create flashcards?\n3. Explain in Malayalam?\n4. Provide more detailed notes?\n\nJust let me know! 😊`,
    };
  };

  const stripMarkdown = (text: string): string =>
    text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^\s*•/gm, '-')
      .replace(/^\s*\*\s+/gm, '- ')
      .replace(/^#+\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const handleSaveAsNote = (msg: Message) => {
    if (savedNoteIds.has(msg.id)) return;
    const title = msg.title || (msg.text.split('\n')[0].replace(/[*#]/g, '').trim().slice(0, 60));
    addNote({
      id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || t('aiTutor.noteTitleFallback'),
      content: stripMarkdown(msg.text),
      type: 'text',
      subject: targetExams[0] || 'General',
      topicIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['ai-tutor'],
    });
    setSavedNoteIds((prev) => new Set(prev).add(msg.id));
    showToast('Saved securely to your notes!');
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u${Date.now()}`, text: text.trim(), isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg = getAIResponse(text);
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {toast && (
        <View style={styles.toast}>
          <View style={styles.toastDot} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('aiTutor.title')}</Text>
            <Text style={styles.headerStatus}>
              Online <Text style={{ opacity: 0.4 }}>•</Text> Calibrated for {depth} level
            </Text>
          </View>
        </View>
        <View style={styles.examStack}>
          {targetExams.slice(0, 2).map((exam) => (
            <View key={exam} style={styles.headerAction}>
              <Text style={{ fontSize: 12 }}>{EXAM_ICONS[exam] || '📋'}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Chat */}
      <ScrollView ref={scrollRef} style={styles.chatArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatContent}>
        {messages.map((msg) => {
          const isSaved = !msg.isUser && savedNoteIds.has(msg.id);
          return (
            <View key={msg.id} style={[styles.msgRow, msg.isUser && styles.msgRowUser]}>
              {!msg.isUser && (
                <View style={styles.botAvatar}>
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                </View>
              )}
              <View style={[styles.msgContent, msg.isUser ? styles.msgContentUser : styles.msgContentBot]}>
                {msg.isLesson && (
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonIcon}>✨</Text>
                    <Text style={styles.lessonTitle}>{msg.title}</Text>
                  </View>
                )}
                <Text style={[styles.msgText, msg.isUser && styles.msgTextUser]}>{msg.text}</Text>

                {msg.quiz && (
                  <View style={styles.quizSection}>
                    <Text style={styles.quizQuestion}>{msg.quiz.question}</Text>
                    {msg.quiz.options.map((option) => {
                      const selected = selectedAnswers[msg.id] === option.key;
                      const showCorrect = selectedAnswers[msg.id] && option.correct;
                      const showWrong = selected && !option.correct;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.quizOption,
                            showCorrect && styles.quizOptionCorrect,
                            showWrong && styles.quizOptionWrong,
                            selected && !selectedAnswers[msg.id] && styles.quizOptionSelected,
                          ]}
                          onPress={() => {
                            if (!selectedAnswers[msg.id]) {
                              setSelectedAnswers((prev) => ({ ...prev, [msg.id]: option.key }));
                            }
                          }}
                          disabled={!!selectedAnswers[msg.id]}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.quizOptionText,
                            showCorrect && { color: '#065F46' },
                            showWrong && { color: '#991B1B' },
                          ]}>
                            {option.key}. {option.text}
                          </Text>
                          {showCorrect && <Text style={{ fontSize: 14, color: '#065F46' }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                    {selectedAnswers[msg.id] && (
                      <View style={styles.quizNote}>
                        <Text style={styles.quizNoteText}>
                          <Text style={{ fontWeight: '800', color: '#6366f1', fontFamily: fontFamily.bodyBold }}>Note:</Text> Sir C.P. Ramaswami Iyer declared this historic change, ending structural discrimination across Travancore temples!
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {!msg.isUser && (
                  <TouchableOpacity
                    style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
                    onPress={() => handleSaveAsNote(msg)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, marginRight: 4 }}>{isSaved ? '✓' : '+'}</Text>
                    <Text style={[styles.saveBtnText, isSaved && { color: '#065F46' }]}>
                      {isSaved ? 'Saved as Note' : 'Save as Note'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}>
              <Text style={{ fontSize: 14 }}>🤖</Text>
            </View>
            <View style={[styles.msgContentBot, styles.typingBubble]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick action chips */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {getSuggestions(t).map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Ask about ${examContext}...`}
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText)} activeOpacity={0.8}>
          <Text style={{ fontSize: 16, color: '#fff', transform: [{ rotate: '45deg' }], marginLeft: 2 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F4F0EF' },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    left: 32,
    right: 32,
    backgroundColor: '#0f172a',
    borderRadius: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399' },
  toastText: { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: fontFamily.bodyBold },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.huge + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', fontFamily: fontFamily.bodyBold },
  headerStatus: { fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 1, fontFamily: fontFamily.bodyBold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerAction: {
    padding: spacing.xs,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  examStack: { flexDirection: 'row', gap: 2, marginLeft: 2 },

  // Chat
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  msgRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  msgContent: { maxWidth: '85%', borderRadius: 20 },
  msgContentBot: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
    padding: spacing.md,
  },
  msgContentUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
    padding: spacing.md,
  },
  msgText: { fontSize: 13, fontWeight: '600', color: '#1e293b', lineHeight: 20, fontFamily: fontFamily.bodyMedium },
  msgTextUser: { color: '#fff' },

  // Lesson header
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ff',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  lessonIcon: { fontSize: 14 },
  lessonTitle: { fontSize: 14, fontWeight: '800', color: '#4338ca', flex: 1, fontFamily: fontFamily.bodyBold },

  // Quiz
  quizSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: spacing.md },
  quizQuestion: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: fontFamily.bodyBold,
    backgroundColor: '#f8fafc',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eef2ff',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  quizOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: spacing.xs,
  },
  quizOptionCorrect: { backgroundColor: '#ecfdf5', borderColor: '#34d399' },
  quizOptionWrong: { backgroundColor: '#fef2f2', borderColor: '#f87171' },
  quizOptionSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  quizOptionText: { fontSize: 12, fontWeight: '700', color: '#475569', flex: 1, fontFamily: fontFamily.bodyBold },
  quizNote: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quizNoteText: { fontSize: 11, fontWeight: '600', color: '#64748b', lineHeight: 16, fontFamily: fontFamily.bodyMedium },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveBtnSaved: { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  saveBtnText: { fontSize: 10, fontWeight: '700', color: '#64748b', fontFamily: fontFamily.bodyBold },

  // Typing
  typingRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  typingBubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minWidth: 60 },

  // Chips
  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#f1f5f9',
  },
  chipsContent: { gap: spacing.sm },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 100,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: '#475569', fontFamily: fontFamily.bodyBold },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: fontFamily.bodyBold,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
