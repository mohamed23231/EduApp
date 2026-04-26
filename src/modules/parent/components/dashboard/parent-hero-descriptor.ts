import type { CurrentSession, TimelineRecord, UpcomingSession } from '../../types';
import type { StatusKey } from '../../utils/dashboard-helpers';
import type { SupportedLocale } from '@/lib/date';
import colors from '@/components/ui/colors';
import { formatCalendarDay, formatTime } from '@/lib/date';
import { combineDateTime, deriveStatusKey } from '../../utils/dashboard-helpers';

/**
 * Pure data layer for ParentHero. Translates the (currentSession, upcomingSession,
 * todayRecord) tuple into a typed UI descriptor — colors, copy, dot state.
 * No JSX, easy to unit-test.
 */

export type HeroMode = 'live' | 'next' | 'past' | 'none';

export type HeroDescriptor = {
  mode: HeroMode;
  tagText: string;
  tagColor: string;
  dotColor: string;
  pulse: boolean;
  headline: string;
  highlight: string | null;
  sub: string;
};

type Translate = (key: string, opts?: any) => string;

type DescriptorArgs = {
  studentFirstName: string;
  currentSession: CurrentSession | undefined;
  upcomingSession: UpcomingSession | undefined;
  todayRecord: TimelineRecord | null;
  locale: SupportedLocale;
  t: Translate;
};

const PAST_HEADLINE_KEY: Record<StatusKey, [string, string]> = {
  present: ['parent.dashboard.hero.headlinePresent', '{{name}} was in class today.'],
  absent: ['parent.dashboard.hero.headlineAbsent', '{{name}} was absent today.'],
  excused: ['parent.dashboard.hero.headlineExcused', '{{name}} was excused today.'],
  none: ['parent.dashboard.hero.headlineNone', '{{name}} has no sessions yet.'],
};

const PAST_TAG_KEY: Record<StatusKey, [string, string]> = {
  present: ['parent.dashboard.hero.tagPresent', 'IN CLASS TODAY'],
  absent: ['parent.dashboard.hero.tagAbsent', 'NOT IN CLASS'],
  excused: ['parent.dashboard.hero.tagExcused', 'EXCUSED TODAY'],
  none: ['parent.dashboard.hero.tagNone', 'NO SESSIONS YET'],
};

const PAST_TAG_COLOR: Record<StatusKey, string> = {
  present: colors.brand.primary,
  absent: colors.semantic.absent,
  excused: colors.semantic.excused,
  none: colors.neutral.dim,
};

const PAST_DOT_COLOR: Record<StatusKey, string> = {
  present: colors.semantic.present,
  absent: colors.semantic.absent,
  excused: colors.semantic.excused,
  none: colors.neutral.dim,
};

type LiveArgs = { studentFirstName: string; currentSession: CurrentSession; locale: SupportedLocale; t: Translate };

function buildLive({ studentFirstName, currentSession, locale, t }: LiveArgs): HeroDescriptor {
  const subject = currentSession.sessionName ?? t('parent.dashboard.hero.fallbackSubject', 'class');
  const startedAt = currentSession.startedAt ? formatTime(currentSession.startedAt, locale) : null;
  const room = currentSession.room ?? null;
  const subParts: string[] = [];
  if (startedAt)
    subParts.push(t('parent.dashboard.hero.startedAt', { defaultValue: 'Started {{time}}', time: startedAt }));
  if (room)
    subParts.push(room);
  return {
    mode: 'live',
    tagText: t('parent.dashboard.hero.tagLive', { defaultValue: 'IN CLASS NOW' }),
    tagColor: colors.brand.primary,
    dotColor: colors.brand.primary,
    pulse: true,
    headline: t('parent.dashboard.hero.headlineLive', {
      defaultValue: '{{name}} is in class right now.',
      name: studentFirstName,
    }),
    highlight: subject,
    sub: subParts.length > 0
      ? subParts.join(' · ')
      : t('parent.dashboard.hero.liveFallbackSub', { defaultValue: 'Live session in progress.' }),
  };
}

type NextArgs = { studentFirstName: string; upcomingSession: UpcomingSession; locale: SupportedLocale; t: Translate };

function buildNext({ studentFirstName, upcomingSession, locale, t }: NextArgs): HeroDescriptor {
  const when = formatCalendarDay(upcomingSession.startsAt, locale);
  const time = formatTime(upcomingSession.startsAt, locale);
  return {
    mode: 'next',
    tagText: t('parent.dashboard.hero.tagNext', { defaultValue: 'NEXT CLASS' }),
    tagColor: colors.neutral.dim,
    dotColor: colors.neutral.dim,
    pulse: false,
    headline: t('parent.dashboard.hero.headlineNext', {
      defaultValue: '{{name}} has class next.',
      name: studentFirstName,
    }),
    highlight: upcomingSession.sessionName,
    sub: `${when} · ${time}${upcomingSession.teacherName ? ` · ${upcomingSession.teacherName}` : ''}`,
  };
}

type PastArgs = { studentFirstName: string; todayRecord: TimelineRecord; locale: SupportedLocale; t: Translate };

function buildPast({ studentFirstName, todayRecord, locale, t }: PastArgs): HeroDescriptor {
  const status: StatusKey = deriveStatusKey(todayRecord.status);
  const [hKey, hFallback] = PAST_HEADLINE_KEY[status];
  const [tKey, tFallback] = PAST_TAG_KEY[status];
  return {
    mode: 'past',
    tagText: t(tKey, { defaultValue: tFallback }),
    tagColor: PAST_TAG_COLOR[status],
    dotColor: PAST_DOT_COLOR[status],
    pulse: false,
    headline: t(hKey, { defaultValue: hFallback, name: studentFirstName }),
    highlight: null,
    sub: `${formatCalendarDay(todayRecord.date, locale)} · ${formatTime(combineDateTime(todayRecord.date, todayRecord.time), locale)}`,
  };
}

function buildNone(studentFirstName: string, t: Translate): HeroDescriptor {
  return {
    mode: 'none',
    tagText: t('parent.dashboard.hero.tagNone', { defaultValue: 'NO SESSIONS YET' }),
    tagColor: colors.neutral.dim,
    dotColor: colors.neutral.dim,
    pulse: false,
    headline: t('parent.dashboard.hero.headlineNone', {
      defaultValue: '{{name}} has no sessions yet.',
      name: studentFirstName,
    }),
    highlight: null,
    sub: t('parent.dashboard.hero.subNone', { defaultValue: 'Stats appear once their first session lands.' }),
  };
}

export function buildHeroDescriptor(args: DescriptorArgs): HeroDescriptor {
  const { studentFirstName, currentSession, upcomingSession, todayRecord, locale, t } = args;
  if (currentSession?.inSession)
    return buildLive({ studentFirstName, currentSession, locale, t });
  if (upcomingSession)
    return buildNext({ studentFirstName, upcomingSession, locale, t });
  if (todayRecord)
    return buildPast({ studentFirstName, todayRecord, locale, t });
  return buildNone(studentFirstName, t);
}
