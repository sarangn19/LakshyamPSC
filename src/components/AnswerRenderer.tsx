import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface Section {
  heading: string;
  icon: string;
  content: string;
}

const HEADING_MAP: Record<string, { icon: string; label: string }> = {
  'concept': { icon: '📘', label: 'Concept' },
  'psc exam focus': { icon: '🎯', label: 'PSC Exam Focus' },
  'memory trick': { icon: '🧠', label: 'Memory Trick' },
  'key facts': { icon: '📌', label: 'Key Facts' },
  'common confusions': { icon: '⚠️', label: 'Common Confusions' },
  'practice mcq': { icon: '❓', label: 'Practice MCQ' },
  'related topics': { icon: '🔗', label: 'Related Topics' },
  'summary': { icon: '📋', label: 'Summary' },
};

export function extractSections(text: string): Section[] {
  const sections: Section[] = [];
  const headingRe = /^##\s+(.+)$/gm;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const heads: { heading: string; index: number }[] = [];
  while ((match = headingRe.exec(text)) !== null) {
    heads.push({ heading: match[1].trim(), index: match.index });
  }

  if (heads.length === 0) {
    const lower = text.toLowerCase();
    return [{ heading: 'summary', icon: '📋', content: text }];
  }

  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index;
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    const heading = heads[i].heading;
    const content = text.slice(text.indexOf('\n', start) + 1, end).trim();
    const key = heading.toLowerCase().replace(/[^a-z ]/g, '').trim();
    const mapped = HEADING_MAP[key];
    if (mapped) {
      sections.push({ heading: mapped.label, icon: mapped.icon, content });
    } else {
      sections.push({ heading, icon: '📌', content });
    }
  }

  return sections;
}

function isLikelyMCQ(text: string): boolean {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hasQuestion = lines.some(l => /[?？]/.test(l));
  const hasOptions = lines.filter(l => /^[A-Da-d][.．\)]\s/.test(l)).length >= 2;
  const hasAnswer = lines.some(l => /^answer/i.test(l));
  return (hasQuestion && hasOptions) || hasAnswer;
}

function extractMCQ(text: string): { question: string; options: string[]; answer: string; explanation: string } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questionLines: string[] = [];
  const options: string[] = [];
  let answer = '';
  let explanation = '';
  let mode: 'question' | 'options' | 'answer' | 'explanation' = 'question';

  for (const line of lines) {
    if (/^answer/i.test(line)) { mode = 'answer'; continue; }
    if (/^explanation/i.test(line)) { mode = 'explanation'; continue; }
    if (/^[A-Da-d][.．\)]\s/.test(line)) {
      if (mode === 'question') mode = 'options';
      options.push(line.replace(/^[A-Da-d][.．\)]\s*/, ''));
      continue;
    }
    if (mode === 'question') questionLines.push(line);
    else if (mode === 'answer') answer += line + ' ';
    else if (mode === 'explanation') explanation += line + ' ';
  }

  if (options.length === 0 && questionLines.length > 0) return null;
  return {
    question: questionLines.join(' ').replace(/^.*?[?？]?\s*/, '').trim() || text,
    options,
    answer: answer.trim(),
    explanation: explanation.trim(),
  };
}

function SectionCard({ icon, heading, children }: { icon: string; heading: string; children: React.ReactNode }) {
  const accentColors: Record<string, string> = {
    'Concept': '#3B82F6',
    'PSC Exam Focus': '#EF4444',
    'Memory Trick': '#8B5CF6',
    'Key Facts': '#F59E0B',
    'Common Confusions': '#F97316',
    'Practice MCQ': '#10B981',
    'Related Topics': '#06B6D4',
    'Summary': '#6B7280',
  };
  const color = accentColors[heading] || '#3B82F6';
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

function MCQCard({ section }: { section: Section }) {
  const mcq = extractMCQ(section.content);
  if (!mcq) return <MarkdownRenderer text={section.content} />;
  return (
    <View>
      <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#1F2937', marginBottom: 8 }}>{mcq.question}</Text>
      {mcq.options.map((opt, i) => (
        <View key={i} style={{ flexDirection: 'row', paddingVertical: 4, paddingLeft: 4 }}>
          <Text style={{ width: 20, fontSize: 14, color: '#4B5563' }}>{String.fromCharCode(65 + i)}.</Text>
          <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>{opt}</Text>
        </View>
      ))}
      {mcq.answer ? (
        <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#059669' }}>Answer: {mcq.answer}</Text>
        </View>
      ) : null}
      {mcq.explanation ? (
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 18 }}>{mcq.explanation}</Text>
      ) : null}
    </View>
  );
}

function KeyFactsCard({ content }: { content: string }) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <View style={{ backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ color: '#F59E0B', marginRight: 6, fontSize: 14 }}>✦</Text>
          <Text style={{ flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 }}>{line.replace(/^[-\*✦]\s*/, '')}</Text>
        </View>
      ))}
    </View>
  );
}

export function AnswerRenderer({ text }: { text: string }) {
  const sections = extractSections(text);

  return (
    <View style={{ gap: 0 }}>
      {sections.map((section, i) => {
        switch (section.heading) {
          case 'Key Facts':
            return (
              <SectionCard key={i} icon={section.icon} heading={section.heading}>
                <KeyFactsCard content={section.content} />
              </SectionCard>
            );
          case 'Practice MCQ':
            return (
              <SectionCard key={i} icon={section.icon} heading={section.heading}>
                {isLikelyMCQ(section.content) ? (
                  <MCQCard section={section} />
                ) : (
                  <MarkdownRenderer text={section.content} />
                )}
              </SectionCard>
            );
          case 'Memory Trick':
            return (
              <SectionCard key={i} icon={section.icon} heading={section.heading}>
                <View style={{ backgroundColor: '#F5F3FF', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: '#5B21B6', fontStyle: 'italic' }}>
                    💡 {section.content.replace(/^💡\s*/, '')}
                  </Text>
                </View>
              </SectionCard>
            );
          case 'Summary':
            return (
              <SectionCard key={i} icon={section.icon} heading={section.heading}>
                <MarkdownRenderer text={section.content} />
              </SectionCard>
            );
          default:
            return (
              <SectionCard key={i} icon={section.icon} heading={section.heading}>
                <MarkdownRenderer text={section.content} />
              </SectionCard>
            );
        }
      })}
    </View>
  );
}

export function plainTextToSections(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('## concept') || lower.includes('## key facts') || lower.includes('## practice mcq')) {
    return text;
  }
  const trimmed = text.trim();
  if (!trimmed) return '## Summary\n\nNo content available.';
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length <= 3) return `## Concept\n\n${trimmed}\n\n## Summary\n\n${trimmed}`;
  const half = Math.ceil(lines.length / 2);
  const concept = lines.slice(0, half).join('\n');
  const facts = lines.slice(half).join('\n');
  return `## Concept\n\n${concept}\n\n## Key Facts\n\n${facts}\n\n## Summary\n\n${trimmed}`;
}
