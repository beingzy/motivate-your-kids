# iOS Native App Build Guide

> Strategy document for shipping "Motivate Your Kids" as an iOS app on the App Store.

---

## Decision: Which Approach?

### Options Evaluated

| Approach | Effort | Native Feel | Code Reuse | Time to App Store |
|----------|--------|-------------|------------|-------------------|
| **Capacitor (recommended first)** | Low | Medium (WebView + native plugins) | ~95% of existing code | 2–4 weeks |
| **React Native / Expo** | Medium | High | ~40% (logic/types, rewrite UI) | 8–12 weeks |
| **SwiftUI (full native)** | High | Highest | ~0% (full rewrite) | 16–24 weeks |

### Recommendation: Two-Phase Strategy

1. **Phase 1 — Capacitor** (ship fast): Wrap the existing Next.js PWA in a native iOS shell. Get on the App Store quickly. Adds native capabilities (push notifications, haptics, camera, biometrics) via Capacitor plugins.

2. **Phase 2 — React Native/Expo** (long-term, optional): If the WebView performance or UX limitations become a problem, migrate to React Native. Reuse TypeScript types, business logic, and state management. Rewrite UI with native components.

---

## Phase 1: Capacitor (Next.js → iOS)

### Prerequisites

- [ ] macOS with Xcode 15+ installed
- [ ] Apple Developer Account ($99/year) — https://developer.apple.com/programs/
- [ ] Node.js 18+ and npm
- [ ] CocoaPods (`sudo gem install cocoapods`)
- [ ] Xcode Command Line Tools (`xcode-select --install`)

---

### Step 1: Export Next.js as Static Site

Capacitor serves a local static build. Next.js must be configured for static export.

```bash
# next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable image optimization (not available in static export)
  images: { unoptimized: true },
};
export default nextConfig;
```

**Known issues to resolve:**
- `middleware.ts` — not supported in static export. Auth redirects must move to client-side `useEffect` guards.
- `app/api/*` routes — not supported. API calls must go directly to Supabase from the client.
- Dynamic routes (`/kids/[id]`) — must use `generateStaticParams()` or switch to hash-based routing.
- `app/manifest.ts` — must become a static `public/manifest.json`.

```bash
npm run build  # Verify static export works → outputs to `out/`
```

### Step 2: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Motivate Your Kids" "ai.motivationlabs.kids" --web-dir out
```

This creates `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.motivationlabs.kids',
  appName: 'Motivate Your Kids',
  webDir: 'out',
  server: {
    // During dev, point to Next.js dev server for hot reload
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Motivate Your Kids',
  },
};

export default config;
```

### Step 3: Add iOS Platform

```bash
npx cap add ios
```

This creates the `ios/` directory with an Xcode project.

### Step 4: Add Native Plugins

```bash
# Core plugins
npm install @capacitor/app           # App lifecycle events
npm install @capacitor/haptics       # Haptic feedback (star animations, badge unlocks)
npm install @capacitor/keyboard      # Keyboard handling
npm install @capacitor/status-bar    # Status bar styling
npm install @capacitor/splash-screen # Launch screen

# Feature plugins
npm install @capacitor/camera        # Photo capture for action memos
npm install @capacitor/push-notifications  # Push notifications (v2)
npm install @capacitor/local-notifications # Local reminders
npm install @capacitor/share         # Native share sheet
npm install @capacitor/preferences   # Native key-value storage (replaces localStorage)
```

### Step 5: Adapt Code for Native

**5a. Platform detection utility:**

```typescript
// lib/platform.ts
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';
```

**5b. Replace localStorage with Capacitor Preferences:**

```typescript
// lib/native-store.ts
import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

export async function getItem(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}
```

**5c. Replace browser camera with Capacitor Camera:**

```typescript
// lib/native-camera.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';

export async function takePhoto(): Promise<string | null> {
  if (isNative) {
    const image = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // camera or gallery
      width: 800,
    });
    return image.dataUrl ?? null;
  }
  // Fallback to existing web file picker
  return null;
}
```

**5d. Add haptic feedback to star animations:**

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from './platform';

export async function hapticSuccess() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Medium });
}
```

**5e. Safe area handling:**

```css
/* globals.css — add safe area insets for iPhone notch/dynamic island */
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
}

/* Apply to bottom nav bars */
.bottom-nav {
  padding-bottom: calc(0.5rem + var(--safe-area-bottom));
}
```

### Step 6: Configure Xcode Project

```bash
npm run build && npx cap sync ios
npx cap open ios   # Opens Xcode
```

In Xcode:
1. **Signing & Capabilities** → Select your Apple Developer team
2. **General → Display Name** → "Motivate Your Kids"
3. **General → Bundle Identifier** → `ai.motivationlabs.kids`
4. **General → Version** → `1.0.0`
5. **General → Deployment Target** → iOS 16.0 (minimum)
6. **App Icons** → Add 1024×1024 icon (use existing app icon)
7. **Launch Screen** → Configure splash screen (warm cream background + logo)
8. **Info.plist** → Add privacy descriptions:
   - `NSCameraUsageDescription` → "Take photos for action memos"
   - `NSMicrophoneUsageDescription` → "Record voice memos for actions"
   - `NSPhotoLibraryUsageDescription` → "Choose photos for action memos"

