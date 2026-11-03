# BrightMinds

Cross-platform (iOS & Android) academic learning app built with **Expo SDK 54 / React Native 0.81**.
Users watch short research "casts", read articles, track their learning with quizzes, browse virtual labs
by department and explore research papers through the [OpenAlex](https://openalex.org) API.

- iOS bundle id: `com.brightmindsresearch` (App Store)
- Android package: `com.ccarnus3.brightminds` (Google Play)
- Backend: `https://api.brightmindsresearch.com` (configured in `src/shared/config/APIConfig.js`)

---

## Testing the app locally

> ⚠️ The app always talks to the **production** backend. Anything you create while testing (accounts,
> casts, articles, quiz answers) is real data. Prefer a dedicated test account, or use **guest mode**
> ("Continue as guest" on the auth screen) to browse without writing data.

### 1. Prerequisites

| Tool | Needed for | Notes |
|------|-----------|-------|
| [Node.js](https://nodejs.org) 20 LTS or newer + npm | everything | `node -v` |
| Git | everything | |
| [Android Studio](https://developer.android.com/studio) | Android | Install an Android SDK + an emulator (AVD). JDK 17 is bundled. Set `ANDROID_HOME`. |
| Xcode 16+ & CocoaPods (macOS only) | iOS | `xcode-select --install`, `sudo gem install cocoapods` |
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
Go app supports **SDK 54** (the store version always targets the latest SDK). Prefer options A or B.

#### Testing on a physical device

- The phone and your computer must be on the same network. If they aren't (corporate Wi-Fi, VPN?), use
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

- First launch: onboarding → "Continue as guest" and sign up / log in / forgot password.
- Cast tab: feed loads, search (topics, papers, casts), play a cast to the end (it is marked as watched at 85%),
  captions toggle, share, Discover.
- Track tab: progress, start a quiz (Ready → Evaluation → Finish), back button during a quiz returns to Track.
- Lab tab: departments → virtual lab → topic → casts / works (OpenAlex papers).
- Library tab (Professor / Researcher / PhD Student roles only): publish a cast (camera & gallery permissions)
  and an article, then delete them.
- Profile: edit profile picture, objective, log out (back gesture must not return into the app).
- Airplane mode: screens should show an error with a "Try again" button instead of loading forever.

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
