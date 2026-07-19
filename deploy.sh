#!/usr/bin/env bash
#
# Build Unidesk mobile — APK Android release firmato (standalone, JS incluso),
# per distribuzione manuale (WeTransfer / installazione diretta).
#
# Uso:
#   ./deploy.sh            # bump versione (interattivo) + build APK
#   ./deploy.sh --no-bump  # usa la versione attuale di app.json, build APK
#
# Prerequisiti (una tantum):
#   1) Genera un keystore release (NON usare il debug keystore):
#        mkdir -p credentials/android
#        keytool -genkeypair -v -keystore credentials/android/keystore.jks \
#          -alias unidesk -keyalg RSA -keysize 2048 -validity 10000
#   2) Copia credentials.json.example in credentials.json e compila i campi
#      (path del keystore, password, alias). credentials.json e' gitignorato.
#
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREDENTIALS="$PROJECT_DIR/credentials.json"
APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk"

# Impostata da bump_version(); vuota = versione non toccata.
MARKETING_VERSION=""

if [[ ! -f "$CREDENTIALS" ]]; then
  echo "ERRORE: credentials.json non trovato in $CREDENTIALS" >&2
  echo "        Copia credentials.json.example in credentials.json e compilalo." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Versione: proponiamo patch+1 rispetto ad app.json (single source of truth) e