### Step 7: Build & Test

```bash
# Sync web build to native project
npm run build && npx cap sync ios

# Run on simulator
npx cap run ios --target "iPhone 15 Pro"

# Run on physical device (device must be connected via USB)
npx cap run ios --target <device-id>
```

**Testing checklist:**
- [ ] App launches with splash screen → role selection
- [ ] Setup wizard completes successfully
- [ ] Parent dashboard renders correctly
- [ ] Kid dashboard with star animations works
- [ ] Bottom tab navigation works (no browser chrome)
- [ ] Camera photo capture works for action memos
- [ ] Voice recording works for action memos
- [ ] Data persists between app launches
- [ ] Safe areas render correctly (notch, home indicator)
- [ ] Keyboard doesn't obscure inputs
- [ ] Landscape orientation handled (or locked to portrait)
- [ ] Back gesture / swipe navigation works

### Step 8: App Store Submission

**8a. Create App Store Connect listing:**
1. Go to https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Fill in: name, primary language, bundle ID, SKU
4. Set category: **Education** (primary), **Lifestyle** (secondary)
5. Age rating: **4+** (no objectionable content)

**8b. Prepare marketing assets:**
- App icon: 1024×1024 PNG (no alpha, no rounded corners — Apple adds them)
- Screenshots: iPhone 6.7" (1290×2796), iPhone 6.5" (1242×2688), iPad 12.9"
- App description (4000 chars max)
- Keywords (100 chars max): `kids,rewards,chores,motivation,family,parenting,behavior,stars,badges`
- Privacy policy URL (required)
- Support URL

**8c. Build and upload:**

```bash
# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Window → Organizer → Distribute App → App Store Connect
# 4. Upload

# Or via CLI:
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ios/exportOptions.plist
```

**8d. Submit for review:**
1. In App Store Connect, select the uploaded build
2. Complete all metadata sections
3. Submit for review (typically 24–48 hours)

---

## Phase 2: React Native / Expo (Optional, Long-term)

Only pursue this if Phase 1 reveals WebView performance or UX limitations that matter for the target audience (kids 4–8).

### When to Consider Phase 2

- WebView animations feel sluggish (star counters, confetti, badge unlocks)
- Camera/mic integration has reliability issues
- Push notification handling is limited
- App Store reviewers reject for "not providing native experience"
- User reviews cite "feels like a website"

### Architecture if Migrating

```
packages/
  shared/           # Reuse from Phase 1
    types/          # TypeScript types (Kid, Action, Reward, Transaction, etc.)
    logic/          # Pure business logic (point calculations, validation)
    i18n/           # Locale dictionaries (en, zh-CN)
    seeds/          # Default template data
  mobile/           # New React Native app
    src/
      screens/      # React Native screens (replacing Next.js pages)
      components/   # Native UI components (replacing web components)
      navigation/   # React Navigation (replacing Next.js router)
      hooks/        # Custom hooks (adapted from web)
      lib/          # Native utilities (camera, haptics, storage)
```

### Key Differences from Web

| Concern | Web (Current) | React Native |
|---------|--------------|--------------|
| Routing | Next.js App Router | React Navigation |
| Styling | Tailwind CSS | StyleSheet / NativeWind |
| Storage | localStorage | AsyncStorage / MMKV |
| Animations | CSS transitions | Reanimated 3 |
| Camera | File input / MediaDevices | expo-camera |
| Audio | Web Audio API / MediaRecorder | expo-av |
| Icons | Lucide React | Lucide React Native |
| UI primitives | HTML + shadcn/ui | React Native + custom |

---

## Dev Workflow Commands (Phase 1)

```bash
# Daily development cycle
npm run dev                      # Web dev server (hot reload)
npm run build && npx cap sync    # Sync to native
npx cap run ios                  # Run on simulator

# Live reload on device (during development)
# In capacitor.config.ts, uncomment server.url pointing to local IP
# Then: npx cap run ios

# Before committing
npm run lint && npm test && npm run build
npx cap sync ios
```

---

## Estimated Timeline (Phase 1)

| Week | Milestone |
|------|-----------|
| 1 | Static export working, Capacitor installed, app runs on simulator |
| 2 | Native plugins integrated (camera, haptics, storage), safe areas fixed |
| 3 | QA on devices, App Store Connect setup, screenshots + metadata |
| 4 | Submit to App Store review, address any review feedback |

---

## App Store Review Gotchas

1. **WebView apps** — Apple may reject apps that are "just a website." Mitigate by using native plugins (haptics, camera, local notifications) to provide value beyond the web version.
2. **Privacy** — Must declare all data collected in App Privacy section. This app collects: photos (action memos), audio (voice memos), usage data.
3. **Kids category** — If listed under "Kids" category, must comply with COPPA. Alternatively, list under "Education" or "Lifestyle" and note parental use.
4. **In-app purchases** — Not applicable for v1 (free app, no IAP).
5. **Login** — Apple requires "Sign in with Apple" if you offer any third-party social login. Since we use email+password, this doesn't apply unless Google OAuth is enabled.
