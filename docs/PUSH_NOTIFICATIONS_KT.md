# Push Notifications — Knowledge Transfer

> **Audience:** Any developer joining this project who has never worked with push notifications before.
> **Goal:** Understand the full end-to-end notification flow, how it was set up, and what broke it the first time.

---

## 1. What Is a Push Notification?

A push notification is a message sent from a server to a user's device even when the app is closed. On Android it goes through **Firebase Cloud Messaging (FCM)** — Google's infrastructure for delivering messages to Android devices.

The flow at the highest level:

```
Your Backend → Expo Push Service → FCM (Google) → Device
```

We use **Expo's managed push service** (instead of calling FCM directly) because it handles token management, batching, and retries for us.

---

## 2. The Three Players

| Player | Role |
|---|---|
| **Your Backend (NestJS on Railway)** | Creates notifications, queues push jobs, calls Expo Push API |
| **Expo Push Service** (`exp.host`) | Receives push requests from your backend, delivers them to FCM on your behalf |
| **Firebase Cloud Messaging (FCM)** | Google's infrastructure that actually delivers the message to the Android device |

---

## 3. Full End-to-End Flow

### Step 1 — App registers for push

When a parent opens the app, this happens automatically:

```
App boots
  → registerPushToken() called
  → Asks user for notification permission
  → Calls getExpoPushTokenAsync({ projectId }) from expo-notifications
  → Expo returns ExponentPushToken[xxxx]  ← this is the device address
  → App sends this token to your backend: POST /api/v1/parents/devices
  → Backend stores it in the device_tokens table
```

The `ExponentPushToken` is like a postal address for the device. Every device has a unique one.

**File:** `mobile-app/src/modules/parent/services/push-notification-handler.ts` → `registerPushToken()`

---

### Step 2 — Teacher marks student absent

```
Teacher taps "Absent" in the teacher app
  → PATCH /api/attendance/:id
  → AttendanceService saves the record
  → Emits AbsenceEvent internally
  → AbsenceEventHandler receives the event
  → Creates a Notification record in DB
  → Calls PushService.enqueuePushJobs()
  → Creates push_notifications rows (one per device token for that parent)
```

**Files:**
- `tutoring-backend/src/modules/push/push.service.ts` → `enqueuePushJobs()`
- `tutoring-backend/src/modules/push/entities/push-notification.entity.ts`

---

### Step 3 — PushWorker delivers the notification

The `PushWorker` is a background polling loop that runs every **5 seconds**:

```
PushWorker polls push_notifications table
  → Claims batch of CREATED/FAILED jobs (SELECT FOR UPDATE SKIP LOCKED)
  → Calls PushService.sendPushNotification(expoToken, { title, body, data })
  → POST https://exp.host/--/api/v2/push/send
  → Expo receives request and calls FCM on your behalf
  → FCM delivers notification to device
  → Expo responds { status: 'ok' } or { status: 'error', ... }
  → PushWorker marks job as ACKED (success) or FAILED (retry)
```

**File:** `tutoring-backend/src/modules/push/push.worker.ts`

---

### Step 4 — Device receives notification

```
FCM delivers notification to Android
  → If app is in FOREGROUND: addNotificationReceivedListener fires
  → If app is in BACKGROUND or KILLED: system shows the notification banner
  → Parent taps the banner
  → addNotificationResponseReceivedListener fires
  → handleNotificationResponse() reads deepLink from notification data
  → router.push(deepLink) navigates to attendance screen
```

**File:** `mobile-app/src/modules/parent/services/push-notification-handler.ts` → `usePushNotificationHandler()`

---

## 4. Circuit Breaker

The `PushWorker` has a circuit breaker to protect against cascading failures:

- If **>50% of pushes fail** in a 5-minute window → circuit breaker **opens**
- When open → worker **pauses** for 60 seconds
- After 60 seconds → **auto-resets** and tries again

This prevents hammering Expo's API when something is broken.

**Database table:** `circuit_breaker_state`

To manually reset it when debugging:
```sql
UPDATE circuit_breaker_state
SET is_open = false, failure_count = 0, total_count = 0
WHERE id = 'expo_push_provider';
```

---

## 5. Job Status Lifecycle

```
CREATED → SENT → ACKED         (happy path)
CREATED → SENT → FAILED → CREATED (retry with backoff: 30s, 60s, 120s)
CREATED → SENT → FAILED (4th attempt) → stays FAILED in DLQ
CREATED → SENT → EXPIRED       (device uninstalled app, token deleted)
```

