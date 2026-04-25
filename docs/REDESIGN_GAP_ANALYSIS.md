# PrivatEdu Redesign — Deep Gap Analysis

**Design source**: Claude Design handoff bundle (`5uMT33j0HczRaowDspaVAQ`)  
**Date of analysis**: 2026-04-18  
**Analyst**: Claude (Sonnet 4.6)  
**Overall redesign rating**: **5.5 / 10** — see §7

---

## 1. What the Design Covers

The design prototype includes:

| Role | Screens designed |
|------|-----------------|
| Auth | Splash · Phone entry · OTP · Role picker · Welcome |
| Teacher | Home · Session detail (Brief/Live/Summary tabs) · Attendance (swipe) · Post-session rating · Student roster · Student profile · Add student · Message parent · Notifications · Profile |
| Parent | Dashboard · Student detail (Overview/Subjects/Timeline tabs) · Notifications/Inbox |
| Manager | Center dashboard · Create session |

---

## 2. Auth Flow — Missing Cases

### 2.1 Designed but broken flows
- **Country code selector** — design hardcodes the Egypt flag (`🇪🇬 +20`) as a non-interactive tile. The app supports international phone numbers. There is no country picker designed.
- **OTP delivery channel** — design says "We'll text you a code" but the app delivers OTP via **WhatsApp** (WAsender), not SMS. No design shows the WhatsApp-delivery UX (message preview, "Open WhatsApp" button).
- **Role picker** — design shows Teacher / Parent / Manager roles chosen at onboarding. The app does not offer a role picker during signup; role is assigned server-side (a teacher account cannot become a parent account). The role-picker screen would mislead users.

### 2.2 Entirely absent screens
| Missing screen | Why it matters |
|----------------|---------------|
| **Email/password login** | App supports email+password in addition to phone OTP. Design has no email flow. |
| **Google OAuth** | `google-sign-in-button.tsx` exists; design ignores it. |
| **Reset password** | App has `reset-password-screen.tsx` with a dedicated phone OTP reset. Design is silent. |
| **Signup (name/email)** | After OTP verify the teacher must set their display name and email. Design jumps straight to Welcome. |
| **Account expired screen** | App shows a friendly "your subscription has expired" error after a 403. No design equivalent. |
| **Onboarding wizard (teacher)** | Teacher sees an onboarding checklist (create session, add student, etc.) on first login. Design skips this. |

---

## 3. Teacher Flow — Missing Cases

### 3.1 Dashboard / Home

| Gap | Detail |
|-----|--------|
| **KPI strip content** | Design shows "To mark / Students / 7-day%". App's real KPI is sessions count + subscription status + trial days remaining. Design KPIs are disconnected from backend data shape. |
| **Live session hero** | Design shows a glowing dark card for one active session. App can have multiple concurrent active sessions (teacher teaches at a center and has personal sessions). Single-session hero assumption is wrong. |
| **Empty state (no sessions)** | Design has an empty state: "Nothing on today · Create a session". App does not show this message; it just renders an empty list. This gap is on the app's side — the design is right. |
| **Session status colors** | Design: `draft` = grey, `active` = lime-bordered, `closed` = normal. App uses similar logic but the mapping to design tokens is not defined anywhere in the existing code. |

### 3.2 Session Detail

