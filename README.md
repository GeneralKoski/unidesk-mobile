# Unidesk mobile

App nativa (React Native + Expo) di [Unidesk](../unidesk): carriera, libretto,
media ponderata, prenotazione appelli e corsi/materiali Elly, in un'unica app per
studenti Unipr. Adattamento mobile della web app, con **floating navbar** a 3
sezioni: Home (dashboard), Esami, Corsi.

## Architettura

L'app è pensata per essere **self-contained** dove conta:

- **Esse3 direttamente da device.** Login, carriera, libretto, media/CFU, appelli
  e prenotazione/disiscrizione usano l'API REST `e3rest` in HTTP Basic Auth
  (stateless), chiamata direttamente dall'app. Le credenziali Unipr restano
  cifrate sul dispositivo (`expo-secure-store`). Nessun backend necessario per
  queste funzioni.
- **Elly tramite backend Unidesk (opzionale).** Il login SSO Shibboleth e il
  proxy dei materiali girano server-side e non sono replicabili on-device con
  `fetch` di React Native. La tab **Corsi** riusa quindi le API route della web
  app (`../unidesk/web`). Se `EXPO_PUBLIC_API_URL` non è impostato, la tab Corsi
  mostra uno stato "configura backend" e il resto dell'app funziona comunque.

```
App (RN/Expo)
 ├─ Esse3Client  ── HTTP Basic ─────────────▶ Esse3 e3rest (diretto)
 └─ ellyApi      ── cookie sessione ────────▶ Unidesk web (Next.js) ──▶ Elly (Moodle SSO)
```

## Configurazione

Copia `.env.example` in `.env`:

```bash
cp .env.example .env
```

- `EXPO_PUBLIC_ESSE3_BASE` — base REST Esse3 (default Unipr).
- `EXPO_PUBLIC_API_URL` — URL del backend Unidesk per i corsi Elly. Default:
  `https://unidesk.martin-trajkovski.it` (backend pubblico già online, PM2 sul
  VPS). Con questo l'app funziona **ovunque, solo con internet sul telefono**.
  In alternativa in sviluppo puoi puntare all'IP LAN del PC che fa girare
  `npm run web` (es. `http://192.168.1.10:3000`; sull'emulatore Android
  `localhost` → `10.0.2.2`). Vuoto = tab Corsi disabilitata.

## Sviluppo

```bash
npm install
npm start            # dev server (richiede un dev build, non Expo Go)
npm run android      # build + run su device/emulatore Android
npm run typecheck    # tsc --noEmit
npm run lint
```

> Il template usa `expo-dev-client` (moduli nativi come SecureStore/reanimated):
> serve un **development build**, Expo Go non basta. La prima volta:
> `npx expo run:android`.

## Build APK (Android)

Script locale `deploy.sh` (stesso approccio di ZCC/Omnia Marine): bump versione,
`expo prebuild --clean`, iniezione firma release idempotente, APK firmato e
versionato in `android/app/build/outputs/apk/release/unidesk-<versione>.apk`.

Prerequisiti (una tantum):

```bash
# 1) keystore release
mkdir -p credentials/android
keytool -genkeypair -v -keystore credentials/android/keystore.jks \
  -alias unidesk -keyalg RSA -keysize 2048 -validity 10000

# 2) credenziali (gitignorate)
cp credentials.json.example credentials.json
#    compila keystorePassword / keyPassword / alias
```

Build:

```bash
./deploy.sh            # chiede la versione, poi builda l'APK
./deploy.sh --no-bump  # usa la versione attuale di app.json
```

`android/` e `credentials.json`/`credentials/` sono gitignorati. L'`.env`
(incluso `EXPO_PUBLIC_API_URL`) viene "congelato" nel bundle a build-time.

In alternativa con EAS: `eas build -p android --profile preview`.

## Struttura

- `src/api/unidesk/` — client Esse3 (on-device) ed Elly (via backend) + tipi.
- `src/stores/` — `authStore` (credenziali in SecureStore), `careerStore`
  (carriere + matId selezionato), `translationStore`.
- `src/navigation/` — root stack + tab (floating navbar) e `screens/`.
- `src/components/` — UI riutilizzabile (`ui/`, `form/`, `FloatingTabBar`,
  `Screen`, `StateViews`).
- `src/containers/esami/` — item lista esami (da sostenere / superati).

## Note

- **Scritture con conferma.** Prenotazione e disiscrizione appelli chiedono
  sempre conferma esplicita. Il blocco questionario OPIS rimanda a Esse3.
- **Home a 3 viste** (segmented control): Dashboard (statistiche + esami superati
  + da sostenere), Storia (timeline esami, grafico andamento media selezionabile,
  impatto per esame) e Simulatore (esami ipotetici, proiezioni di laurea sui CFU
  rimanenti, distribuzione voti). Grafici con `react-native-svg`.
