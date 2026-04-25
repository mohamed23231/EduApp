import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import colors from '@/components/ui/colors';

export default function TeacherTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.neutral.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          shadowColor: colors.neutral.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.neutral.dim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('teacher.tabs.dashboard'),
          tabBarAccessibilityLabel: t('teacher.tabs.dashboard'),
          tabBarButtonTestID: 'teacher-tab-dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: t('teacher.tabs.students'),
          tabBarAccessibilityLabel: t('teacher.tabs.students'),
          tabBarButtonTestID: 'teacher-tab-students',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: t('teacher.tabs.sessions'),
          tabBarAccessibilityLabel: t('teacher.tabs.sessions'),
          tabBarButtonTestID: 'teacher-tab-sessions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('teacher.tabs.profile'),
          tabBarAccessibilityLabel: t('teacher.tabs.profile'),
          tabBarButtonTestID: 'teacher-tab-profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
