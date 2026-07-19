# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start            # Start dev server (expo start --dev-client)
npm run ios          # Build and run on iOS (expo run:ios)
npm run android      # Build and run on Android (expo run:android)
npm run web          # Start web dev server
npm run build:web    # Export static web build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run lint         # ESLint (expo lint)
```

## Architecture

React Native 0.83 + Expo 55 + React 19 template. New Architecture enabled by default. Targets iOS 15.1+, Android SDK 24+, and web.

### Path Alias

Use `@/` for absolute imports from the project root (e.g., `@/src/components/...`). Never use relative `../` paths.

### Navigation

React Navigation 7.x with static API (`createStaticNavigation`). Root stack has Login, Tabs, and detail screens (EsameDetail, CorsoDetail). The Tabs use a **custom floating navbar** (`src/components/FloatingTabBar.tsx`, an absolute overlay) with three sections: Home, Esami, Corsi. Because the navbar is an overlay, scroll/list content adds `getFloatingTabBarSpace(insets.bottom)` as bottom padding. Auth guard in `NavigationWrapper.tsx` reactively redirects based on auth state.

### Authentication

Zustand store (`src/stores/authStore.ts`) stores the Unipr credentials (same for Esse3/Elly) encrypted in `expo-secure-store` (localStorage on web). `login(email, pass)` validates against Esse3 (`/login`) and derives name + active matricola; `getEsse3()` returns a ready `Esse3Client`, `getCreds()` returns the raw credentials. `careerStore` holds the fetched carriere and the selected `matId`, shared between Home and Esami.

### Component Organization

- `src/components/` — generic, reusable, presentational components decoupled from business logic (e.g. `ui/`, `form/`, `icons/`).
- `src/containers/<feature>/` — feature-specific components tied to project/business logic (e.g. `src/containers/home/CardBackground.tsx`). Group by feature/screen, not by type.

When extracting a component from a screen, default to `containers/<feature>/` unless it is truly generic enough to live in `components/`.

### Styling

Dual system: `StyleSheet.create()` with static theme values from `src/styles.ts`, plus `useAppTheme()` hook for dynamic light/dark colors (background, surface, border, text). NativeWind/Tailwind available but primary approach is StyleSheet. Custom `Text` and `TextInput` components in `src/components/ui/` auto-resolve Poppins font family from fontWeight/fontStyle — always use these instead of RN primitives.

### Forms

Form field components (`DfInput`, `DfPassword`, `DfButton`, `DfSelect`, `DfDatePicker`, `DfCheckbox`, `DfSwitch`, `DfNumberInput`) in `src/components/form/` wrap react-hook-form fields. Screens compose them under a `FormProvider` and submit with their own async handler (e.g. LoginScreen calls `authStore.login`). The old API-bound `DfForm`/`useApi`/axios client were removed — Unidesk talks to Esse3/Elly through `src/api/unidesk`.

### i18n

i18n-js with Italian (default/fallback) and English. Translations in `src/i18n/locales/{it,en}.json`. Use `useTranslation()` hook in components. Tab labels in navigation use `i18n.t()` directly (outside React tree).

### API Layer

`src/api/unidesk/` is the single source for talking to the university systems:
- `esse3.ts` — `Esse3Client`, plain `fetch` + HTTP Basic (base64 without Buffer), stateless. Runs **on-device**. Covers login, carriere, libretto (v2→v1 fallback), calesa appelli, prenota/disiscrivi. Base from `EXPO_PUBLIC_ESSE3_BASE`.
- `elly.ts` — `ellyApi`, talks to the **Unidesk web backend** (`EXPO_PUBLIC_API_URL`) which handles the Elly SSO + file proxy server-side. Session cookie kept by RN's native cookie jar; re-login on 401. `HAS_BACKEND` gates the Corsi tab.
- `types.ts` — Esse3 + Elly domain types (mirror of `@unidesk/core`).
Material downloads go through `src/utils/fileDownload.ts` (authenticated `fetch` → base64 → `expo-file-system` → `expo-sharing`).

### State Management

Zustand 5.x stores in `src/stores/`. Babel config includes `import.meta` polyfill for Zustand 5 compatibility. Translation store persists language preference to AsyncStorage.

### Types

Model types go in `src/types/` as separate files per entity (e.g., `user.ts`). Each entity should define a full model interface (for detail views) and a lightweight `ListItem` variant (for lists). Global types (API response, pagination) are in `src/types.d.ts`.

## Key Conventions

- Babel config must keep `react-native-reanimated/plugin` as the **last** plugin
- Italian locale throughout (number formatting with `.` thousands and `,` decimal separator)
- Platform-specific code uses `Platform.OS` checks, not separate files
- `DfDatePicker` uses `@react-native-community/datetimepicker` (not `react-native-date-picker` which is incompatible with New Architecture)
