import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import colors from '@/components/ui/colors';

const TAB_ICON: Record<string, string> = {
  dashboard: 'home',
  students: 'users',
  sessions: 'calendar',
  teachers: 'building',
  more: 'user',
};

const TAB_TITLE_KEY: Record<string, string> = {
  dashboard: 'manager.tabs.home',
  students: 'manager.tabs.students',
  sessions: 'manager.tabs.sessions',
  teachers: 'manager.tabs.teachers',
  more: 'manager.tabs.more',
};

function ManagerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        start: 0,
        end: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 14),
        paddingTop: 8,
      }}
    >
      <View
        style={{
          marginHorizontal: 16,
          padding: 6,
          backgroundColor: colors.neutral.card,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: colors.neutral.rule,
          flexDirection: 'row',
          gap: 2,
          shadowColor: colors.neutral.ink,
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 2 },
          elevation: 6,
        }}
      >
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const iconName = TAB_ICON[route.name];
          const titleKey = TAB_TITLE_KEY[route.name];
          if (!iconName || !titleKey)
            return null;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={t(titleKey, { defaultValue: route.name })}
              accessibilityState={{ selected: isActive }}
              testID={`manager-tab-${route.name}`}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented)
                  navigation.navigate(route.name as never);
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                backgroundColor: isActive ? colors.neutral.ink : 'transparent',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Icon
                name={iconName}
                size={18}
                color={isActive ? colors.neutral.paper : colors.neutral.dim}
              />
              <Text
                style={{
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  color: isActive ? colors.neutral.paper : colors.neutral.inkMuted,
                }}
              >
                {t(titleKey, { defaultValue: route.name })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ManagerTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <ManagerTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="students" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="teachers" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
