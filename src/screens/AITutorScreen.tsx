import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useKnowledgeStore } from '../store';
import { useTranslation } from '../i18n/useTranslation';
import { BottomNav, BOTTOM_NAV_HEIGHT, BOTTOM_NAV_BOTTOM_OFFSET, TAB_BAR_TOTAL_HEIGHT } from '../components/BottomNav';
import { getAIResponse, buildHistory, ChatMessage, ResponseMode, logRenderer } from '../services/chatService';
import { AnswerRenderer, plainTextToSections } from '../components/AnswerRenderer';
import { ActionChips } from '../components/ActionChips';
import { ResponseModeRenderer } from '../components/renderers/ResponseModeRenderer';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

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

  const sendMessage = async (text: string, mode?: ResponseMode) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), responseMode: mode };
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

  return (
    <KeyboardAvoidingView style={[styles.wrapper, { paddingBottom: bottomClearance }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              Online <Text style={{ opacity: 0.4 }}>•</Text> Lakshyam PSC
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
      <ScrollView ref={scrollRef} style={styles.chatArea} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.chatContent, { paddingBottom: bottomClearance }]}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'ai' && (
              <View style={styles.botAvatar}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
            )}
            <View style={[styles.msgContent, msg.role === 'user' ? styles.msgContentUser : styles.msgContentBot]}>
              {msg.role === 'ai' ? (
                <>
                  <ResponseModeRenderer mode={msg.responseMode || 'tutor'} text={msg.text} />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSaveAsNote(msg)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, marginRight: 4 }}>+</Text>
                    <Text style={styles.saveBtnText}>Save as Note</Text>
                  </TouchableOpacity>
                  <ActionChips onAction={(action) => {
                    const mode = MODE_MAP[action] || 'tutor';
                    const prompts: Record<string, string> = {
                      generate_mcq: `Generate a multiple choice question about this topic for ${examContext} exam. Include question, 4 options, answer, and explanation.`,
                      explain_simpler: `Explain the previous response in simpler terms for ${examContext} exam preparation.`,
                      give_pyqs: `List previous year questions from ${examContext} exams related to this topic.`,
                      related_topic: `Suggest a related topic from ${examContext} syllabus that I should study next.`,
                      create_flashcard: `Create a flashcard summary of this response for quick revision. Format as: Front: ... Back: ...`,
                    };
                    sendMessage(prompts[action] || action, mode);
                  }} />
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
            <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s, 'tutor')} activeOpacity={0.7}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <BottomNav activeTab="AITutor" />

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
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText, 'tutor')} activeOpacity={0.8}>
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
  msgRow: { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'flex-end' },
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
    paddingBottom: spacing.sm,
  },
  msgContentUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
    padding: spacing.md,
  },
  msgText: { fontSize: 13, fontWeight: '600', color: '#1e293b', lineHeight: 20, fontFamily: fontFamily.bodyMedium },
  msgTextUser: { color: '#fff' },

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
