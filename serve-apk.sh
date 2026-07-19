#!/usr/bin/env bash
#
# Serve l'APK release via HTTP sulla LAN, per scaricarlo dal telefono.
# Uso:
#   ./serve-apk.sh          # porta 8000
#   ./serve-apk.sh 8080     # porta custom
#
# Sul telefono (stessa Wi-Fi del Mac) apri l'URL stampato, tocca l'APK e installa.
# Ctrl-C per fermare il server.
#
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APK_DIR="$PROJECT_DIR/android/app/build/outputs/apk/release"
PORT="${1:-8000}"

# APK più recente (unidesk-<ver>.apk, con fallback ad app-release.apk).
APK="$(ls -t "$APK_DIR"/unidesk-*.apk "$APK_DIR"/app-release.apk 2>/dev/null | head -1 || true)"
if [[ -z "$APK" ]]; then
  echo "ERRORE: nessun APK trovato in $APK_DIR" >&2
  echo "        Genera prima la build con ./deploy.sh" >&2
  exit 1
fi

# IP LAN del Mac.
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [[ -z "$IP" ]]; then
  echo "ERRORE: impossibile rilevare l'IP LAN (sei connesso al Wi-Fi?)" >&2
  exit 1
fi

APK_NAME="$(basename "$APK")"
SIZE="$(du -h "$APK" | cut -f1)"

echo ""
echo "  APK   : $APK_NAME ($SIZE)"
echo ""
echo "  Sul telefono (stessa Wi-Fi) apri:"
echo ""
echo "      http://$IP:$PORT/$APK_NAME"
echo ""
echo "  Oppure la cartella:  http://$IP:$PORT/"
echo "  (Ctrl-C per fermare)"
echo ""

cd "$APK_DIR"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
