import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore, Role } from '../../store';
import { fetchAllProfiles, fetchRoles, assignUserRole, removeUserRole, fetchUserTotalAttempts } from '../../services/adminDataService';
import { supabase } from '../../services/supabase';

interface ManagedUser {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended';
  lastActive: string;
  totalSessions: number;
  totalAttempts: number;
  subStatus: string | null;
  subPlan: string | null;
  subTrialEnd: string | null;
  subPeriodEnd: string | null;
}

export function UserManagementScreen() {
  const { t } = useTranslation();
  const { role: currentRole } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
  const [fetchingAttempts, setFetchingAttempts] = useState(false);

  useEffect(() => {
    (async () => {
      const [profiles, roles] = await Promise.all([
        fetchAllProfiles(),
        fetchRoles(),
      ]);
      const map: Record<string, string> = {};
      for (const r of roles) map[r.name as string] = r.id;
      setRolesMap(map);

      // Fetch subscriptions
      let subsMap: Record<string, any> = {};
      try {
        if (supabase) {
          const { data: subs } = await supabase.from('subscriptions').select('*');
          if (subs) {
            for (const s of subs) subsMap[s.user_id] = s;
          }
        }
      } catch {}

      const mapped: ManagedUser[] = profiles.map((p: any) => {
        const sub = subsMap[p.auth_user_id] || subsMap[p.id] || null;
        return {
          id: p.id,
          authUserId: p.auth_user_id,
          name: p.user_name || (p.email ? p.email.split('@')[0] : 'Unknown'),
          email: p.email || '',
          role: (p.role as Role) || 'student',
          status: (p.status || 'active') as 'active' | 'suspended',
          lastActive: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : '--',
          totalSessions: p.total_sessions || 0,
          totalAttempts: 0,
          subStatus: sub?.status || null,
          subPlan: sub?.plan || null,
          subTrialEnd: sub?.trial_end || null,
          subPeriodEnd: sub?.current_period_end || null,
        };
      });
      setUsers(mapped);
    })();
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    students: users.filter((u) => u.role === 'student').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  const handleRoleChange = (authUserId: string, newRole: Role) => {
    const roleId = rolesMap[newRole];
    if (roleId) {
      assignUserRole(authUserId, roleId);
      setUsers((prev) => prev.map((u) => u.authUserId === authUserId ? { ...u, role: newRole } : u));
    }
  };

  const handleUserSelect = async (user: ManagedUser) => {
    setFetchingAttempts(true);
    setSelectedUser(user);
    try {
      const attempts = await fetchUserTotalAttempts(user.authUserId);
      setUsers((prev) => prev.map((u) => u.authUserId === user.authUserId ? { ...u, totalAttempts: attempts } : u));
      setSelectedUser((prev) => prev ? { ...prev, totalAttempts: attempts } : null);
    } catch (err) {
      console.error('Failed to fetch attempts:', err);
    } finally {
      setFetchingAttempts(false);
    }
  };

  const handleSuspend = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
    setSelectedUser(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
        {t('superadmin.userManagement')}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.totalUsers')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.success }]}>{stats.active}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.active')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.error }]}>{stats.suspended}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.suspended')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.info }]}>{stats.admins}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.admins')}</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t('superadmin.searchUsers')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {selectedUser ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={[typography.h4, { color: colors.text, flex: 1 }]}>{selectedUser.name}</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>{t('admin.back')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('superadmin.email')}</Text>
            <Text style={[typography.body, { color: colors.text }]}>{selectedUser.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('superadmin.role')}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {(['student', 'admin', 'superadmin'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, selectedUser.role === r && styles.roleBtnActive]}
                    onPress={() => handleRoleChange(selectedUser.authUserId, r)}
                  >
                  <Text style={[typography.small, { color: selectedUser.role === r ? '#fff' : colors.textSecondary }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('superadmin.status')}</Text>
            <Text style={[typography.body, { color: selectedUser.status === 'active' ? colors.success : colors.error }]}>
              {selectedUser.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('superadmin.lastActive')}</Text>
            <Text style={[typography.body, { color: colors.text }]}>{selectedUser.lastActive}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('superadmin.sessions')}</Text>
            <Text style={[typography.body, { color: colors.text }]}>{selectedUser.totalSessions}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Questions Attempted</Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {fetchingAttempts ? '...' : selectedUser.totalAttempts}
            </Text>
          </View>
          {selectedUser.subStatus && (
            <>
              <View style={styles.detailRow}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Subscription</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.subBadge, { backgroundColor: subColor(selectedUser.subStatus) + '20' }]}>
                    <Text style={[typography.small, { color: subColor(selectedUser.subStatus), fontWeight: '600' }]}>
                      {selectedUser.subStatus}
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {selectedUser.subPlan || 'premium'}
                  </Text>
                </View>
              </View>
              {selectedUser.subTrialEnd && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Trial Ends</Text>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {new Date(selectedUser.subTrialEnd).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {selectedUser.subPeriodEnd && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Period Ends</Text>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {new Date(selectedUser.subPeriodEnd).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={[styles.actionBtn, {
                backgroundColor: selectedUser.status === 'active' ? colors.error : colors.success,
              }]}
              onPress={() => handleSuspend(selectedUser.id)}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>
                {selectedUser.status === 'active' ? t('superadmin.suspend') : t('superadmin.restore')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        filtered.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[styles.userCard, user.status === 'suspended' && { opacity: 0.6 }]}
            onPress={() => handleUserSelect(user)}
          >
            <View style={styles.userHeader}>
              <View style={styles.avatar}>
                <Text style={[typography.bodyBold, { color: colors.primary }]}>
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.body, { color: colors.text }]}>{user.name}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'superadmin' ? colors.error + '20' : user.role === 'admin' ? colors.warning + '20' : colors.info + '20' }]}>
                <Text style={[typography.small, { color: user.role === 'superadmin' ? colors.error : user.role === 'admin' ? colors.warning : colors.info }]}>
                  {user.role}
                </Text>
              </View>
              {user.subStatus && (
                <View style={[styles.subBadge, { backgroundColor: subColor(user.subStatus) + '20' }]}>
                  <Text style={[typography.small, { color: subColor(user.subStatus), fontWeight: '600' }]}>
                    {user.subStatus}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userMeta}>
              <Text style={[typography.small, { color: user.status === 'active' ? colors.success : colors.error }]}>
                {user.status}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {t('superadmin.lastActive')}: {user.lastActive}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

function subColor(status: string): string {
  const map: Record<string, string> = {
    trialing: '#2563EB',
    active: '#22C55E',
    expired: '#6B7280',
    canceled: '#DC2626',
    past_due: '#F59E0B',
    incomplete: '#9CA3AF',
  };
  return map[status] || '#9CA3AF';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  searchInput: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 14 },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  roleBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  detailActions: { flexDirection: 'row', marginTop: spacing.md },
  actionBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  userCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  subBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginLeft: spacing.xs },
  userMeta: { flexDirection: 'row', gap: spacing.md, marginLeft: 40 + spacing.md },
});
