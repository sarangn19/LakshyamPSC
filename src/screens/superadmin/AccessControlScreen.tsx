import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchRoles, fetchPermissions, fetchRolePermissions, fetchFeatureFlags, updateFeatureFlag } from '../../services/adminDataService';

export function AccessControlScreen() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    Promise.all([
      fetchRoles(),
      fetchPermissions(),
      fetchRolePermissions(),
      fetchFeatureFlags(),
    ]).then(([r, p, rp, f]) => {
      setRoles(r);
      setPermissions(p);
      setRolePerms(rp);
      setFlags(f);
      if (r.length > 0) setSelectedRole(r[0].name);
    });
  }, []);

  const allResources = [...new Set(permissions.map((p: any) => p.resource))];
  const allActions = [...new Set(permissions.map((p: any) => p.action))];

  const buildMatrix = () => {
    const m: Record<string, Record<string, string[]>> = {};
    for (const role of roles) {
      m[role.name] = {};
      const rps = rolePerms.filter((rp: any) => rp.role_id === role.id);
      for (const perm of permissions) {
        if (rps.some((rp: any) => rp.permission_id === perm.id)) {
          if (!m[role.name][perm.resource]) m[role.name][perm.resource] = [];
          m[role.name][perm.resource].push(perm.action);
        }
      }
    }
    return m;
  };

  const matrix = buildMatrix();

  const togglePermission = () => {};

  const handleFlagToggle = async (id: string, enabled: boolean) => {
    await updateFeatureFlag(id, enabled);
    const updated = await fetchFeatureFlags();
    setFlags(updated);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.lg }]}>
        {t('superadmin.accessControl')}
      </Text>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.permissionMatrix')}
        </Text>
        <View style={styles.roleToggle}>
          {roles.map((r: any) => (
            <TouchableOpacity
              key={r.name}
              style={[styles.roleTab, selectedRole === r.name && styles.roleTabActive]}
              onPress={() => setSelectedRole(r.name)}
            >
              <Text style={[typography.body, { color: selectedRole === r.name ? '#fff' : colors.textSecondary }]}>
                {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.matrixHeader}>
              <Text style={[typography.small, { color: colors.textMuted, width: 100 }]}>{t('superadmin.resource')}</Text>
              {allActions.map((a: string) => (
                <Text key={a} style={[typography.small, { color: colors.textMuted, width: 60, textAlign: 'center' }]}>
                  {a.slice(0, 4)}
                </Text>
              ))}
            </View>
            {allResources.map((resource: string) => (
              <View key={resource} style={styles.matrixRow}>
                <Text style={[typography.small, { color: colors.text, width: 100 }]}>{resource}</Text>
                {allActions.map((action: string) => {
                  const isActive = (matrix[selectedRole]?.[resource] || []).includes(action);
                  return (
                    <TouchableOpacity
                      key={action}
                      style={[styles.permCell, isActive && styles.permCellActive]}
                      onPress={() => togglePermission(resource, action)}
                    >
                      {isActive && <Text style={{ fontSize: 12, color: '#fff' }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('superadmin.savePermissions')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.featureFlags')}
        </Text>
        {flags.map((flag: any) => (
          <View key={flag.key} style={styles.flagRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]}>{flag.name || flag.key}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{flag.description || ''}</Text>
            </View>
            <Switch
              value={flag.enabled ?? false}
              onValueChange={(v) => handleFlagToggle(flag.id, v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={flag.enabled ? colors.primary : colors.textMuted}
            />
          </View>
        ))}
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  section: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  roleToggle: { flexDirection: 'row', marginBottom: spacing.md },
  roleTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm },
  roleTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  matrixHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  matrixRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  permCell: { width: 60, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  permCellActive: { backgroundColor: colors.primary },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center', marginTop: spacing.md },
  flagRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
});
