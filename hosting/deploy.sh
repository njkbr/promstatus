#!/bin/bash
# Забирает готовую сборку сайта из ветки "site" на GitHub и раскладывает её в папку сайта.
# Запуск: Планировщик CRON ISPmanager, каждые 5 минут.
# Журнал пишется только при обновлении или ошибке.

REPO="njkbr/promstatus"
BRANCH="site"
DEST="$HOME/www/promstatus.ru"
STATE="$HOME/.promstatus"
LOG="$HOME/promstatus-deploy.log"

mkdir -p "$STATE"
exec >>"$LOG" 2>&1
export LC_ALL=C
now() { date '+%Y-%m-%d %H:%M:%S'; }

exec 9>"$STATE/lock"
flock -n 9 || exit 0

remote=$(curl -fsS --max-time 20 "https://raw.githubusercontent.com/$REPO/$BRANCH/build-hash.txt?t=$(date +%s)" 2>&1)
rc=$?
if [ $rc -ne 0 ]; then echo "$(now) ERROR: не получен build-hash (curl $rc): $remote"; exit 0; fi
remote=$(echo "$remote" | tr -d '[:space:]')
local_hash=$(tr -d '[:space:]' < "$DEST/build-hash.txt" 2>/dev/null)
[ "$remote" = "$local_hash" ] && exit 0

tmp=$(mktemp -d "$STATE/dl.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
err=$(curl -fsSL --max-time 180 "https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH" -o "$tmp/site.tgz" 2>&1)
rc=$?
if [ $rc -ne 0 ]; then echo "$(now) ERROR: не скачан архив (curl $rc): $err"; exit 0; fi
if ! tar -xzf "$tmp/site.tgz" -C "$tmp"; then echo "$(now) ERROR: архив повреждён"; exit 0; fi
src=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -1)
if [ ! -f "$src/manifest.txt" ] || [ ! -f "$src/index.html" ]; then echo "$(now) ERROR: в архиве нет manifest.txt или index.html"; exit 0; fi

mkdir -p "$DEST"
cp -a "$src/." "$DEST/"

# Удаляем файлы, которых больше нет в сборке (только те, что ставил этот скрипт)
if [ -f "$STATE/manifest.txt" ]; then
  comm -23 <(sort -u "$STATE/manifest.txt") <(sort -u "$src/manifest.txt") | while IFS= read -r f; do
    case "$f" in ""|*..*|/*) continue;; esac
    rm -f "$DEST/$f"
  done
fi
cp "$src/manifest.txt" "$STATE/manifest.txt"
echo "$(now) OK: сайт обновлён до сборки $remote"
