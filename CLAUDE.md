# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrightMinds is a cross-platform React Native mobile app (iOS & Android) built with Expo SDK 52 and JavaScript. It's an academic learning platform with video content, learning tracking, virtual labs, and research paper integration (OpenAlex API).

## Commands

```bash
# Development
expo start --dev-client        # Start dev server
expo run:android               # Run on Android
expo run:ios                   # Run on iOS

# Building
npx expo prebuild              # Generate native projects
eas build --platform android --profile production   # APK build
eas build --platform android --profile release      # AAB build (app-bundle)
eas build --platform ios --auto-submit              # iOS build + submit

# Tests
npx jest                       # Run all tests
npx jest path/to/test          # Run single test
```

## Architecture

**Entry point:** `App.js` → wraps app in Paper theme provider. `index.js` registers with Expo.

**File structure follows a feature-based organization under `src/`:**

```
src/
  features/         # Feature modules, each with screens/ and components/
    cast/           # Video/article browsing, discovery, search (OpenAlex)
    track/          # Learning progress, quizzes (Ready → Evaluation → Finish)
    lab/            # Virtual laboratory browsing by department
    library/        # User publications (Professor/Researcher/PhD only)
    auth/           # Login, signup, forgot password
    onboarding/     # First-launch flow and auth choice
    profile/        # User profile editing, preferences
    post-content/   # Content creation (video casts, articles)
    leaderboard/    # User rankings
  shared/
    components/     # Banner, Icon
    config/         # APIConfig (API base URL), theme (colors, sizes, spacing)
    utils/          # UserStorage (AsyncStorage session wrapper)
    data/           # Static data: categories, departments, visibility
    styles/         # Shared button styles
  navigation/
    MainNavigator.js    # Stack navigator (all screen routes)
    BottomNavigation.js # 4 main tabs: Cast, Track, Lab, Library
```

**Path aliases** (configured in `babel.config.js` via `babel-plugin-module-resolver`):
- `@features` → `./src/features`
- `@shared` → `./src/shared`
- `@navigation` → `./src/navigation`
- `@assets` → `./assets`

## Key Patterns

- **Imports** — Always use path aliases: `import { colors } from '@shared/config/theme'`
- **Functional components with hooks** — useState, useEffect, useCallback, useFocusEffect
- **Navigation props** — Screens receive `navigation` and `route` props from React Navigation
- **API calls** — Axios with base URL from `@shared/config/APIConfig`
- **Responsive text** — `RFValue` from `react-native-responsive-fontsize`
- **Role-based access** — Library tab only visible to Professor/Researcher/PhD roles
- **Guest mode** — Special `GUEST_USER_ID` constant; check with `isGuestUser()`
- **Animations** — Lottie files in `assets/Loader/` and `assets/lotties/`
- **Video playback** — Uses `expo-av` (Video, Audio components), NOT `expo-video`

## Key Dependencies

React Native 0.76.5, React 18.3, Expo 52, React Navigation 6 (Stack + Bottom Tabs), React Native Paper, Axios, AsyncStorage, expo-av, Lottie, React Native Reanimated

## App Identity

- iOS bundle: `com.brightmindsresearch`
- Android package: `com.ccarnus3.brightminds`
- EAS project ID: `9c6866c1-2446-45c8-a5b0-82bc6aa94aac`
