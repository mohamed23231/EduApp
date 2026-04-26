import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.extend(updateLocale);

/**
 * Locale-aware date/time formatting.
 *
 * Always pass `locale` (`'en'` | `'ar'`) — every helper renders with the
 * correct numerals, weekday names, and month names. Never use raw
 * `toLocaleDateString` / `toLocaleTimeString` in new code.
 */

type Input = string | number | Date | dayjs.Dayjs | null | undefined;

export type SupportedLocale = 'en' | 'ar';

function withLocale(input: Input, locale: SupportedLocale): dayjs.Dayjs {
  return dayjs(input ?? undefined).locale(locale);
}

/** "Mar 6" / "٦ مارس" — short calendar date for list rows. */
export function formatShortDate(input: Input, locale: SupportedLocale): string {
  return withLocale(input, locale).format('MMM D');
}

/** "Mar 6, 2026" / "٦ مارس ٢٠٢٦" — long form for headers. */
export function formatLongDate(input: Input, locale: SupportedLocale): string {
  return withLocale(input, locale).format('LL');
}

/** "3:00 PM" / "٣:٠٠ م" — locale-aware 12-hour clock. */
export function formatTime(input: Input, locale: SupportedLocale): string {
  return withLocale(input, locale).format('LT');
}

/** "3 days ago" / "منذ ٣ أيام" — relative phrase for activity feeds. */
export function formatRelative(input: Input, locale: SupportedLocale): string {
  return withLocale(input, locale).fromNow();
}

/** "Today" / "اليوم", "Yesterday" / "أمس", or "Mar 6". For timeline rows. */
export function formatCalendarDay(input: Input, locale: SupportedLocale): string {
  const d = withLocale(input, locale);
  const today = dayjs().locale(locale).startOf('day');
  const target = d.startOf('day');
  const diff = target.diff(today, 'day');
  if (diff === 0)
    return locale === 'ar' ? 'اليوم' : 'Today';
  if (diff === -1)
    return locale === 'ar' ? 'أمس' : 'Yesterday';
  if (diff === 1)
    return locale === 'ar' ? 'غداً' : 'Tomorrow';
  return d.format('MMM D');
}

/** True if both inputs land on the same calendar day in the given locale. */
export function isSameDay(a: Input, b: Input): boolean {
  return dayjs(a ?? undefined).isSame(dayjs(b ?? undefined), 'day');
}

/** Pass-through to dayjs for callers that need full API access. */
export { dayjs };
