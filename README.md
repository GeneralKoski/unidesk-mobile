# unidesk mobile

The mobile client for [unidesk](https://github.com/GeneralKoski/unidesk):
academic record, weighted average, exam booking, and course materials, in one
app. Three sections behind a custom floating navbar: Home, Exams, Courses.

The split between what runs on the device and what needs a server is the point of
the architecture. Esse3 is called directly from the device, because its internal
REST API takes stateless HTTP Basic auth and works fine from React Native. Elly
is not reachable that way: the Shibboleth SSO login and the file proxy cannot be
reproduced on-device with `fetch`, so the Courses tab goes through the unidesk web
backend. Without a backend configured, that tab shows a "configure backend" state
and everything else keeps working.

## Stack

- React Native 0.83, Expo 55, React 19, TypeScript, New Architecture enabled
- Targets iOS 15.1+, Android SDK 24+, and web
- React Navigation 7 (static API) with a custom floating tab bar
- Zustand for state, `expo-secure-store` for the credentials on device
- `react-hook-form` for forms, `react-native-svg` for charts, i18n-js for Italian and English

Credentials are held encrypted in `expo-secure-store` and validated against
Esse3 at login. Booking and cancelling an exam always ask for explicit
confirmation.

The Home tab has three views behind a segmented control: a dashboard, a history
view with an exam timeline and a running-average chart, and a simulator that
projects graduation marks over the remaining credits.

## Running locally

```bash
npm install

cp .env.example .env
# EXPO_PUBLIC_ESSE3_BASE  base REST endpoint for Esse3
# EXPO_PUBLIC_API_URL     unidesk web backend, needed only for the Courses tab

npx expo run:android   # first run, produces the dev build
npm start              # dev server afterwards
npm run typecheck
npm run lint
```

This uses `expo-dev-client` because of native modules such as SecureStore and
reanimated, so a development build is required and Expo Go is not enough.

To build a signed release APK, create a keystore and fill in the gitignored
`credentials.json`:

```bash
mkdir -p credentials/android
keytool -genkeypair -v -keystore credentials/android/keystore.jks \
  -alias unidesk -keyalg RSA -keysize 2048 -validity 10000

cp credentials.json.example credentials.json

./deploy.sh            # prompts for a version, then builds the APK
./deploy.sh --no-bump  # keeps the current version from app.json
```

`android/`, `ios/`, `credentials.json` and `credentials/` are gitignored. The
`.env` is baked into the bundle at build time.

## Status

Working on Android, which is the platform it has been built and run on. The iOS
target is configured but has not been through a device build. The Courses tab
depends on a reachable unidesk backend; the rest of the app only needs internet
access.

The same caveat as the web app applies: the project brokers university passwords
because neither Esse3 nor Elly issues tokens. It is a personal project, not a
service meant for other people's accounts.
