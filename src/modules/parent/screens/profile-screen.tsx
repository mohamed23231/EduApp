import type { TFunction } from 'i18next';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';

function getTranslatedRole(role: string | undefined, t: TFunction): string {
  if (!role) {
    return '';
  }
  if (role.toLowerCase() === 'parent') {
    return t('parent.profile.roleParent');
  }
  return role;
}

function getInitials(email: string | undefined): string {
  if (!email) {
    return '?';
  }
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const isArabic = language === 'ar';

  const handleToggle = () => {
    setLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="language-outline" size={20} color="#6B7280" />
        </View>
        <Text style={styles.settingsLabel}>
          {t('parent.profile.languageLabel')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.langToggle}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('parent.profile.languageLabel')}
      >
        <View style={[styles.langOption, !isArabic && styles.langOptionActive]}>
          <Text style={[styles.langOptionText, !isArabic && styles.langOptionTextActive]}>EN</Text>
        </View>
        <View style={[styles.langOption, isArabic && styles.langOptionActive]}>
          <Text style={[styles.langOptionText, isArabic && styles.langOptionTextActive]}>عربي</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore.use.user();
  const signOut = useAuthStore.use.signOut();

  const initials = getInitials(user?.email);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.emailHeader}>{user?.email ?? ''}</Text>
        <View style={styles.roleBadgeHeader}>
          <Text style={styles.roleBadgeHeaderText}>{getTranslatedRole(user?.role, t)}</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{t('parent.profile.accountSection')}</Text>
        <View style={styles.card}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
              </View>
              <Text style={styles.settingsLabel}>
                {t('parent.profile.emailLabel')}
              </Text>
            </View>
            <Text
              style={[styles.settingsValue, { textAlign: I18nManager.isRTL ? 'left' : 'right' }]}
              numberOfLines={1}
            >
              {user?.email ?? ''}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-outline" size={20} color="#6B7280" />
              </View>
              <Text style={styles.settingsLabel}>
                {t('parent.profile.roleLabel')}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{getTranslatedRole(user?.role, t)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <LanguageToggle />
        </View>
      </View>

      <View style={styles.spacer} />

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel={t('parent.profile.logoutButton')}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#DC2626"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>{t('parent.profile.logoutButton')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emailHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadgeHeader: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  settingsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginStart: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  settingsLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  settingsValue: {
    fontSize: 14,
    color: '#6B7280',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginStart: 60,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  langOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langOptionActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  langOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  langOptionTextActive: {
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    minHeight: 48,
  },
  logoutIcon: {
    marginEnd: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
});
