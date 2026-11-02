#!/bin/sh
# Reconstruit le jeu et publie la version web sur GitHub Pages
# (dépôt Laucans/cozy-stickers-dungeon, servi depuis le dossier docs/).
# Usage : sh deploy.sh "Message de commit"
set -e
cd "$(dirname "$0")"
MSG="${1:-Mise à jour du jeu}"
sh build.sh
TMP=$(mktemp -d)
git clone --quiet --depth 1 git@github.com:Laucans/cozy-stickers-dungeon.git "$TMP/repo"
rm -rf "$TMP/repo/src" "$TMP/repo/docs"
cp -R src docs "$TMP/repo/"
cp README.md build.sh deploy.sh "$TMP/repo/"
cd "$TMP/repo"
git add -A
if git diff --cached --quiet; then echo "Rien à publier."; exit 0; fi
git commit --quiet -m "$MSG" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push --quiet origin HEAD:main
echo "Publié : https://laucans.github.io/cozy-stickers-dungeon/ (GitHub Pages met environ une minute à se mettre à jour)"
