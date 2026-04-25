import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '@/components/ui/colors';

export default function ManagerTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.neutral.dim,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('manager.tabs.home', { defaultValue: 'Home' }),
          tabBarAccessibilityLabel: t('manager.tabs.homeAccessibility', {
            defaultValue: 'Manager dashboard',
          }),
          tabBarButtonTestID: 'manager-tab-dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: t('manager.tabs.students', { defaultValue: 'Students' }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: t('manager.tabs.sessions', { defaultValue: 'Sessions' }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: t('manager.tabs.teachers', { defaultValue: 'Teachers' }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('manager.tabs.more', { defaultValue: 'More' }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
