#!/bin/sh
# Construit les deux versions du jeu à partir de src/ :
#  - cozy-stickers-dungeon.html : l'Artifact claude.ai (solo, Atelier du Maître partagé via claude.ai)
#  - docs/index.html            : la version web ouverte à tous (GitHub Pages), avec le Val des Maîtres et le château partagé
cd "$(dirname "$0")"
PARTS="src/p3_data.js src/p4_engine.js src/p5_tex.js src/p6_art.js src/p7_chars.js src/p8_render.js src/p9_scene.js src/p10_ui.js src/p11_night.js src/p12_admin.js src/p13_admin_sprites.js src/p14_admin_tools.js src/p16_grimoire.js src/p17_tutorial.js src/p18_souls.js src/p19_net.js src/p20_val.js src/p21_coop.js src/p15_start.js"
{ cat src/p1_head.html src/p2_body.html; echo "<script>"; cat $PARTS; echo "</script>"; } > cozy-stickers-dungeon.html
mkdir -p docs
{ echo '<!doctype html><html lang="fr"><head>'
  cat src/p1_head.html src/web_head.html
  echo '</head><body>'
  cat src/p2_body.html
  echo "<script>"; cat $PARTS; echo "</script></body></html>"; } > docs/index.html
[ -f docs/tuning.json ] || echo '{}' > docs/tuning.json
