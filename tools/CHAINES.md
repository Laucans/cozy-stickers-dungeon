# Chaînes d’enveloppes (généré par `node tools/chaines.mjs`, ne pas modifier à la main)

135 fonctions sont redéfinies par enveloppe. Ordre = ordre du build (`PARTS` de build.sh) : la **dernière** ligne est la version appelée en jeu, chacune appelle la précédente.

| Fonction | Naît dans | Enveloppes, dans l’ordre | n |
|---|---|---|---|
| `dawn` | p4_engine.js:598 | p36_crawl_ui.js:50 → p43_nemesis.js:83 → p44_chantiers.js:25 → p45_saisons.js:24 → p46_visiteurs.js:47 → p47_oeufs.js:17 → p48_cuisine.js:47 → p49_caravanes.js:22 → p50_artisanat.js:94 → p51_renommee.js:39 → p52_quetes.js:376 → p61_filrouge.js:110 → p63_livre.js:219 → p66_stickers.js:48 → p74_prestige.js:92 | 15 |
| `openRoom` | p10_ui.js:285 | p34_design.js:32 → p38_heart.js:29 → p38_heart.js:116 → p44_chantiers.js:41 → p48_cuisine.js:60 → p50_artisanat.js:172 → p54_mobile.js:89 → p60_economie.js:60 → p74_prestige.js:129 → p75_etageres.js:57 | 10 |
| `applyInvasion` | p4_engine.js:543 | p28_combat.js:547 → p33_val.js:110 → p33_val.js:148 → p43_nemesis.js:46 → p45_saisons.js:43 → p48_cuisine.js:44 → p50_artisanat.js:87 → p52_quetes.js:365 → p69_invasion.js:364 | 9 |
| `applyRaid` | p4_engine.js:481 | p31_saga.js:175 → p32_raids.js:69 → p33_val.js:94 → p52_quetes.js:348 → p58_risque.js:23 → p61_filrouge.js:114 | 6 |
| `openCreature` | p10_ui.js:355 | p28_combat.js:571 → p29_status.js:81 → p31_saga.js:228 → p32_raids.js:137 → p50_artisanat.js:154 → p53_emotions.js:157 | 6 |
| `upgradeState` | p18_souls.js:19 | p42_guards.js:31 → p42_guards.js:51 → p42_guards.js:63 → p52_quetes.js:505 → p74_prestige.js:110 | 5 |
| `glowParts` | p22_world.js:13 | p44_chantiers.js:33 → p46_visiteurs.js:26 → p60_economie.js:42 → p74_prestige.js:44 | 4 |
| `heartTokens` | p28_combat.js:67 | p43_nemesis.js:89 → p45_saisons.js:41 → p48_cuisine.js:40 → p60_economie.js:38 | 4 |
| `planInvasion0` | p4_engine.js:518 | p28_combat.js:158 → p33_val.js:116 → p43_nemesis.js:35 → p52_quetes.js:354 | 4 |
| `renderAll` | p10_ui.js:193 | p36_crawl_ui.js:590 → p42_guards.js:44 → p52_quetes.js:508 → p54_mobile.js:51 | 4 |
| `renderPortraits` | p10_ui.js:112 | p29_status.js:86 → p42_guards.js:89 → p47_oeufs.js:51 → p53_emotions.js:152 | 4 |
| `valNotifs` | p33_val.js:218 | p57_duel.js:448 → p60_economie.js:73 → p61_filrouge.js:140 → p74_prestige.js:157 | 4 |
| `applyCombat` | p28_combat.js:519 | p31_saga.js:177 → p33_val.js:172 → p66_stickers.js:75 | 3 |
| `bindSouls` | p18_souls.js:493 | p42_guards.js:180 → p51_renommee.js:65 → p52_quetes.js:499 | 3 |
| `CMD.raidPlan` | objet | p32_raids.js:67 → p36_crawl_ui.js:568 → p73_siege.js:116 | 3 |
| `crawlApply` | p35_crawl.js:900 | p61_filrouge.js:117 → p63_livre.js:227 → p65_livre_ui.js:41 | 3 |
| `drawActor` | p8_render.js:274 | p31_saga.js:262 → p47_oeufs.js:45 → p53_emotions.js:143 | 3 |
| `epaFactors` | p18_souls.js:147 | p26_life.js:138 → p58_risque.js:48 → p60_economie.js:44 | 3 |
| `fighterOf` | p28_combat.js:89 | p32_raids.js:56 → p48_cuisine.js:42 → p50_artisanat.js:76 | 3 |
| `lvArt` | p65_livre_ui.js:71 | p67_sticker_art.js:76 → p67_sticker_art.js:913 → p67_sticker_art.js:917 | 3 |
| `partyPreview` | p4_engine.js:512 | p28_combat.js:182 → p69_invasion.js:356 → p71_defense.js:97 | 3 |
| `raidBreakdown` | p4_engine.js:453 | p32_raids.js:45 → p33_val.js:91 → p58_risque.js:17 | 3 |
| `renderHand` | p10_ui.js:184 | p38_heart.js:140 → p54_mobile.js:108 → p54_mobile.js:225 | 3 |
| `renderMapPanel` | p23_map.js:280 | p33_val.js:201 → p49_caravanes.js:62 → p57_duel.js:415 | 3 |
| `runRaid` | p11_night.js:79 | p36_crawl_ui.js:566 → p52_quetes.js:511 → p73_siege.js:123 | 3 |
| `afterChange` | p10_ui.js:252 | p61_filrouge.js:112 → p63_livre.js:221 | 2 |
| `ambiance` | p4_engine.js:238 | p45_saisons.js:21 → p60_economie.js:40 | 2 |
| `applyOverrides` | p12_admin.js:50 | p56_admin_crawl.js:15 → p64_admin_livre.js:31 | 2 |
| `baseOf` | p12_admin.js:25 | p56_admin_crawl.js:13 → p64_admin_livre.js:18 | 2 |
| `bookAdd` | p63_livre.js:113 | p65_livre_ui.js:206 → p66_stickers.js:25 | 2 |
| `calamityDelta` | p4_engine.js:576 | p33_val.js:44 → p50_artisanat.js:83 | 2 |
| `crawlFoes` | p35_crawl.js:373 | p66_stickers.js:63 → p73_siege.js:110 | 2 |
| `crawlNew` | p35_crawl.js:350 | p36_crawl_ui.js:54 → p73_siege.js:107 | 2 |
| `entryOf` | p12_admin.js:18 | p56_admin_crawl.js:12 → p64_admin_livre.js:17 | 2 |
| `figHTML` | p36_crawl_ui.js:155 | p53_emotions.js:174 → p59_defense.js:100 | 2 |
| `foeImg` | p39_crawl_fx.js:33 | p53_emotions.js:167 → p53_emotions.js:177 | 2 |
| `grantEnvie` | p18_souls.js:287 | p29_status.js:74 → p53_emotions.js:163 | 2 |
| `invFightR` | p69_invasion.js:146 | p71_defense.js:39 → p71_defense.js:82 | 2 |
| `invInfo` | p69_invasion.js:140 | p71_defense.js:32 → p71_defense.js:76 | 2 |
| `invNew` | p69_invasion.js:128 | p70_invasion_ui.js:165 → p71_defense.js:18 | 2 |
| `mapPanelClick` | p23_map.js:325 | p33_val.js:212 → p57_duel.js:421 | 2 |
| `newState` | p4_engine.js:17 | p42_guards.js:48 → p51_renommee.js:50 | 2 |
| `openMissions` | p18_souls.js:540 | p29_status.js:83 → p31_saga.js:250 | 2 |
| `openWorld` | p23_map.js:234 | p55_carte_tuto.js:66 → p61_filrouge.js:119 | 2 |
| `renderHUD` | p10_ui.js:28 | p30_rival.js:163 → p45_saisons.js:46 | 2 |
| `soulsDawn` | p18_souls.js:319 | p58_risque.js:57 → p60_economie.js:46 | 2 |
| `tap` | p11_night.js:403 | p38_heart.js:65 → p54_mobile.js:23 | 2 |
| `victoryNotifs` | p25_victory.js:267 | p62_rivaux.js:87 → p63_livre.js:250 | 2 |
| `applyNemRaid` | p30_rival.js:111 | p33_val.js:104 | 1 |
| `availability` | p4_engine.js:268 | p50_artisanat.js:70 | 1 |
| `B.check` | objet | p69_invasion.js:156 | 1 |
| `B.startTurn` | objet | p69_invasion.js:157 | 1 |
| `bookTick` | p63_livre.js:180 | p66_stickers.js:51 | 1 |
| `castleCard` | p20_val.js:349 | p57_duel.js:404 | 1 |
| `chronicle` | p11_night.js:201 | p43_nemesis.js:14 | 1 |
| `chronicleHTML` | p11_night.js:192 | p60_economie.js:92 | 1 |
| `cleanSummary` | p20_val.js:65 | p57_duel.js:412 | 1 |
| `closeModal` | p10_ui.js:274 | p65_livre_ui.js:208 | 1 |
| `closeWorld` | p23_map.js:244 | p55_carte_tuto.js:72 | 1 |
| `CMD.cook` | objet | p52_quetes.js:345 | 1 |
| `CMD.pact` | objet | p66_stickers.js:56 | 1 |
| `CMD.shop` | objet | p61_filrouge.js:123 | 1 |
| `CMD.wonder` | objet | p60_economie.js:30 | 1 |
| `coopGuestMsg` | p21_coop.js:127 | p36_crawl_ui.js:587 | 1 |
| `coopHostMsg` | p21_coop.js:69 | p36_crawl_ui.js:585 | 1 |
| `COUPS.morgrave.run` | objet | p63_livre.js:238 | 1 |
| `COUPS.moussues.run` | objet | p63_livre.js:237 | 1 |
| `COUPS.ombrelune.run` | objet | p63_livre.js:239 | 1 |
| `crawlAnimator` | p36_crawl_ui.js:205 | p53_emotions.js:181 | 1 |
| `crawlBattle` | p35_crawl.js:453 | p36_crawl_ui.js:42 | 1 |
| `crawlSiteResult` | p36_crawl_ui.js:61 | p52_quetes.js:351 | 1 |
| `crawlVictory` | p36_crawl_ui.js:20 | p62_rivaux.js:62 | 1 |
| `crawlWinLoot` | p35_crawl.js:782 | p66_stickers.js:65 | 1 |
| `defenseCards` | p59_defense.js:72 | p61_filrouge.js:126 | 1 |
| `defStr` | p4_engine.js:246 | p50_artisanat.js:64 | 1 |
| `drawArt` | p7_chars.js:217 | p53_emotions.js:94 | 1 |
| `drawMap` | p23_map.js:245 | p49_caravanes.js:54 | 1 |
| `drawOverlays` | p9_scene.js:142 | p42_guards.js:150 | 1 |
| `drawParticles` | p8_render.js:334 | p45_saisons.js:65 | 1 |
| `drawScene` | p9_scene.js:87 | p38_heart.js:52 | 1 |
| `dropSticker` | p10_ui.js:217 | p54_mobile.js:103 | 1 |
| `endNight` | p11_night.js:144 | p61_filrouge.js:108 | 1 |
| `eye` | p7_chars.js:40 | p53_emotions.js:24 | 1 |
| `fatigueDawn` | p32_raids.js:41 | p58_risque.js:43 | 1 |
| `figVM` | p36_crawl_ui.js:84 | p59_defense.js:98 | 1 |
| `fld` | p12_admin.js:162 | p56_admin_crawl.js:18 | 1 |
| `gainXP` | p18_souls.js:308 | p29_status.js:76 | 1 |
| `guardHud` | p42_guards.js:71 | p54_mobile.js:244 | 1 |
| `guardMode` | p42_guards.js:79 | p54_mobile.js:242 | 1 |
| `head` | p7_chars.js:68 | p53_emotions.js:57 | 1 |
| `heroCard` | p28_combat.js:582 | p33_val.js:151 | 1 |
| `invFinish` | p69_invasion.js:250 | p71_defense.js:66 | 1 |
| `invHook` | p69_invasion.js:154 | p71_defense.js:59 | 1 |
| `lifeTick` | p26_life.js:341 | p28_combat.js:805 | 1 |
| `mapArt` | p23_map.js:116 | p45_saisons.js:90 | 1 |
| `nemRaidPlan` | p30_rival.js:101 | p70_invasion_ui.js:163 | 1 |
| `newEra` | p25_victory.js:137 | p62_rivaux.js:69 | 1 |
| `notifList` | p10_ui.js:125 | p61_filrouge.js:143 | 1 |
| `openCrawlPage` | p36_crawl_ui.js:258 | p73_siege.js:112 | 1 |
| `openDef` | p10_ui.js:338 | p50_artisanat.js:178 | 1 |
| `openGrimoire` | p16_grimoire.js:165 | p68_aide.js:37 | 1 |
| `openVal` | p20_val.js:304 | p57_duel.js:454 | 1 |
| `openVictories` | p25_victory.js:279 | p61_filrouge.js:121 | 1 |
| `parseField` | p12_admin.js:175 | p56_admin_crawl.js:26 | 1 |
| `placeFurn` | p4_engine.js:387 | p16_grimoire.js:188 | 1 |
| `planAct` | p26_life.js:260 | p28_combat.js:807 | 1 |
| `planInvasion` | p4_engine.js:517 | p28_combat.js:180 | 1 |
| `questComplete` | p52_quetes.js:290 | p65_livre_ui.js:34 | 1 |
| `questDawn` | p52_quetes.js:381 | p61_filrouge.js:132 | 1 |
| `questNotifs` | p52_quetes.js:483 | p61_filrouge.js:138 | 1 |
| `raceTick` | p25_victory.js:144 | p62_rivaux.js:52 | 1 |
| `removeRoom` | p4_engine.js:411 | p75_etageres.js:43 | 1 |
| `renderGoals` | p10_ui.js:159 | p54_mobile.js:238 | 1 |
| `renderVal` | p20_val.js:328 | p57_duel.js:390 | 1 |
| `revealSecret` | p26_life.js:99 | p29_status.js:78 | 1 |
| `rotateHand` | p10_ui.js:218 | p54_mobile.js:106 | 1 |
| `sagaNotifs` | p31_saga.js:243 | p52_quetes.js:496 | 1 |
| `secretsCheck` | p26_life.js:107 | p65_livre_ui.js:25 | 1 |
| `sfx` | p11_night.js:12 | p39_crawl_fx.js:121 | 1 |
| `siteIcon` | p23_map.js:58 | p33_val.js:199 | 1 |
| `SPECIALS.ghost` | objet | p53_emotions.js:70 | 1 |
| `startExpedition` | p22_world.js:211 | p36_crawl_ui.js:582 | 1 |
| `statusOf` | p29_status.js:27 | p32_raids.js:135 | 1 |
| `takeSticker` | p10_ui.js:204 | p54_mobile.js:91 | 1 |
| `tryPlace` | p10_ui.js:242 | p38_heart.js:132 | 1 |
| `tutoTick` | p17_tutorial.js:81 | p61_filrouge.js:224 | 1 |
| `updateGhost` | p10_ui.js:233 | p28_combat.js:842 | 1 |
| `updateParticles` | p8_render.js:326 | p45_saisons.js:54 | 1 |
| `upgradeCreature` | p18_souls.js:11 | p26_life.js:132 | 1 |
| `valClick` | p20_val.js:372 | p57_duel.js:396 | 1 |
| `validate` | p10_ui.js:225 | p38_heart.js:130 | 1 |
| `valMail` | p20_val.js:97 | p57_duel.js:428 | 1 |
| `valSummary` | p20_val.js:40 | p57_duel.js:410 | 1 |
| `WIKI.meubler.x` | objet | p75_etageres.js:71 | 1 |
| `winVictory` | p25_victory.js:131 | p66_stickers.js:60 | 1 |