# lasciamo scriverne un'altra. La scelta viene persistita in app.json +
# package.json, cosi' il run successivo riparte da li' (1.0.0 -> propone 1.0.1).
# ---------------------------------------------------------------------------
bump_version() {
  local current suggested input
  current="$(node -e 'process.stdout.write(require("./app.json").expo.version)')"
  if [[ "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    suggested="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$(( BASH_REMATCH[3] + 1 ))"
  else
    suggested="$current"
  fi

  while true; do
    read -r -p "Nuova versione (attuale $current) [$suggested]: " input || true
    MARKETING_VERSION="${input:-$suggested}"
    [[ "$MARKETING_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && break
    echo "   Formato non valido: usa X.Y.Z (es. 1.2.0)." >&2
  done

  # Persisti in app.json e package.json (sostituzione mirata della sola riga
  # "version", resto del file intatto). Teniamo i due allineati.
  APP_JSON="$PROJECT_DIR/app.json" PACKAGE_JSON="$PROJECT_DIR/package.json" NEW_VER="$MARKETING_VERSION" node - <<'PATCH'
const fs = require("fs");
const v = process.env.NEW_VER;
const re = /("version":\s*")[0-9]+\.[0-9]+\.[0-9]+(")/;
for (const p of [process.env.APP_JSON, process.env.PACKAGE_JSON]) {
  const s = fs.readFileSync(p, "utf8");
  if (!re.test(s)) { console.error(`ERRORE: campo version non trovato in ${p}`); process.exit(1); }
  fs.writeFileSync(p, s.replace(re, `$1${v}$2`));
}
PATCH
  echo "==> Versione impostata a $MARKETING_VERSION (app.json + package.json)"

  # Committa automaticamente il bump (solo app.json + package.json, mai i file
  # rigenerati da prebuild). Se non c'e' nulla da committare, non fallire.
  ( cd "$PROJECT_DIR" && git add app.json package.json )
  if ( cd "$PROJECT_DIR" && ! git diff --cached --quiet -- app.json package.json ); then
    ( cd "$PROJECT_DIR" && git commit -m "chore: version bump to $MARKETING_VERSION" )
    echo "==> Commit del version bump creato"
  else
    echo "==> Nessuna modifica di versione da committare"
  fi
}

# ---------------------------------------------------------------------------
# Android: APK release firmato, standalone (JS incluso).
# ---------------------------------------------------------------------------
build_android() {
  local KEYSTORE STORE_PASSWORD KEY_ALIAS KEY_PASSWORD GRADLE SIZE

  # Credenziali keystore da credentials.json (gitignorato): mai hardcodate qui.
  eval "$(node -e '
    const c = require(process.argv[1]).android.keystore;
    const q = s => "'"'"'" + String(s).replace(/'"'"'/g, "'"'"'\\'"'"''"'"'") + "'"'"'";
    process.stdout.write(
      "KEYSTORE=" + q(c.keystorePath) + "\n" +
      "STORE_PASSWORD=" + q(c.keystorePassword) + "\n" +
      "KEY_ALIAS=" + q(c.keyAlias) + "\n" +
      "KEY_PASSWORD=" + q(c.keyPassword) + "\n"
    );
  ' "$CREDENTIALS")"

  [[ "$KEYSTORE" = /* ]] || KEYSTORE="$PROJECT_DIR/$KEYSTORE"
  if [[ ! -f "$KEYSTORE" ]]; then
    echo "ERRORE: keystore non trovato in $KEYSTORE" >&2
    echo "        Generane uno con: keytool -genkeypair -v -keystore $KEYSTORE -alias $KEY_ALIAS -keyalg RSA -keysize 2048 -validity 10000" >&2
    exit 1
  fi

  # android/ e' gitignorato (Expo CNG): lo rigeneriamo SEMPRE da app.json con
  # --clean, cosi' ogni modifica di config (icona, splash, permessi, SDK, .env...)
  # finisce sempre nell'APK. La firma release viene re-iniettata sotto in modo
  # idempotente, quindi sopravvive al --clean.
  echo "==> Rigenero android/ da app.json (expo prebuild --clean)..."
  ( cd "$PROJECT_DIR" && npx expo prebuild --platform android --clean )

  # La firma release non e' gestita dal template (usa il debug keystore). La
  # iniettiamo qui in modo idempotente, cosi' sopravvive a ogni prebuild.
  GRADLE="$PROJECT_DIR/android/app/build.gradle"
  if ! grep -q "UNIDESK_SIGNING" "$GRADLE"; then
    echo "==> Configuro la firma release in build.gradle..."
    GRADLE_FILE="$GRADLE" node - <<'PATCH'
const fs = require("fs");
const p = process.env.GRADLE_FILE;
let s = fs.readFileSync(p, "utf8");
const rel = `        release { // UNIDESK_SIGNING
            if (project.hasProperty('UNIDESK_STORE_FILE')) {
                storeFile file(project.property('UNIDESK_STORE_FILE'))
                storePassword project.property('UNIDESK_STORE_PASSWORD')
                keyAlias project.property('UNIDESK_KEY_ALIAS')
                keyPassword project.property('UNIDESK_KEY_PASSWORD')
            }
        }
`;
s = s.replace(/(signingConfigs \{\n\s*debug \{[\s\S]*?\n\s*\}\n)(\s*\}\n)/, `$1${rel}$2`);
s = s.replace(/(signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/, `$1signingConfig project.hasProperty('UNIDESK_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`);
if (!s.includes("UNIDESK_SIGNING") || !s.includes("signingConfigs.release : signingConfigs.debug")) {
  console.error("ERRORE: struttura di build.gradle inattesa, impossibile iniettare la firma");
  process.exit(1);
}
fs.writeFileSync(p, s);
PATCH
  fi

  echo "==> Build APK release in corso (puo' richiedere alcuni minuti)..."
  ( cd "$PROJECT_DIR/android" && ./gradlew assembleRelease \
    -PUNIDESK_STORE_FILE="$KEYSTORE" \
    -PUNIDESK_STORE_PASSWORD="$STORE_PASSWORD" \
    -PUNIDESK_KEY_ALIAS="$KEY_ALIAS" \
    -PUNIDESK_KEY_PASSWORD="$KEY_PASSWORD" )

  if [[ ! -f "$APK_PATH" ]]; then
    echo "ERRORE: build terminata ma APK non trovato in $APK_PATH" >&2
    exit 1
  fi

  # Rinomina l'APK con un nome parlante e versionato (versione da app.json,
  # single source of truth). Gradle rigenera comunque app-release.apk a ogni build.
  local VERSION DIST_APK
  VERSION="$(node -e 'process.stdout.write(require("./app.json").expo.version)')"
  DIST_APK="$(dirname "$APK_PATH")/unidesk-${VERSION}.apk"
  mv -f "$APK_PATH" "$DIST_APK"

  SIZE="$(du -h "$DIST_APK" | cut -f1)"
  echo ""
  echo "==> APK PRONTO"
  echo "    APK  : $DIST_APK"
  echo "    Peso : $SIZE"
  echo "    Backend Elly: $(node -e 'const fs=require("fs");const m=(fs.readFileSync(".env","utf8").match(/^EXPO_PUBLIC_API_URL=(.*)$/m)||[])[1]||"(non impostato)";process.stdout.write(m)')"
  echo "    Installalo su Android (Sorgenti sconosciute) o condividilo via WeTransfer."
  echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if [[ "${1:-}" != "--no-bump" ]]; then
  bump_version
fi
build_android
