# BrightMinds

Cross-platform (iOS & Android) academic learning app built with **Expo SDK 58 / React Native 0.88**.
Users watch short research "casts", read articles, track their learning with quizzes, browse virtual labs
by department and explore research papers through the [OpenAlex](https://openalex.org) API.

- iOS bundle id: `com.brightmindsresearch` (App Store)
- Android package: `com.ccarnus3.brightminds` (Google Play)
- Backend: `https://api.greenlights.us` (configured in `src/shared/config/APIConfig.js`)

---

## Testing the app locally

> ⚠️ The app always talks to the **production** backend. Anything you create while testing (accounts,
> casts, articles, quiz answers) is real data. Prefer a dedicated test account, or use **guest mode**
> ("Continue as guest" on the auth screen) to browse without writing data.

### 1. Prerequisites

| Tool | Needed for | Notes |
|------|-----------|-------|
| [Node.js](https://nodejs.org) 22.13+ or 24.3+ (LTS) + npm | everything | `node -v` — odd versions (23, 25) are not supported |
| Git | everything | |
| [Android Studio](https://developer.android.com/studio) | Android | Install an Android SDK + an emulator (AVD). Use the bundled JDK. Set `ANDROID_HOME`. |
| Xcode 26.4+ (Xcode 27 recommended) & CocoaPods (macOS only) | iOS | `xcode-select --install`, `sudo gem install cocoapods`. Minimum iOS version is 16.4. |
| [EAS CLI](https://docs.expo.dev/eas/) (optional) | cloud builds | `npm install -g eas-cli`, then `eas login` |

### 2. Install dependencies

```bash
git clone https://github.com/ccarnus/BrightMinds_beta.git
cd BrightMinds_beta
npm install
```

Check the project health (dependency versions compatible with the Expo SDK, config issues):

```bash
npx expo install --check
npx expo-doctor
```

### 3. Run the app

The app uses native modules, so it runs in a **development build** (a debug version of the app that
loads JavaScript from your computer with hot reload). Pick one option:

#### Option A — build and run locally (Android Studio / Xcode installed)

```bash
npm run android     # = npx expo run:android  (emulator running or device plugged in via USB)
npm run ios         # = npx expo run:ios      (macOS only, opens the iOS Simulator)
```

The first run generates the native `android/` / `ios/` folders (they are git-ignored, regenerate them any
time with `npx expo prebuild --clean`), compiles and installs the app, and starts the Metro bundler.
After that you only need to start Metro:

```bash
npm start           # = npx expo start --dev-client
```

then press `a` (Android) or `i` (iOS) in the terminal, or open the installed BrightMinds dev app.

#### Option B — use a cloud development build (no Android Studio / Xcode needed)

```bash
eas build --profile development --platform android            # APK for an emulator or a phone
eas build --profile development-simulator --platform ios      # .app for the iOS Simulator (macOS)
eas build --profile development --platform ios                # physical iPhone (register it first: eas device:create)
```

Install the build from the link EAS prints (or `eas build:run -p android|ios --latest`), then run `npm start`
and open the app. You only need to rebuild when native dependencies or `app.json` change.

#### Option C — Expo Go (quick look only)

`npx expo start --go` and scan the QR code with [Expo Go](https://expo.dev/go). This only works if your Expo
Go app supports **SDK 58** (the store version always targets the latest SDK). Prefer options A or B.

> **Upgraded from an older SDK?** Native folders and dev builds made for a previous SDK won't work. Run
> `npx expo prebuild --clean` (or delete `android/` and `ios/`) before Option A, and create a new
> development build for Option B.

#### Testing on a physical device

- The phone and your computer must be on the same network. If they aren't (corporate Wi-Fi, VPN…), use
  `npx expo start --dev-client --tunnel`.
- Android over USB: `adb reverse tcp:8081 tcp:8081` lets the device reach Metro on `localhost`.
- Shake the device (or `Ctrl+M` on Android emulator / `Cmd+D` on iOS Simulator) to open the dev menu
  (reload, performance monitor, element inspector).

### 4. Run the unit tests

```bash
npm test                                   # all tests (Jest + jest-expo preset)
npx jest src/shared/utils                  # a folder
npx jest src/shared/api/__tests__/client.test.js   # a single file
```

Tests live next to the code in `__tests__/` folders.

### 5. Test a production-like build locally

Debug builds are slower and keep developer tooling. Before a release, check performance and behaviour on a
release build (console logs are stripped, JS is minified):

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

Or build an installable preview with EAS: `eas build --profile preview --platform android` (APK) / `ios`.

To check that the JavaScript bundle compiles without running the app:

```bash
npx expo export --platform android
npx expo export --platform ios
```

### Suggested manual test checklist

- First launch: onboarding → "Continue as guest" and sign up / log in / forgot password. A first login goes through
  field preferences → learning path picker (try Deep Learner: it asks for a focus field; "Decide later" skips) →
  welcome screen.
- Cast tab: feed loads, search (topics, papers, casts), play a cast to the end (it is marked as watched at 85%),
  captions toggle, share, Discover.
- Track tab: rewards card (level, XP bar, streak, badges — tap one for details), progress, start a quiz
  (Ready → Evaluation → Finish): answer right and wrong (animations, haptics, combo toast at 3 in a row), leave with
  the ✕ (answers given so far still count), finish and check XP / level-up / new badges, then the Track tab updates.
  With no pending question, Ready shows "All caught up!" and links to the Cast tab.
- Lab tab: departments → virtual lab → topic → casts / works (OpenAlex papers).
- Library tab (Professor / Researcher / PhD Student roles only): publish a cast (camera & gallery permissions)
  and an article, then delete them.
- Learning path: on Track (or Profile), the path card shows the milestone trail and the next goals; tap it for the
  path screen (milestones timeline, stats, top fields, previous paths), then "Change learning path": switching keeps
  every past activity, and milestones the new path already covers unlock at once (confetti). Watching casts, reading
  articles, quizzes and opening research papers (Researcher) move the goals forward.
- Profile: edit profile picture, learning path card, log out (back gesture must not return into the app).
- Airplane mode / no data (see below): screens must show the shared error screen instead of loading forever.

### Testing connection loss and error states

`expo-network` and `expo-haptics` are native modules: rebuild the dev build once after pulling these changes
(`npm run android` / `npm run ios`, or a new EAS development build).

- **Offline on launch**: enable airplane mode, open each tab → "You're offline" screen with the illustration; the
  "No internet connection" pill appears at the top. Disable airplane mode → the pill turns into "Back online" and
  the screen reloads by itself.
- **Connection lost while browsing**: load a tab, go offline, pull to refresh → content stays and a snackbar
  explains the refresh failed.
- **Connection lost during a cast**: start a cast, go offline until playback stops → "You're offline" overlay;
  reconnect → playback resumes where it stopped.
- **Slow network** (Android emulator: *Extended controls → Cellular → Network type: GSM/EDGE*; iOS: Network Link
  Conditioner "Very Bad Network"): after a few seconds the loader says it is taking longer than usual; after 15 s
  the "This is taking too long" screen appears with "Try again".
- **No data**: a new account shows the empty states (no publications, no learnings, no questions) instead of blank
  screens.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Stale bundle / weird cache errors | `npx expo start --dev-client --clear` |
| Port 8081 already in use | Stop the other Metro process or `npx expo start --port 8082` |
| Native module not found / crash on start after changing dependencies | Rebuild the dev build (`npx expo run:android` / `run:ios`, or a new EAS development build) |
| iOS pods out of sync | `npx expo prebuild --clean -p ios` |

---

## Building & releasing

Versions are managed remotely by EAS (`appVersionSource: remote`, `autoIncrement: true`); bump the user-facing
`version` in `app.json` for each store release.

```bash
eas build --platform android --profile production   # APK (internal testing / sideload)
eas build --platform android --profile release      # AAB for Google Play
eas build --platform ios --profile production --auto-submit   # build + submit to App Store Connect / TestFlight
eas submit --platform android                       # upload the latest AAB to Google Play
```

## Project structure

See [CLAUDE.md](./CLAUDE.md) for the architecture, conventions and coding guidelines.
