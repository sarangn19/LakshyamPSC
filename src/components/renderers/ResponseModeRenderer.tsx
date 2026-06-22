import React from 'react';
import { View, Text } from 'react-native';
import { ResponseMode } from '../../services/chatService';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { AnswerRenderer, extractSections, Section } from '../AnswerRenderer';
import { logRenderer } from '../../services/chatService';

interface RendererProps {
  text: string;
}

function SectionCard({ icon, heading, color, children }: { icon: string; heading: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: color,
      padding: 14,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{heading}</Text>
      </View>
      {children}
    </View>
  );
}

function MCQSection({ text }: { text: string }) {
  const sections = extractSections(text);
  const question = sections.find(s => s.heading.toLowerCase() === 'question');
  const options = sections.find(s => s.heading.toLowerCase() === 'options');
  const answer = sections.find(s => s.heading.toLowerCase() === 'answer');
  const explanation = sections.find(s => s.heading.toLowerCase() === 'explanation');

  return (
    <SectionCard icon="❓" heading="Practice MCQ" color="#10B981">
      {question && <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#1F2937', marginBottom: 8 }}>{question.content}</Text>}
      {options && options.content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const match = trimmed.match(/^([A-Da-d])[.．\)]\s*(.+)/);
        if (match) {
          return (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 3, paddingLeft: 4 }}>
              <Text style={{ width: 20, fontSize: 14, color: '#4B5563' }}>{match[1].toUpperCase()}.</Text>
              <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>{match[2]}</Text>
            </View>
          );
        }
        return <Text key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>{trimmed}</Text>;
      })}
      {answer && (
        <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#059669' }}>Answer: {answer.content.replace(/^Answer[:\s]*/i, '')}</Text>
        </View>
      )}
      {explanation && (
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 18, fontStyle: 'italic' }}>{explanation.content}</Text>
      )}
    </SectionCard>
  );
}

function MCQRenderer({ text }: RendererProps) {
  logRenderer('MCQRenderer');
  return (
    <View>
      <MCQSection text={text} />
    </View>
  );
}

function SimpleExplanationRenderer({ text }: RendererProps) {
  logRenderer('SimpleExplanationRenderer');
  const sections = extractSections(text);
  const simpleExp = sections.find(s => s.heading.toLowerCase() === 'simple explanation');
  const example = sections.find(s => s.heading.toLowerCase() === 'example');
  const quickSummary = sections.find(s => s.heading.toLowerCase() === 'quick summary');

  return (
    <View>
      {simpleExp && (
        <SectionCard icon="🔍" heading="Simple Explanation" color="#3B82F6">
          <MarkdownRenderer text={simpleExp.content} />
        </SectionCard>
      )}
      {example && (
        <SectionCard icon="💡" heading="Example" color="#8B5CF6">
          <View style={{ backgroundColor: '#F5F3FF', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 14, lineHeight: 20, color: '#5B21B6' }}>{example.content}</Text>
          </View>
        </SectionCard>
      )}
      {quickSummary && (
        <SectionCard icon="📋" heading="Quick Summary" color="#F59E0B">
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 14, lineHeight: 20, color: '#92400E' }}>{quickSummary.content}</Text>
          </View>
        </SectionCard>
      )}
      {!simpleExp && !example && !quickSummary && <MarkdownRenderer text={text} />}
    </View>
  );
}