| Gap | Detail |
|-----|--------|
| **"Brief" pre-session tab** | Shows "Starts in", expected students, location, last session topic, and a "Suggested focus" (AI-style insight about students who haven't submitted homework). No AI inference layer exists in the backend. This is a fantasy feature. |
| **"Notes" tab** | Freeform session notes field. Backend schema has no `notes` column on sessions. A migration would be required. |
| **Cancel session** | Design has a destructive confirm sheet ("Students will be auto-notified"). App's session delete does not auto-notify parents via push — that pipeline doesn't exist. |
| **Homework field** | "Homework set: Yes · Ch. 25 problems 1–12" in the summary tab. No homework data model exists. |

### 3.3 Attendance

| Gap | Detail |
|-----|--------|
| **Swipe gesture** | Design's `SwipeRow` uses `translateX` drag → commit at 80px. App's `attendance-status-control.tsx` uses segmented button buttons (Present/Absent/Excused). The swipe mechanic doesn't exist in the app. |
| **Excused via long-press** | Chat mentions "long-press for Excused + note" but the prototype only has a third tap-button for Excused. Neither is implemented as a gesture in the app. |
| **"Auto-mark remaining absent" CTA** | Design: "Close & auto-mark {N} absent". App does not auto-mark unmarked students on close — teachers must mark each one explicitly. |
| **Undo toast** | Swipe-mark fires an undo toast for 2.4 s. App has no undo for attendance marks. |

### 3.4 Post-Session Rating

| Gap | Detail |
|-----|--------|
| **Dedicated full screen** | Design is a full screen (`TeacherPostSession`). App uses `batch-rating-sheet.tsx` — a bottom sheet. This is a UX regression in the design (sheets are more ergonomic). |
| **"Finalize & notify parents" CTA** | Design implies pressing this button sends push notifications. App fires push from the backend when attendance is submitted, not when ratings are submitted. The timing/trigger is different. |
| **Session notes field on rating screen** | Duplicates the "Notes tab" gap. No backend column. |

### 3.5 Student Roster

| Gap | Detail |
|-----|--------|
| **"At-risk" sort** | Design has a sort tab "At-risk" that sorts by ascending attendance. Good UX, but "at-risk" threshold (< 80%) is hardcoded in the prototype. App shows no such dynamic badge or sort. |
| **Rating pips / trend** | Student cards in design show `{st.rating}/10` as a big number. App's `student-card.tsx` shows attendance and streak but not rating directly in the list. |
| **Search** | Both design and app have search. Gap: app's search is server-side; design's is client-side filter. Debounce/loading state not designed. |

### 3.6 Student Profile

| Gap | Detail |
|-----|--------|
| **Rating trend bar chart** | 8-bar chart of last 8 sessions. App has `teacher-student-performance-screen.tsx` — needs review for whether chart is included. |
| **"Message parent" button** | Design has a phone icon linking to an in-app chat. **No messaging backend exists.** This is a missing feature that would require: a new backend module, real-time transport (WebSocket or polling), and push integration. Estimated effort: 3–4 sprints. |
| **Per-student notes tab** | Design has a free-text notes field per student (e.g., "strong on problem sets, weak on derivations"). App has no per-student notes field. Would require schema migration. |

### 3.7 Add Student

| Gap | Detail |
|-----|--------|
| **Parent phone at add time** | Design captures parent name + phone when adding a student, and says "Parent gets an SMS invite". App uses a **connection code** system — teacher creates a student, generates a code, parent uses the code to self-link. Design's flow bypasses the connection-code mechanism entirely. |
| **Grade picker** | Design shows G7–G12 grade pills. App has a free-text grade/level field. |
| **Edit student** | Design has no edit-student screen. App has `student-edit-screen.tsx`. |

### 3.8 Message Parent (New Feature — Not In App)

The entire `TeacherMessageParent` screen represents a feature that **does not exist** in the codebase:
- No `messages` table or API endpoint
- No real-time transport layer
- No backend module
- Quick replies ("Marked present ✓", "Running late", "Session cancelled", "Great work today!") need backend event hooks
- Push notification triggers for new messages missing

This is the single largest gap in the redesign — it treats an aspirational feature as if it already exists.

### 3.9 Teacher Notifications

| Gap | Detail |
|-----|--------|
| **Payment received** | Notification type `payment received — 1,200 EGP · April invoice`. App has no payment/billing module on mobile. |
| **"Parent sent a message"** | Depends on the messaging feature (§3.8). |
| **Left-border color coding** | Design uses a 4px colored left border per notification type. App's `notification-item.tsx` doesn't have this pattern. |
| **"Weekly report ready"** | Notification type suggesting a generated report. No report generation exists. |

### 3.10 Teacher Profile

| Gap | Detail |
|-----|--------|
| **Earnings** | Design shows "12,400 EGP · April invoice". App has no payment/invoicing data. |
| **Weekly schedule** | Design shows "Mon–Fri" as a settings row. App has no schedule settings. |
| **"Invite students · Share link"** | App has `connection-code-screen.tsx` for per-student codes. A global invite link doesn't exist. |
| **Language setting** | Design shows "English" as the current language. App does have i18next language switching. Gap: no design for the language picker sheet. |

---

## 4. Parent Flow — Missing Cases

### 4.1 Parent Dashboard

| Gap | Detail |
|-----|--------|
| **"In class now" hero** | Design's hero says "Layla is in Physics right now." This requires the backend to expose a real-time "is student currently in an active session" flag. Current parent API returns attendance records, not live session presence. Would require a new endpoint. |
| **Kid switcher horizontal pills** | Design has a horizontal pill switcher. App has `student-selector.tsx` but it may differ visually. |
| **Weekly dot calendar** | 7-day grid of attendance dots (Present/Absent/Excused/Today). App has `student-attendance-screen.tsx` with a timeline but not a compact dot-grid. |
| **"This week" 3-tile KPI grid** | Attendance % (lime tile), Streak (dark tile), Avg rating (card). App has `attendance-stat-card.tsx` and `attendance-donut-chart.tsx` but not this layout. |
| **Subjects strip (horizontal scroll)** | Per-subject cards with teacher name + attendance % + rating bar. App has `student-details-screen.tsx` (tabs) but no horizontal subject strip. |
| **Activity feed** | Design's `ActivityCard` with kind: present/absent/rating/streak. App has `timeline-item.tsx` — different data shape. |
| **QR button in header** | Design has a QR icon button at top-right. No QR code feature exists in the parent module. |
| **"+" add child dashed button** | Design shows a dashed-border circle for adding another child from the dashboard. App has `link-student-screen.tsx` but no such shortcut from the dashboard. |

### 4.2 Parent Student Detail

| Gap | Detail |
|-----|--------|
| **"View class" button on hero** | If student is in class, a "View class" button appears. No class viewing/camera feature exists. This is a phantom feature. |
| **"See schedule" CTA** | Tapping on "Next class" hero shows a "See schedule" button. No schedule screen is designed or built for parents. |
| **Teachers section with phone button** | Design shows teacher cards with a phone call button. App has no teacher-to-parent calling feature, and exposing teacher phone numbers to parents may be a privacy concern. |
| **Subjects tab in student detail** | Rating bars per subject with attendance % per subject. App has `parent-student-performance-screen.tsx` — different structure. |
| **8-week attendance bar chart** | Design shows a bar chart in the Overview tab. App uses donut chart. |

### 4.3 Parent Notifications / Inbox

| Gap | Detail |
|-----|--------|
| **URGENT banner** | Hot-coral banner at top for the most critical alert (absence). App's `notification-center-screen.tsx` shows a flat list. |
| **Filter tabs** | "All / Urgent / Updates" segmented tabs. App has a flat list with no filtering. |
| **"Earlier this week" section** | Design groups notifications by Today / Earlier. App shows a flat chronological list. |
| **Streak notification type** | Design shows a "Layla hit a 10-day streak" notification type. App's notification types are: absence alert + low performance alert only (2 types). Streak notifications don't exist in the backend. |
| **Rating notification** | "Layla got 9/10 in Chemistry" as a notification. App's "low performance alert" fires on low rating, not on all ratings. High-score notifications don't exist. |

### 4.4 Parent Profile — Entirely Missing from Design

The design has no parent profile screen. App has `profile-screen.tsx` for parents. Design coverage: 0%.

### 4.5 Parent Linking Flow — Entirely Missing from Design

The connection code flow (parent enters a 6-char code to link to a student) is the entire onboarding flow for parents. Design shows a "+" button but no:
- `link-student-screen.tsx` equivalent
- Code entry UI
- Success/error states
- Parent invite deep link handling (`/parent-invite` route)

---

## 5. Manager Flow — Missing Cases

The manager module in the design covers only 2 screens. The app implements 12+ screens.

### 5.1 Screens in app with zero design coverage

| App screen | Route |
|-----------|-------|
| Sessions list | `(manager)/(tabs)/sessions.tsx` |
| Session detail | `(manager)/sessions/[id].tsx` |
| Attendance marking (org) | `(manager)/sessions/attendance/[instance-id].tsx` |
| Students list | `(manager)/(tabs)/students.tsx` |
| Student create | `(manager)/students/create.tsx` |
| Student detail | `(manager)/students/[id].tsx` |
| Teachers list | `(manager)/(tabs)/teachers.tsx` |
| Teacher invite | `(manager)/teachers/invite.tsx` |
| Reports | `(manager)/reports.tsx` |
| More / settings | `(manager)/(tabs)/more.tsx` |
| Org setup wizard | `(manager)/setup.tsx` |
| Manager settings | `(manager)/settings.tsx` |

### 5.2 Design-only features not in the app

| Design element | Status |
|---------------|--------|
| Top teachers leaderboard (ranked) | Not implemented — app's teachers screen is a flat list |
| "Needs attention" at-risk student section | Not implemented — app has no at-risk section on manager dashboard |
| Session create "natural language preview" card | Not implemented — app uses a standard form layout |
| Overlapping monogram avatar cluster for assigned students | Not implemented |

### 5.3 Manager Dashboard data gaps

| Design shows | App actually has |
|-------------|-----------------|
| "87% attendance · live" as a single org-wide number | Per-session attendance only |
| "+3% vs yesterday" trend | No daily trend delta in API |
| "126 present · 18 absent · 4 excused" absolute counts | Not aggregated at org level in API |
| "4 live sessions" count on KPI tile | Partially supported |

---

## 6. Cross-Cutting Gaps (All Roles)

### 6.1 Arabic / RTL — Critical

**The entire design is English-only with LTR layout. The app is Arabic-first.**

- Zero Arabic strings in any design file
- No `direction: rtl` applied anywhere in the prototype
- All icons are directional (back arrow, chevrons) with no RTL flipping
- Monospace numerals in design (`JetBrains Mono`) — Arabic numerals (٠١٢٣) are not addressed
- Typography token `arabic: '"Rubik", "SF Arabic"'` exists in `design-system.js` but is **never used** in any screen file
- The "editorial modernism" → "Confident Signal" direction was designed and iterated entirely in English

**Impact**: Every screen would need RTL mirroring before implementation. Padding, margin, icon direction, text alignment — all need `marginStart`/`marginEnd` equivalents.

### 6.2 Dark Mode

- Design uses a dark canvas (`#0B0D10`) for hero cards and key surfaces
- App currently supports theme switching (light/dark) via `use-selected-theme.tsx`
- Design prototype does not define how the light-mode variant looks for the dark hero cards
- No night-mode color tokens for the "paper" and "card" surfaces in dark context

### 6.3 Loading States

The design has no loading/skeleton states for any screen. The app has `skeleton-loader.tsx`. Missing:
- Skeleton for Teacher Home while sessions load
- Skeleton for Parent Dashboard while student data loads
- Skeleton for Notifications while fetching
- Pull-to-refresh UI
- Infinite scroll pagination indicators

### 6.4 Error States

No error UI in any design file. Missing:
- Network error (no internet) screen
- API error (500, 503) states per screen
- Empty search results (partially exists — Teacher Students has it)
- "Session not found" deep-link error
- Auth token expired banner

### 6.5 Subscription / Trial / Entitlement Flows

The design is completely silent on:
- Free trial countdown banner (`TrialCard.tsx` / `trial-expired-banner.tsx`)
- Account expired screen (the app shows a friendly message after 403)
- Plan upgrade CTA
- Trial-expired state on teacher home

These are core product flows — teachers hit them on day 14.

### 6.6 Organization / Multi-tenant Features

The design ignores the entire organization/school flow introduced on the current branch:
- Context switcher (personal ↔ org teaching contexts) — `context-switcher.tsx`
- Org invitation acceptance screen — `org-invitation-screen.tsx`
- Teacher org-sessions view — `teacher-org-sessions-screen.tsx`
- Org setup wizard — `onboarding-wizard.tsx`
- Trial-expired banner for org context — `trial-expired-banner.tsx`

### 6.7 Super-Admin Role

App has `(super-admin)/dashboard.tsx`. Design has zero super-admin coverage.

### 6.8 Bottom Navigation Structure

Design prototype navigates via a floating role-switcher pill (dev tool). It never defines:
- Tab bar icons, labels, and active states for Teacher (Today / Sessions / Students / Profile)
- Tab bar for Parent (Dashboard / Profile)
- Tab bar for Manager (Overview / Sessions / Students / Teachers / More)
- Tab bar height, safe-area inset, badge behavior

### 6.9 Haptic Feedback

Design's swipe-to-mark UX on attendance would greatly benefit from haptic feedback at the commit threshold. Not mentioned in the design, not in the app.

### 6.10 Offline / Optimistic Updates

Design splash says "works offline" but:
- No offline indicator UI is designed
- No optimistic update patterns (e.g., swipe-mark while offline then sync) are defined
- No retry queue or conflict resolution UI

### 6.11 Accessibility

- No minimum tap target sizes specified (design uses 38px `MarkBtn` — below 44pt iOS minimum)
- No `accessibilityLabel` equivalents in prototype
- No color-blind safe alternatives (lime as the only accent is problematic for deuteranopia)
- No voice-over / TalkBack flow consideration

---

## 7. Overall Redesign Rating: 5.5 / 10

### What works well (+)

| Strength | Score |
|---------|-------|
| Visual direction — obsidian + lime is genuinely distinctive, not generic SaaS | +1.5 |
| Swipe-to-mark attendance pattern is a real UX improvement over segmented controls | +1.0 |
| Parent "one sentence hero" insight (in-class vs. next-class) is excellent product thinking | +1.0 |
| Session detail multi-state tabs (Brief/Live/Summary) are thoughtful and well-structured | +0.75 |
| Typography, spacing, and card density feel modern and usable | +0.75 |
| Empty states for Teacher Home and Students are correctly designed | +0.5 |

**Subtotal strengths: 5.5 / 10**

### What's wrong (–)

| Weakness | Deduction |
|---------|-----------|
| No Arabic/RTL — fatal for an Arabic-first app. The entire design is unusable as-is | –1.5 |
| "Message parent" is a fully designed phantom feature (no backend, no protocol) | –0.75 |
| Manager module covers 2 of 12+ screens — incomplete to the point of misleading | –0.5 |
| Subscription/trial flows completely missing — core product lifecycle undesigned | –0.5 |
| Parent linking / connection code flow absent — parents can't onboard without it | –0.5 |
| Role picker assumes server-side role assignment works differently than it does | –0.5 |
| "In class now" requires a real-time presence API that doesn't exist | –0.5 |
| No loading, error, or offline states on any screen | –0.5 |
| Tab bar structure undefined — routing and navigation are core to the UX | –0.5 |
| MarkBtn tap targets are 38px — below iOS 44pt minimum | –0.25 |

**Subtotal weaknesses: –6.0**

### Net adjusted rating

Starting from 5.5 and applying the deductions: **5.5 / 10**

The redesign is a solid visual concept and a useful directional reference, but it cannot be implemented as-is. It treats too many phantom features as real, ignores the primary language/locale of the product, and has Swiss-cheese coverage of the manager and auth modules.

---

## 8. Recommended Implementation Priority

If the team decides to adopt the design direction, implement in this order:

### Phase 1 — Design tokens & global shell (no feature changes)
1. Add `obsidian/lime` color tokens to `src/global.css` and `colors.js`
2. Update `Button` component variants (primary → ink, accent → lime)
3. Update `StatusChip` / `StatusBadge` components to new colors
4. Update bottom tab bar with new icon treatment and active states

### Phase 2 — High-ROI screens (Arabic-compatible)
5. Teacher dashboard KPI strip + live session hero card (with RTL support)
6. Attendance swipe gestures (augment existing `attendance-status-control.tsx`)
7. Student roster "AT RISK" badge + at-risk sort
8. Parent dashboard hero card + weekly dot grid (requires real-time presence API work)

### Phase 3 — New screens (lower risk)
9. Teacher post-session rating → convert from sheet to full screen
10. Parent notifications: URGENT banner + All/Urgent/Updates filter tabs
11. Parent student detail tabs (Overview/Subjects/Timeline)
12. Manager dashboard hero KPI + teachers leaderboard

### Phase 4 — Phantom features (require backend work first)
13. Session notes tab (needs schema migration)
14. Per-student notes tab (needs schema migration)
15. Streak notifications (needs backend notification type)
16. Rating notifications for high scores (needs backend notification type)
17. In-class real-time presence API
18. Message parent (entire new feature — 3–4 sprint estimate)

---

## 9. Files to Reference

| Reference | Path |
|-----------|------|
| Existing color tokens | `src/components/ui/colors.js`, `src/components/ui/color-utils.ts` |
| Existing button component | `src/components/ui/button.tsx` |
| Attendance control | `src/modules/teacher/components/attendance-status-control.tsx` |
| Teacher dashboard | `src/modules/teacher/screens/dashboard-screen.tsx` |
| Parent dashboard | `src/modules/parent/screens/dashboard-screen.tsx` |
| Parent notifications | `src/modules/parent/screens/notification-center-screen.tsx` |
| Manager dashboard | `src/modules/organization/manager/screens/dashboard-screen.tsx` |
| Design prototype | `/tmp/design_extracted/education/project/` (local only, not committed) |
