import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontFamily } from '../theme';
import { useUserStore, useKnowledgeStore } from '../store';
import { useTranslation } from '../i18n/useTranslation';
import { BottomNav, TAB_BAR_TOTAL_HEIGHT } from '../components/BottomNav';
import { getAIResponse, buildHistory, ChatMessage, ResponseMode, logRenderer } from '../services/chatService';
import { ActionChips } from '../components/ActionChips';
import { ResponseModeRenderer } from '../components/renderers/ResponseModeRenderer';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

function TypingDots() {
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: false }),
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
        <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: op }} />
      ))}
    </View>
  );
}

export function AITutorScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { targetExams } = useUserStore();
  const addNote = useKnowledgeStore((s) => s.addNote);
  const bottomClearance = useMemo(
    () => TAB_BAR_TOTAL_HEIGHT + insets.bottom + 4,
    [insets.bottom],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();

  const examContext = targetExams.length > 0 ? targetExams[0] : 'Kerala PSC';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

  const handleSaveAsNote = (msg: ChatMessage) => {
    const text = msg.text;
    const title = text.split('\n')[0].replace(/[*#]/g, '').trim().slice(0, 60);
    addNote({
      id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || t('aiTutor.noteTitleFallback'),
      content: stripMarkdown(text),
      type: 'text',
      subject: targetExams[0] || 'General',
      topicIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['ai-tutor'],
    });
    showToast('Saved securely to your notes!');
  };

  const MODE_MAP: Record<string, ResponseMode> = {
    generate_mcq: 'mcq',
    explain_simpler: 'simple_explanation',
    give_pyqs: 'pyq',
    related_topic: 'related_topic',
    create_flashcard: 'flashcard',
  };

  const sendMessage = async (text: string, mode?: ResponseMode, displayText?: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: displayText || text.trim(), responseMode: mode };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const history = messages.length > 0 ? buildHistory(messages) : [];
    const result = await getAIResponse(text, history, mode);
    const aiMode = result.responseMode || mode || 'tutor';
    logRenderer(`AITutor sendMessage mode=${aiMode}`);
    setMessages((prev) => [...prev, { role: 'ai', text: result.reply, responseMode: aiMode }]);
    setIsLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const ACTION_LABELS: Record<string, string> = {
    generate_mcq: 'Generate MCQ',
    explain_simpler: 'Explain Simply',
    give_pyqs: 'Previous Year Questions',
    related_topic: 'Related Topic',
    create_flashcard: 'Create Flashcard',
  };

  const ACTION_PROMPTS: Record<string, string> = {
    generate_mcq: `You are a Kerala PSC exam tutor. Generate a multiple choice question about the previous topic for ${examContext} exam. Return the response in this exact structure:

Question
[the question text]

A. [option A]
B. [option B]
C. [option C]
D. [option D]

Answer
[correct option letter and text]

Explanation
[detailed explanation]

Topic
[subject area]

PSC Tip
[exam-specific memory aid or shortcut]

Difficulty: Easy/Medium/Hard
Weightage: High/Medium/Low`,
    explain_simpler: `You are a Kerala PSC exam tutor. Explain the previous response in simpler terms for ${examContext} exam preparation. Return the response in this exact structure:

Simple Explanation
[clear, plain-language explanation]

Key Points
• [point 1]
• [point 2]
• [point 3]

Example
[concrete example if applicable]

PSC Shortcut
[memory aid or mnemonic]

Difficulty: Easy/Medium/Hard`,
    give_pyqs: `You are a Kerala PSC exam tutor. List previous year questions from ${examContext} exams related to the previous topic. Return the response in this exact structure:

Previous Year Questions
[year] • [exam name]: [question]

Answers
[answer explanations]

Trend
[how often this topic appears]

Difficulty: Easy/Medium/Hard`,
    related_topic: `You are a Kerala PSC exam tutor. Suggest a related topic from ${examContext} syllabus that the student should study next, based on the previous topic. Return in this structure:

Related Topic
[topic name]

Why Related
[connection explanation]

Key Facts
• [fact 1]
• [fact 2]

Suggested Follow-up
[what to study next]

Difficulty: Easy/Medium/Hard`,
    create_flashcard: `You are a Kerala PSC exam tutor. Create a flashcard summary of the previous response for quick revision. Return in this structure:

Flashcard

Front:
[key concept or question]

Back:
[answer or explanation]

Subject
[subject name]

Difficulty: Easy/Medium/Hard`,
  };

  return (
    <KeyboardAvoidingView style={[styles.wrapper, { paddingBottom: bottomClearance }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {toast && (
        <View style={styles.toast}>
          <View style={styles.toastDot} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xs - 2 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>AI</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('aiTutor.title')}</Text>
            <Text style={styles.headerStatus}>
              Online · Lakshyam PSC
            </Text>
          </View>
        </View>
        <View style={styles.examStack}>
          {targetExams.slice(0, 2).map((exam) => (
            <View key={exam} style={styles.headerAction}>
              <Text style={{ fontSize: 11 }}>{EXAM_ICONS[exam] || '📋'}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Chat */}
      <ScrollView ref={scrollRef} style={styles.chatArea} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.chatContent, { paddingBottom: bottomClearance }]}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'ai' && (
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>AI</Text>
              </View>
            )}
            <View style={[styles.msgContent, msg.role === 'user' ? styles.msgContentUser : styles.msgContentBot]}>
              {msg.role === 'ai' ? (
                <>
                  <View style={styles.botLabel}>
                    <Text style={styles.botLabelText}>Lakshyam AI</Text>
                    <Text style={styles.botLabelDot}>·</Text>
                    <Text style={styles.botLabelTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <ResponseModeRenderer mode={msg.responseMode || 'tutor'} text={msg.text} />
                  <ActionChips onAction={(action) => {
                    const mode = MODE_MAP[action] || 'tutor';
                    sendMessage(ACTION_PROMPTS[action] || action, mode, ACTION_LABELS[action]);
                  }} />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSaveAsNote(msg)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 11, marginRight: 3, opacity: 0.6 }}>+</Text>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>{msg.text}</Text>
              )}
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>AI</Text>
            </View>
            <View style={[styles.msgContentBot, styles.typingBubble]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="AITutor" />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Ask about ${examContext}...`}
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText, 'tutor')} activeOpacity={0.8}>
          <Text style={{ fontSize: 16, color: colors.white, transform: [{ rotate: '45deg' }], marginLeft: 2 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    left: 32,
    right: 32,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  toastText: { fontSize: 12, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: fontFamily.bodyBold },
  headerStatus: { fontSize: 11, fontWeight: '700', color: colors.success, marginTop: 1, fontFamily: fontFamily.bodyBold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerAction: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.bgInput,
  },
  examStack: { flexDirection: 'row', gap: 2, marginLeft: 2 },

  // Chat
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  msgRow: { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatarCircle: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14, fontWeight: '700', color: '#FFFFFF',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  botAvatarText: {
    fontSize: 10, fontWeight: '700', color: colors.textSecondary,
  },
  msgContent: { maxWidth: '85%', borderRadius: radius.xl },
  msgContentBot: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
    padding: spacing.sm + 2,
    paddingBottom: spacing.xs,
  },
  msgContentUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    padding: spacing.md,
  },
  msgText: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 20, fontFamily: fontFamily.bodyMedium },
  msgTextUser: { color: colors.white },
  botLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs + 2 },
  botLabelText: { fontSize: 10, fontWeight: '700', color: colors.primary, fontFamily: fontFamily.bodyBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  botLabelDot: { fontSize: 10, color: colors.border },
  botLabelTime: { fontSize: 9, color: colors.textTertiary, fontFamily: fontFamily.body },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnSaved: { borderColor: `${colors.success}30`, backgroundColor: `${colors.success}15` },
  saveBtnText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, fontFamily: fontFamily.bodyBold },

  // Typing
  typingRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  typingBubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minWidth: 60 },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs + 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamily.bodyBold,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.xxl - 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
