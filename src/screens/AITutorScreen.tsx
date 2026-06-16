import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useKnowledgeStore } from '../store';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
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

const SUGGESTIONS = [
  'Explain Temple Entry Proclamation',
  'Difference between Revenue District and Taluk?',
  'Create 10 LDC questions on Kerala Geography',
  '\u0D1A\u0D1F\u0D4D\u0D1F\u0D2E\u0D4D\u0D2A\u0D3F \u0D38\u0D4D\u0D35\u0D3E\u0D2E\u0D3F\u0D15\u0D33\u0D41\u0D1F\u0D46 \u0D38\u0D02\u0D2D\u0D3E\u0D35\u0D28 \u0D0E\u0D28\u0D4D\u0D24\u0D3E\u0D23\u0D4D?',
  'Explain Directive Principles like I\'m 15',
  'Summarize Sree Narayana Guru teachings',
];

export function AITutorScreen() {
  const { targetExams, primaryExam } = useUserStore();
  const addNote = useKnowledgeStore((s) => s.addNote);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [savedNoteIds, setSavedNoteIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  const depth = getDepthPrefix(targetExams);
  const examContext = getExamContext(targetExams);

  const getWelcomeMessage = (): Message => {
    const contextStr = targetExams.length > 0
      ? `I see you're preparing for **${examContext}**. I'll calibrate explanations to that level.`
      : '';
    return {
      id: 'welcome',
      text: `\u0D28\u0D2E\u0D38\u0D4D\u0D15\u0D3E\u0D30\u0D02! 👋 I'm your Lakshyam AI Tutor.\n\n${contextStr}\n\nI can help you with:\n• Explaining Kerala PSC topics at the right depth (${depth} level)\n• Generating practice MCQs for your target exams\n• Answering doubts\n• Simplifying difficult concepts\n• \u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D24\u0D4D\u0D24\u0D3F\u0D32\u0D41\u0D02 \u0D1A\u0D4B\u0D26\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D02\n\nWhat would you like to learn today?`,
      isUser: false,
      timestamp: new Date(),
    };
  };

  React.useEffect(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [targetExams, primaryExam]);

  const getAIResponse = (query: string): string => {
    const lower = query.toLowerCase().trim();
    const isDeep = depth === 'deep';
    const isModerate = depth === 'moderate';

    if (lower.includes('20') && (lower.includes('ldc') || lower.includes('question') || lower.includes('kerala geography'))) {
      return 'Here are 5 LDC-level questions on Kerala Geography:\n\n' +
        '1\uFE0F\u20E3 Which is the longest river in Kerala?\n   a) Periyar  b) Bharathapuzha  c) Pamba  d) Chaliyar\n' +
        '   **Answer: a) Periyar (244 km)**\n\n' +
        '2\uFE0F\u20E3 Which district has the longest coastline?\n   a) Kozhikode  b) Kannur  c) Kasaragod  d) Alappuzha\n' +
        '   **Answer: d) Alappuzha**\n\n' +
        '3\uFE0F\u20E3 The backwaters of Kerala are known as?\n   a) Kuttanad  b) Vembanad  c) Ashtamudi  d) Kayals\n' +
        '   **Answer: d) Kayals**\n\n' +
        '4\uFE0F\u20E3 Highest peak in Kerala?\n   a) Anamudi  b) Agastya Mala  c) Chembra  d) Meesapulimala\n' +
        '   **Answer: a) Anamudi (2,695m)**\n\n' +
        '5\uFE0F\u20E3 Which pass connects Kerala to Tamil Nadu?\n   a) Palakkad Gap  b) Thalassery  c) Kambam  d) Shencottah\n' +
        '   **Answer: a) Palakkad Gap**\n\nWant more questions or an explanation on any of these?';
    }

    if (lower.includes('degree') || (lower.includes('deep') && (lower.includes('question') || lower.includes('mcq')))) {
      return 'Here are 3 Degree-Level conceptual questions on Kerala Renaissance:\n\n' +
        '1\uFE0F\u20E3 Critically analyse the socio-economic impact of SNDP Yogam on Kerala society.\n' +
        '   **Hint:** Focus on caste reform, education access, and economic empowerment.\n\n' +
        '2\uFE0F\u20E3 Evaluate the role of Sree Narayana Guru\'s "One Caste, One God, One Religion" philosophy in shaping Kerala\'s secular identity.\n' +
        '   **Hint:** Compare with contemporary reform movements across India.\n\n' +
        '3\uFE0F\u20E3 Discuss how the Temple Entry Proclamation of 1936 influenced similar movements in other princely states.\n' +
        '   **Hint:** Consider Travancore\'s unique position and the role of Maharaja Sree Chithira Thirunal.\n\nWant me to provide detailed model answers for any of these?';
    }

    if (lower.includes('\u0D1A\u0D1F\u0D4D\u0D1F\u0D2E\u0D4D\u0D2A\u0D3F')) {
      return '**\u0D1A\u0D1F\u0D4D\u0D1F\u0D2E\u0D4D\u0D2A\u0D3F \u0D38\u0D4D\u0D35\u0D3E\u0D2E\u0D3F\u0D15\u0D33\u0D4D\u200D (1853-1924)**\n\n' +
        '\u2022 \u0D2F\u0D25\u0D3E\u0D30\u0D4D\u200D\u0D25 \u0D2A\u0D47\u0D30\u0D4D\u200D: \u0D05\u0D2F\u0D4D\u0D2F\u0D2A\u0D4D\u0D2A\u0D7B\n' +
        '\u2022 \u0D1C\u0D28\u0D28\u0D02: \u0D15\u0D4A\u0D32\u0D4D\u0D32\u0D02 \u0D1C\u0D3F\u0D32\u0D4D\u0D32\u0D2F\u0D3F\u0D32\u0D46 \u0D15\u0D41\u0D28\u0D4D\u0D28\u0D24\u0D4D\u0D24\u0D42\u0D7C\n' +
        '\u2022 \u2018\u0D1A\u0D1F\u0D4D\u0D1F\u0D2E\u0D4D\u0D2A\u0D3F\u2019 \u0D0E\u0D28\u0D4D\u0D28 \u0D35\u0D3F\u0D36\u0D47\u0D37\u0D23\u0D02 \u0D32\u0D2D\u0D3F\u0D1A\u0D4D\u0D1B\u0D24\u0D4D \u0D36\u0D3E\u0D30\u0D40\u0D30\u0D3F\u0D15 \u0D36\u0D47\u0D37\u0D3F\u0D2F\u0D41\u0D02 \u0D2A\u0D23\u0D4D\u0D21\u0D3F\u0D24\u0D24\u0D4D\u0D35\u0D35\u0D41\u0D02 \u0D15\u0D4A\u0D23\u0D4D\u0D1F\n\n' +
        '**\u0D2A\u0D4D\u0D30\u0D27\u0D3E\u0D28 \u0D38\u0D02\u0D2D\u0D3E\u0D35\u0D28\u0D15\u0D33\u0D4D\u200D:**\n' +
        '\u2022 \u0D38\u0D4D\u0D24\u0D4D\u0D30\u0D40\u0D15\u0D33\u0D4D\u200D\u0D15\u0D4D\u0D15\u0D4D \u0D2E\u0D47\u0D7D\u0D2E\u0D41\u0D23\u0D4D\u0D1F\u0D4D \u0D27\u0D30\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D28\u0D41\u0D33\u0D4D\u0D33 \u0D05\u0D35\u0D15\u0D3E\u0D36\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D3E\u0D2F\u0D3F \u0D2A\u0D4B\u0D30\u0D3E\u0D1F\u0D3F\n' +
        '\u2022 \u0D1C\u0D3E\u0D24\u0D3F \u0D35\u0D3F\u0D35\u0D47\u0D1A\u0D28\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D46\u0D24\u0D3F\u0D30\u0D46 \u0D36\u0D15\u0D4D\u0D24\u0D2E\u0D3E\u0D2F \u0D28\u0D3F\u0D32\u0D2A\u0D3E\u0D1F\u0D4D\u0D1F\u0D4D\n' +
        '\u2022 \u2018\u0D06\u0D26\u0D3F\u0D2D\u0D3E\u0D37\u2019 \u0D0E\u0D28\u0D4D\u0D28 \u0D17\u0D4D\u0D30\u0D28\u0D4D\u0D25\u0D02 \u0D30\u0D1A\u0D3F\u0D1A\u0D4D\u0D1A\u0D41\n' +
        '\u2022 \u0D2A\u0D4D\u0D30\u0D3E\u0D1A\u0D40\u0D28 \u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D4D\u0D31\u0D46 \u0D09\u0D24\u0D4D\u0D2A\u0D24\u0D4D\u0D24\u0D3F\u0D2F\u0D46 \u0D15\u0D41\u0D31\u0D3F\u0D1A\u0D4D\u0D1B\u0D4D \u0D2A\u0D23\u0D3F\u0D1A\u0D4D\u0D1A\u0D41\n' +
        '\u2022 \u0D36\u0D4D\u0D30\u0D40 \u0D28\u0D3E\u0D30\u0D3E\u0D2F\u0D23 \u0D17\u0D41\u0D30\u0D41\u0D35\u0D3F\u0D28\u0D4D\u0D31\u0D46 \u0D38\u0D2E\u0D15\u0D3E\u0D32\u0D3F\u0D15\u0D28\u0D41\u0D02 \u0D38\u0D39\u0D2F\u0D4B\u0D17\u0D3F\u0D2F\u0D41\u0D02\n\n' +
        '**\u0D13\u0D7C\u0D2E\u0D4D\u0D2E\u0D3F\u0D15\u0D4D\u0D15\u0D41\u0D15:** \u0D1A\u0D1F\u0D4D\u0D1F\u0D2E\u0D4D\u0D2A\u0D3F \u0D38\u0D4D\u0D35\u0D3E\u0D2E\u0D3F\u0D15\u0D33\u0D4D\u200D, \u0D36\u0D4D\u0D30\u0D40 \u0D28\u0D3E\u0D30\u0D3E\u0D2F\u0D23 \u0D17\u0D41\u0D30\u0D41, \u0D38\u0D39\u0D4B\u0D26\u0D30\u0D7B \u0D05\u0D2F\u0D4D\u0D2F\u0D2A\u0D4D\u0D2A\u0D7B \u0D0E\u0D28\u0D4D\u0D28\u0D3F\u0D35\u0D7C \u0D15\u0D47\u0D30\u0D33\u0D40\u0D2F \u0D28\u0D35\u0D4B\u0D24\u0D4D\u0D25\u0D3E\u0D28\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D4D\u0D31\u0D46 \u0D2E\u0D42\u0D28\u0D4D\u0D28\u0D4D \u0D38\u0D4D\u0D24\u0D02\u0D2D\u0D19\u0D4D\u0D19\u0D33\u0D3E\u0D23\u0D4D!';
    }

    if (lower.includes('explain temple entry proclamation')) {
      const base = "The Temple Entry Proclamation was issued on November 12, 1936 by Maharaja Sree Chithira Thirunal of Travancore.\n\n**Key Points:**\n• Lifted the ban on lower caste Hindus entering temples\n• A landmark step for social equality in Kerala\n• Followed the Vaikom Satyagraha (1924-25)\n• Influenced by Sree Narayana Guru's teachings\n\n**Impact:** It was the first such proclamation in India.";
      if (isDeep) {
        return base + "\n\n**Degree-Level Depth:**\n• Compare with the Temple Entry Authorization Act of 1947 (Madras)\n• Analyse the role of the Travancore Legislative Council\n• Discuss how it intersected with the larger Devdasi abolition movement\n• Evaluate its economic impact on temple treasury systems\n• Connect to Article 25 of the Constitution (freedom of religion)";
      }
      if (isModerate) {
        return base + "\n\n**Additional Context (SA Level):**\n• The proclamation was influenced by the 1931 Census which revealed caste demographics\n• It covered not just temples but also roads, wells, and public spaces\n• Key figures: Maharaja Sree Chithira Thirunal, Sir C.P. Ramaswami Iyer (Dewan)";
      }
      return base;
    }

    if (lower.includes('directive principles')) {
      const base = "Think of Directive Principles as the **instruction manual** for the government.\n\n📖 **Simple Version:**\nThe Constitution says 'Government, here's what you SHOULD do for the people.'\n\n🎯 **Key Ideas:**\n• Every village should have schools and hospitals (Article 41)\n• Fair wages for workers (Article 43)\n• Free legal aid for the poor (Article 39A)\n• Protect the environment (Article 48A)";
      if (isDeep) {
        return base + "\n\n**Degree-Level Depth:**\n• Distinguish between Socialistic, Gandhian, and Liberal-Intellectual principles\n• Analyse the relationship between Part III (Fundamental Rights) and Part IV (DPSP)\n• Key cases: Minerva Mills (1980), Kesavananda Bharati (1973)\n• Compare with the concept of 'Directive Principles' in the Irish Constitution\n• Critically evaluate: Are they really 'non-justiciable' in practice? (Consider Article 21 linkage)";
      }
      if (isModerate) {
        return base + "\n\n**SA-Level Detail:**\n• DPSPs are borrowed from the Irish Constitution\n• Key amendments: 42nd Amendment (1976) added new principles\n• Important articles: 39 (equal pay), 44 (uniform civil code), 48 (cow protection)\n• Difference between 'legal rights' and 'directive principles' - the 'Harijan' vs state case";
      }
      return base;
    }

    if (lower.includes('sree narayana guru') || lower.includes('sndp')) {
      const base = "**Sree Narayana Guru (1855-1928)** was a visionary social reformer from Kerala.\n\n**Core Teachings:**\n• 'One Caste, One God, One Religion for Mankind'\n• 'Knowledge is the greatest wealth'\n• Questioned caste hierarchy and superstitions\n\n**Key Contributions:**\n• Consecrated Siva idol at Aruvippuram (1888)\n• Founded SNDP Yogam with Dr. Palpu (1903)\n• Built temples open to all castes\n• Advocated for education and social equality";
      if (isDeep) {
        return base + "\n\n**Degree-Level Depth:**\n• Analyse his philosophical influences: Advaita Vedanta, Buddhist thought\n• Compare his 'mirror' analogy at Aruvippuram with contemporary caste discourse\n• Evaluate the economic dimensions of SNDP's cooperative banking initiatives\n• Discuss his relationship with Gandhi, Tagore, and the national movement\n• Critically assess: Did his movement inadvertently create a new Ezhava identity politics?";
      }
      return base;
    }

    const defaultResponse = `Great question! Let me help you with that for **${examContext}** (${depth} level).\n\n📚 **Key Points:**\n• This is an important topic for Kerala PSC ${examContext} exams\n• It appears in both prelims and mains\n\n💡 **Study Tip:** Make sure to link this topic with related concepts in your Knowledge Vault for better retention.\n\nWant me to:\n1. Generate MCQ questions for ${examContext}?\n2. Create flashcards?\n3. Explain in Malayalam?\n4. Provide more detailed notes?\n\nJust let me know! 😊`;

    return defaultResponse;
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
    const title = msg.text.split('\n')[0].replace(/[*#]/g, '').trim().slice(0, 60);
    addNote({
      id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || 'AI Tutor Response',
      content: stripMarkdown(msg.text),
      type: 'text',
      subject: targetExams[0] || 'General',
      topicIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['ai-tutor'],
    });
    setSavedNoteIds((prev) => new Set(prev).add(msg.id));
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u${Date.now()}`, text: text.trim(), isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const aiMsg: Message = { id: `a${Date.now()}`, text: getAIResponse(text), isUser: false, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>AI Tutor</Text>
            <Text style={[typography.small, { color: colors.accentGreen }]}>
              Online • Calibrated for {depth} level
            </Text>
          </View>
        </View>
        <View style={styles.headerContext}>
          {targetExams.slice(0, 3).map((exam) => (
            <Text key={exam} style={{ fontSize: 14 }}>{EXAM_ICONS[exam] || '📌'}</Text>
          ))}
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.chatArea} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => {
          const isSaved = !msg.isUser && savedNoteIds.has(msg.id);
          return (
            <View key={msg.id} style={[styles.messageRow, msg.isUser ? styles.userRow : styles.aiRow]}>
              {!msg.isUser && (
                <View style={styles.aiAvatarSmall}>
                  <Text style={{ fontSize: 16 }}>🤖</Text>
                </View>
              )}
              <View style={{ maxWidth: '100%' }}>
                <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[typography.body, { color: msg.isUser ? colors.white : colors.text }]}>{msg.text}</Text>
                </View>
                {!msg.isUser && msg.id !== 'welcome' && (
                  <TouchableOpacity
                    style={[styles.saveNoteBtn, isSaved && styles.saveNoteBtnSaved]}
                    onPress={() => handleSaveAsNote(msg)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, marginRight: 4 }}>{isSaved ? '✓' : '+'}</Text>
                    <Text style={[typography.tiny, { color: isSaved ? colors.accentGreen : colors.textSecondary }]}>
                      {isSaved ? 'Saved as Note' : 'Save as Note'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.suggestionsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => sendMessage(s)}>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Ask about ${examContext}...`}
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText)}>
          <Text style={{ fontSize: 20 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.huge, paddingBottom: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerContext: { flexDirection: 'row', gap: spacing.xs },
  aiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  aiAvatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  chatArea: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  messageRow: { flexDirection: 'row', marginBottom: spacing.md, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end' },
  aiRow: { alignSelf: 'flex-start', alignItems: 'flex-end' },
  bubble: { padding: spacing.md, borderRadius: borderRadius.md },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  suggestionsRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgInput,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    maxHeight: 100,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveNoteBtnSaved: {
    borderColor: colors.accentGreen + '40',
    backgroundColor: colors.accentGreen + '10',
  },
});
