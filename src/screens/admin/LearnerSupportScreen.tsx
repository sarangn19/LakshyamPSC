import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSupportTickets, updateTicketStatus, assignTicket } from '../../services/adminDataService';

export function LearnerSupportScreen() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('open');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchSupportTickets().then(setTickets);
  }, []);

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter((t: any) => t.status === filter);

  const priorityColor = (p: string) =>
    p === 'critical' ? colors.error : p === 'high' ? colors.warning : p === 'medium' ? colors.info : colors.textMuted;

  const ticket = selectedTicket ? tickets.find((t: any) => t.id === selectedTicket) : null;

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
        {t('admin.learnerSupport')}
      </Text>

      <View style={styles.summaryRow}>
        {(['open', 'assigned', 'in_progress', 'resolved', 'escalated'] as const).map((s) => {
          const count = tickets.filter((t: any) => t.status === s).length;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.summaryCard, filter === s && styles.summaryCardActive]}
              onPress={() => setFilter(s)}
            >
              <Text style={[typography.h4, { color: filter === s ? colors.primary : colors.text }]}>{count}</Text>
              <Text style={[typography.small, { color: filter === s ? colors.primary : colors.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {ticket ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={[typography.h4, { color: colors.text, flex: 1 }]}>{ticket.subject}</Text>
            <TouchableOpacity onPress={() => { setSelectedTicket(null); setResolution(''); }}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>{t('admin.back')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ticketMeta}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('admin.from')}: {ticket.userName}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor(ticket.priority) + '20' }]}>
              <Text style={[typography.small, { color: priorityColor(ticket.priority) }]}>{ticket.priority}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('admin.category')}: {ticket.category}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.text, marginVertical: spacing.md }]}>
            {ticket.description}
          </Text>
          {ticket.assignedTo && (
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              {t('admin.assignedTo')}: {ticket.assignedTo}
            </Text>
          )}
          <TextInput
            style={styles.resolutionInput}
            placeholder={t('admin.resolutionPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={resolution}
            onChangeText={setResolution}
            multiline
          />
          <View style={styles.detailActions}>
            {!ticket.assignedTo && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.info }]}
                onPress={async () => { await assignTicket(ticket.id, 'admin_self'); const u = await fetchSupportTickets(); setTickets(u); }}
              >
                <Text style={[typography.small, { color: '#fff' }]}>{t('admin.assignToMe')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={async () => { await updateTicketStatus(ticket.id, 'resolved', resolution); const u = await fetchSupportTickets(); setTickets(u); setSelectedTicket(null); setResolution(''); }}
            >
              <Text style={[typography.small, { color: '#fff' }]}>{t('admin.resolve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
              onPress={async () => { await updateTicketStatus(ticket.id, 'escalated'); const u = await fetchSupportTickets(); setTickets(u); }}
            >
              <Text style={[typography.small, { color: '#fff' }]}>{t('admin.escalate')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        filtered.map((ticket) => (
          <TouchableOpacity key={ticket.id} style={styles.ticketCard} onPress={() => setSelectedTicket(ticket.id)}>
            <View style={styles.ticketHeader}>
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{ticket.subject}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor(ticket.priority) + '20' }]}>
                <Text style={[typography.small, { color: priorityColor(ticket.priority) }]}>{ticket.priority}</Text>
              </View>
            </View>
            <View style={styles.ticketMeta}>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {ticket.userName} · {ticket.category}
              </Text>
              <Text style={[
                typography.small,
                { color: ticket.status === 'open' ? colors.error : ticket.status === 'assigned' ? colors.info : colors.success },
              ]}>{ticket.status}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
              {ticket.description}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  summaryCard: { backgroundColor: colors.bgCard, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', minWidth: 60, flex: 1, borderWidth: 1, borderColor: colors.border },
  summaryCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  ticketMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  priorityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  resolutionInput: { backgroundColor: colors.bgInput, borderRadius: borderRadius.sm, padding: spacing.md, color: colors.text, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.border },
  detailActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  ticketCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
});
