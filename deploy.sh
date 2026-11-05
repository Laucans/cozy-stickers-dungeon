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
rm -rf "$TMP/repo/src" "$TMP/repo/docs" "$TMP/repo/sim" "$TMP/repo/.claude/skills/simulation-equilibrage"
cp -R src docs "$TMP/repo/"
cp README.md CLAUDE.md build.sh deploy.sh "$TMP/repo/"
mkdir -p "$TMP/repo/tools" && cp tools/chaines.mjs tools/CHAINES.md "$TMP/repo/tools/"
# le banc d'essai (sans les copies figées ni les résultats bruts) et son mode d'emploi
mkdir -p "$TMP/repo/sim" "$TMP/repo/.claude/skills"
cp sim/*.mjs sim/*.js sim/RAPPORT*.md sim/BOUCLES.md "$TMP/repo/sim/"
cp -R .claude/skills/simulation-equilibrage "$TMP/repo/.claude/skills/"
cd "$TMP/repo"
git add -A
if git diff --cached --quiet; then echo "Rien à publier."; exit 0; fi
git commit --quiet -m "$MSG" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push --quiet origin HEAD:main
echo "Publié : https://laucans.github.io/cozy-stickers-dungeon/ (GitHub Pages met environ une minute à se mettre à jour)"