function PYQRenderer({ text }: RendererProps) {
  logRenderer('PYQRenderer');
  const sections = extractSections(text);
  const pyq = sections.find(s => /previous year/i.test(s.heading));
  const exam = sections.find(s => s.heading.toLowerCase() === 'exam');
  const year = sections.find(s => s.heading.toLowerCase() === 'year');
  const answer = sections.find(s => s.heading.toLowerCase() === 'answer');
  const explanation = sections.find(s => s.heading.toLowerCase() === 'explanation');

  return (
    <View>
      {pyq && (
        <SectionCard icon="📜" heading="Previous Year Questions" color="#EF4444">
          <MarkdownRenderer text={pyq.content} />
        </SectionCard>
      )}
      {exam && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {exam && (
            <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B', marginBottom: 2 }}>Exam</Text>
              <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{exam.content}</Text>
            </View>
          )}
          {year && (
            <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B', marginBottom: 2 }}>Year</Text>
              <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{year.content}</Text>
            </View>
          )}
        </View>
      )}
      {answer && (
        <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#059669', marginBottom: 2 }}>Answer</Text>
          <Text style={{ fontSize: 14, color: '#065F46', lineHeight: 20 }}>{answer.content}</Text>
        </View>
      )}
      {explanation && (
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', fontSize: 13, color: '#475569', marginBottom: 2 }}>Explanation</Text>
          <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18, fontStyle: 'italic' }}>{explanation.content}</Text>
        </View>
      )}
      {!pyq && !exam && !answer && <MarkdownRenderer text={text} />}
    </View>
  );
}

function FlashcardRenderer({ text }: RendererProps) {
  logRenderer('FlashcardRenderer');
  const sections = extractSections(text);
  const front = sections.find(s => s.heading.toLowerCase() === 'front');
  const back = sections.find(s => s.heading.toLowerCase() === 'back');

  return (
    <View style={{ gap: 12 }}>
      {front && (
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#6366f1',
          padding: 20,
          shadowColor: '#6366f1',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 4,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Front</Text>
          <MarkdownRenderer text={front.content} />
        </View>
      )}
      {back && (
        <View style={{
          backgroundColor: '#F5F3FF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#C7D2FE',
          padding: 20,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#4338CA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Back</Text>
          <MarkdownRenderer text={back.content} />
        </View>
      )}
      {!front && !back && <MarkdownRenderer text={text} />}
    </View>
  );
}

function RelatedTopicRenderer({ text }: RendererProps) {
  logRenderer('RelatedTopicRenderer');
  const sections = extractSections(text);
  const topicCard = sections.find(s => s.heading.toLowerCase() === 'topic card');
  const whyRelated = sections.find(s => s.heading.toLowerCase() === 'why related');
  const keyFacts = sections.find(s => s.heading.toLowerCase() === 'key facts');
  const followup = sections.find(s => /suggested follow/i.test(s.heading));

  return (
    <View>
      {topicCard && (
        <SectionCard icon="🔗" heading="Related Topic" color="#06B6D4">
          <MarkdownRenderer text={topicCard.content} />
        </SectionCard>
      )}
      {whyRelated && (
        <SectionCard icon="🔗" heading="Why Related" color="#8B5CF6">
          <Text style={{ fontSize: 14, lineHeight: 20, color: '#374151' }}>{whyRelated.content}</Text>
        </SectionCard>
      )}
      {keyFacts && (
        <SectionCard icon="📌" heading="Key Facts" color="#F59E0B">
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10 }}>
            {keyFacts.content.split('\n').filter(l => l.trim()).map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ color: '#F59E0B', marginRight: 6, fontSize: 14 }}>✦</Text>
                <Text style={{ flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 }}>{line.replace(/^[-\*✦\s]*/, '')}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
      {followup && (
        <SectionCard icon="❓" heading="Suggested Follow-up" color="#10B981">
          <MarkdownRenderer text={followup.content} />
        </SectionCard>
      )}
      {!topicCard && !whyRelated && !keyFacts && !followup && <MarkdownRenderer text={text} />}
    </View>
  );
}

export function ResponseModeRenderer({ mode, text }: { mode: ResponseMode; text: string }) {
  switch (mode) {
    case 'mcq':
      return <MCQRenderer text={text} />;
    case 'simple_explanation':
      return <SimpleExplanationRenderer text={text} />;
    case 'pyq':
      return <PYQRenderer text={text} />;
    case 'flashcard':
      return <FlashcardRenderer text={text} />;
    case 'related_topic':
      return <RelatedTopicRenderer text={text} />;
    case 'tutor':
    default:
      logRenderer('TutorRenderer');
      return <AnswerRenderer text={text} />;
  }
}
