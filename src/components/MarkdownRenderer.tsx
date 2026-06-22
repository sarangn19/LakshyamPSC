import React from 'react';
import { View, Text } from 'react-native';

type LineType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'ordered'; number: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'divider' }
  | { type: 'code'; text: string }
  | { type: 'empty' };

function parseInline(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      nodes.push(<Text key={`t${last}`}>{line.slice(last, match.index)}</Text>);
    }
    nodes.push(<Text key={`b${match.index}`} style={{ fontWeight: '700' }}>{match[2]}</Text>);
    last = re.lastIndex;
  }
  if (last < line.length) {
    nodes.push(<Text key={`t${last}`}>{line.slice(last)}</Text>);
  }
  return nodes.length > 0 ? nodes : [<Text key="0">{line}</Text>];
}

function parseLines(text: string): LineType[] {
  const raw = text.split('\n');
  const lines: LineType[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  for (const l of raw) {
    if (l.trim().startsWith('```')) {
      if (inCode) {
        lines.push({ type: 'code', text: codeBuf.join('\n') });
        codeBuf = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuf.push(l); continue; }
    const trimmed = l.trim();
    if (!trimmed) { lines.push({ type: 'empty' }); continue; }
    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^#+/)![0].length;
      lines.push({ type: 'heading', level, text: trimmed.replace(/^#+\s*/, '') });
    } else if (trimmed.startsWith('- ')) {
      lines.push({ type: 'bullet', text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = parseInt(trimmed.match(/^\d+/)![0], 10);
      lines.push({ type: 'ordered', number: num, text: trimmed.replace(/^\d+\.\s*/, '') });
    } else if (trimmed === '---' || trimmed === '___') {
      lines.push({ type: 'divider' });
    } else {
      lines.push({ type: 'paragraph', text: trimmed });
    }
  }
  if (inCode && codeBuf.length > 0) {
    lines.push({ type: 'code', text: codeBuf.join('\n') });
  }
  return lines;
}

export function MarkdownRenderer({ text, style }: { text: string; style?: any }) {
  const lines = parseLines(text);
  return (
    <View style={style}>
      {lines.map((line, i) => {
        switch (line.type) {
          case 'heading': {
            const size = line.level === 1 ? 18 : line.level === 2 ? 16 : 14;
            const weight = '700' as const;
            return (
              <Text key={i} style={{ fontSize: size, fontWeight: weight, marginTop: 12, marginBottom: 4, lineHeight: size + 6 }}>
                {parseInline(line.text)}
              </Text>
            );
          }
          case 'bullet':
            return (
              <View key={i} style={{ flexDirection: 'row', paddingLeft: 8, marginVertical: 2 }}>
                <Text style={{ width: 14, fontSize: 14, lineHeight: 20 }}>•</Text>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{parseInline(line.text)}</Text>
              </View>
            );
          case 'ordered':
            return (
              <View key={i} style={{ flexDirection: 'row', paddingLeft: 8, marginVertical: 2 }}>
                <Text style={{ width: 20, fontSize: 14, lineHeight: 20 }}>{line.number}.</Text>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{parseInline(line.text)}</Text>
              </View>
            );
          case 'divider':
            return <View key={i} style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />;
          case 'code':
            return (
              <View key={i} style={{ backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginVertical: 8 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 18 }}>{line.text}</Text>
              </View>
            );
          case 'empty':
            return <View key={i} style={{ height: 8 }} />;
          default:
            return (
              <Text key={i} style={{ fontSize: 14, lineHeight: 20, marginVertical: 1 }}>
                {parseInline(line.text)}
              </Text>
            );
        }
      })}
    </View>
  );
}