---

## 6. Initial Setup — What You Need To Do Once

These are the one-time setup steps required before push notifications work. They are already done in this project.

### 6.1 Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project (or use existing)
3. Add an Android app with your package name (e.g. `com.privatedu.mobile.preview`)
4. Download `google-services.json`
5. Place it at `mobile-app/android/app/google-services.json`

### 6.2 Android Gradle Setup

`android/build.gradle` (root) must have:
```groovy
classpath('com.google.gms:google-services:4.4.4')
```

`android/app/build.gradle` must have at the top:
```groovy
apply plugin: "com.google.gms.google-services"
```

This enables FCM in the Android build so the device can receive messages.

### 6.3 Expo FCM V1 Credentials (the most important step)

Expo's push service needs credentials to send via FCM on your behalf.

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts
2. Click **"Generate new private key"** → download the JSON file
3. Go to [expo.dev](https://expo.dev) → your project → **Credentials** → **Android**
4. Click on your app's package identifier (e.g. `com.privatedu.mobile.preview`)
5. Find **"FCM V1 Service Account Key"** → upload the JSON file

Without this step, every push attempt fails with:
```
InvalidCredentials: Unable to retrieve the FCM server key for the recipient's app
```

### 6.4 Enable FCM API on Google Cloud

1. Go to: `https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=YOUR_PROJECT_ID`
2. Click **Enable** if it isn't already

### 6.5 Backend Environment Variable

The backend needs an Expo access token to authenticate with Expo's push API:

```
EXPO_ACCESS_TOKEN=your_token_here
```

Get it from: [expo.dev](https://expo.dev) → Account Settings → Access Tokens

Without this, Expo rate-limits or rejects requests.

---

## 7. Testing Push Notifications on an Emulator

By default, push notifications only work on **physical devices** because emulators don't have Google Play Services. The code has a dev-mode bypass for this:

```typescript
// mobile-app/src/modules/parent/services/push-notification-handler.ts
if (!Device.isDevice && !__DEV__) {
  return null; // Block on production
}
// In dev mode, emulators are allowed through
```

**Requirements for emulator testing:**
- Use a **Google Play** emulator image (e.g. `Pixel_7_API_35` with `google_apis_playstore` tag)
- Regular `google_apis` images do NOT support FCM
- A `google-services.json` must be placed in `android/app/` and the app must be rebuilt

**To test manually via curl:**
```bash
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_EXPO_ACCESS_TOKEN" \
     -X POST "https://exp.host/--/api/v2/push/send" \
     -d '{"to": "ExponentPushToken[YOUR_TOKEN]", "title": "Test", "body": "Test push"}'
```
A response of `{"data":{"status":"ok"}}` confirms end-to-end delivery works.

---

## 8. Deep Link Navigation

When a parent taps the notification, the app navigates to the attendance screen. The notification payload contains a `deepLink` field:

```json
{
  "deepLink": "/parent/students/STUDENT_UUID/attendance"
}
```

The deep link is validated before navigation to prevent malicious payloads:

```typescript
// mobile-app/src/modules/parent/services/notification-deep-link.ts
const SAFE_PATTERN = /^\/(parent)\/students\/[0-9a-f-]{36}\/attendance$/i;
```

Only links matching this exact pattern are allowed through.

---

## 9. What Was Broken and What Fixed It

This section documents every bug found during initial setup so future developers understand what to watch for.

### Bug 1 — Attendance screen showed blank after tapping notification

**Symptom:** Tapping a notification opened the attendance screen but showed "No attendance records available."

**Root cause:** The backend query in `getStudentAttendanceTimeline` filtered only `WHERE session.state = 'CLOSED'`. But absence notifications fire when the teacher marks a student absent during an **open** session — so the session was still open when the parent tapped the notification.

**Fix:** Changed the WHERE clause to include open sessions that have explicit (teacher-marked) attendance records:
```sql
WHERE (session.state = 'CLOSED'
   OR (attendance_record.id IS NOT NULL AND attendance_record.is_system_generated = false))
```

**File:** `tutoring-backend/src/modules/parents/parents.service.ts`

---

### Bug 2 — Push token never registered on emulator

**Symptom:** Log said `"Push notifications only work on physical devices"`. No token was registered.

**Root cause:** `Device.isDevice` is `false` on emulators, blocking token registration with no dev bypass.

**Fix:** Added `__DEV__` exception so emulators are allowed in development:
```typescript
if (!Device.isDevice && !__DEV__) {
  return null;
}
```

**File:** `mobile-app/src/modules/parent/services/push-notification-handler.ts`

---

### Bug 3 — Red error screen: "Default FirebaseApp is not initialized"

**Symptom:** App crashed with a red overlay immediately after launch on the emulator.

**Root cause:** `google-services.json` was missing from `android/app/`. Without it, the Firebase SDK cannot initialize, and `getExpoPushTokenAsync()` throws.

**Fix:**
1. Copied `google-services.json` to `android/app/google-services.json`
2. Added Google Services Gradle plugin to both `build.gradle` files
3. Wrapped `getExpoPushTokenAsync` in a try-catch so emulators without FCM don't crash the app

---

### Bug 4 — All pushes failing with `{"status":"error"}` (no details)

**Symptom:** `push_sent_total{status="FAILED"}` kept incrementing. Circuit breaker kept opening. `provider_response` in DB was just `{"status":"error"}` with no explanation.

**Root cause:** Two problems combined:
1. Expo was returning errors in `{"errors": [...]}` format (top-level API errors) but the code only parsed `response.data.data[0]`
2. For single-token sends, Expo returns `data` as an **object**, not an **array** — so `data[0]` was always `undefined`

Both caused the code to silently swallow the real error and store a useless `{"status":"error"}`.

**Fix in** `tutoring-backend/src/modules/push/push.service.ts`:
```typescript
// Handle top-level errors (auth failures, etc.)
if (response.data.errors?.length) {
  const firstError = response.data.errors[0];
  return { status: 'error', message: firstError.message, details: { error: firstError.code } };
}

// Handle both object and array response shapes
const rawData = response.data.data;
const result = Array.isArray(rawData) ? rawData[0] : rawData ?? undefined;
```

---

### Bug 5 — `InvalidCredentials` from Expo Push Service

**Symptom:** After fixing the parsing bug, the real error appeared: `"Unable to retrieve the FCM server key for the recipient's app."`

**Root cause:** The FCM V1 Service Account Key was never uploaded to Expo's credential store. Expo's push service had no way to authenticate with FCM.

**Fix:**
1. Downloaded the Firebase Admin SDK service account JSON from Firebase Console
2. Enabled **Firebase Cloud Messaging API** on Google Cloud Console
3. Uploaded the service account JSON to **expo.dev → project → Credentials → Android → `com.privatedu.mobile.preview` → FCM V1 Service Account Key**

Note: Uploading via `eas credentials` CLI alone was not sufficient — the credential must be assigned to the specific application identifier on the Expo website.

### Bug 6 — "Network error. Please check your connection." on emulator

**Symptom:** Login screen showed a network error even though the Railway API is a public URL. The emulator had internet but API calls all failed.

**Root cause:** Expo dev tools automatically set a global HTTP proxy (`192.168.1.6:9090`) on the emulator to intercept traffic. This proxy was interfering with calls to the Railway API.

**Diagnosis:**
```bash
adb shell settings get global http_proxy
# Returns: 192.168.1.6:9090  ← this is the problem
```

**Fix:**
```bash
# Clear the proxy
adb shell settings delete global http_proxy
adb shell settings put global http_proxy :0

# Forward the proxy port so dev client still works
adb reverse tcp:9090 tcp:9090
```

---

### Bug 7 — Dev client showed "Error loading app: Failed to connect" / blank Development Servers screen

**Symptom:** After launching the emulator, the dev client could not connect to Metro bundler. Either showed a blank "Development Servers" screen or "Failed to connect to /192.168.1.6:9090".

**Root cause:** `localhost` on the emulator refers to the emulator itself, not the host Mac. Metro runs on the Mac at port 8081 — the emulator can't reach it without port forwarding.

**Fix:**
```bash
# Forward Metro port from emulator to host Mac
adb reverse tcp:8081 tcp:8081

# Forward proxy port too (so Expo dev client connections work)
adb reverse tcp:9090 tcp:9090
```

Run these every time you launch a new emulator session before opening the app.

---

## 10. iOS Push Notifications — Setup and Expected Issues

iOS uses **APNs (Apple Push Notification service)** instead of FCM. The delivery chain looks like this:

```
Your Backend → Expo Push Service → APNs (Apple) → iPhone
```

Everything in the app code stays the same — `getExpoPushTokenAsync`, `addNotificationReceivedListener`, deep link navigation — all works identically on iOS. The only difference is the credential setup.

---

### 10.1 What You Need

| Requirement | Where to get it |
|---|---|
| Apple Developer account | developer.apple.com ($99/year) |
| APNs Auth Key (.p8 file) | Apple Developer → Certificates, IDs & Profiles → Keys |
| App Bundle ID registered | Apple Developer → Identifiers |
| Push Notifications capability enabled | Apple Developer → Identifiers → your app → Push Notifications ✓ |

---

### 10.2 Important — APNs Key is Gitignored

The `.gitignore` contains `*.p8` and `*.p12` — meaning APNs private key files are **never committed to git**. This is correct security practice.

New developers must either:
- Get the `.p8` file from a secure vault (team password manager, AWS Secrets Manager, etc.)
- Or skip needing the file locally — credentials are already uploaded to Expo's servers via `eas credentials`, so EAS builds work without the file on your machine

Similarly `google-services.json` lives at the **project root** (tracked by git — it's safe to commit, contains no secrets). The `/android` and `/ios` directories are gitignored entirely because Expo regenerates them on every `npx expo prebuild`. **Never edit files inside `/android` or `/ios` directly** — use config plugins in `app.config.ts` instead.

---

### 10.4 How to Set Up APNs Credentials on Expo

1. Go to [Apple Developer Portal](https://developer.apple.com) → **Keys** → create a new key
2. Check **"Apple Push Notifications service (APNs)"**
3. Download the `.p8` file — **you can only download it once**
4. Note your **Key ID** and **Team ID** (top right of developer portal)
5. Go to [expo.dev](https://expo.dev) → project → **Credentials** → **iOS**
6. Click your app's bundle identifier
7. Upload the `.p8` file with your Key ID and Team ID

Or via CLI:
```bash
eas credentials --platform ios
# Select: Push Notifications → Add APNs Key
```

---

### 10.3 Expected Issues on iOS

**Issue 1 — Simulator does not support push notifications at all**

Unlike Android emulators (which can receive push with Google Play image), the iOS Simulator has zero push support. There is no workaround. You must use a **physical iPhone** to test push notifications on iOS.

```
// This will always return null on iOS Simulator
const token = await Notifications.getExpoPushTokenAsync({ projectId });
```

The code already handles this gracefully — `registerPushToken()` returns `null` silently on unsupported devices.

---

**Issue 2 — Permission prompt only appears once**

iOS shows the "Allow Notifications?" dialog **only once, ever**. If the user taps "Don't Allow", the only way to re-enable is:

```
Settings → Privacy & Security → Notifications → PrivatEdu → Allow
```

The app handles this by showing a custom prompt directing users to settings. If you tap "Allow" yourself during testing and then want to reset it, go to:
```
Settings → General → Transfer or Reset iPhone → Reset → Reset Location & Privacy
```

---

**Issue 3 — APNs requires a valid provisioning profile with push entitlement**

When building with EAS, the provisioning profile must include the **Push Notifications** entitlement. If you see this error during build:

```
Error: No push notification entitlement found in provisioning profile
```

Fix: In Apple Developer Portal → Identifiers → your app → enable **Push Notifications** → regenerate the provisioning profile → run `eas credentials` to sync.

---

**Issue 4 — Development vs Production APNs environments**

Apple has two separate APNs environments:
- **Development (sandbox):** Used by debug/development builds
- **Production:** Used by TestFlight and App Store builds

Expo automatically selects the right environment based on your build type. But if you test with a production build installed via TestFlight and use a sandbox APNs key, notifications will silently fail.

Always use:
- `eas build --profile development` → development APNs
- `eas build --profile production` → production APNs

---

**Issue 5 — Background notification delivery is throttled by iOS**

iOS aggressively throttles background notifications. If the app sends too many notifications in a short time, iOS may stop delivering them silently. There is no fix — it is iOS system behaviour. Keep notification frequency reasonable (which our absence-based system already does).

---

### 10.4 iOS vs Android Side-by-Side

| | Android | iOS |
|---|---|---|
| Push infrastructure | FCM (Google) | APNs (Apple) |
| Credentials needed | FCM V1 Service Account JSON | APNs Auth Key (.p8) |
| Where to upload | expo.dev → Android → package identifier | expo.dev → iOS → bundle identifier |
| Emulator/Simulator support | Yes (Google Play image only) | No — physical device only |
| Permission prompt | Shows every install (can be re-asked) | Shows once, forever |
| Rebuild needed after credential change | No | No |

---

## 11. Alternatives to Expo Push Service

Expo's managed push service is the simplest option but not the only one. Here is how other teams handle push notifications and the trade-offs of each approach.

---

### Option 1 — Direct FCM + APNs (No Expo Push Service)

Instead of routing through `exp.host`, your backend calls FCM and APNs directly.

```
Your Backend → FCM HTTP v1 API → Android device
Your Backend → APNs HTTP/2 API → iPhone
```

**How it works:**
```typescript
// Call FCM v1 directly using a Google access token
const accessToken = await getGoogleAccessToken(serviceAccountJson);
await axios.post(
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
  { message: { token: fcmToken, notification: { title, body } } },
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

For this approach you need **FCM tokens** (`device.getFCMToken()` or `getDevicePushTokenAsync()`), not Expo tokens. FCM tokens look like long random strings, not `ExponentPushToken[...]`.

**When teams use this:**
- When they don't want a third-party intermediary between backend and device
- When Expo's managed service has reliability concerns for their SLA
- When they need more control over payload structure

**Trade-offs:**
- You handle retries, batching, error handling yourself
- Must maintain two separate delivery paths (FCM for Android, APNs for iOS)
- More code, more infrastructure

---

### Option 2 — Firebase Admin SDK (Google's official backend library)

Similar to Option 1 but using the official Firebase Admin SDK which handles token management, batching, and the FCM HTTP v1 API call for you.

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.cert(serviceAccountJson) });

await admin.messaging().send({
  token: deviceFcmToken,
  notification: { title: 'Student Absent', body: 'Ahmed was absent today' },
  android: { priority: 'high' },
  apns: { payload: { aps: { sound: 'default' } } },
});
```

**When teams use this:**
- When already using Firebase for database/auth and want everything in one ecosystem
- When targeting both Android and iOS with one SDK call (Firebase Admin handles both FCM and APNs routing)

**Trade-offs:**
- Ties your backend to Firebase/Google ecosystem
- Firebase Admin SDK is available for Node.js, Python, Java, Go — but not all languages

---

### Option 3 — AWS SNS (Amazon Simple Notification Service)

AWS SNS is Amazon's push notification broker. It creates a platform endpoint per device and routes to FCM or APNs.

```
Your Backend → AWS SNS → FCM → Android
                       → APNs → iOS
```

**When teams use this:**
- Already on AWS infrastructure
- Want built-in dead-letter queues, fan-out to multiple subscribers, and CloudWatch metrics
- Enterprise scale with millions of notifications

**Trade-offs:**
- AWS vendor lock-in
- More complex setup than Expo Push Service
- Cost scales with volume

---

### Option 4 — OneSignal / Braze / Courier (Third-Party Services)

These are fully managed notification platforms. You send an event to their API and they handle everything — delivery, scheduling, A/B testing, analytics.

```
Your Backend → OneSignal API → FCM/APNs → Device
```

**When teams use this:**
- Marketing teams need segmentation, scheduling, and analytics
- Product wants rich notifications with images, action buttons
- Don't want to manage any push infrastructure at all

**Trade-offs:**
- Subscription cost ($50–$500+/month at scale)
- User data goes through a third party
- Less control over delivery timing and retry logic

---

### Why We Use Expo Push Service

| Factor | Reason |
|---|---|
| Single API for Android + iOS | One `POST` to `exp.host` handles both platforms |
| No credential rotation in backend | FCM/APNs credentials live in Expo, not in our Railway env |
| Free tier is sufficient | Up to 1,000 recipients/month free |
| Same token format everywhere | `ExponentPushToken[...]` works for both Android and iOS |
| Built-in Expo SDK integration | `getExpoPushTokenAsync` works out of the box |

The only requirement is that the app uses `expo-notifications` and builds with Expo (EAS). Since this project already does, Expo Push Service is the right choice.

---



| File | Purpose |
|---|---|
| `mobile-app/src/modules/parent/services/push-notification-handler.ts` | Token registration, notification listeners, deep link navigation |
| `mobile-app/src/modules/parent/services/notification-deep-link.ts` | Deep link validation |
| `mobile-app/android/app/google-services.json` | Firebase config for Android build |
| `tutoring-backend/src/modules/push/push.service.ts` | Token storage, Expo API calls |
| `tutoring-backend/src/modules/push/push.worker.ts` | Background polling, job processing, circuit breaker |
| `tutoring-backend/src/modules/push/entities/push-notification.entity.ts` | Push job DB schema |
| `tutoring-backend/src/modules/push/entities/device-token.entity.ts` | Device token DB schema |
| `tutoring-backend/src/modules/parents/parents.service.ts` | Attendance timeline/statistics queries |
