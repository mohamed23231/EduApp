import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useNotificationStore } from '@/modules/parent/store/use-notification-store';

type IconName = 'home' | 'calendar' | 'bell' | 'user';

const TAB_ICON: Record<string, IconName> = {
  dashboard: 'home',
  schedule: 'calendar',
  notifications: 'bell',
  profile: 'user',
};

const TAB_TITLE_KEY: Record<string, string> = {
  dashboard: 'parent.tabs.dashboard',
  schedule: 'parent.tabs.schedule',
  notifications: 'parent.tabs.inbox',
  profile: 'parent.tabs.profile',
};

function ParentTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const unreadCount = useNotificationStore.use.unreadCount();

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
          const showBadge = route.name === 'notifications' && unreadCount > 0;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={t(titleKey)}
              accessibilityState={{ selected: isActive }}
              testID={`parent-tab-${route.name}`}
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
                position: 'relative',
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
                {t(titleKey)}
              </Text>
              {showBadge
                ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        end: 14,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: colors.semantic.absent,
                        borderWidth: 1.5,
                        borderColor: colors.neutral.card,
                      }}
                    />
                  )
                : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ParentTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <ParentTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
