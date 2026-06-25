#!/usr/bin/env bash
BOT="bot_AFKR1QYFJ3VKYF3W"
RUBRIC="shared/scripts/closebot/rubrics/hammersports.json"
PDIR="shared/scripts/closebot/personas/hammersports"
SANDBOX="src_4R4DUIQTMMX2NFPU"
SUMMARY="shared/logs/eval/_hammersports_sweep_summary.txt"
: > "$SUMMARY"
run () {
  echo "=== RUN $1 ($(date -u +%H:%M:%S)) ===" | tee -a "$SUMMARY"
  CB_TEST_BOT_ID="$BOT" PERSONA="$PDIR/$1.json" RUBRIC="$RUBRIC" \
  MIMIC_SOURCE_ID="$SANDBOX" GHL_VERIFY_LOCATION_ID="isGl70YkeLEAiVckMhgT" \
  node --env-file=.env --env-file=clients/ground-standard/.env \
    shared/scripts/closebot/eval/orchestrator.js >> "$SUMMARY" 2>&1
  rd=$(ls -t shared/logs/eval/ | grep "^hammersports_hammersports_$1_" | head -1)
  v=$(grep -m1 'Overall:' "shared/logs/eval/$rd/report.md" 2>/dev/null || echo "NO REPORT")
  echo "  -> $1 :: $rd :: $v" | tee -a "$SUMMARY"
}
for p in adult_bjj_default adult_nogi adult_muay_thai adult_wrestling \
         kid_youth teen adult_and_kid minor_self_booking \
         pricing_deflect nonbookable_mma; do run "$p"; done
echo "=== NON-DETERMINISM: adult_bjj_default x3 ===" | tee -a "$SUMMARY"
for i in 1 2 3; do run "adult_bjj_default"; done
echo "=== SWEEP COMPLETE $(date -u +%H:%M:%S) ===" | tee -a "$SUMMARY"
