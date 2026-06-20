import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { storeGeneratedMCQsBatchDirect, StoreMCQRequest } from '../../services/questionBankStorage';
import { useTranslation } from '../../i18n/useTranslation';

type UploadMode = 'json' | 'csv' | 'file';
type RowStatus = 'pending' | 'valid' | 'invalid';

interface ParsedRow {
  index: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
  examType: string;
  language: string;
  tags: string[];
  status: RowStatus;
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]);
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = h.replace(/['"]/g, '').toLowerCase().replace(/[\s_-]+/g, '');
    colMap[key] = i;
  });
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const getCol = (...keys: string[]): string => {
      for (const k of keys) {
        const idx = colMap[k];
        if (idx !== undefined && idx < cols.length) return cols[idx];
      }
      return '';
    };
    const questionText = getCol('questiontext', 'question', 'text', 'question_text');
    const optionsRaw = getCol('options', 'option');
    const correctAnswerRaw = getCol('correctanswer', 'correctanswer', 'answer', 'correct');
    const explanation = getCol('explanation', 'exp', 'explain');
    const subject = getCol('subject');
    const topic = getCol('topic');
    const difficulty = getCol('difficulty', 'diff');
    const examType = getCol('examtype', 'examtype', 'exam', 'exam_type');
    const language = getCol('language', 'lang') || 'en';
    const tagsRaw = getCol('tags', 'tag');
    const options = optionsRaw ? optionsRaw.split(/[|;]/).map((s) => s.trim()).filter(Boolean) : [];
    const tags = tagsRaw ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const correctAnswer = parseInt(correctAnswerRaw, 10);
    const errors: string[] = [];
    if (!questionText) errors.push('errMissingQuestion');
    if (options.length < 2) errors.push('errNeedOptions');
    if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) errors.push('errInvalidAnswer');
    if (!subject) errors.push('errMissingSubject');
    if (!topic) errors.push('errMissingTopic');
    if (!['easy', 'medium', 'hard'].includes(difficulty)) errors.push('errInvalidDifficulty');
    if (!examType) errors.push('errMissingExamType');
    rows.push({
      index: i - 1,
      questionText,
      options,
      correctAnswer,
      explanation,
      subject,
      topic,
      difficulty,
      examType,
      language,
      tags,
      status: errors.length === 0 ? 'valid' : 'invalid',
      errors,
    });
  }
  return rows;
}

function parseJSON(text: string): ParsedRow[] {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : (data.questions || data.data || []);
    return arr.map((item: Record<string, unknown>, idx: number) => {
      const q = (item as Record<string, unknown>);
      const questionText = (q.questionText || q.question_text || q.text || q.question || '') as string;
      const options = (q.options || q.option || []) as string[];
      const correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(String(q.correct_answer), 10);
      const explanation = (q.explanation || q.explain || '') as string;
      const subject = (q.subject || '') as string;
      const topic = (q.topic || '') as string;
      const difficulty = (q.difficulty || q.diff || '') as string;
      const examType = (q.examType || q.exam_type || q.exam || '') as string;
      const language = (q.language || q.lang || 'en') as string;
      const tags = (q.tags || q.tag || []) as string[];
      const errors: string[] = [];
      if (!questionText) errors.push('errMissingQuestion');
      if (!Array.isArray(options) || options.length < 2) errors.push('errNeedOptions');
      if (typeof correctAnswer !== 'number' || isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) errors.push('errInvalidAnswer');
      if (!subject) errors.push('errMissingSubject');
      if (!topic) errors.push('errMissingTopic');
      if (!['easy', 'medium', 'hard'].includes(difficulty)) errors.push('errInvalidDifficulty');
      if (!examType) errors.push('errMissingExamType');
      return {
        index: idx,
        questionText,
        options,
        correctAnswer,
        explanation,
        subject,
        topic,
        difficulty,
        examType,
        language,
        tags: Array.isArray(tags) ? tags : [],
        status: errors.length === 0 ? 'valid' : 'invalid',
        errors,
      };
    });
  } catch {
    return [];
  }
}

function validateRowsForUpload(rows: ParsedRow[]): StoreMCQRequest[] {
  return rows
    .filter((r) => r.status === 'valid')
    .map((r) => ({
      questionText: r.questionText,
      options: r.options,
      correctAnswer: r.correctAnswer,
      explanation: r.explanation,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty as 'easy' | 'medium' | 'hard',
      examType: r.examType,
      language: r.language,
      sourceType: 'admin_uploaded' as const,
      tags: r.tags,
    }));
}

const CheckIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Circle cx="8" cy="8" r="7" fill={colors.success} />
    <Path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CrossIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Circle cx="8" cy="8" r="7" fill={colors.error} />
    <Path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const UploadIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 16V4M12 4L8 8M12 4L16 8" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 16V20H20V16" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export function BulkUploadScreen() {
  const [mode, setMode] = useState<UploadMode>('json');
  const [inputText, setInputText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ stored: number; failed: number; total: number } | null>(null);
  const fileRef = useRef<any>(null);
  const { t, typography: tx } = useTranslation();

  const handleParse = useCallback(() => {
    let parsed: ParsedRow[] = [];
    if (mode === 'csv') {
      parsed = parseCSV(inputText);
    } else {
      parsed = parseJSON(inputText);
    }
    setRows(parsed);
    setShowPreview(true);
    setUploadResult(null);
  }, [mode, inputText]);

  const handleFileSelect = useCallback((e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const isCSV = file.name.endsWith('.csv');
      const parsed = isCSV ? parseCSV(text) : parseJSON(text);
      setRows(parsed);
      setShowPreview(true);
      setUploadResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleUpload = useCallback(async () => {
    const valid = validateRowsForUpload(rows);
    if (valid.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const total = valid.length;
    const result = await storeGeneratedMCQsBatchDirect(valid, (stored, failed) => {
      setUploadProgress(Math.round(((stored + failed) / total) * 100));
    });
    setUploadResult({ stored: result.stored, failed: result.failed, total: result.total });
    setUploading(false);
    setUploadProgress(100);
  }, [rows]);

  const handleReset = useCallback(() => {
    setInputText('');
    setRows([]);
    setShowPreview(false);
    setUploading(false);
    setUploadProgress(0);
    setUploadResult(null);
  }, []);

  const validCount = rows.filter((r) => r.status === 'valid').length;
  const invalidCount = rows.filter((r) => r.status === 'invalid').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('bulkUpload.title')}</Text>
      </View>

      {!showPreview && (
        <>
          <View style={styles.modeRow}>
            {(['json', 'csv', 'file'] as UploadMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => { setMode(m); setInputText(''); }}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'json' ? t('bulkUpload.modeJson') : m === 'csv' ? t('bulkUpload.modeCsv') : t('bulkUpload.modeFile')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'file' ? (
            <View style={styles.fileUploadArea}>
              <UploadIcon />
              <Text style={styles.fileUploadText}>{t('bulkUpload.fileUploadHint')}</Text>
              <TouchableOpacity
                style={styles.fileBtn}
                onPress={() => fileRef.current?.click()}
              >
                <Text style={styles.fileBtnText}>{t('bulkUpload.chooseFile')}</Text>
              </TouchableOpacity>
              {Platform.OS === 'web' && (
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              )}
            </View>
          ) : (
            <>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder={mode === 'json'
                  ? t('bulkUpload.jsonPlaceholder')
                  : t('bulkUpload.csvPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={[styles.parseBtn, !inputText.trim() && styles.parseBtnDisabled]}
                disabled={!inputText.trim()}
                onPress={handleParse}
              >
                <Text style={styles.parseBtnText}>{t('bulkUpload.parsePreview')}</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {showPreview && (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: colors.primary }]}>{rows.length}</Text>
              <Text style={styles.summaryLabel}>{t('bulkUpload.total')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: colors.success }]}>{validCount}</Text>
              <Text style={styles.summaryLabel}>{t('bulkUpload.valid')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: colors.error }]}>{invalidCount}</Text>
              <Text style={styles.summaryLabel}>{t('bulkUpload.invalid')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: colors.warning }]}>{uploadProgress}%</Text>
              <Text style={styles.summaryLabel}>{t('bulkUpload.uploaded')}</Text>
            </View>
          </View>

          {rows.length > 0 && (
            <View style={styles.tableWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, styles.colStatus]}>#</Text>
                    <Text style={[styles.tableCell, styles.colQuestion]}>{t('bulkUpload.colQuestion')}</Text>
                    <Text style={[styles.tableCell, styles.colSubject]}>{t('bulkUpload.colSubject')}</Text>
                    <Text style={[styles.tableCell, styles.colDifficulty]}>{t('bulkUpload.colDifficulty')}</Text>
                    <Text style={[styles.tableCell, styles.colErrors]}>{t('bulkUpload.colIssues')}</Text>
                  </View>
                  {rows.slice(0, 50).map((row) => (
                    <View key={row.index} style={[styles.tableRow, row.status === 'invalid' && styles.tableRowInvalid]}>
                      <View style={[styles.tableCell, styles.colStatus]}>
                        {row.status === 'valid' ? <CheckIcon /> : <CrossIcon />}
                      </View>
                      <Text style={[styles.tableCell, styles.colQuestion]} numberOfLines={2}>
                        {row.questionText.slice(0, 80)}{row.questionText.length > 80 ? '...' : ''}
                      </Text>
                      <Text style={[styles.tableCell, styles.colSubject]}>{row.subject}</Text>
                      <Text style={[styles.tableCell, styles.colDifficulty]}>{row.difficulty}</Text>
                      <Text style={[styles.tableCell, styles.colErrors, { color: colors.error }]}>
                        {row.errors.slice(0, 2).map(e => t(`bulkUpload.${e}`)).join('; ')}
                      </Text>
                    </View>
                  ))}
                  {rows.length > 50 && (
                    <Text style={styles.moreText}>{t('bulkUpload.moreRows', { count: rows.length - 50 })}</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {uploadResult ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t('bulkUpload.uploadComplete')}</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('bulkUpload.stored')}</Text>
                <Text style={[styles.resultValue, { color: colors.success }]}>{uploadResult.stored}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('bulkUpload.failed')}</Text>
                <Text style={[styles.resultValue, { color: colors.error }]}>{uploadResult.failed}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('bulkUpload.totalLabel')}</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>{uploadResult.total}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.actionRow}>
              {validCount > 0 && (
                <TouchableOpacity
                  style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  <Text style={styles.uploadBtnText}>
                    {uploading ? t('bulkUpload.uploading', { progress: uploadProgress }) : t('bulkUpload.uploadQuestions', { count: validCount })}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>{t('bulkUpload.startOver')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { marginBottom: spacing.lg },
  headerTitle: { fontSize: 22, fontWeight: '700', fontFamily: fontFamily.display, color: colors.text, lineHeight: 30 },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surface,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, fontFamily: fontFamily.bodyMedium },
  modeBtnTextActive: { color: colors.white },
  textArea: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, minHeight: 220, color: colors.text, fontSize: 13, fontFamily: 'monospace',
    lineHeight: 18, textAlignVertical: 'top',
  },
  parseBtn: {
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
    marginTop: spacing.md,
  },
  parseBtnDisabled: { opacity: 0.5 },
  parseBtnText: { fontSize: 15, fontWeight: '600', color: colors.white, fontFamily: fontFamily.bodySemiBold },
  fileUploadArea: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.xxl,
    padding: spacing.xxl, alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface,
  },
  tableWrap: {
    backgroundColor: colors.surface, borderRadius: radius.xxl,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  resultCard: {
    backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  fileUploadText: { fontSize: 14, color: colors.textSecondary, fontFamily: fontFamily.body },
  fileBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderRadius: radius.md,
  },
  fileBtnText: { fontSize: 14, fontWeight: '600', color: colors.white, fontFamily: fontFamily.bodyMedium },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  summaryNum: { fontSize: 20, fontWeight: '700', fontFamily: fontFamily.display, lineHeight: 26 },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, fontFamily: fontFamily.body, marginTop: 2 },
  tableWrap: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tableRowInvalid: { backgroundColor: `${colors.error}08` },
  tableCell: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, fontSize: 12, color: colors.text, fontFamily: fontFamily.body },
  colStatus: { width: 36, alignItems: 'center' },
  colQuestion: { width: 220 },
  colSubject: { width: 100 },
  colDifficulty: { width: 60 },
  colErrors: { width: 160, fontSize: 11, color: colors.error },
  moreText: { padding: spacing.sm, fontSize: 12, color: colors.textTertiary, fontStyle: 'italic', textAlign: 'center' },
  actionRow: { gap: spacing.sm, marginTop: spacing.sm },
  uploadBtn: {
    backgroundColor: colors.success, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { fontSize: 16, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },
  resetBtn: {
    paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  resetBtnText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: fontFamily.bodyMedium },
  resultCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  resultTitle: { fontSize: 17, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodyBold, marginBottom: spacing.md, textAlign: 'center' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  resultLabel: { fontSize: 14, color: colors.textSecondary, fontFamily: fontFamily.body },
  resultValue: { fontSize: 14, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
});
