import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { I18nManager, View } from 'react-native';

type IconName = string;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

const ICON_MAP: Record<string, string> = {
  chevron: 'chevron-forward-outline',
  chevronDown: 'chevron-down-outline',
  chevronL: 'chevron-back-outline',
  check: 'checkmark-outline',
  x: 'close-outline',
  clock: 'time-outline',
  plus: 'add-outline',
  bell: 'notifications-outline',
  calendar: 'calendar-outline',
  user: 'person-outline',
  users: 'people-outline',
  home: 'home-outline',
  search: 'search-outline',
  sparkle: 'sparkles-outline',
  arrowR: 'arrow-forward-outline',
  arrowL: 'arrow-back-outline',
  book: 'book-outline',
  star: 'star-outline',
  starFill: 'star',
  flame: 'flame-outline',
  flag: 'flag-outline',
  share: 'share-social-outline',
  play: 'play',
  gift: 'gift-outline',
  phone: 'call-outline',
  heart: 'heart-outline',
  lock: 'lock-closed-outline',
  refresh: 'refresh-outline',
  filter: 'funnel-outline',
  grid: 'grid-outline',
  list: 'list-outline',
  qr: 'qr-code-outline',
  pin: 'location-outline',
  arrowUpR: 'arrow-up-right-outline',
};

const RTL_FLIP_NAMES = new Set(['chevron', 'chevronL', 'arrowR', 'arrowL', 'arrowUpR']);

function resolveIconName(name: IconName): string {
  return ICON_MAP[name] ?? 'help-outline';
}

function Icon({ name, size = 20, color }: IconProps) {
  const glyph = resolveIconName(name);
  const shouldFlip = RTL_FLIP_NAMES.has(name) && I18nManager.isRTL;
  const resolvedColor = color ?? undefined;

  const iconElement = <Ionicons name={glyph as keyof typeof Ionicons.glyphMap} size={size} color={resolvedColor} />;

  if (shouldFlip) {
    const flipStyle: ViewStyle = { transform: [{ scaleX: -1 }] };
    return <View style={flipStyle}>{iconElement}</View>;
  }

  return iconElement;
}

export { Icon, ICON_MAP, resolveIconName, RTL_FLIP_NAMES };
export type { IconName, IconProps };
